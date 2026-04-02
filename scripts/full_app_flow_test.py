#!/usr/bin/env python3
"""
Core end-to-end app flow test for the ECE1724 ticketing app.

This script covers the main user journey:
1. Register and log in Organizer, Staff, and Attendee users.
2. Verify auth/me for each role.
3. Organizer creates and updates events.
4. Public event and ticket-type browsing works.
5. Organizer assigns staff and staff gains dashboard access.
6. Attendees claim tickets and retrieve them from the API.
7. Staff validates tickets and organizer receives realtime dashboard updates.
8. Duplicate, wrong-event, and invalid-token scans are surfaced correctly.
9. Staff can still validate a new ticket after those failure cases.

Note:
- This script intentionally skips poster/file upload because that depends on S3/MinIO.

Dependencies:
  pip install requests "python-socketio[client]"

Usage:
  python3 scripts/full_app_flow_test.py
  python3 scripts/full_app_flow_test.py --base-url http://localhost:3000
"""

from __future__ import annotations

import argparse
import json
import queue
import sys
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any


class TestFailure(RuntimeError):
    pass


def load_dependencies():
    try:
        import requests  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            'Missing dependency "requests". Install it with: pip install requests'
        ) from exc

    try:
        import socketio  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            'Missing dependency "python-socketio". Install it with: '
            'pip install "python-socketio[client]"'
        ) from exc

    return requests, socketio


def iso_utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def log(message: str) -> None:
    print(message)


def pass_check(message: str) -> None:
    print(f"[PASS] {message}")


def fail(message: str) -> None:
    raise TestFailure(message)


def expect(condition: bool, message: str) -> None:
    if not condition:
        fail(message)
    pass_check(message)


def pretty_payload(payload: Any) -> str:
    return json.dumps(payload, indent=2, sort_keys=True, default=str)


@dataclass
class Actor:
    email: str
    password: str
    token: str
    user_id: str
    role: str


def print_actor_credentials(label: str, actor: Actor) -> None:
    print(f"{label} email: {actor.email}")
    print(f"{label} password: {actor.password}")


class ApiClient:
    def __init__(self, base_url: str, requests_module: Any, timeout: float) -> None:
        self.base_url = base_url.rstrip("/")
        self.requests = requests_module
        self.timeout = timeout

    def request(
        self,
        method: str,
        path: str,
        *,
        token: str | None = None,
        expected_status: int = 200,
        json_body: dict[str, Any] | None = None,
    ) -> Any:
        headers: dict[str, str] = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        response = self.requests.request(
            method,
            f"{self.base_url}{path}",
            headers=headers,
            json=json_body,
            timeout=self.timeout,
        )

        try:
            payload = response.json() if response.content else None
        except ValueError:
            payload = response.text

        if response.status_code != expected_status:
            raise TestFailure(
                f"{method} {path} returned {response.status_code}, expected "
                f"{expected_status}.\nResponse: {pretty_payload(payload)}"
            )

        return payload

    def get(self, path: str, *, token: str | None = None, expected_status: int = 200) -> Any:
        return self.request("GET", path, token=token, expected_status=expected_status)

    def post(
        self,
        path: str,
        *,
        token: str | None = None,
        expected_status: int = 200,
        json_body: dict[str, Any] | None = None,
    ) -> Any:
        return self.request(
            "POST",
            path,
            token=token,
            expected_status=expected_status,
            json_body=json_body,
        )

    def put(
        self,
        path: str,
        *,
        token: str | None = None,
        expected_status: int = 200,
        json_body: dict[str, Any] | None = None,
    ) -> Any:
        return self.request(
            "PUT",
            path,
            token=token,
            expected_status=expected_status,
            json_body=json_body,
        )


class DashboardSocketListener:
    def __init__(
        self,
        socketio_module: Any,
        socket_url: str,
        token: str,
        event_id: str,
        timeout: float,
    ) -> None:
        self.timeout = timeout
        self.events: "queue.Queue[dict[str, Any]]" = queue.Queue()
        self.room_errors: "queue.Queue[dict[str, Any]]" = queue.Queue()
        self.client = socketio_module.Client(
            reconnection=False,
            logger=False,
            engineio_logger=False,
        )

        @self.client.on("checkin:new")
        def _on_checkin(data: dict[str, Any]) -> None:
            self.events.put(data)

        @self.client.on("room:error")
        def _on_room_error(data: dict[str, Any]) -> None:
            self.room_errors.put(data)

        self.client.connect(
            socket_url.rstrip("/"),
            auth={"token": token},
            transports=["websocket"],
            wait_timeout=timeout,
        )
        self.client.emit("join:event", event_id)
        time.sleep(0.5)
        self._raise_room_error_if_any()

    def _raise_room_error_if_any(self) -> None:
        try:
            room_error = self.room_errors.get_nowait()
        except queue.Empty:
            return

        raise TestFailure(f"Socket room error: {pretty_payload(room_error)}")

    def expect_event(self, expected_status: str) -> dict[str, Any]:
        self._raise_room_error_if_any()
        try:
            event = self.events.get(timeout=self.timeout)
        except queue.Empty as exc:
            raise TestFailure(
                f"Timed out waiting for realtime dashboard event: {expected_status}"
            ) from exc

        actual_status = event.get("status")
        if actual_status != expected_status:
            raise TestFailure(
                f"Expected realtime event status {expected_status}, got "
                f"{actual_status}.\nEvent: {pretty_payload(event)}"
            )

        pass_check(f"Organizer realtime feed received {expected_status}")
        return event

    def close(self) -> None:
        if self.client.connected:
            self.client.disconnect()


def register_user(api: ApiClient, email: str, password: str, role: str) -> Actor:
    payload = api.post(
        "/auth/register",
        expected_status=201,
        json_body={"email": email, "password": password, "role": role},
    )
    return Actor(
        email=email,
        password=password,
        token=payload["token"],
        user_id=payload["user"]["id"],
        role=payload["user"]["role"],
    )


def login_user(api: ApiClient, email: str, password: str) -> str:
    payload = api.post(
        "/auth/login",
        expected_status=200,
        json_body={"email": email, "password": password},
    )
    return payload["token"]


def create_event(api: ApiClient, organizer: Actor, run_id: str, label: str) -> dict[str, Any]:
    start_at = datetime.now(timezone.utc) + timedelta(hours=2)
    end_at = start_at + timedelta(hours=3)
    payload = api.post(
        "/events",
        token=organizer.token,
        expected_status=201,
        json_body={
            "title": f"{label} {run_id}",
            "description": f"{label} automated test event",
            "venue": "Automation Lab",
            "startAt": iso_utc(start_at),
            "endAt": iso_utc(end_at),
            "capacity": 50,
        },
    )
    pass_check(f"Organizer created {label}")
    return payload


def create_ticket_type(
    api: ApiClient, organizer: Actor, event_id: str, name: str
) -> dict[str, Any]:
    payload = api.post(
        f"/events/{event_id}/ticket-types",
        token=organizer.token,
        expected_status=201,
        json_body={"name": name, "priceCents": 0, "quantity": 20},
    )
    pass_check(f'Organizer created ticket type "{name}"')
    return payload


def assign_staff(api: ApiClient, organizer: Actor, event_id: str, staff: Actor) -> None:
    api.post(
        f"/events/{event_id}/staff",
        token=organizer.token,
        expected_status=201,
        json_body={"email": staff.email},
    )
    pass_check("Organizer assigned the staff user to the primary event")


def claim_ticket(
    api: ApiClient, attendee: Actor, event_id: str, ticket_type_id: str, label: str
) -> dict[str, Any]:
    payload = api.post(
        f"/events/{event_id}/tickets",
        token=attendee.token,
        expected_status=201,
        json_body={"ticketTypeId": ticket_type_id},
    )
    pass_check(f"{label} claimed a ticket")
    return payload


def get_dashboard(api: ApiClient, actor: Actor, event_id: str) -> dict[str, Any]:
    return api.get(f"/events/{event_id}/dashboard", token=actor.token)


def dashboard_has_activity(
    dashboard: dict[str, Any],
    *,
    status: str,
    message: str | None = None,
    ticket_id: str | None = None,
) -> bool:
    for item in dashboard.get("recentActivity", []):
        if item.get("status") != status:
            continue
        if message is not None and item.get("message") != message:
            continue
        if ticket_id is not None and item.get("ticketId") != ticket_id:
            continue
        return True
    return False


def validate_token(
    api: ApiClient, staff: Actor, event_id: str, qr_token: str, label: str
) -> dict[str, Any]:
    payload = api.post(
        f"/events/{event_id}/checkins/validate",
        token=staff.token,
        expected_status=200,
        json_body={"qrToken": qr_token},
    )
    pass_check(f"Staff submitted {label}")
    return payload


def run(args: argparse.Namespace) -> int:
    requests_module, socketio_module = load_dependencies()
    api = ApiClient(args.base_url, requests_module, args.http_timeout)

    health = api.get("/health")
    expect(health.get("status") == "ok", "Backend health check passed")

    run_id = uuid.uuid4().hex[:8]
    password = args.password

    log("\n== Registering users ==")
    organizer = register_user(
        api, f"organizer-full-{run_id}@example.com", password, "ORGANIZER"
    )
    staff = register_user(api, f"staff-full-{run_id}@example.com", password, "STAFF")
    attendee_a = register_user(
        api, f"attendee-a-full-{run_id}@example.com", password, "ATTENDEE"
    )
    attendee_b = register_user(
        api, f"attendee-b-full-{run_id}@example.com", password, "ATTENDEE"
    )
    pass_check("Fresh organizer, staff, and attendee accounts were created")

    log("\n== Test account credentials ==")
    print_actor_credentials("Organizer", organizer)
    print_actor_credentials("Staff", staff)
    print_actor_credentials("Attendee A", attendee_a)
    print_actor_credentials("Attendee B", attendee_b)

    log("\n== Auth checks ==")
    organizer.token = login_user(api, organizer.email, organizer.password)
    staff.token = login_user(api, staff.email, staff.password)
    attendee_a.token = login_user(api, attendee_a.email, attendee_a.password)
    attendee_b.token = login_user(api, attendee_b.email, attendee_b.password)
    pass_check("All test users can log in")

    organizer_me = api.get("/auth/me", token=organizer.token)
    staff_me = api.get("/auth/me", token=staff.token)
    attendee_me = api.get("/auth/me", token=attendee_a.token)
    expect(organizer_me.get("role") == "ORGANIZER", "Organizer auth/me returns ORGANIZER")
    expect(staff_me.get("role") == "STAFF", "Staff auth/me returns STAFF")
    expect(attendee_me.get("role") == "ATTENDEE", "Attendee auth/me returns ATTENDEE")

    log("\n== Organizer event setup ==")
    primary_event = create_event(api, organizer, run_id, "Primary Event")
    primary_event_id = primary_event["id"]
    updated_event = api.put(
        f"/events/{primary_event_id}",
        token=organizer.token,
        expected_status=200,
        json_body={"venue": "Updated Automation Hall"},
    )
    expect(
        updated_event.get("venue") == "Updated Automation Hall",
        "Organizer can update the event",
    )

    public_events = api.get("/events")
    expect(
        any(event["id"] == primary_event_id for event in public_events),
        "Public event list includes the primary event",
    )
    public_event = api.get(f"/events/{primary_event_id}")
    expect(
        public_event.get("id") == primary_event_id,
        "Public event detail returns the primary event",
    )

    primary_ticket_type = create_ticket_type(
        api, organizer, primary_event_id, "General Admission"
    )
    public_ticket_types = api.get(f"/events/{primary_event_id}/ticket-types")
    expect(
        any(ticket_type["id"] == primary_ticket_type["id"] for ticket_type in public_ticket_types),
        "Public ticket-type list includes the created ticket type",
    )

    assign_staff(api, organizer, primary_event_id, staff)
    staff_list = api.get(f"/events/{primary_event_id}/staff", token=organizer.token)
    expect(
        any(assignment["userId"] == staff.user_id for assignment in staff_list),
        "Organizer staff list includes the assigned staff user",
    )

    staff_dashboard = get_dashboard(api, staff, primary_event_id)
    expect(
        staff_dashboard.get("eventId") == primary_event_id,
        "Assigned staff can open the primary event dashboard",
    )
    attendee_dashboard_error = api.get(
        f"/events/{primary_event_id}/dashboard",
        token=attendee_a.token,
        expected_status=403,
    )
    expect(
        attendee_dashboard_error.get("code") == "FORBIDDEN",
        "Attendees cannot access the organizer/staff dashboard",
    )

    listener = DashboardSocketListener(
        socketio_module,
        args.socket_url or args.base_url,
        organizer.token,
        primary_event_id,
        args.socket_timeout,
    )

    try:
        initial_dashboard = get_dashboard(api, organizer, primary_event_id)
        expect(
            initial_dashboard.get("checkedInCount") == 0,
            "Organizer dashboard starts at 0 checked-in attendees",
        )

        log("\n== Attendee ticket flow ==")
        primary_ticket_a = claim_ticket(
            api,
            attendee_a,
            primary_event_id,
            primary_ticket_type["id"],
            "Attendee A for the primary event",
        )
        my_tickets = api.get("/me/tickets", token=attendee_a.token)
        expect(
            any(ticket["id"] == primary_ticket_a["id"] for ticket in my_tickets),
            "Attendee A can see the claimed ticket in My Tickets",
        )

        attendee_ticket_detail = api.get(
            f"/tickets/{primary_ticket_a['id']}",
            token=attendee_a.token,
        )
        organizer_ticket_detail = api.get(
            f"/tickets/{primary_ticket_a['id']}",
            token=organizer.token,
        )
        staff_ticket_detail = api.get(
            f"/tickets/{primary_ticket_a['id']}",
            token=staff.token,
        )
        expect(
            attendee_ticket_detail.get("qrToken") == primary_ticket_a["qrToken"],
            "Attendee ticket detail includes the QR token",
        )
        expect(
            organizer_ticket_detail.get("id") == primary_ticket_a["id"],
            "Organizer can view attendee ticket detail",
        )
        expect(
            staff_ticket_detail.get("id") == primary_ticket_a["id"],
            "Assigned staff can view attendee ticket detail",
        )

        duplicate_claim_error = api.post(
            f"/events/{primary_event_id}/tickets",
            token=attendee_a.token,
            expected_status=409,
            json_body={"ticketTypeId": primary_ticket_type["id"]},
        )
        expect(
            duplicate_claim_error.get("code") == "ALREADY_CLAIMED",
            "Attendee cannot claim the same event twice",
        )

        log("\n== Staff scan flow ==")
        first_result = validate_token(
            api,
            staff,
            primary_event_id,
            primary_ticket_a["qrToken"],
            "Primary Event Ticket A",
        )
        expect(
            first_result.get("status") == "success",
            "First scan of the primary ticket succeeds",
        )
        success_event = listener.expect_event("success")
        expect(
            success_event.get("ticket", {}).get("id") == primary_ticket_a["id"],
            "Organizer realtime feed receives the successful scan",
        )
        dashboard_after_success = get_dashboard(api, organizer, primary_event_id)
        expect(
            dashboard_after_success.get("checkedInCount") == 1,
            "Dashboard checked-in count increases after a valid scan",
        )
        expect(
            dashboard_has_activity(
                dashboard_after_success,
                status="success",
                ticket_id=primary_ticket_a["id"],
            ),
            "Dashboard activity includes the valid scan",
        )

        duplicate_result = validate_token(
            api,
            staff,
            primary_event_id,
            primary_ticket_a["qrToken"],
            "Primary Event Ticket A again",
        )
        expect(
            duplicate_result.get("status") == "already_used",
            "Second scan of the same ticket returns already_used",
        )
        duplicate_event = listener.expect_event("already_used")
        expect(
            duplicate_event.get("checkIn", {}).get("ticketId") == primary_ticket_a["id"],
            "Organizer realtime feed receives the duplicate scan alert",
        )
        dashboard_after_duplicate = get_dashboard(api, organizer, primary_event_id)
        expect(
            dashboard_after_duplicate.get("checkedInCount") == 1,
            "Dashboard count does not increase after a duplicate scan",
        )
        expect(
            dashboard_has_activity(
                dashboard_after_duplicate,
                status="already_used",
                message="Duplicate scan attempt detected",
                ticket_id=primary_ticket_a["id"],
            ),
            "Dashboard activity includes the duplicate scan alert",
        )

        log("\n== Wrong-event and invalid-token checks ==")
        secondary_event = create_event(api, organizer, run_id, "Secondary Event")
        secondary_event_id = secondary_event["id"]
        secondary_ticket_type = create_ticket_type(
            api, organizer, secondary_event_id, "Secondary Admission"
        )
        secondary_ticket = claim_ticket(
            api,
            attendee_b,
            secondary_event_id,
            secondary_ticket_type["id"],
            "Attendee B for the secondary event",
        )

        wrong_event_result = validate_token(
            api,
            staff,
            primary_event_id,
            secondary_ticket["qrToken"],
            "a secondary-event ticket against the primary event scanner",
        )
        expect(
            wrong_event_result.get("status") == "wrong_event",
            "Scanning a different event's ticket returns wrong_event",
        )
        listener.expect_event("wrong_event")
        dashboard_after_wrong_event = get_dashboard(api, organizer, primary_event_id)
        expect(
            dashboard_has_activity(
                dashboard_after_wrong_event,
                status="wrong_event",
                message="Scanned ticket belongs to another event",
            ),
            "Dashboard activity includes the wrong-event scan alert",
        )

        invalid_result = validate_token(
            api,
            staff,
            primary_event_id,
            args.invalid_token,
            "an invalid QR token",
        )
        expect(
            invalid_result.get("status") == "invalid_ticket",
            "Scanning a fake token returns invalid_ticket",
        )
        listener.expect_event("invalid_ticket")
        dashboard_after_invalid = get_dashboard(api, organizer, primary_event_id)
        expect(
            dashboard_has_activity(
                dashboard_after_invalid,
                status="invalid_ticket",
                message="Invalid ticket scan",
            ),
            "Dashboard activity includes the invalid scan alert",
        )

        log("\n== Continue after failures ==")
        primary_ticket_b = claim_ticket(
            api,
            attendee_b,
            primary_event_id,
            primary_ticket_type["id"],
            "Attendee B for the primary event",
        )
        final_success = validate_token(
            api,
            staff,
            primary_event_id,
            primary_ticket_b["qrToken"],
            "Primary Event Ticket B",
        )
        expect(
            final_success.get("status") == "success",
            "Staff can still validate a fresh ticket after failure cases",
        )
        final_event = listener.expect_event("success")
        expect(
            final_event.get("ticket", {}).get("id") == primary_ticket_b["id"],
            "Organizer realtime feed receives the final valid scan",
        )
        final_dashboard = get_dashboard(api, organizer, primary_event_id)
        expect(
            final_dashboard.get("checkedInCount") == 2,
            "Dashboard ends with two successful check-ins on the primary event",
        )

    finally:
        listener.close()

    log("\n== Summary ==")
    log(f"Run ID: {run_id}")
    log(f"Organizer email: {organizer.email}")
    log(f"Organizer password: {organizer.password}")
    log(f"Primary event ID: {primary_event_id}")
    log(f"Secondary event ID: {secondary_event_id}")
    log(f"Primary ticket A ID: {primary_ticket_a['id']}")
    log(f"Primary ticket B ID: {primary_ticket_b['id']}")
    log("Core app flow completed successfully.")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run a broad end-to-end test of the ticketing app's core flow."
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:3000",
        help="Backend base URL. Default: http://localhost:3000",
    )
    parser.add_argument(
        "--socket-url",
        default=None,
        help="Socket.IO server URL. Defaults to the value of --base-url.",
    )
    parser.add_argument(
        "--password",
        default="Password123!",
        help="Password to use for the generated test accounts.",
    )
    parser.add_argument(
        "--invalid-token",
        default="not-a-real-token-123",
        help="Token value used for the invalid scan test.",
    )
    parser.add_argument(
        "--http-timeout",
        type=float,
        default=10.0,
        help="HTTP timeout in seconds. Default: 10",
    )
    parser.add_argument(
        "--socket-timeout",
        type=float,
        default=10.0,
        help="Socket event timeout in seconds. Default: 10",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        return run(args)
    except KeyboardInterrupt:
        print("\nInterrupted by user.", file=sys.stderr)
        return 130
    except TestFailure as exc:
        print(f"\n[FAIL] {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

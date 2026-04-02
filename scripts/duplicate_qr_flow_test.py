#!/usr/bin/env python3
"""
End-to-end duplicate QR flow test for the ECE1724 ticketing app.

This script:
1. Registers fresh Organizer, Staff, and two Attendee users.
2. Prints their credentials in the terminal.
3. Creates a new event and ticket type.
4. Assigns the Staff user to the event.
5. Claims two attendee tickets.
6. Connects to the organizer dashboard Socket.IO room.
7. Verifies valid, duplicate, invalid, and next-valid scan behavior.

Dependencies:
  pip install requests "python-socketio[client]"

Usage:
  python3 scripts/duplicate_qr_flow_test.py
  python3 scripts/duplicate_qr_flow_test.py --base-url http://localhost:3000
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

    def get(self, path: str, *, token: str | None = None) -> Any:
        return self.request("GET", path, token=token)

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


def create_event(api: ApiClient, organizer: Actor, run_id: str) -> dict[str, Any]:
    start_at = datetime.now(timezone.utc) + timedelta(hours=2)
    end_at = start_at + timedelta(hours=3)
    payload = api.post(
        "/events",
        token=organizer.token,
        expected_status=201,
        json_body={
            "title": f"Duplicate QR Demo {run_id}",
            "description": "Automated duplicate QR flow test",
            "venue": "Automation Lab",
            "startAt": iso_utc(start_at),
            "endAt": iso_utc(end_at),
            "capacity": 50,
        },
    )
    pass_check("Organizer created a fresh event")
    return payload


def create_ticket_type(
    api: ApiClient, organizer: Actor, event_id: str
) -> dict[str, Any]:
    payload = api.post(
        f"/events/{event_id}/ticket-types",
        token=organizer.token,
        expected_status=201,
        json_body={
            "name": "General Admission",
            "priceCents": 0,
            "quantity": 10,
        },
    )
    pass_check("Organizer created a ticket type")
    return payload


def assign_staff(api: ApiClient, organizer: Actor, event_id: str, staff: Actor) -> None:
    api.post(
        f"/events/{event_id}/staff",
        token=organizer.token,
        expected_status=201,
        json_body={"email": staff.email},
    )
    pass_check("Organizer assigned the staff user to the event")


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

    log("\n== Registering test users ==")
    organizer = register_user(
        api, f"organizer-{run_id}@example.com", password, "ORGANIZER"
    )
    staff = register_user(api, f"staff-{run_id}@example.com", password, "STAFF")
    attendee_a = register_user(
        api, f"attendee-a-{run_id}@example.com", password, "ATTENDEE"
    )
    attendee_b = register_user(
        api, f"attendee-b-{run_id}@example.com", password, "ATTENDEE"
    )
    pass_check("Fresh organizer, staff, and attendee accounts were created")

    log("\n== Test account credentials ==")
    print_actor_credentials("Organizer", organizer)
    print_actor_credentials("Staff", staff)
    print_actor_credentials("Attendee A", attendee_a)
    print_actor_credentials("Attendee B", attendee_b)

    log("\n== Creating event data ==")
    event = create_event(api, organizer, run_id)
    event_id = event["id"]
    ticket_type = create_ticket_type(api, organizer, event_id)
    assign_staff(api, organizer, event_id, staff)

    listener = DashboardSocketListener(
        socketio_module,
        args.socket_url or args.base_url,
        organizer.token,
        event_id,
        args.socket_timeout,
    )

    try:
        dashboard = get_dashboard(api, organizer, event_id)
        expect(
            dashboard.get("checkedInCount") == 0,
            "Organizer dashboard starts with 0 checked-in attendees",
        )

        log("\n== Claiming attendee tickets ==")
        ticket_a = claim_ticket(api, attendee_a, event_id, ticket_type["id"], "Attendee A")
        ticket_b = claim_ticket(api, attendee_b, event_id, ticket_type["id"], "Attendee B")

        log("\n== First submission of Ticket A ==")
        first_result = validate_token(api, staff, event_id, ticket_a["qrToken"], "Ticket A")
        expect(
            first_result.get("status") == "success",
            "First submission of Ticket A returns success",
        )
        first_event = listener.expect_event("success")
        expect(
            first_event.get("ticket", {}).get("id") == ticket_a["id"],
            "Organizer realtime feed recorded Ticket A as a valid check-in",
        )
        dashboard = get_dashboard(api, organizer, event_id)
        expect(
            dashboard.get("checkedInCount") == 1,
            "Dashboard checked-in count increased to 1 after the first scan",
        )

        log("\n== Duplicate submission of Ticket A ==")
        duplicate_result = validate_token(
            api, staff, event_id, ticket_a["qrToken"], "Ticket A again"
        )
        expect(
            duplicate_result.get("status") == "already_used",
            "Second submission of Ticket A returns already_used",
        )
        duplicate_event = listener.expect_event("already_used")
        expect(
            duplicate_event.get("checkIn", {}).get("ticketId") == ticket_a["id"],
            "Organizer realtime feed recorded the duplicate attempt for Ticket A",
        )
        dashboard = get_dashboard(api, organizer, event_id)
        expect(
            dashboard.get("checkedInCount") == 1,
            "Dashboard checked-in count did not increase after the duplicate scan",
        )
        expect(
            dashboard_has_activity(
                dashboard,
                status="already_used",
                message="Duplicate scan attempt detected",
                ticket_id=ticket_a["id"],
            ),
            "Dashboard payload includes the duplicate scan activity",
        )

        log("\n== Invalid token submission ==")
        invalid_result = validate_token(
            api, staff, event_id, args.invalid_token, "an invalid QR token"
        )
        expect(
            invalid_result.get("status") == "invalid_ticket",
            "Fake token returns invalid_ticket",
        )
        invalid_event = listener.expect_event("invalid_ticket")
        expect(
            invalid_event.get("status") == "invalid_ticket",
            "Organizer realtime feed recorded the invalid scan attempt",
        )
        dashboard = get_dashboard(api, organizer, event_id)
        expect(
            dashboard.get("checkedInCount") == 1,
            "Dashboard checked-in count stayed at 1 after the invalid scan",
        )
        expect(
            dashboard_has_activity(
                dashboard,
                status="invalid_ticket",
                message="Invalid ticket scan",
            ),
            "Dashboard payload includes the invalid scan activity",
        )

        log("\n== Submitting Ticket B after duplicate and invalid attempts ==")
        second_valid_result = validate_token(
            api, staff, event_id, ticket_b["qrToken"], "Ticket B"
        )
        expect(
            second_valid_result.get("status") == "success",
            "Ticket B still succeeds after duplicate and invalid attempts",
        )
        second_valid_event = listener.expect_event("success")
        expect(
            second_valid_event.get("ticket", {}).get("id") == ticket_b["id"],
            "Organizer realtime feed recorded Ticket B as a valid check-in",
        )
        dashboard = get_dashboard(api, organizer, event_id)
        expect(
            dashboard.get("checkedInCount") == 2,
            "Dashboard checked-in count increased to 2 after Ticket B",
        )

    finally:
        listener.close()

    log("\n== Summary ==")
    log(f"Run ID: {run_id}")
    log(f"Event ID: {event_id}")
    log(f"Organizer email: {organizer.email}")
    log(f"Organizer password: {organizer.password}")
    log(f"Ticket A ID: {ticket_a['id']}")
    log(f"Ticket B ID: {ticket_b['id']}")
    log("Duplicate QR flow completed successfully.")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the duplicate QR token flow against the backend API and realtime dashboard socket."
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

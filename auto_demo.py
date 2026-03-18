#!/usr/bin/env python3
"""Start a timed 3-minute automated demo flow for the project."""

from __future__ import annotations

import argparse
import base64
import json
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"
PUBLIC_DIR = FRONTEND_DIR / "public"
MANIFEST_PATH = PUBLIC_DIR / "demo-manifest.json"
LOG_DIR = ROOT / ".demo-logs"

BACKEND_URL = "http://localhost:3000"
FRONTEND_URL = "http://localhost:5173"


@dataclass(frozen=True)
class AuthBundle:
    token: str
    user: dict


class ApiError(RuntimeError):
    def __init__(self, status: int, body: dict | str):
        super().__init__(f"API {status}: {body}")
        self.status = status
        self.body = body


def isoformat(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def request_json(
    method: str,
    url: str,
    payload: dict | None = None,
    token: str | None = None,
    timeout: float = 10.0,
) -> dict:
    data = None
    headers = {"Content-Type": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            body = raw
        raise ApiError(exc.code, body) from exc


def backend_is_ready() -> bool:
    try:
        with urllib.request.urlopen(f"{BACKEND_URL}/health", timeout=3) as response:
            if response.status != 200:
                return False
    except Exception:
        return False

    try:
        data = request_json("GET", f"{BACKEND_URL}/events")
        return isinstance(data, list)
    except Exception:
        return False


def wait_for_url(url: str, timeout_seconds: int) -> None:
    deadline = time.time() + timeout_seconds
    last_error: Exception | None = None

    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=3) as response:
                if 200 <= response.status < 500:
                    return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
        time.sleep(1)

    raise RuntimeError(f"Timed out waiting for {url}: {last_error}")


def start_detached(command: list[str], cwd: Path, log_name: str) -> subprocess.Popen:
    LOG_DIR.mkdir(exist_ok=True)
    log_path = LOG_DIR / log_name
    log_file = log_path.open("ab")
    return subprocess.Popen(
        command,
        cwd=cwd,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )


def maybe_start_services(start_services: bool) -> None:
    backend_ready = backend_is_ready()
    frontend_ready = False

    try:
        wait_for_url(FRONTEND_URL, timeout_seconds=2)
        frontend_ready = True
    except Exception:
        frontend_ready = False

    if backend_ready and frontend_ready:
        print("Frontend and backend already running.")
        return

    if not start_services:
        missing = []
        if not backend_ready:
            missing.append("backend")
        if not frontend_ready:
            missing.append("frontend")
        raise RuntimeError(
            "Missing running services: "
            + ", ".join(missing)
            + ". Re-run without --skip-start to launch them automatically."
        )

    print("Starting local services...")
    try:
        subprocess.run(
            ["docker", "compose", "up", "-d", "postgres"],
            cwd=ROOT,
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except FileNotFoundError:
        print("Docker is not installed here; skipping docker compose and using any existing Postgres service.")

    if not backend_ready:
        start_detached(["npm", "run", "dev"], BACKEND_DIR, "backend.log")

    if not frontend_ready:
        start_detached(["npm", "run", "dev"], FRONTEND_DIR, "frontend.log")

    deadline = time.time() + 60
    while time.time() < deadline:
        if backend_is_ready():
            break
        time.sleep(1)
    else:
        raise RuntimeError(
            "Backend started responding on port 3000, but its database-backed routes are not ready. "
            "Check backend/.env and your PostgreSQL connection."
        )

    wait_for_url(FRONTEND_URL, timeout_seconds=60)
    print("Frontend and backend are ready.")


def ensure_account(email: str, password: str, role: str) -> AuthBundle:
    register_url = f"{BACKEND_URL}/auth/register"
    login_url = f"{BACKEND_URL}/auth/login"
    payload = {"email": email, "password": password, "role": role}

    try:
        response = request_json("POST", register_url, payload)
    except ApiError as exc:
        if exc.status == 500:
            raise RuntimeError(
                "Backend is reachable, but account creation failed with a 500. "
                "This usually means the backend database connection is broken or points at the wrong PostgreSQL instance. "
                "Fix backend/.env and rerun Prisma migration before starting the auto demo."
            ) from exc
        if exc.status != 409:
            raise
        response = request_json("POST", login_url, {"email": email, "password": password})

    return AuthBundle(token=response["token"], user=response["user"])


def create_demo_data() -> dict:
    stamp = int(time.time())
    password = "DemoPass123!"

    organizer = ensure_account(f"demo.organizer.{stamp}@campus.local", password, "ORGANIZER")
    staff = ensure_account(f"demo.staff.{stamp}@campus.local", password, "STAFF")
    attendee = ensure_account(f"demo.attendee.{stamp}@campus.local", password, "ATTENDEE")
    start_at = datetime.now() + timedelta(days=7, hours=2)
    end_at = start_at + timedelta(hours=2)

    return {
        "organizer": organizer,
        "staff": staff,
        "attendee": attendee,
        "password": password,
        "demoValues": {
            "eventTitle": f"Automated Demo Event {stamp}",
            "eventDescription": "An event created automatically through the UI for the presentation walkthrough.",
            "eventVenue": "Hart House Great Hall",
            "eventStartAt": start_at.strftime("%Y-%m-%dT%H:%M"),
            "eventEndAt": end_at.strftime("%Y-%m-%dT%H:%M"),
            "eventCapacity": "120",
            "createEventFilledPauseMs": 18000,
            "createEventDetailPauseMs": 5000,
            "createTicketTypeDetailPauseMs": 3000,
            "attendeeEventDetailPauseMs": 2000,
            "ticketName": "General Admission",
            "ticketPrice": "0",
            "ticketQuantity": "120",
            "createTicketTypeFilledPauseMs": 6000,
            "myTicketsPagePauseMs": 11200,
            "scannerFilledPauseMs": 3000,
        },
    }


def encode_user(user: dict) -> str:
    raw = json.dumps(user, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def build_url(path: str, auth: AuthBundle, params: dict[str, str] | None = None) -> str:
    query = {
        "demoToken": auth.token,
        "demoUser": encode_user(auth.user),
    }
    if params:
        query.update(params)
    return f"{FRONTEND_URL}{path}?{urllib.parse.urlencode(query)}"


def build_manifest(data: dict) -> dict:
    return {
        "title": "3-Minute UI Autoplay Demo",
        "countdownSeconds": 3,
        "durationSeconds": 180,
        "auth": {
            "organizer": {
                "token": data["organizer"].token,
                "user": data["organizer"].user,
            },
            "staff": {
                "token": data["staff"].token,
                "user": data["staff"].user,
            },
            "attendee": {
                "token": data["attendee"].token,
                "user": data["attendee"].user,
            },
        },
        "staffEmail": data["staff"].user["email"],
        "demoValues": data["demoValues"],
        "segments": [
            {
                "start": 0,
                "end": 20,
                "title": "Organizer Event Management",
                "kind": "organizer-home",
                "actions": [
                    "Show the organizer event list and navigation.",
                    "Point out that organizer-only options are available.",
                ],
                "say": [
                    "We start on the organizer side, already authenticated as an organizer.",
                    "From here, the organizer can manage events and move into the event creation flow.",
                ],
                "proofs": [
                    "Organizer flow",
                    "Protected organizer routes",
                ],
            },
            {
                "start": 20,
                "end": 44,
                "title": "Create Event",
                "kind": "create-event",
                "actions": [
                    "Open the Create Event page.",
                    "Auto-fill the form and submit it through the real UI.",
                ],
                "say": [
                    "Now the organizer creates a new event through the UI.",
                    "The form submission creates a real event record in the backend database.",
                ],
                "proofs": [
                    "Frontend form handling",
                    "Backend event creation",
                    "Database persistence",
                ],
            },
            {
                "start": 44,
                "end": 75,
                "title": "Add Ticket Type",
                "kind": "create-ticket-type",
                "actions": [
                    "Open the ticket type form for the newly created event.",
                    "Auto-fill the ticket type and submit it.",
                ],
                "say": [
                    "Next, the organizer creates a ticket type for this event.",
                    "That makes the event claimable for attendees.",
                ],
                "proofs": [
                    "Ticket type creation",
                    "Database write",
                ],
            },
            {
                "start": 75,
                "end": 92,
                "title": "Assign Staff",
                "kind": "assign-staff",
                "actions": [
                    "Open the staff assignment page.",
                    "Auto-add the demo staff account to the event by email.",
                ],
                "say": [
                    "Now the organizer assigns a staff member to the event.",
                    "In the current version, staff assignment uses the staff account email instead of the user ID.",
                    "Only assigned staff should be able to validate tickets for that event.",
                ],
                "proofs": [
                    "Role-based workflow",
                    "Organizer-only management",
                ],
            },
            {
                "start": 92,
                "end": 120,
                "title": "Attendee Claim Ticket",
                "kind": "claim-ticket",
                "actions": [
                    "Open the event detail page as an attendee.",
                    "Use the real Claim Ticket button and navigate to the ticket detail page.",
                ],
                "say": [
                    "On the attendee side, the ticket is claimed through the event page.",
                    "The attendee receives a unique QR token for check-in.",
                ],
                "proofs": [
                    "Attendee experience",
                    "Ticket issuance",
                ],
            },
            {
                "start": 120,
                "end": 140,
                "title": "Staff Scan Success",
                "kind": "scan-success",
                "actions": [
                    "Open the scanner as the assigned staff user.",
                    "Auto-submit the claimed QR token and show the VALID result.",
                ],
                "say": [
                    "Now staff validate the ticket.",
                    "The backend checks that the ticket belongs to the event and has not already been used, then it records the check-in.",
                ],
                "proofs": [
                    "Validation logic",
                    "Check-in persistence",
                    "Frontend-backend integration",
                ],
            },
            {
                "start": 140,
                "end": 152,
                "title": "Duplicate Scan Prevention",
                "kind": "scan-duplicate",
                "actions": [
                    "Scan the same QR token again.",
                    "Show the ALREADY USED result.",
                ],
                "say": [
                    "If the same ticket is scanned again, duplicate prevention is triggered immediately.",
                ],
                "proofs": [
                    "Duplicate prevention",
                ],
            },
            {
                "start": 152,
                "end": 180,
                "title": "Organizer Dashboard Live Update",
                "kind": "dashboard",
                "frame": "dashboard",
                "actions": [
                    "Return to the organizer dashboard that has been open in the background.",
                    "Point out the updated checked-in count and recent activity feed.",
                ],
                "say": [
                    "Back on the organizer dashboard, the checked-in count and recent activity update without refreshing.",
                    "This demonstrates our real-time functionality using Socket.IO.",
                    "In one workflow, we demonstrated organizer management, attendee ticketing, staff validation, database persistence, and live dashboard updates.",
                ],
                "proofs": [
                    "Real-time dashboard",
                    "Recent check-ins",
                    "Strong closing",
                ],
            },
        ],
    }


def write_manifest(manifest: dict) -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def open_controller() -> None:
    ts = int(time.time())
    controller_url = f"{FRONTEND_URL}/demo-controller.html?ts={ts}"
    webbrowser.open(controller_url)
    print(f"Opened controller: {controller_url}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed demo data and launch an automated 3-minute browser demo."
    )
    parser.add_argument(
        "--skip-start",
        action="store_true",
        help="Do not auto-start postgres/backend/frontend; expect them to already be running.",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Create the manifest without opening the controller page.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    maybe_start_services(start_services=not args.skip_start)
    data = create_demo_data()
    manifest = build_manifest(data)
    write_manifest(manifest)

    print(f"Wrote manifest to {MANIFEST_PATH}")
    print("Demo accounts:")
    print(f"  Organizer: {data['organizer'].user['email']}")
    print(f"  Staff:     {data['staff'].user['email']}")
    print(f"  Attendee:  {data['attendee'].user['email']}")
    print(f"  Password:  {data['password']}")

    if not args.no_browser:
        open_controller()
    else:
        print("Browser launch skipped.")

    print("Automated demo is ready.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

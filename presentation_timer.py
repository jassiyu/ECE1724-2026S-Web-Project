#!/usr/bin/env python3
"""Timed presentation/demo cue runner based on presentation.md."""

from __future__ import annotations

import argparse
import sys
import time
from dataclasses import dataclass


@dataclass(frozen=True)
class Cue:
    start: int
    end: int
    title: str
    actions: tuple[str, ...]
    narration: tuple[str, ...]
    proofs: tuple[str, ...] = ()
    notes: tuple[str, ...] = ()

    @property
    def duration(self) -> int:
        return self.end - self.start


def format_mmss(seconds: int) -> str:
    minutes, seconds = divmod(seconds, 60)
    return f"{minutes}:{seconds:02d}"


def build_slide_cues() -> list[Cue]:
    return [
        Cue(
            start=0,
            end=40,
            title="Slide 1: Problem and Users",
            actions=(
                "Show the title/problem slide.",
                "Point out the three user roles: organizer, staff, attendee.",
            ),
            narration=(
                "Our project is an event ticketing and check-in platform for small organizers.",
                "Many student clubs and small events still rely on Google Forms and spreadsheets, which can cause slow check-in, duplicate entry, and poor live visibility during peak arrival times.",
                "Our main users are organizers, staff, and attendees.",
            ),
            proofs=("Clarity of presentation",),
        ),
        Cue(
            start=40,
            end=75,
            title="Slide 2: End-to-End Workflow",
            actions=(
                "Show the workflow diagram.",
                "Trace the flow from organizer setup to live dashboard update.",
            ),
            narration=(
                "Our system supports one complete workflow: the organizer creates an event, an attendee gets a ticket with a QR token, staff validate it at the door, and the organizer dashboard updates live.",
            ),
            proofs=("Project purpose", "Integrated system flow"),
        ),
        Cue(
            start=75,
            end=130,
            title="Slide 3: Architecture and Core Technical Requirements",
            actions=(
                "Show the architecture slide.",
                "Briefly point at frontend, backend, database, storage, and real-time pieces.",
            ),
            narration=(
                "On the frontend, we use React with TypeScript and Tailwind CSS.",
                "On the backend, we use Express with TypeScript.",
                "We use PostgreSQL with Prisma for relational data storage, and S3-compatible object storage for event poster uploads.",
                "The frontend and backend communicate through REST APIs.",
                "This means our project covers the core technical requirements: TypeScript on both sides, a working frontend, a working backend, frontend-backend integration, relational database persistence, and cloud file handling.",
            ),
            proofs=(
                "TypeScript usage",
                "Frontend implementation",
                "Backend implementation",
                "Relational database usage",
                "File handling with cloud storage",
            ),
        ),
        Cue(
            start=130,
            end=180,
            title="Slide 4: Advanced Features and Demo Setup",
            actions=(
                "Show the advanced-features slide.",
                "Set up the audience for the live demo flow.",
            ),
            narration=(
                "Our first advanced feature is authentication and authorization.",
                "Different roles have different permissions: organizers manage events, staff validate tickets, and attendees view their own tickets. These permissions are enforced on the backend, not just hidden in the frontend.",
                "Our second advanced feature is real-time updates. When a staff member checks in a ticket, the organizer dashboard updates without refreshing using Socket.IO.",
                "In the demo, we will show organizer setup, attendee ticket access, staff validation, and the live dashboard update.",
            ),
            proofs=("Advanced feature 1", "Advanced feature 2"),
        ),
    ]


def build_demo_cues(attendee_mode: str) -> list[Cue]:
    attendee_actions = (
        "Log in as attendee.",
        "Claim the ticket live.",
        "Open the ticket page and keep the QR token ready.",
    )
    attendee_narration = (
        "On the attendee side, the user claims a ticket through the real event detail page.",
        "The attendee is then taken to the ticket detail page, where the QR token is shown.",
        "That token is what the staff scanner validates against the backend.",
    )
    attendee_notes = ()

    if attendee_mode == "preclaimed":
        attendee_actions = (
            "Log in as attendee.",
            "Open My Tickets.",
            "Open the pre-claimed ticket and keep the QR token ready.",
        )
        attendee_notes = (
            "Using a pre-claimed ticket is the safer fallback if the live claim flow is not fully stable.",
        )

    return [
        Cue(
            start=180,
            end=215,
            title="Demo 1: Organizer Login and Event Management",
            actions=(
                "Log in as organizer.",
                "Open the event management page or event list.",
            ),
            narration=(
                "We will now show one complete workflow.",
                "First, we are on the organizer side, looking at the event management page.",
                "This demonstrates authentication, protected routes, and organizer-only capabilities at the start of the demo.",
            ),
            proofs=("Auth", "Protected routes", "Organizer flow"),
        ),
        Cue(
            start=215,
            end=245,
            title="Demo 2: Create Event and Upload Poster",
            actions=(
                "Create a new event.",
                "Fill the event form.",
            ),
            narration=(
                "Here the organizer creates a new event through the real frontend form.",
                "When the form is submitted, the request goes to the backend and the event is stored in PostgreSQL.",
                "This is a direct example of frontend-backend integration and database persistence.",
            ),
            proofs=("Frontend-backend integration", "Database persistence"),
        ),
        Cue(
            start=245,
            end=265,
            title="Demo 3: Add Ticket Type",
            actions=("Add one ticket type.",),
            narration=(
                "Next, the organizer creates a ticket type.",
                "This is another database-backed action and it makes the event claimable for attendees.",
            ),
            proofs=("Organizer management", "Database write"),
        ),
        Cue(
            start=265,
            end=280,
            title="Demo 4: Assign Staff",
            actions=(
                "Paste the staff email address.",
                "Assign the staff member to the event.",
            ),
            narration=(
                "Now the organizer assigns a staff member to this event.",
                "In the current version, staff assignment uses the staff account email instead of a user ID.",
                "This matters because only assigned staff should be allowed to validate tickets for that event.",
            ),
            proofs=("Role-based workflow",),
        ),
        Cue(
            start=280,
            end=300,
            title="Demo 5: Attendee Ticket Access",
            actions=attendee_actions,
            narration=attendee_narration,
            proofs=("Attendee flow", "Ticket issuance or ticket access"),
            notes=attendee_notes,
        ),
        Cue(
            start=300,
            end=325,
            title="Demo 6: Staff Scan Success Case",
            actions=(
                "Log in as staff.",
                "Open the scanner.",
                "Scan or paste the token.",
                "Show VALID.",
            ),
            narration=(
                "Now staff validate the ticket.",
                "The frontend sends the token to the backend, which checks that the ticket exists, matches the event, and has not been used yet.",
                "On success, the backend creates a check-in record and the result becomes VALID.",
            ),
            proofs=("Validation logic", "Backend integration", "Check-in persistence"),
        ),
        Cue(
            start=325,
            end=332,
            title="Demo 7: Duplicate Scan Case",
            actions=(
                "Scan the same ticket again.",
                "Show ALREADY USED.",
            ),
            narration=(
                "If we scan the same ticket again, duplicate prevention is triggered immediately and the result becomes ALREADY USED.",
            ),
            proofs=("Duplicate prevention",),
            notes=(
                "If you are behind on time, this is the first section you can shorten.",
            ),
        ),
        Cue(
            start=332,
            end=360,
            title="Demo 8: Organizer Dashboard Live Update",
            actions=(
                "Return to the organizer dashboard.",
                "Show the checked-in count changed.",
                "Show recent check-ins updated.",
            ),
            narration=(
                "Back on the organizer dashboard, the checked-in count and recent activity reflect the check-in flow we just completed.",
                "This demonstrates our real-time functionality using Socket.IO, because the organizer sees live updates without refreshing the page.",
                "In one workflow, we demonstrated authentication, organizer management, attendee ticketing, staff validation, persistent data storage, duplicate prevention, and real-time dashboard updates.",
            ),
            proofs=("Real-time updates", "Recent check-ins", "Strong closing"),
        ),
    ]


def build_cues(mode: str, attendee_mode: str) -> list[Cue]:
    if mode == "demo":
        return build_demo_cues(attendee_mode)
    return build_slide_cues() + build_demo_cues(attendee_mode)


def countdown_markers(duration: int) -> list[int]:
    markers: set[int] = set()
    if duration >= 40:
        markers.update({20, 10, 5, 3, 1})
    elif duration >= 20:
        markers.update({10, 5, 3, 1})
    elif duration >= 10:
        markers.update({5, 3, 1})
    else:
        markers.update({3, 1})
    return sorted(marker for marker in markers if 0 < marker < duration)


def sleep_with_markers(duration: int, speed: float) -> None:
    started = time.monotonic()
    markers = countdown_markers(duration)

    for remaining in sorted(markers, reverse=True):
        target_elapsed = (duration - remaining) / speed
        delay = target_elapsed - (time.monotonic() - started)
        if delay > 0:
            time.sleep(delay)
        print(f"  -> {remaining}s left in this section")

    total_sleep = duration / speed
    tail = total_sleep - (time.monotonic() - started)
    if tail > 0:
        time.sleep(tail)


def print_cue(cue: Cue, base_start: int) -> None:
    local_start = cue.start - base_start
    local_end = cue.end - base_start

    print("\n" + "=" * 72)
    print(f"{cue.title}")
    print(
        f"Global time: {format_mmss(cue.start)}-{format_mmss(cue.end)}"
        f" | Local run: {format_mmss(local_start)}-{format_mmss(local_end)}"
        f" | Duration: {cue.duration}s"
    )

    if cue.actions:
        print("Action:")
        for action in cue.actions:
            print(f"  - {action}")

    if cue.narration:
        print("Say:")
        for line in cue.narration:
            print(f"  - {line}")

    if cue.proofs:
        print("Rubric signal:")
        for item in cue.proofs:
            print(f"  - {item}")

    if cue.notes:
        print("Notes:")
        for note in cue.notes:
            print(f"  - {note}")


def print_summary(cues: list[Cue], mode: str, speed: float, dry_run: bool) -> None:
    base_start = cues[0].start
    total_duration = cues[-1].end - cues[0].start

    print("=" * 72)
    print("Presentation Timer")
    print(f"Mode: {mode}")
    print(
        f"Timeline covered: {format_mmss(cues[0].start)}-{format_mmss(cues[-1].end)}"
        f" (local run {format_mmss(0)}-{format_mmss(total_duration)})"
    )
    print(f"Cues: {len(cues)}")
    if dry_run:
        print("Sleep: disabled via --dry-run")
    else:
        print(f"Sleep speed: {speed:.2f}x")
        print(
            f"Real rehearsal duration: {total_duration / speed:.1f}s"
            f" for a scripted {total_duration}s run"
        )
    if base_start == 180:
        print("Note: demo mode starts at 3:00 in the full presentation.")
    print("=" * 72)


def start_countdown(seconds: int, dry_run: bool) -> None:
    if seconds <= 0:
        return

    print(f"Starting in {seconds} seconds...")
    if dry_run:
        print("[dry-run] countdown skipped")
        return

    for remaining in range(seconds, 0, -1):
        print(f"  {remaining}...")
        time.sleep(1)
    print("Go.\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Timed cue runner for the presentation/demo flow in presentation.md."
    )
    parser.add_argument(
        "--mode",
        choices=("demo", "full"),
        default="demo",
        help="Run only the demo cues or the full 6-minute presentation.",
    )
    parser.add_argument(
        "--attendee-mode",
        choices=("preclaimed", "live-claim"),
        default="preclaimed",
        help="Use the safer pre-claimed ticket flow or the live attendee claim flow.",
    )
    parser.add_argument(
        "--speed",
        type=float,
        default=1.0,
        help="Rehearsal speed multiplier. Example: 2.0 halves all sleeps.",
    )
    parser.add_argument(
        "--start-delay",
        type=int,
        default=5,
        help="Seconds to wait before the first cue starts.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print all cues without sleeping.",
    )
    parser.add_argument(
        "--no-bell",
        action="store_true",
        help="Disable the terminal bell at the start of each cue.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.speed <= 0:
        print("error: --speed must be greater than 0", file=sys.stderr)
        return 2

    cues = build_cues(args.mode, args.attendee_mode)
    base_start = cues[0].start

    print_summary(cues, args.mode, args.speed, args.dry_run)
    start_countdown(args.start_delay, args.dry_run)

    for cue in cues:
        if not args.no_bell:
            print("\a", end="", flush=True)
        print_cue(cue, base_start)

        if args.dry_run:
            print("  -> [dry-run] sleep skipped")
            continue

        sleep_with_markers(cue.duration, args.speed)
        print("  -> Section complete")

    print("\nRun complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

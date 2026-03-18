# 3-Minute Demo Script

This script is for the **demo only**. It matches the current automated demo flow in `npm run demo:autoplay`.

## Demo Timeline

| Time | What the audience sees | What to say |
| --- | --- | --- |
| `0:00-0:10` | Organizer event list page | "We’ll use one end-to-end workflow to show the system in action. We start as an organizer on the event management page, where organizers can view and manage events." |
| `0:10-0:45` | Organizer creates a new event | "Here the organizer creates a new event through the React frontend. When we submit, the request goes to our Express backend, and the event is stored in PostgreSQL." |
| `0:45-1:10` | Organizer adds a ticket type | "Next, the organizer adds a ticket type. This is another database-backed action, and it makes the event ready for attendees to claim tickets." |
| `1:10-1:30` | Organizer opens staff management and adds a staff member | "Now the organizer assigns a staff member to this event. This is important because our role-based authorization ensures only assigned staff can validate tickets for that event." |
| `1:30-1:55` | Attendee opens the event, claims a ticket, then lands on the ticket detail page | "Switching to the attendee view, the attendee claims a ticket using the real claim flow. The system generates a unique ticket with a QR token, which is what staff will validate at check-in." |
| `1:55-2:20` | Staff opens scanner and scans successfully, showing `VALID` | "Now we switch to staff. The scanner sends the token to the backend, which checks that the ticket exists, belongs to this event, and has not been used before. If everything is valid, the backend records the check-in." |
| `2:20-2:27` | Staff scans the same ticket again, showing `ALREADY USED` | "If the same ticket is scanned a second time, duplicate prevention triggers immediately. This helps prevent duplicate entry at the door." |
| `2:27-3:00` | Organizer dashboard shows checked-in count and recent scan feed updating | "Finally, we return to the organizer dashboard. The checked-in count and recent scan feed update without a page refresh, which demonstrates our real-time functionality using Socket.IO." |

## Read-Aloud Script

### `0:00-0:10`

"We’ll use one end-to-end workflow to show the system in action. 

We start on the organizer side, already authenticated and looking at the event management page. This immediately shows our role-based access control, because organizer-only actions are available here and these routes are also protected on the backend."

### `0:10-0:45`

"Now the organizer creates a new event through the real form in the React frontend. When we submit, that request goes to our Express backend, Prisma validates and persists the event in PostgreSQL, and the UI navigates to the newly created event."

### `0:45-1:10`

"Next, the organizer adds a ticket type. This is another real database-backed action, and it turns the event from just a record into something attendees can actually claim."

### `1:10-1:30`

"Now the organizer assigns a staff member to this event. This step matters because only staff who are explicitly assigned to the event are allowed to validate tickets for that event."

### `1:30-1:55`

"Switching to the attendee view, once we land in the home page, we could see all events that we are allowed to attend, by simply clicking the event tab, we are able to see the system assigned QR code that will be used for check in."

### `1:55-2:20`

"Now we switch to staff account and open the scanner. When the QR token is submitted, the backend checks that the ticket exists, belongs to this event, and has not already been used. If everything is valid, the backend records a check-in and the staff interface returns VALID."

### `2:20-2:27`

"If the same ticket is scanned a second time, duplicate prevention triggers immediately and the result becomes ALREADY USED. This is the backend logic that prevents the same ticket from being reused at the door."

### `2:27-3:00`

"Finally, we return to the organizer dashboard. The checked-in count and recent scan feed reflect the check-in flow we just performed, which gives the organizer live operational visibility during an event. This is also where our real-time functionality appears, because the dashboard updates through Socket.IO instead of relying on a manual refresh."

"Finally, we return to the organizer dashboard. The checked-in count and recent scan feed update without a page refresh, which demonstrates our real-time functionality using Socket.IO."
// ─── Literal Types ───────────────────────────────────────────────

export type UserRole = "ORGANIZER" | "STAFF" | "ATTENDEE";

export type TicketStatus = "VALID" | "USED" | "CANCELLED";

// ─── Auth ────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: UserDTO;
}

// ─── User ────────────────────────────────────────────────

export interface UserDTO {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

// ─── Event ───────────────────────────────────────────────

export interface EventDTO {
  id: string;
  organizerId: string;
  title: string;
  description: string | null;
  venue: string | null;
  startAt: string;
  endAt: string;
  capacity: number;
  posterFileId: string | null;
  createdAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  venue?: string;
  startAt: string;
  endAt: string;
  capacity: number;
  posterFileId?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  venue?: string;
  startAt?: string;
  endAt?: string;
  capacity?: number;
  posterFileId?: string;
}

// ─── Event Staff ─────────────────────────────────────────

export interface EventStaffDTO {
  eventId: string;
  userId: string;
  user: UserDTO;
}

// ─── Ticket Type ─────────────────────────────────────────

export interface TicketTypeDTO {
  id: string;
  eventId: string;
  name: string;
  priceCents: number;
  quantity: number;
  salesStartAt: string | null;
  salesEndAt: string | null;
  soldCount?: number;
}

export interface CreateTicketTypeInput {
  name: string;
  priceCents?: number;
  quantity: number;
  salesStartAt?: string;
  salesEndAt?: string;
}

// ─── Ticket ──────────────────────────────────────────────

export interface TicketDTO {
  id: string;
  eventId: string;
  ticketTypeId: string;
  ownerId: string;
  status: TicketStatus;
  qrToken: string;
  createdAt: string;
  event?: {
    id: string;
    title: string;
    venue: string | null;
    startAt: string;
  };
  ticketType?: {
    id: string;
    name: string;
    priceCents: number;
  };
}

// ─── Check-In ────────────────────────────────────────────

export interface CheckInDTO {
  id: string;
  ticketId: string;
  eventId: string;
  checkedInBy: string;
  checkedInAt: string;
}

export type CheckInResult =
  | { status: "success"; checkIn: CheckInDTO; ticket: TicketDTO }
  | { status: "already_used"; checkIn?: CheckInDTO }
  | { status: "invalid_ticket" }
  | { status: "wrong_event" }
  | { status: "cancelled" };

// ─── Dashboard ───────────────────────────────────────────

export interface DashboardDTO {
  eventId: string;
  capacity: number;
  checkedInCount: number;
  ticketsSold: number;
  recentCheckIns: CheckInDTO[];
}

// ─── File ────────────────────────────────────────────────

export interface PresignUploadResponse {
  uploadUrl: string;
  fileId: string;
  bucketKey: string;
}

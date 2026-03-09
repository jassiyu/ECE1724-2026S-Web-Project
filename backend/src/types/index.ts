import { Request } from "express";

// ─── Enums ───────────────────────────────────────────────

export enum UserRole {
  ORGANIZER = "ORGANIZER",
  STAFF = "STAFF",
  ATTENDEE = "ATTENDEE",
}

export enum TicketStatus {
  VALID = "VALID",
  USED = "USED",
  CANCELLED = "CANCELLED",
}

// ─── Auth ────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// ─── DTOs: Auth ──────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
}

// ─── DTOs: User ──────────────────────────────────────────

export interface UserDTO {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// ─── DTOs: Event ─────────────────────────────────────────

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

export interface EventDTO {
  id: string;
  organizerId: string;
  title: string;
  description: string | null;
  venue: string | null;
  startAt: Date;
  endAt: Date;
  capacity: number;
  posterFileId: string | null;
  createdAt: Date;
}

export interface EventFilters {
  organizerId?: string;
  search?: string;
  upcoming?: boolean;
}

// ─── DTOs: Event Staff ───────────────────────────────────

export interface AddStaffInput {
  userId: string;
}

export interface EventStaffDTO {
  eventId: string;
  userId: string;
  user: UserDTO;
}

// ─── DTOs: Ticket Type ───────────────────────────────────

export interface CreateTicketTypeInput {
  name: string;
  priceCents?: number;
  quantity: number;
  salesStartAt?: string;
  salesEndAt?: string;
}

export interface TicketTypeDTO {
  id: string;
  eventId: string;
  name: string;
  priceCents: number;
  quantity: number;
  salesStartAt: Date | null;
  salesEndAt: Date | null;
  soldCount?: number;
}

// ─── DTOs: Ticket ────────────────────────────────────────

export interface ClaimTicketInput {
  ticketTypeId: string;
}

export interface TicketDTO {
  id: string;
  eventId: string;
  ticketTypeId: string;
  ownerId: string;
  status: TicketStatus;
  qrToken: string;
  createdAt: Date;
  event?: {
    id: string;
    title: string;
    venue: string | null;
    startAt: Date;
  };
  ticketType?: {
    id: string;
    name: string;
    priceCents: number;
  };
}

// ─── DTOs: Check-In ──────────────────────────────────────

export interface ValidateCheckInInput {
  qrToken: string;
}

export interface CheckInDTO {
  id: string;
  ticketId: string;
  eventId: string;
  checkedInBy: string;
  checkedInAt: Date;
}

export type CheckInResult =
  | { status: "success"; checkIn: CheckInDTO; ticket: TicketDTO }
  | { status: "already_used"; checkIn?: CheckInDTO }
  | { status: "invalid_ticket" }
  | { status: "wrong_event" }
  | { status: "cancelled" };

// ─── DTOs: Dashboard ─────────────────────────────────────

export interface DashboardDTO {
  eventId: string;
  capacity: number;
  checkedInCount: number;
  ticketsSold: number;
  recentCheckIns: CheckInDTO[];
}

// ─── DTOs: File ──────────────────────────────────────────

export interface PresignUploadInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  fileId: string;
  bucketKey: string;
}

export interface FileDTO {
  id: string;
  ownerId: string;
  bucketKey: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
  createdAt: Date;
}

// ─── Errors ──────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message: string, code?: string) {
    return new AppError(400, message, code);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message = "Forbidden") {
    return new AppError(403, message, "FORBIDDEN");
  }

  static notFound(message = "Not found") {
    return new AppError(404, message, "NOT_FOUND");
  }

  static conflict(message: string, code?: string) {
    return new AppError(409, message, code);
  }
}

import { CheckIn, Prisma, Ticket } from "@prisma/client";
import { checkInClient } from "../clients/checkin.client";
import { eventClient } from "../clients/event.client";
import { eventStaffClient } from "../clients/eventStaff.client";
import { ticketClient } from "../clients/ticket.client";
import { emitCheckIn } from "../socket";
import { scanActivityService } from "./scanActivity.service";
import {
  AppError,
  CheckInResult,
  CheckInDTO,
  TicketStatus as DomainTicketStatus,
  UserRole,
} from "../types";

export interface ICheckInService {
  validateAndCheckIn(
    eventId: string,
    qrToken: string,
    staffId: string
  ): Promise<CheckInResult>;
  getRecentCheckIns(
    eventId: string,
    requester: { userId: string; role: UserRole },
    limit?: number
  ): Promise<CheckInDTO[]>;
}

function toCheckInDTO(checkIn: CheckIn): CheckInDTO {
  return {
    id: checkIn.id,
    ticketId: checkIn.ticketId,
    eventId: checkIn.eventId,
    checkedInBy: checkIn.checkedInBy,
    checkedInAt: checkIn.checkedInAt,
  };
}

function toTicketDTO(ticket: Ticket) {
  const statusMap: Record<Ticket["status"], DomainTicketStatus> = {
    VALID: DomainTicketStatus.VALID,
    USED: DomainTicketStatus.USED,
    CANCELLED: DomainTicketStatus.CANCELLED,
  };

  return {
    id: ticket.id,
    eventId: ticket.eventId,
    ticketTypeId: ticket.ticketTypeId,
    ownerId: ticket.ownerId,
    status: statusMap[ticket.status],
    qrToken: ticket.qrToken,
    createdAt: ticket.createdAt,
  };
}

export class CheckInService implements ICheckInService {
  private async assertCheckInAccess(
    eventId: string,
    requester: { userId: string; role: UserRole }
  ): Promise<void> {
    const existingEvent = await eventClient.findById(eventId);
    if (!existingEvent) {
      throw AppError.notFound("Event not found");
    }

    if (requester.role === UserRole.ORGANIZER) {
      if (existingEvent.organizerId !== requester.userId) {
        throw AppError.forbidden("You do not own this event");
      }
      return;
    }

    if (requester.role === UserRole.STAFF) {
      const assigned = await eventStaffClient.isStaffForEvent(eventId, requester.userId);
      if (!assigned) {
        throw AppError.forbidden("Staff is not assigned to this event");
      }
      return;
    }

    throw AppError.forbidden("You are not allowed to access check-ins");
  }

  private broadcast(eventId: string, payload: CheckInResult): void {
    scanActivityService.record(eventId, payload);

    try {
      emitCheckIn(eventId, payload);
    } catch (error) {
      console.warn("Check-in broadcast skipped:", error);
    }
  }

  async validateAndCheckIn(
    eventId: string,
    qrToken: string,
    staffId: string
  ): Promise<CheckInResult> {
    const normalizedQrToken = qrToken?.trim();
    if (!normalizedQrToken) {
      throw AppError.badRequest("qrToken is required");
    }

    const existingEvent = await eventClient.findById(eventId);
    if (!existingEvent) {
      throw AppError.notFound("Event not found");
    }

    const isAssignedStaff = await eventStaffClient.isStaffForEvent(eventId, staffId);
    if (!isAssignedStaff) {
      throw AppError.forbidden("Staff is not assigned to this event");
    }

    const ticket = await ticketClient.findByQrToken(normalizedQrToken);
    if (!ticket) {
      const result: CheckInResult = { status: "invalid_ticket" };
      this.broadcast(eventId, result);
      return result;
    }

    if (ticket.eventId !== eventId) {
      const result: CheckInResult = { status: "wrong_event" };
      this.broadcast(eventId, result);
      return result;
    }

    if (ticket.status === DomainTicketStatus.CANCELLED) {
      const result: CheckInResult = { status: "cancelled" };
      this.broadcast(eventId, result);
      return result;
    }

    const existingCheckIn = await checkInClient.findByTicketId(ticket.id);
    if (existingCheckIn) {
      const result: CheckInResult = {
        status: "already_used",
        checkIn: toCheckInDTO(existingCheckIn),
      };
      this.broadcast(eventId, result);
      return result;
    }

    if (ticket.status === DomainTicketStatus.USED) {
      const result: CheckInResult = { status: "already_used" };
      this.broadcast(eventId, result);
      return result;
    }

    let checkIn: CheckIn;
    try {
      checkIn = await checkInClient.create({
        ticketId: ticket.id,
        eventId,
        checkedInBy: staffId,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const concurrentCheckIn = await checkInClient.findByTicketId(ticket.id);
        const result: CheckInResult = {
          status: "already_used",
          checkIn: concurrentCheckIn ? toCheckInDTO(concurrentCheckIn) : undefined,
        };
        this.broadcast(eventId, result);
        return result;
      }

      throw error;
    }

    const updatedTicket = await ticketClient.updateStatus(
      ticket.id,
      DomainTicketStatus.USED
    );

    const eventPayload: CheckInResult = {
      status: "success",
      checkIn: toCheckInDTO(checkIn),
      ticket: toTicketDTO(updatedTicket),
    };

    this.broadcast(eventId, eventPayload);
    return eventPayload;
  }

  async getRecentCheckIns(
    eventId: string,
    requester: { userId: string; role: UserRole },
    limit = 20
  ): Promise<CheckInDTO[]> {
    await this.assertCheckInAccess(eventId, requester);

    const checkIns = await checkInClient.findRecentByEvent(eventId, limit);
    return checkIns.map(toCheckInDTO);
  }
}

export const checkInService = new CheckInService();

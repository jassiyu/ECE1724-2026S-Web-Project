import { CheckIn, Ticket } from "@prisma/client";
import { checkInClient } from "../clients/checkin.client";
import { eventStaffClient } from "../clients/eventStaff.client";
import { ticketClient } from "../clients/ticket.client";
import { emitCheckIn } from "../socket";
import {
  AppError,
  CheckInResult,
  CheckInDTO,
  TicketStatus as DomainTicketStatus,
} from "../types";

export interface ICheckInService {
  validateAndCheckIn(
    eventId: string,
    qrToken: string,
    staffId: string
  ): Promise<CheckInResult>;
  getRecentCheckIns(eventId: string, limit?: number): Promise<CheckInDTO[]>;
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
  async validateAndCheckIn(
    eventId: string,
    qrToken: string,
    staffId: string
  ): Promise<CheckInResult> {
    const isAssignedStaff = await eventStaffClient.isStaffForEvent(eventId, staffId);
    if (!isAssignedStaff) {
      throw AppError.forbidden("Staff is not assigned to this event");
    }

    const ticket = await ticketClient.findByQrToken(qrToken);
    if (!ticket) {
      return { status: "invalid_ticket" };
    }

    if (ticket.eventId !== eventId) {
      return { status: "wrong_event" };
    }

    if (ticket.status === DomainTicketStatus.CANCELLED) {
      return { status: "cancelled" };
    }

    const existingCheckIn = await checkInClient.findByTicketId(ticket.id);
    if (existingCheckIn) {
      return {
        status: "already_used",
        checkIn: toCheckInDTO(existingCheckIn),
      };
    }

    if (ticket.status === DomainTicketStatus.USED) {
      return { status: "already_used" };
    }

    const checkIn = await checkInClient.create({
      ticketId: ticket.id,
      eventId,
      checkedInBy: staffId,
    });

    const updatedTicket = await ticketClient.updateStatus(
      ticket.id,
      DomainTicketStatus.USED
    );

    const eventPayload: CheckInResult = {
      status: "success",
      checkIn: toCheckInDTO(checkIn),
      ticket: toTicketDTO(updatedTicket),
    };

    try {
      emitCheckIn(eventId, eventPayload);
    } catch (error) {
      console.warn("Check-in broadcast skipped:", error);
    }

    return eventPayload;
  }

  async getRecentCheckIns(
    eventId: string,
    limit = 20
  ): Promise<CheckInDTO[]> {
    const checkIns = await checkInClient.findRecentByEvent(eventId, limit);
    return checkIns.map(toCheckInDTO);
  }
}

export const checkInService = new CheckInService();

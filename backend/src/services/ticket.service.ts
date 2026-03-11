import { Event, Ticket, TicketType } from "@prisma/client";
import { eventClient } from "../clients/event.client";
import { eventStaffClient } from "../clients/eventStaff.client";
import { ticketClient } from "../clients/ticket.client";
import { ticketTypeClient } from "../clients/ticketType.client";
import {
  AppError,
  ClaimTicketInput,
  TicketDTO,
  TicketStatus as DomainTicketStatus,
} from "../types";

export interface ITicketService {
  claimTicket(
    eventId: string,
    ownerId: string,
    input: ClaimTicketInput
  ): Promise<TicketDTO>;
  getMyTickets(ownerId: string): Promise<TicketDTO[]>;
  getTicket(ticketId: string, requesterId: string): Promise<TicketDTO>;
}

type TicketWithRelations = Ticket & {
  event?: Event | null;
  ticketType?: TicketType | null;
};

function toTicketDTO(ticket: TicketWithRelations): TicketDTO {
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
    event: ticket.event
      ? {
          id: ticket.event.id,
          title: ticket.event.title,
          venue: ticket.event.venue,
          startAt: ticket.event.startAt,
        }
      : undefined,
    ticketType: ticket.ticketType
      ? {
          id: ticket.ticketType.id,
          name: ticket.ticketType.name,
          priceCents: ticket.ticketType.priceCents,
        }
      : undefined,
  };
}

export class TicketService implements ITicketService {
  async claimTicket(
    eventId: string,
    ownerId: string,
    input: ClaimTicketInput
  ): Promise<TicketDTO> {
    const event = await eventClient.findById(eventId);
    if (!event) {
      throw AppError.notFound("Event not found");
    }

    const ticketType = await ticketTypeClient.findById(input.ticketTypeId);
    if (!ticketType || ticketType.eventId !== eventId) {
      throw AppError.badRequest("Ticket type is invalid for this event");
    }

    const now = new Date();
    if (ticketType.salesStartAt && now < ticketType.salesStartAt) {
      throw AppError.badRequest("Ticket sales have not started yet");
    }
    if (ticketType.salesEndAt && now > ticketType.salesEndAt) {
      throw AppError.badRequest("Ticket sales window has ended");
    }

    const soldCount = await ticketTypeClient.countSold(ticketType.id);
    if (soldCount >= ticketType.quantity) {
      throw AppError.conflict("Ticket type is sold out", "SOLD_OUT");
    }

    const existingTicket = await ticketClient.findByEventAndOwner(eventId, ownerId);
    if (existingTicket) {
      throw AppError.conflict(
        "You already claimed a ticket for this event",
        "ALREADY_CLAIMED"
      );
    }

    const ticket = await ticketClient.create({
      eventId,
      ticketTypeId: ticketType.id,
      ownerId,
    });

    return toTicketDTO(ticket);
  }

  async getMyTickets(ownerId: string): Promise<TicketDTO[]> {
    const tickets = await ticketClient.findByOwner(ownerId);
    return tickets.map((ticket) => toTicketDTO(ticket as TicketWithRelations));
  }

  async getTicket(
    ticketId: string,
    requesterId: string
  ): Promise<TicketDTO> {
    const ticket = await ticketClient.findById(ticketId);
    if (!ticket) {
      throw AppError.notFound("Ticket not found");
    }

    if (ticket.ownerId === requesterId) {
      return toTicketDTO(ticket as TicketWithRelations);
    }

    const event = await eventClient.findById(ticket.eventId);
    if (!event) {
      throw AppError.notFound("Event not found");
    }

    if (event.organizerId === requesterId) {
      return toTicketDTO(ticket as TicketWithRelations);
    }

    const isAssignedStaff = await eventStaffClient.isStaffForEvent(
      ticket.eventId,
      requesterId
    );
    if (isAssignedStaff) {
      return toTicketDTO(ticket as TicketWithRelations);
    }

    throw AppError.forbidden("You are not allowed to view this ticket");
  }
}

export const ticketService = new TicketService();

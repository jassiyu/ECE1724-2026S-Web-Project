import { ClaimTicketInput, TicketDTO } from "../types";

export interface ITicketService {
  claimTicket(
    eventId: string,
    ownerId: string,
    input: ClaimTicketInput
  ): Promise<TicketDTO>;
  getMyTickets(ownerId: string): Promise<TicketDTO[]>;
  getTicket(ticketId: string, requesterId: string): Promise<TicketDTO>;
}

// TODO: Implement TicketService
// Dependencies: ticketClient, ticketTypeClient, eventClient
export class TicketService implements ITicketService {
  async claimTicket(
    _eventId: string,
    _ownerId: string,
    _input: ClaimTicketInput
  ): Promise<TicketDTO> {
    // TODO:
    // 1. Verify event exists (eventClient.findById)
    // 2. Verify ticket type exists and belongs to event (ticketTypeClient.findById)
    // 3. Check sales window (salesStartAt / salesEndAt)
    // 4. Check availability (ticketTypeClient.countSold < quantity)
    // 5. Check user doesn't already have a ticket for this event (ticketClient.findByEventAndOwner)
    // 6. ticketClient.create({ eventId, ticketTypeId, ownerId })
    throw new Error("Not implemented");
  }

  async getMyTickets(_ownerId: string): Promise<TicketDTO[]> {
    // TODO: ticketClient.findByOwner(ownerId)
    throw new Error("Not implemented");
  }

  async getTicket(
    _ticketId: string,
    _requesterId: string
  ): Promise<TicketDTO> {
    // TODO:
    // 1. ticketClient.findById(ticketId)
    // 2. Verify requester is owner or authorized staff/organizer
    throw new Error("Not implemented");
  }
}

export const ticketService = new TicketService();

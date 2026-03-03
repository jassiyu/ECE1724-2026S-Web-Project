import { CreateTicketTypeInput, TicketTypeDTO } from "../types";

export interface ITicketTypeService {
  listByEvent(eventId: string): Promise<TicketTypeDTO[]>;
  create(
    eventId: string,
    organizerId: string,
    input: CreateTicketTypeInput
  ): Promise<TicketTypeDTO>;
}

// TODO: Implement TicketTypeService
// Dependencies: ticketTypeClient, eventClient
export class TicketTypeService implements ITicketTypeService {
  async listByEvent(_eventId: string): Promise<TicketTypeDTO[]> {
    // TODO:
    // 1. ticketTypeClient.findByEvent(eventId)
    // 2. For each, attach soldCount via ticketTypeClient.countSold
    throw new Error("Not implemented");
  }

  async create(
    _eventId: string,
    _organizerId: string,
    _input: CreateTicketTypeInput
  ): Promise<TicketTypeDTO> {
    // TODO:
    // 1. Verify organizer owns event
    // 2. ticketTypeClient.create({ eventId, ...input })
    throw new Error("Not implemented");
  }
}

export const ticketTypeService = new TicketTypeService();

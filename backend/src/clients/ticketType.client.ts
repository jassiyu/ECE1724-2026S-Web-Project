import { TicketType } from "@prisma/client";

export interface ITicketTypeClient {
  findByEvent(eventId: string): Promise<TicketType[]>;
  findById(id: string): Promise<TicketType | null>;
  create(data: {
    eventId: string;
    name: string;
    priceCents: number;
    quantity: number;
    salesStartAt?: Date;
    salesEndAt?: Date;
  }): Promise<TicketType>;
  countSold(ticketTypeId: string): Promise<number>;
}

// TODO: Implement TicketTypeClient using prisma
export class TicketTypeClient implements ITicketTypeClient {
  async findByEvent(_eventId: string): Promise<TicketType[]> {
    // TODO: prisma.ticketType.findMany({ where: { eventId } })
    throw new Error("Not implemented");
  }

  async findById(_id: string): Promise<TicketType | null> {
    // TODO: prisma.ticketType.findUnique({ where: { id } })
    throw new Error("Not implemented");
  }

  async create(_data: {
    eventId: string;
    name: string;
    priceCents: number;
    quantity: number;
    salesStartAt?: Date;
    salesEndAt?: Date;
  }): Promise<TicketType> {
    // TODO: prisma.ticketType.create({ data })
    throw new Error("Not implemented");
  }

  async countSold(_ticketTypeId: string): Promise<number> {
    // TODO: prisma.ticket.count({ where: { ticketTypeId } })
    throw new Error("Not implemented");
  }
}

export const ticketTypeClient = new TicketTypeClient();

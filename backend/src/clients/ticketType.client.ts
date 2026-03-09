import { TicketType } from "@prisma/client";
import prisma from "./prisma.client";

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

export class TicketTypeClient implements ITicketTypeClient {
  async findByEvent(eventId: string): Promise<TicketType[]> {
    return prisma.ticketType.findMany({ where: { eventId } });
  }

  async findById(id: string): Promise<TicketType | null> {
    return prisma.ticketType.findUnique({ where: { id } });
  }

  async create(data: {
    eventId: string;
    name: string;
    priceCents: number;
    quantity: number;
    salesStartAt?: Date;
    salesEndAt?: Date;
  }): Promise<TicketType> {
    return prisma.ticketType.create({ data });
  }

  async countSold(ticketTypeId: string): Promise<number> {
    return prisma.ticket.count({ where: { ticketTypeId } });
  }
}

export const ticketTypeClient = new TicketTypeClient();

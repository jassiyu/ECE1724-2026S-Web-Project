import { Ticket } from "@prisma/client";
import { TicketStatus } from "../types";

export interface ITicketClient {
  findById(id: string): Promise<Ticket | null>;
  findByQrToken(qrToken: string): Promise<Ticket | null>;
  findByOwner(ownerId: string): Promise<Ticket[]>;
  findByEventAndOwner(
    eventId: string,
    ownerId: string
  ): Promise<Ticket | null>;
  create(data: {
    eventId: string;
    ticketTypeId: string;
    ownerId: string;
  }): Promise<Ticket>;
  updateStatus(id: string, status: TicketStatus): Promise<Ticket>;
  countByTicketType(ticketTypeId: string): Promise<number>;
}

// TODO: Implement TicketClient using prisma
export class TicketClient implements ITicketClient {
  async findById(_id: string): Promise<Ticket | null> {
    // TODO: prisma.ticket.findUnique({ where: { id } })
    throw new Error("Not implemented");
  }

  async findByQrToken(_qrToken: string): Promise<Ticket | null> {
    // TODO: prisma.ticket.findUnique({ where: { qrToken } })
    throw new Error("Not implemented");
  }

  async findByOwner(_ownerId: string): Promise<Ticket[]> {
    // TODO: prisma.ticket.findMany({ where: { ownerId }, include: { event: true, ticketType: true } })
    throw new Error("Not implemented");
  }

  async findByEventAndOwner(
    _eventId: string,
    _ownerId: string
  ): Promise<Ticket | null> {
    // TODO: prisma.ticket.findFirst({ where: { eventId, ownerId } })
    throw new Error("Not implemented");
  }

  async create(_data: {
    eventId: string;
    ticketTypeId: string;
    ownerId: string;
  }): Promise<Ticket> {
    // TODO: prisma.ticket.create({ data })
    throw new Error("Not implemented");
  }

  async updateStatus(_id: string, _status: TicketStatus): Promise<Ticket> {
    // TODO: prisma.ticket.update({ where: { id }, data: { status } })
    throw new Error("Not implemented");
  }

  async countByTicketType(_ticketTypeId: string): Promise<number> {
    // TODO: prisma.ticket.count({ where: { ticketTypeId } })
    throw new Error("Not implemented");
  }
}

export const ticketClient = new TicketClient();

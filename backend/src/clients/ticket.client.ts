import { Ticket, TicketStatus as PrismaTicketStatus } from "@prisma/client";
import { TicketStatus } from "../types";
import prisma from "./prisma.client";

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

export class TicketClient implements ITicketClient {
  async findById(id: string): Promise<Ticket | null> {
    return prisma.ticket.findUnique({
      where: { id },
      include: { event: true, ticketType: true },
    });
  }

  async findByQrToken(qrToken: string): Promise<Ticket | null> {
    return prisma.ticket.findUnique({ where: { qrToken } });
  }

  async findByOwner(ownerId: string): Promise<Ticket[]> {
    return prisma.ticket.findMany({
      where: { ownerId },
      include: { event: true, ticketType: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByEventAndOwner(
    eventId: string,
    ownerId: string
  ): Promise<Ticket | null> {
    return prisma.ticket.findFirst({
      where: { eventId, ownerId },
    });
  }

  async create(data: {
    eventId: string;
    ticketTypeId: string;
    ownerId: string;
  }): Promise<Ticket> {
    return prisma.ticket.create({ data });
  }

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    const statusMap: Record<TicketStatus, PrismaTicketStatus> = {
      [TicketStatus.VALID]: PrismaTicketStatus.VALID,
      [TicketStatus.USED]: PrismaTicketStatus.USED,
      [TicketStatus.CANCELLED]: PrismaTicketStatus.CANCELLED,
    };

    return prisma.ticket.update({
      where: { id },
      data: { status: statusMap[status] },
    });
  }

  async countByTicketType(ticketTypeId: string): Promise<number> {
    return prisma.ticket.count({ where: { ticketTypeId } });
  }
}

export const ticketClient = new TicketClient();

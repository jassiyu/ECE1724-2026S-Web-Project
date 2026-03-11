import { CheckIn } from "@prisma/client";
import prisma from "./prisma.client";

export interface ICheckInClient {
  findByTicketId(ticketId: string): Promise<CheckIn | null>;
  findRecentByEvent(eventId: string, limit?: number): Promise<CheckIn[]>;
  countByEvent(eventId: string): Promise<number>;
  create(data: {
    ticketId: string;
    eventId: string;
    checkedInBy: string;
  }): Promise<CheckIn>;
}

export class CheckInClient implements ICheckInClient {
  async findByTicketId(ticketId: string): Promise<CheckIn | null> {
    return prisma.checkIn.findUnique({ where: { ticketId } });
  }

  async findRecentByEvent(
    eventId: string,
    limit = 20
  ): Promise<CheckIn[]> {
    return prisma.checkIn.findMany({
      where: { eventId },
      orderBy: { checkedInAt: "desc" },
      take: limit,
    });
  }

  async countByEvent(eventId: string): Promise<number> {
    return prisma.checkIn.count({ where: { eventId } });
  }

  async create(data: {
    ticketId: string;
    eventId: string;
    checkedInBy: string;
  }): Promise<CheckIn> {
    return prisma.checkIn.create({ data });
  }
}

export const checkInClient = new CheckInClient();

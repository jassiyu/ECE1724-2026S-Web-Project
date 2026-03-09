import { CheckIn } from "@prisma/client";

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

// TODO: Implement CheckInClient using prisma
export class CheckInClient implements ICheckInClient {
  async findByTicketId(_ticketId: string): Promise<CheckIn | null> {
    // TODO: prisma.checkIn.findUnique({ where: { ticketId } })
    throw new Error("Not implemented");
  }

  async findRecentByEvent(
    _eventId: string,
    _limit = 20
  ): Promise<CheckIn[]> {
    // TODO: prisma.checkIn.findMany({ where: { eventId }, orderBy: { checkedInAt: 'desc' }, take: limit })
    throw new Error("Not implemented");
  }

  async countByEvent(_eventId: string): Promise<number> {
    // TODO: prisma.checkIn.count({ where: { eventId } })
    throw new Error("Not implemented");
  }

  async create(_data: {
    ticketId: string;
    eventId: string;
    checkedInBy: string;
  }): Promise<CheckIn> {
    // TODO: prisma.checkIn.create({ data })
    throw new Error("Not implemented");
  }
}

export const checkInClient = new CheckInClient();

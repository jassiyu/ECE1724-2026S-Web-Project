import { EventStaff, User } from "@prisma/client";
import prisma from "./prisma.client";

export type EventStaffWithUser = EventStaff & { user: User };

export interface IEventStaffClient {
  findByEvent(eventId: string): Promise<EventStaffWithUser[]>;
  findByEventAndUser(
    eventId: string,
    userId: string
  ): Promise<EventStaff | null>;
  isStaffForEvent(eventId: string, userId: string): Promise<boolean>;
  create(eventId: string, userId: string): Promise<EventStaff>;
  remove(eventId: string, userId: string): Promise<void>;
}

export class EventStaffClient implements IEventStaffClient {
  async findByEvent(eventId: string): Promise<EventStaffWithUser[]> {
    return prisma.eventStaff.findMany({
      where: { eventId },
      include: { user: true },
    });
  }

  async findByEventAndUser(
    eventId: string,
    userId: string
  ): Promise<EventStaff | null> {
    return prisma.eventStaff.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
  }

  async isStaffForEvent(eventId: string, userId: string): Promise<boolean> {
    const assignment = await this.findByEventAndUser(eventId, userId);
    return assignment !== null;
  }

  async create(eventId: string, userId: string): Promise<EventStaff> {
    return prisma.eventStaff.create({
      data: { eventId, userId },
    });
  }

  async remove(eventId: string, userId: string): Promise<void> {
    await prisma.eventStaff.delete({
      where: { eventId_userId: { eventId, userId } },
    });
  }
}

export const eventStaffClient = new EventStaffClient();

import { EventStaff } from "@prisma/client";

export interface IEventStaffClient {
  findByEvent(eventId: string): Promise<EventStaff[]>;
  findByEventAndUser(
    eventId: string,
    userId: string
  ): Promise<EventStaff | null>;
  isStaffForEvent(eventId: string, userId: string): Promise<boolean>;
  create(eventId: string, userId: string): Promise<EventStaff>;
  remove(eventId: string, userId: string): Promise<void>;
}

// TODO: Implement EventStaffClient using prisma
export class EventStaffClient implements IEventStaffClient {
  async findByEvent(_eventId: string): Promise<EventStaff[]> {
    // TODO: prisma.eventStaff.findMany({ where: { eventId }, include: { user: true } })
    throw new Error("Not implemented");
  }

  async findByEventAndUser(
    _eventId: string,
    _userId: string
  ): Promise<EventStaff | null> {
    // TODO: prisma.eventStaff.findUnique({ where: { eventId_userId: { eventId, userId } } })
    throw new Error("Not implemented");
  }

  async isStaffForEvent(_eventId: string, _userId: string): Promise<boolean> {
    // TODO: check if record exists
    throw new Error("Not implemented");
  }

  async create(_eventId: string, _userId: string): Promise<EventStaff> {
    // TODO: prisma.eventStaff.create({ data: { eventId, userId } })
    throw new Error("Not implemented");
  }

  async remove(_eventId: string, _userId: string): Promise<void> {
    // TODO: prisma.eventStaff.delete({ where: { eventId_userId: { eventId, userId } } })
    throw new Error("Not implemented");
  }
}

export const eventStaffClient = new EventStaffClient();

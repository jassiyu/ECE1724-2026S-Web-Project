import { Event } from "@prisma/client";
import { EventFilters } from "../types";

export interface IEventClient {
  findMany(filters?: EventFilters): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  create(data: {
    organizerId: string;
    title: string;
    description?: string;
    venue?: string;
    startAt: Date;
    endAt: Date;
    capacity: number;
    posterFileId?: string;
  }): Promise<Event>;
  update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      venue: string;
      startAt: Date;
      endAt: Date;
      capacity: number;
      posterFileId: string;
    }>
  ): Promise<Event>;
}

// TODO: Implement EventClient using prisma
export class EventClient implements IEventClient {
  async findMany(_filters?: EventFilters): Promise<Event[]> {
    // TODO: prisma.event.findMany with filters
    throw new Error("Not implemented");
  }

  async findById(_id: string): Promise<Event | null> {
    // TODO: prisma.event.findUnique({ where: { id } })
    throw new Error("Not implemented");
  }

  async create(_data: {
    organizerId: string;
    title: string;
    description?: string;
    venue?: string;
    startAt: Date;
    endAt: Date;
    capacity: number;
    posterFileId?: string;
  }): Promise<Event> {
    // TODO: prisma.event.create({ data })
    throw new Error("Not implemented");
  }

  async update(
    _id: string,
    _data: Partial<{
      title: string;
      description: string;
      venue: string;
      startAt: Date;
      endAt: Date;
      capacity: number;
      posterFileId: string;
    }>
  ): Promise<Event> {
    // TODO: prisma.event.update({ where: { id }, data })
    throw new Error("Not implemented");
  }
}

export const eventClient = new EventClient();

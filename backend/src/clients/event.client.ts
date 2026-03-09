import { Event, Prisma } from "@prisma/client";
import { EventFilters } from "../types";
import prisma from "./prisma.client";

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

export class EventClient implements IEventClient {
  async findMany(filters?: EventFilters): Promise<Event[]> {
    const where: Prisma.EventWhereInput = {};

    if (filters?.organizerId) {
      where.organizerId = filters.organizerId;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { venue: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.upcoming) {
      where.startAt = { gte: new Date() };
    }

    return prisma.event.findMany({
      where,
      orderBy: { startAt: "asc" },
    });
  }

  async findById(id: string): Promise<Event | null> {
    return prisma.event.findUnique({ where: { id } });
  }

  async create(data: {
    organizerId: string;
    title: string;
    description?: string;
    venue?: string;
    startAt: Date;
    endAt: Date;
    capacity: number;
    posterFileId?: string;
  }): Promise<Event> {
    return prisma.event.create({ data });
  }

  async update(
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
  ): Promise<Event> {
    return prisma.event.update({ where: { id }, data });
  }
}

export const eventClient = new EventClient();

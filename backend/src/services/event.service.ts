import {
  CreateEventInput,
  UpdateEventInput,
  EventDTO,
  EventFilters,
  DashboardDTO,
  AppError,
  UserRole,
} from "../types";
import { eventClient } from "../clients/event.client";
import { checkInClient } from "../clients/checkin.client";
import { eventStaffClient } from "../clients/eventStaff.client";
import prisma from "../clients/prisma.client";

export interface IEventService {
  listEvents(filters?: EventFilters): Promise<EventDTO[]>;
  getEvent(eventId: string): Promise<EventDTO>;
  createEvent(organizerId: string, data: CreateEventInput): Promise<EventDTO>;
  updateEvent(
    eventId: string,
    organizerId: string,
    data: UpdateEventInput
  ): Promise<EventDTO>;
  getDashboard(
    eventId: string,
    requester: { userId: string; role: UserRole }
  ): Promise<DashboardDTO>;
}

function toEventDTO(event: any): EventDTO {
  return {
    id: event.id,
    organizerId: event.organizerId,
    title: event.title,
    description: event.description,
    venue: event.venue,
    startAt: event.startAt,
    endAt: event.endAt,
    capacity: event.capacity,
    posterFileId: event.posterFileId,
    createdAt: event.createdAt,
  };
}

export class EventService implements IEventService {
  private async assertDashboardAccess(
    eventId: string,
    requester: { userId: string; role: UserRole }
  ) {
    const event = await eventClient.findById(eventId);
    if (!event) {
      throw AppError.notFound("Event not found");
    }

    if (requester.role === UserRole.ORGANIZER) {
      if (event.organizerId !== requester.userId) {
        throw AppError.forbidden("You do not own this event");
      }
      return event;
    }

    if (requester.role === UserRole.STAFF) {
      const assigned = await eventStaffClient.isStaffForEvent(eventId, requester.userId);
      if (!assigned) {
        throw AppError.forbidden("Staff is not assigned to this event");
      }
      return event;
    }

    throw AppError.forbidden("You are not allowed to access this dashboard");
  }

  async listEvents(filters?: EventFilters): Promise<EventDTO[]> {
    const events = await eventClient.findMany(filters);
    return events.map(toEventDTO);
  }

  async getEvent(eventId: string): Promise<EventDTO> {
    const event = await eventClient.findById(eventId);
    if (!event) {
      throw AppError.notFound("Event not found");
    }
    return toEventDTO(event);
  }

  async createEvent(
    organizerId: string,
    data: CreateEventInput
  ): Promise<EventDTO> {
    if (!Number.isInteger(data.capacity) || data.capacity <= 0) {
      throw AppError.badRequest("capacity must be a positive integer");
    }

    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw AppError.badRequest("startAt and endAt must be valid dates", "INVALID_DATES");
    }

    if (startAt >= endAt) {
      throw AppError.badRequest("startAt must be before endAt", "INVALID_DATES");
    }

    const event = await eventClient.create({
      organizerId,
      title: data.title,
      description: data.description,
      venue: data.venue,
      startAt,
      endAt,
      capacity: data.capacity,
      posterFileId: data.posterFileId,
    });

    return toEventDTO(event);
  }

  async updateEvent(
    eventId: string,
    organizerId: string,
    data: UpdateEventInput
  ): Promise<EventDTO> {
    const existing = await eventClient.findById(eventId);
    if (!existing) {
      throw AppError.notFound("Event not found");
    }
    if (existing.organizerId !== organizerId) {
      throw AppError.forbidden("You do not own this event");
    }

    const updateData: Record<string, any> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.venue !== undefined) updateData.venue = data.venue;

    let nextStartAt = existing.startAt;
    if (data.startAt !== undefined) {
      const parsedStartAt = new Date(data.startAt);
      if (Number.isNaN(parsedStartAt.getTime())) {
        throw AppError.badRequest("startAt is invalid", "INVALID_DATES");
      }
      updateData.startAt = parsedStartAt;
      nextStartAt = parsedStartAt;
    }

    let nextEndAt = existing.endAt;
    if (data.endAt !== undefined) {
      const parsedEndAt = new Date(data.endAt);
      if (Number.isNaN(parsedEndAt.getTime())) {
        throw AppError.badRequest("endAt is invalid", "INVALID_DATES");
      }
      updateData.endAt = parsedEndAt;
      nextEndAt = parsedEndAt;
    }

    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.posterFileId !== undefined) updateData.posterFileId = data.posterFileId;

    if (
      updateData.capacity !== undefined &&
      (!Number.isInteger(updateData.capacity) || updateData.capacity <= 0)
    ) {
      throw AppError.badRequest("capacity must be a positive integer");
    }

    if (nextStartAt >= nextEndAt) {
      throw AppError.badRequest("startAt must be before endAt", "INVALID_DATES");
    }

    const updated = await eventClient.update(eventId, updateData);
    return toEventDTO(updated);
  }

  async getDashboard(
    eventId: string,
    requester: { userId: string; role: UserRole }
  ): Promise<DashboardDTO> {
    const event = await this.assertDashboardAccess(eventId, requester);

    const [checkedInCount, ticketsSold, recentCheckIns] = await Promise.all([
      checkInClient.countByEvent(eventId),
      prisma.ticket.count({ where: { eventId } }),
      checkInClient.findRecentByEvent(eventId, 20),
    ]);

    return {
      eventId: event.id,
      capacity: event.capacity,
      checkedInCount,
      ticketsSold,
      recentCheckIns: recentCheckIns.map((ci) => ({
        id: ci.id,
        ticketId: ci.ticketId,
        eventId: ci.eventId,
        checkedInBy: ci.checkedInBy,
        checkedInAt: ci.checkedInAt,
      })),
    };
  }
}

export const eventService = new EventService();

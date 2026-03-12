import { AddStaffInput, AppError, EventStaffDTO, UserRole } from "../types";
import { eventClient } from "../clients/event.client";
import { eventStaffClient } from "../clients/eventStaff.client";
import { userClient } from "../clients/user.client";

export interface IEventStaffService {
  listStaff(eventId: string, organizerId: string): Promise<EventStaffDTO[]>;
  addStaff(
    eventId: string,
    organizerId: string,
    input: AddStaffInput
  ): Promise<EventStaffDTO>;
  removeStaff(
    eventId: string,
    organizerId: string,
    userId: string
  ): Promise<void>;
}

export class EventStaffService implements IEventStaffService {
  async listStaff(eventId: string, organizerId: string): Promise<EventStaffDTO[]> {
    const event = await eventClient.findById(eventId);
    if (!event) {
      throw AppError.notFound("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw AppError.forbidden("You do not own this event");
    }

    const assignments = await eventStaffClient.findByEvent(eventId);
    return assignments.map((assignment) => ({
      eventId: assignment.eventId,
      userId: assignment.userId,
      user: {
        id: assignment.user.id,
        email: assignment.user.email,
        role: assignment.user.role as UserRole,
        createdAt: assignment.user.createdAt,
      },
    }));
  }

  async addStaff(
    eventId: string,
    organizerId: string,
    input: AddStaffInput
  ): Promise<EventStaffDTO> {
    const userId = input.userId?.trim();
    if (!userId) {
      throw AppError.badRequest("userId is required");
    }

    const event = await eventClient.findById(eventId);
    if (!event) {
      throw AppError.notFound("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw AppError.forbidden("You do not own this event");
    }

    const targetUser = await userClient.findById(userId);
    if (!targetUser) {
      throw AppError.notFound("Target user not found");
    }

    if (targetUser.role !== UserRole.STAFF) {
      throw AppError.badRequest("Target user must have STAFF role");
    }

    const existing = await eventStaffClient.findByEventAndUser(eventId, userId);
    if (existing) {
      throw AppError.conflict(
        "User is already assigned to this event",
        "STAFF_ALREADY_ASSIGNED"
      );
    }

    const assignment = await eventStaffClient.create(eventId, userId);
    return {
      eventId: assignment.eventId,
      userId: assignment.userId,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role as UserRole,
        createdAt: targetUser.createdAt,
      },
    };
  }

  async removeStaff(
    eventId: string,
    organizerId: string,
    userId: string
  ): Promise<void> {
    const normalizedUserId = userId?.trim();
    if (!normalizedUserId) {
      throw AppError.badRequest("userId is required");
    }

    const event = await eventClient.findById(eventId);
    if (!event) {
      throw AppError.notFound("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw AppError.forbidden("You do not own this event");
    }

    const existing = await eventStaffClient.findByEventAndUser(eventId, normalizedUserId);
    if (!existing) {
      throw AppError.notFound("Staff assignment not found");
    }

    await eventStaffClient.remove(eventId, normalizedUserId);
  }
}

export const eventStaffService = new EventStaffService();

import { EventStaffDTO, AddStaffInput } from "../types";

export interface IEventStaffService {
  listStaff(eventId: string): Promise<EventStaffDTO[]>;
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

// TODO: Implement EventStaffService
// Dependencies: eventStaffClient, eventClient, userClient
export class EventStaffService implements IEventStaffService {
  async listStaff(_eventId: string): Promise<EventStaffDTO[]> {
    // TODO: eventStaffClient.findByEvent(eventId) with user info
    throw new Error("Not implemented");
  }

  async addStaff(
    _eventId: string,
    _organizerId: string,
    _input: AddStaffInput
  ): Promise<EventStaffDTO> {
    // TODO:
    // 1. Verify organizer owns the event (eventClient.findById, check organizerId)
    // 2. Verify target user exists and has STAFF role (userClient.findById)
    // 3. Check not already assigned (eventStaffClient.findByEventAndUser)
    // 4. eventStaffClient.create(eventId, userId)
    throw new Error("Not implemented");
  }

  async removeStaff(
    _eventId: string,
    _organizerId: string,
    _userId: string
  ): Promise<void> {
    // TODO:
    // 1. Verify organizer owns the event
    // 2. eventStaffClient.remove(eventId, userId)
    throw new Error("Not implemented");
  }
}

export const eventStaffService = new EventStaffService();

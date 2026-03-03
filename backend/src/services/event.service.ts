import {
  CreateEventInput,
  UpdateEventInput,
  EventDTO,
  EventFilters,
  DashboardDTO,
} from "../types";

export interface IEventService {
  listEvents(filters?: EventFilters): Promise<EventDTO[]>;
  getEvent(eventId: string): Promise<EventDTO>;
  createEvent(organizerId: string, data: CreateEventInput): Promise<EventDTO>;
  updateEvent(
    eventId: string,
    organizerId: string,
    data: UpdateEventInput
  ): Promise<EventDTO>;
  getDashboard(eventId: string): Promise<DashboardDTO>;
}

// TODO: Implement EventService
// Dependencies: eventClient, checkInClient, ticketClient
export class EventService implements IEventService {
  async listEvents(_filters?: EventFilters): Promise<EventDTO[]> {
    // TODO: eventClient.findMany(filters)
    throw new Error("Not implemented");
  }

  async getEvent(_eventId: string): Promise<EventDTO> {
    // TODO:
    // 1. eventClient.findById(eventId)
    // 2. Throw AppError.notFound if not found
    throw new Error("Not implemented");
  }

  async createEvent(
    _organizerId: string,
    _data: CreateEventInput
  ): Promise<EventDTO> {
    // TODO:
    // 1. Validate dates (startAt < endAt, startAt in future)
    // 2. eventClient.create({ organizerId, ...data })
    throw new Error("Not implemented");
  }

  async updateEvent(
    _eventId: string,
    _organizerId: string,
    _data: UpdateEventInput
  ): Promise<EventDTO> {
    // TODO:
    // 1. eventClient.findById(eventId)
    // 2. Verify organizer owns this event
    // 3. eventClient.update(eventId, data)
    throw new Error("Not implemented");
  }

  async getDashboard(_eventId: string): Promise<DashboardDTO> {
    // TODO:
    // 1. eventClient.findById(eventId)
    // 2. checkInClient.countByEvent(eventId)
    // 3. ticketClient.countByEvent(eventId)
    // 4. checkInClient.findRecentByEvent(eventId)
    // 5. Assemble DashboardDTO
    throw new Error("Not implemented");
  }
}

export const eventService = new EventService();

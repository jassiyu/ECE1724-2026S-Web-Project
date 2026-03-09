import apiClient from "./client";
import {
  EventDTO,
  CreateEventInput,
  UpdateEventInput,
  DashboardDTO,
  EventStaffDTO,
  TicketTypeDTO,
  CreateTicketTypeInput,
} from "../types";

export const eventsApi = {
  // ─── Events ──────────────────────────────────────────
  list(params?: { search?: string; upcoming?: boolean }): Promise<EventDTO[]> {
    // TODO: return apiClient.get('/events', { params }).then(r => r.data);
    throw new Error("Not implemented");
  },

  get(eventId: string): Promise<EventDTO> {
    // TODO: return apiClient.get(`/events/${eventId}`).then(r => r.data);
    throw new Error("Not implemented");
  },

  create(data: CreateEventInput): Promise<EventDTO> {
    // TODO: return apiClient.post('/events', data).then(r => r.data);
    throw new Error("Not implemented");
  },

  update(eventId: string, data: UpdateEventInput): Promise<EventDTO> {
    // TODO: return apiClient.put(`/events/${eventId}`, data).then(r => r.data);
    throw new Error("Not implemented");
  },

  getDashboard(eventId: string): Promise<DashboardDTO> {
    // TODO: return apiClient.get(`/events/${eventId}/dashboard`).then(r => r.data);
    throw new Error("Not implemented");
  },

  // ─── Staff ───────────────────────────────────────────
  listStaff(eventId: string): Promise<EventStaffDTO[]> {
    // TODO: return apiClient.get(`/events/${eventId}/staff`).then(r => r.data);
    throw new Error("Not implemented");
  },

  addStaff(eventId: string, userId: string): Promise<EventStaffDTO> {
    // TODO: return apiClient.post(`/events/${eventId}/staff`, { userId }).then(r => r.data);
    throw new Error("Not implemented");
  },

  removeStaff(eventId: string, userId: string): Promise<void> {
    // TODO: return apiClient.delete(`/events/${eventId}/staff/${userId}`).then(r => r.data);
    throw new Error("Not implemented");
  },

  // ─── Ticket Types ────────────────────────────────────
  listTicketTypes(eventId: string): Promise<TicketTypeDTO[]> {
    // TODO: return apiClient.get(`/events/${eventId}/ticket-types`).then(r => r.data);
    throw new Error("Not implemented");
  },

  createTicketType(
    eventId: string,
    data: CreateTicketTypeInput
  ): Promise<TicketTypeDTO> {
    // TODO: return apiClient.post(`/events/${eventId}/ticket-types`, data).then(r => r.data);
    throw new Error("Not implemented");
  },
};

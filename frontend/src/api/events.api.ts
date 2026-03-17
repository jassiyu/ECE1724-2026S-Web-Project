import apiClient from "./client";
import type {
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
    // Query params are optional; Axios will omit undefined keys.
    return apiClient.get("/events", { params }).then((r) => r.data);
  },

  get(eventId: string): Promise<EventDTO> {
    return apiClient.get(`/events/${eventId}`).then((r) => r.data);
  },

  create(data: CreateEventInput): Promise<EventDTO> {
    return apiClient.post("/events", data).then((r) => r.data);
  },

  update(eventId: string, data: UpdateEventInput): Promise<EventDTO> {
    return apiClient.put(`/events/${eventId}`, data).then((r) => r.data);
  },

  getDashboard(eventId: string): Promise<DashboardDTO> {
    return apiClient.get(`/events/${eventId}/dashboard`).then((r) => r.data);
  },

  // ─── Staff ───────────────────────────────────────────
  listStaff(eventId: string): Promise<EventStaffDTO[]> {
    return apiClient.get(`/events/${eventId}/staff`).then((r) => r.data);
  },

  addStaff(eventId: string, userId: string): Promise<EventStaffDTO> {
    return apiClient
      .post(`/events/${eventId}/staff`, { userId })
      .then((r) => r.data);
  },

  removeStaff(eventId: string, userId: string): Promise<void> {
    return apiClient.delete(`/events/${eventId}/staff/${userId}`).then(() => {
      return;
    });
  },

  // ─── Ticket Types ────────────────────────────────────
  listTicketTypes(eventId: string): Promise<TicketTypeDTO[]> {
    return apiClient.get(`/events/${eventId}/ticket-types`).then((r) => r.data);
  },

  createTicketType(
    eventId: string,
    data: CreateTicketTypeInput
  ): Promise<TicketTypeDTO> {
    return apiClient
      .post(`/events/${eventId}/ticket-types`, data)
      .then((r) => r.data);
  },

  // ─── Tickets ─────────────────────────────────────────
  claimTicket(eventId: string, ticketTypeId: string) {
    return apiClient
      .post(`/events/${eventId}/tickets`, { ticketTypeId })
      .then((r) => r.data);
  },
};

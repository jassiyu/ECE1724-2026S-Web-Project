import apiClient from "./client";
import type { TicketDTO } from "../types";

export const ticketsApi = {
  claim(eventId: string, ticketTypeId: string): Promise<TicketDTO> {
    return apiClient
      .post(`/events/${eventId}/tickets`, { ticketTypeId })
      .then((r) => r.data);
  },

  getMyTickets(): Promise<TicketDTO[]> {
    return apiClient.get("/me/tickets").then((r) => r.data);
  },

  getTicket(ticketId: string): Promise<TicketDTO> {
    return apiClient.get(`/tickets/${ticketId}`).then((r) => r.data);
  },
};

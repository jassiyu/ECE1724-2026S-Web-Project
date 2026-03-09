import apiClient from "./client";
import { TicketDTO } from "../types";

export const ticketsApi = {
  claim(eventId: string, ticketTypeId: string): Promise<TicketDTO> {
    // TODO: return apiClient.post(`/events/${eventId}/tickets`, { ticketTypeId }).then(r => r.data);
    throw new Error("Not implemented");
  },

  getMyTickets(): Promise<TicketDTO[]> {
    // TODO: return apiClient.get('/me/tickets').then(r => r.data);
    throw new Error("Not implemented");
  },

  getTicket(ticketId: string): Promise<TicketDTO> {
    // TODO: return apiClient.get(`/tickets/${ticketId}`).then(r => r.data);
    throw new Error("Not implemented");
  },
};

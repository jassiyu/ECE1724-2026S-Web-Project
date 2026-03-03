import apiClient from "./client";
import { CheckInResult, CheckInDTO } from "../types";

export const checkinsApi = {
  validate(eventId: string, qrToken: string): Promise<CheckInResult> {
    // TODO: return apiClient.post(`/events/${eventId}/checkins/validate`, { qrToken }).then(r => r.data);
    throw new Error("Not implemented");
  },

  getRecent(eventId: string, limit?: number): Promise<CheckInDTO[]> {
    // TODO: return apiClient.get(`/events/${eventId}/checkins/recent`, { params: { limit } }).then(r => r.data);
    throw new Error("Not implemented");
  },
};

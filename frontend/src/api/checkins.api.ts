import apiClient from "./client";
import type { CheckInResult, CheckInDTO } from "../types";

export const checkinsApi = {
  validate(eventId: string, qrToken: string): Promise<CheckInResult> {
    return apiClient
      .post(`/events/${eventId}/checkins/validate`, { qrToken })
      .then((r) => r.data);
  },

  getRecent(eventId: string, limit?: number): Promise<CheckInDTO[]> {
    return apiClient
      .get(`/events/${eventId}/checkins/recent`, { params: { limit } })
      .then((r) => r.data);
  },
};

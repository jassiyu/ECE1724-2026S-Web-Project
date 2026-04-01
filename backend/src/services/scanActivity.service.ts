import { randomUUID } from "crypto";
import { CheckInDTO, CheckInResult, ScanActivityDTO } from "../types";

const MAX_ALERTS_PER_EVENT = 50;

function toSuccessActivity(checkIn: CheckInDTO): ScanActivityDTO {
  return {
    id: `success:${checkIn.id}`,
    status: "success",
    timestamp: checkIn.checkedInAt,
    ticketId: checkIn.ticketId,
    message: `Ticket ${checkIn.ticketId.slice(0, 8)} checked in`,
  };
}

function toAlertActivity(result: Exclude<CheckInResult, { status: "success" }>): ScanActivityDTO {
  const now = new Date();

  switch (result.status) {
    case "already_used":
      return {
        id: `already_used:${randomUUID()}`,
        status: "already_used",
        timestamp: now,
        ticketId: result.checkIn?.ticketId,
        message: "Duplicate scan attempt detected",
      };
    case "wrong_event":
      return {
        id: `wrong_event:${randomUUID()}`,
        status: "wrong_event",
        timestamp: now,
        message: "Scanned ticket belongs to another event",
      };
    case "cancelled":
      return {
        id: `cancelled:${randomUUID()}`,
        status: "cancelled",
        timestamp: now,
        message: "Cancelled ticket was scanned",
      };
    case "invalid_ticket":
    default:
      return {
        id: `invalid_ticket:${randomUUID()}`,
        status: "invalid_ticket",
        timestamp: now,
        message: "Invalid ticket scan",
      };
  }
}

function byNewestFirst(a: ScanActivityDTO, b: ScanActivityDTO): number {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

export class ScanActivityService {
  private readonly alertsByEvent = new Map<string, ScanActivityDTO[]>();

  record(eventId: string, result: CheckInResult): void {
    if (result.status === "success") {
      return;
    }

    const nextItem = toAlertActivity(result);
    const current = this.alertsByEvent.get(eventId) ?? [];
    this.alertsByEvent.set(eventId, [nextItem, ...current].slice(0, MAX_ALERTS_PER_EVENT));
  }

  buildRecentActivity(
    eventId: string,
    recentCheckIns: CheckInDTO[],
    limit = 25
  ): ScanActivityDTO[] {
    const alerts = this.alertsByEvent.get(eventId) ?? [];
    const successes = recentCheckIns.map(toSuccessActivity);

    return [...alerts, ...successes].sort(byNewestFirst).slice(0, limit);
  }
}

export const scanActivityService = new ScanActivityService();

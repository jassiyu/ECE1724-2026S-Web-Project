import { CheckInResult, CheckInDTO } from "../types";

export interface ICheckInService {
  validateAndCheckIn(
    eventId: string,
    qrToken: string,
    staffId: string
  ): Promise<CheckInResult>;
  getRecentCheckIns(eventId: string, limit?: number): Promise<CheckInDTO[]>;
}

// TODO: Implement CheckInService
// Dependencies: ticketClient, checkInClient, eventStaffClient, socket (for broadcasting)
export class CheckInService implements ICheckInService {
  async validateAndCheckIn(
    _eventId: string,
    _qrToken: string,
    _staffId: string
  ): Promise<CheckInResult> {
    // TODO:
    // 1. ticketClient.findByQrToken(qrToken)
    //    → if not found: return { status: 'invalid_ticket' }
    // 2. Check ticket.eventId === eventId
    //    → if mismatch: return { status: 'wrong_event' }
    // 3. Check ticket.status
    //    → if CANCELLED: return { status: 'cancelled' }
    // 4. checkInClient.findByTicketId(ticket.id)
    //    → if exists: return { status: 'already_used', checkIn }
    // 5. checkInClient.create({ ticketId, eventId, checkedInBy: staffId })
    // 6. ticketClient.updateStatus(ticket.id, USED)
    // 7. Emit socket event to room `event:${eventId}`
    // 8. Return { status: 'success', checkIn, ticket }
    throw new Error("Not implemented");
  }

  async getRecentCheckIns(
    _eventId: string,
    _limit?: number
  ): Promise<CheckInDTO[]> {
    // TODO: checkInClient.findRecentByEvent(eventId, limit)
    throw new Error("Not implemented");
  }
}

export const checkInService = new CheckInService();

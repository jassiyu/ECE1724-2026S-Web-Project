import { AppError, CreateTicketTypeInput, TicketTypeDTO } from "../types";
import { eventClient } from "../clients/event.client";
import { ticketTypeClient } from "../clients/ticketType.client";

export interface ITicketTypeService {
  listByEvent(eventId: string): Promise<TicketTypeDTO[]>;
  create(
    eventId: string,
    organizerId: string,
    input: CreateTicketTypeInput
  ): Promise<TicketTypeDTO>;
}

export class TicketTypeService implements ITicketTypeService {
  async listByEvent(eventId: string): Promise<TicketTypeDTO[]> {
    const event = await eventClient.findById(eventId);
    if (!event) {
      throw AppError.notFound("Event not found");
    }

    const ticketTypes = await ticketTypeClient.findByEvent(eventId);
    const soldCounts = await Promise.all(
      ticketTypes.map((type) => ticketTypeClient.countSold(type.id))
    );

    return ticketTypes.map((type, index) => ({
      id: type.id,
      eventId: type.eventId,
      name: type.name,
      priceCents: type.priceCents,
      quantity: type.quantity,
      salesStartAt: type.salesStartAt,
      salesEndAt: type.salesEndAt,
      soldCount: soldCounts[index],
    }));
  }

  async create(
    eventId: string,
    organizerId: string,
    input: CreateTicketTypeInput
  ): Promise<TicketTypeDTO> {
    const event = await eventClient.findById(eventId);
    if (!event) {
      throw AppError.notFound("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw AppError.forbidden("You do not own this event");
    }

    const name = input.name?.trim();
    if (!name) {
      throw AppError.badRequest("name is required");
    }

    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw AppError.badRequest("quantity must be a positive integer");
    }

    const priceCents = input.priceCents ?? 0;
    if (!Number.isInteger(priceCents) || priceCents < 0) {
      throw AppError.badRequest("priceCents must be a non-negative integer");
    }

    let salesStartAt: Date | undefined;
    let salesEndAt: Date | undefined;

    if (input.salesStartAt) {
      salesStartAt = new Date(input.salesStartAt);
      if (Number.isNaN(salesStartAt.getTime())) {
        throw AppError.badRequest("salesStartAt is invalid");
      }
    }

    if (input.salesEndAt) {
      salesEndAt = new Date(input.salesEndAt);
      if (Number.isNaN(salesEndAt.getTime())) {
        throw AppError.badRequest("salesEndAt is invalid");
      }
    }

    if (salesStartAt && salesEndAt && salesStartAt >= salesEndAt) {
      throw AppError.badRequest("salesStartAt must be before salesEndAt");
    }

    const created = await ticketTypeClient.create({
      eventId,
      name,
      priceCents,
      quantity: input.quantity,
      salesStartAt,
      salesEndAt,
    });

    return {
      id: created.id,
      eventId: created.eventId,
      name: created.name,
      priceCents: created.priceCents,
      quantity: created.quantity,
      salesStartAt: created.salesStartAt,
      salesEndAt: created.salesEndAt,
      soldCount: 0,
    };
  }
}

export const ticketTypeService = new TicketTypeService();

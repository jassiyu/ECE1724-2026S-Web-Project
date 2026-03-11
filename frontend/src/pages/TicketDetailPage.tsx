import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ticketsApi } from "../api/tickets.api";
import type { TicketDTO } from "../types";
import type { TicketStatus } from "../types";

const statusStyles: Record<TicketStatus, string> = {
  VALID: "bg-green-100 text-green-700",
  USED: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<TicketDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) {
      setError("Missing ticket ID");
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const loadTicket = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await ticketsApi.getTicket(ticketId);
        if (isMounted) {
          setTicket(data);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Failed to load ticket";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTicket();

    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  const qrSrc = useMemo(() => {
    if (!ticket) return "";
    const encoded = encodeURIComponent(ticket.qrToken);
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encoded}`;
  }, [ticket]);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Ticket</h1>

      {isLoading && <p className="mt-4 text-gray-500">Loading ticket...</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}

      {!isLoading && !error && ticket && (
        <div className="mt-6 space-y-4 rounded-lg border border-gray-200 p-5 text-center">
          <div>
            <h2 className="text-lg font-semibold">
              {ticket.event?.title ?? `Event ${ticket.eventId.slice(0, 8)}`}
            </h2>
            <p className="text-sm text-gray-600">
              {ticket.ticketType?.name ?? `Type ${ticket.ticketTypeId.slice(0, 8)}`}
            </p>
          </div>

          <div className="flex justify-center">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusStyles[ticket.status]
              }`}
            >
              {ticket.status}
            </span>
          </div>

          <div className="flex justify-center">
            <img
              src={qrSrc}
              alt="Ticket QR code"
              className="h-60 w-60 rounded border border-gray-200"
            />
          </div>

          <div className="rounded bg-gray-100 p-3 text-left">
            <p className="text-xs uppercase tracking-wide text-gray-500">QR Token</p>
            <p className="break-all font-mono text-sm">{ticket.qrToken}</p>
          </div>
        </div>
      )}

      <Link to="/my-tickets" className="mt-6 inline-block text-sm text-blue-700">
        Back to My Tickets
      </Link>
    </div>
  );
}

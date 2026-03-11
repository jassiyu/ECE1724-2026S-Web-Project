import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ticketsApi } from "../api/tickets.api";
import type { TicketDTO } from "../types";
import { TicketStatus } from "../types";

function formatDate(value: string | undefined): string {
  if (!value) return "TBD";
  return new Date(value).toLocaleString();
}

const statusStyles: Record<TicketStatus, string> = {
  [TicketStatus.VALID]: "bg-green-100 text-green-700",
  [TicketStatus.USED]: "bg-amber-100 text-amber-700",
  [TicketStatus.CANCELLED]: "bg-red-100 text-red-700",
};

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTickets = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await ticketsApi.getMyTickets();
        if (isMounted) {
          setTickets(data);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Failed to load tickets";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTickets();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">My Tickets</h1>

      {isLoading && <p className="mt-4 text-gray-500">Loading tickets...</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}

      {!isLoading && !error && tickets.length === 0 && (
        <p className="mt-4 text-gray-500">You have not claimed any tickets yet.</p>
      )}

      {!isLoading && !error && tickets.length > 0 && (
        <div className="mt-6 grid gap-4">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              to={`/my-tickets/${ticket.id}`}
              className="rounded-lg border border-gray-200 p-4 transition hover:border-gray-400"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {ticket.event?.title ?? `Event ${ticket.eventId.slice(0, 8)}`}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {ticket.ticketType?.name ?? `Type ${ticket.ticketTypeId.slice(0, 8)}`}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDate(ticket.event?.startAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusStyles[ticket.status]
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

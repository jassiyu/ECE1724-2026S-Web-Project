import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { eventsApi } from "../api/events.api";
import { filesApi } from "../api/files.api";
import { useAppSelector } from "../store/hooks";
import type { EventDTO, TicketTypeDTO } from "../types";

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventDTO | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isClaimingTicketId, setIsClaimingTicketId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState("");

  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchEventDetail = async () => {
      if (!eventId) {
        setError("Event ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const [eventResponse, ticketTypesResponse] = await Promise.all([
          eventsApi.get(eventId),
          eventsApi.listTicketTypes(eventId),
        ]);

        setEvent(eventResponse);
        setTicketTypes(ticketTypesResponse);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Failed to load event details."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetail();
  }, [eventId]);

  const isAttendee = user?.role === "ATTENDEE";

  const handleClaimTicket = async (ticketTypeId: string) => {
    if (!eventId) {
      setClaimError("Event ID is missing.");
      return;
    }

    try {
      setIsClaimingTicketId(ticketTypeId);
      setClaimError("");

      await eventsApi.claimTicket(eventId, ticketTypeId);
      navigate("/my-tickets");
    } catch (err: any) {
      setClaimError(
        err?.response?.data?.error || "Failed to claim ticket."
      );
    } finally {
      setIsClaimingTicketId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {isLoading && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
          Loading event details...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {!isLoading && !error && event && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {event.title}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Event details and available ticket types
                </p>
              </div>

              {user?.role === "ORGANIZER" && (
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/events/${event.id}/dashboard`}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Live Dashboard
                  </Link>
                  <Link
                    to={`/events/${event.id}/staff`}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Manage Staff
                  </Link>
                  <Link
                    to={`/events/${event.id}/edit`}
                    className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Edit Event
                  </Link>
                </div>
              )}

              {user?.role === "STAFF" && (
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/scan/${event.id}`}
                    className="inline-flex w-fit rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Open Scanner
                  </Link>
                  <Link
                    to={`/events/${event.id}/dashboard`}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    View Dashboard
                  </Link>
                </div>
              )}

              {event.posterFileId && (
                <div className="overflow-hidden rounded-2xl border border-gray-200">
                  <img
                    src={filesApi.getDownloadUrl(event.posterFileId)}
                    alt={`${event.title} poster`}
                    className="h-64 w-full object-cover"
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">Venue</p>
                  <p className="mt-1 text-gray-900">{event.venue || "TBA"}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">Capacity</p>
                  <p className="mt-1 text-gray-900">{event.capacity}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">Start</p>
                  <p className="mt-1 text-gray-900">
                    {new Date(event.startAt).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">End</p>
                  <p className="mt-1 text-gray-900">
                    {new Date(event.endAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Description
                </h2>
                <p className="mt-2 whitespace-pre-line text-gray-700">
                  {event.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Ticket Types</h2>
              <p className="mt-1 text-sm text-gray-500">
                View available tickets for this event
              </p>
              {claimError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {claimError}
                </div>
              )}
            </div>

            {ticketTypes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                No ticket types available.
              </div>
            ) : (
              <div className="space-y-4">
                {ticketTypes.map((ticketType) => (
                  <div
                    key={ticketType.id}
                    className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {ticketType.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Price: ${(ticketType.priceCents / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Quantity: {ticketType.quantity}
                      </p>
                      <p className="text-sm text-gray-600">
                        Sales start:{" "}
                        {ticketType.salesStartAt
                          ? new Date(ticketType.salesStartAt).toLocaleString()
                          : "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Sales end:{" "}
                        {ticketType.salesEndAt
                          ? new Date(ticketType.salesEndAt).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>

                    {isAttendee && (
                      <button
                        type="button"
                        className="rounded-lg bg-black px-4 py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => handleClaimTicket(ticketType.id)}
                        disabled={isClaimingTicketId === ticketType.id}
                      >
                        {isClaimingTicketId === ticketType.id ? "Claiming..." : "Claim Ticket"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { eventsApi } from "../api/events.api";
import { filesApi } from "../api/files.api";
import type { EventDTO } from "../types";

export default function EventListPage() {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [search, setSearch] = useState("");
  const [venueFilter, setVenueFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await eventsApi.list();
        setEvents(response);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Failed to load events."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const venues = useMemo(() => {
    const uniqueVenues = Array.from(
      new Set(events.map((event) => event.venue).filter(Boolean))
    ) as string[];

    return uniqueVenues.sort((a, b) => a.localeCompare(b));
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        (event.description ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesVenue =
        !venueFilter || (event.venue ?? "") === venueFilter;

      return matchesSearch && matchesVenue;
    });
  }, [events, search, venueFilter]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10" data-demo="event-list-page">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-sm text-gray-500">
          Browse upcoming events and view details
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 lg:grid-cols-[2.1fr_1fr]">
        <div>
          <label
            htmlFor="search"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Search
          </label>
            <input
              id="search"
              type="text"
              data-demo="event-search"
              value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
          />
        </div>

        <div>
          <label
            htmlFor="venueFilter"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Venue
          </label>
            <select
              id="venueFilter"
              data-demo="event-venue-filter"
              value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
          >
            <option value="">All venues</option>
            {venues.map((venue) => (
              <option key={venue} value={venue}>
                {venue}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500">Loading events...</p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!isLoading && !error && filteredEvents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
          No events found.
        </div>
      )}

      {!isLoading && !error && filteredEvents.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              data-demo={`event-card:${event.id}`}
              className="block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {event.posterFileId ? (
                <img
                  src={filesApi.getDownloadUrl(event.posterFileId)}
                  alt={`${event.title} poster`}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="flex h-36 items-center justify-center bg-gray-100 text-sm text-gray-400">
                  No poster
                </div>
              )}

              <div className="space-y-3 p-5">
                <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>

                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-800">Date:</span>{" "}
                    {new Date(event.startAt).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">Venue:</span>{" "}
                    {event.venue || "TBA"}
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">Capacity:</span>{" "}
                    {event.capacity}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

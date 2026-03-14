import { useEffect, useState } from "react";
import { Link,useNavigate, useParams } from "react-router-dom";
import { eventsApi } from "../api/events.api";
import { filesApi } from "../api/files.api";
import type { TicketTypeDTO } from "../types";

export default function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [posterFileId, setPosterFileId] = useState("");
  const [ticketTypes, setTicketTypes] = useState<TicketTypeDTO[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [error, setError] = useState("");

  const toDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  useEffect(() => {
    const fetchEvent = async () => {
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
        const event = eventResponse;

        setTitle(event.title ?? "");
        setDescription(event.description ?? "");
        setVenue(event.venue ?? "");
        setStartAt(event.startAt ? toDateTimeLocal(event.startAt) : "");
        setEndAt(event.endAt ? toDateTimeLocal(event.endAt) : "");
        setCapacity(event.capacity != null ? String(event.capacity) : "");
        setPosterFileId(event.posterFileId ?? "");
        setTicketTypes(ticketTypesResponse);
      } catch (err: any) {
        setError(err?.response?.data?.error || "Failed to load event details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handlePosterChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Poster must be PNG or JPEG.");
      return;
    }

    try {
      setIsUploadingPoster(true);
      setError("");

      const presign = await filesApi.presignUpload(file.name, file.type, file.size);
      await filesApi.uploadToPresignedUrl(presign.uploadUrl, file);
      setPosterFileId(presign.fileId);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to upload poster.");
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!eventId) {
      setError("Event ID is missing.");
      return;
    }

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!startAt || !endAt) {
      setError("Start time and end time are required.");
      return;
    }

    if (new Date(endAt) <= new Date(startAt)) {
      setError("End time must be after start time.");
      return;
    }

    if (!capacity || Number(capacity) <= 0) {
      setError("Capacity must be greater than 0.");
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        venue: venue.trim() || undefined,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        capacity: Number(capacity),
        posterFileId: posterFileId || undefined,
      };

      await eventsApi.update(eventId, payload);
      navigate(`/events/${eventId}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to update event.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-500 shadow-sm">
          Loading event...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
        <p className="mt-2 text-gray-500">
          Update the event details below
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="title"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter event description"
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="venue"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Venue
            </label>
            <input
              id="venue"
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Enter venue"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="startAt"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Start Time
              </label>
              <input
                id="startAt"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="endAt"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                End Time
              </label>
              <input
                id="endAt"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="capacity"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Capacity
            </label>
            <input
              id="capacity"
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Enter capacity"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="poster"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Poster Upload (PNG/JPG)
            </label>
            <input
              id="poster"
              type="file"
              accept="image/png,image/jpeg"
              onChange={handlePosterChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
            {isUploadingPoster && (
              <p className="mt-2 text-sm text-gray-500">Uploading poster...</p>
            )}
            {posterFileId && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-500">
                  Current poster file: <span className="font-mono">{posterFileId}</span>
                </p>
                <img
                  src={filesApi.getDownloadUrl(posterFileId)}
                  alt="Event poster"
                  className="h-40 rounded-lg border border-gray-200 object-cover"
                />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isSaving || isUploadingPoster}
            className="w-full rounded-lg bg-black px-4 py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : isUploadingPoster ? "Uploading poster..." : "Save Event Changes"}
          </button>
        </form>
      </div>
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ticket Types</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage ticket types separately from the event details.
            </p>
          </div>

          {eventId && (
            <Link
              to={`/events/${eventId}/ticket-types/new`}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              Add Ticket Type
            </Link>
          )}
        </div>

        {ticketTypes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
            No ticket types yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {ticketTypes.map((tt) => (
              <li
                key={tt.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
              >
                <span className="font-medium text-gray-900">{tt.name}</span>
                <span className="text-gray-600">
                  ${(tt.priceCents / 100).toFixed(2)} · Qty {tt.quantity}
                  {tt.soldCount != null && ` · Sold ${tt.soldCount}`}
                </span>
                {tt.salesStartAt != null && (
                  <span className="text-gray-500">
                    Sales: {new Date(tt.salesStartAt).toLocaleString()}
                    {tt.salesEndAt != null &&
                      ` – ${new Date(tt.salesEndAt).toLocaleString()}`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

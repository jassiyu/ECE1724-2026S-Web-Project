import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventsApi } from "../api/events.api";
import { filesApi } from "../api/files.api";

export default function CreateEventPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [posterFileId, setPosterFileId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);

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

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!startAt || !endAt) {
      setError("Start time and end time are required.");
      return;
    }

    if (!capacity || Number(capacity) <= 0) {
      setError("Capacity must be greater than 0.");
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        venue: venue.trim() || undefined,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        capacity: Number(capacity),
        posterFileId: posterFileId || undefined,
      };

      const response = await eventsApi.create(payload);

      navigate(`/events/${response.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to create event.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
        <p className="mt-2 text-gray-500">
          Fill in the event details and publish your event
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
              <p className="mt-2 text-sm text-gray-500">
                Poster uploaded: <span className="font-mono">{posterFileId}</span>
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || isUploadingPoster}
            className="w-full rounded-lg bg-black px-4 py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Creating..." : isUploadingPoster ? "Uploading poster..." : "Create Event"}
          </button>
        </form>
      </div>
    </div>
  );
}

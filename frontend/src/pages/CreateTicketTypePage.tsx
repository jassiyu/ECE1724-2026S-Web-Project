import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { eventsApi } from "../api/events.api";

export default function CreateTicketTypePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [eventStartAt, setEventStartAt] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [salesStartAt, setSalesStartAt] = useState("");
  const [salesEndAt, setSalesEndAt] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

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

        const event = await eventsApi.get(eventId);
        setEventStartAt(event.startAt ?? "");
      } catch (err: any) {
        setError(err?.response?.data?.error || "Failed to load event.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!eventId) {
      setError("Event ID is missing.");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Ticket type name is required.");
      return;
    }

    const parsedQuantity = parseInt(quantity, 10);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError("Quantity must be a positive integer.");
      return;
    }

    const parsedPrice = price === "" ? 0 : parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Price must be 0 or greater.");
      return;
    }

    if (
      salesStartAt &&
      salesEndAt &&
      new Date(salesEndAt) <= new Date(salesStartAt)
    ) {
      setError("Sales end time must be after sales start time.");
      return;
    }

    try {
      setIsSaving(true);

      const effectiveSalesEndAt = salesEndAt
        ? new Date(salesEndAt).toISOString()
        : eventStartAt
          ? new Date(eventStartAt).toISOString()
          : undefined;

      await eventsApi.createTicketType(eventId, {
        name: trimmedName,
        quantity: parsedQuantity,
        priceCents: Math.round(parsedPrice * 100),
        salesStartAt: salesStartAt
          ? new Date(salesStartAt).toISOString()
          : undefined,
        salesEndAt: effectiveSalesEndAt,
      });

      navigate(`/events/${eventId}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to create ticket type.");
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
        <h1 className="text-3xl font-bold text-gray-900">Add Ticket Type</h1>
        <p className="mt-2 text-gray-500">
          Create a new ticket type for this event.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. General Admission"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="price"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Price ($)
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="quantity"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="100"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="salesStartAt"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Sales Start (optional)
              </label>
              <input
                id="salesStartAt"
                type="datetime-local"
                value={salesStartAt}
                onChange={(e) => setSalesStartAt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="salesEndAt"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Sales End (optional)
              </label>
              <input
                id="salesEndAt"
                type="datetime-local"
                value={salesEndAt}
                onChange={(e) => setSalesEndAt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
              <p className="mt-1 text-xs text-gray-500">
                If left blank, sales end will default to the event start time.
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-black px-4 py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Creating..." : "Create Ticket Type"}
            </button>

            <button
              type="button"
              onClick={() => navigate(`/events/${eventId}`)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
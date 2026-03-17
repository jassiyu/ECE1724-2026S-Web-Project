import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { eventsApi } from "../api/events.api";
import type { EventStaffDTO } from "../types";

function extractApiError(err: any, fallback: string): string {
  return err?.response?.data?.error || fallback;
}

export default function StaffManagementPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const [staffList, setStaffList] = useState<EventStaffDTO[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStaff = async () => {
      if (!eventId) {
        setError("Event ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        const response = await eventsApi.listStaff(eventId);
        setStaffList(response);
      } catch (err: any) {
        setError(extractApiError(err, "Failed to load staff list."));
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStaff();
  }, [eventId]);

  const handleAddStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();

    if (!eventId) {
      setError("Event ID is missing.");
      return;
    }

    if (!email) {
      setError("Enter a staff email.");
      return;
    }

    try {
      setIsAdding(true);
      setError("");
      const assignment = await eventsApi.addStaff(eventId, email);
      setStaffList((prev) => {
        const next = [assignment, ...prev.filter((item) => item.userId !== assignment.userId)];
        return next;
      });
      setEmailInput("");
    } catch (err: any) {
      setError(extractApiError(err, "Failed to add staff."));
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveStaff = async (userId: string) => {
    if (!eventId) {
      setError("Event ID is missing.");
      return;
    }

    try {
      setRemovingUserId(userId);
      setError("");
      await eventsApi.removeStaff(eventId, userId);
      setStaffList((prev) => prev.filter((item) => item.userId !== userId));
    } catch (err: any) {
      setError(extractApiError(err, "Failed to remove staff."));
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Staff Assignment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Event ID: <span className="font-mono">{eventId ?? "Unknown"}</span>
        </p>
      </div>

      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" data-demo="staff-assignment-form">
        <h2 className="text-lg font-semibold text-gray-900">Add Staff</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter the email address of an account with the STAFF role.
        </p>
        <form onSubmit={handleAddStaff} className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            data-demo="staff-email-input"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="staff@example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            data-demo="add-staff-button"
            disabled={isAdding}
            className="rounded-lg bg-black px-4 py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAdding ? "Adding..." : "Add Staff"}
          </button>
        </form>
      </section>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Assigned Staff</h2>
        <p className="mt-1 text-sm text-gray-500">{staffList.length} staff assigned</p>

        {isLoading ? (
          <p className="mt-4 text-sm text-gray-500">Loading staff list...</p>
        ) : staffList.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
            No staff assigned yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {staffList.map((assignment) => (
              <div
                key={`${assignment.eventId}:${assignment.userId}`}
                data-demo={`assigned-staff:${assignment.user.email}`}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{assignment.user.email}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    User ID: <span className="font-mono">{assignment.userId}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemoveStaff(assignment.userId)}
                  disabled={removingUserId === assignment.userId}
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {removingUserId === assignment.userId ? "Removing..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

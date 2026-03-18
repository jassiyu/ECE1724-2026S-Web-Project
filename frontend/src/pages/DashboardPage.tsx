import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { eventsApi } from "../api/events.api";
import { useAppSelector } from "../store/hooks";
import {
  connectSocket,
  joinEventRoom,
  leaveEventRoom,
  onCheckIn,
  offCheckIn,
  onRoomError,
  offRoomError,
} from "../socket";
import type { CheckInDTO, CheckInResult, DashboardDTO } from "../types";

type FeedStatus = CheckInResult["status"];

interface ScanFeedItem {
  id: string;
  status: FeedStatus;
  timestamp: string;
  ticketId?: string;
  message: string;
}

const FEED_LIMIT = 25;

function buildCheckInMessage(checkIn: CheckInDTO): string {
  return `Ticket ${checkIn.ticketId.slice(0, 8)} checked in`;
}

function toInitialFeedItem(checkIn: CheckInDTO): ScanFeedItem {
  return {
    id: `success:${checkIn.id}`,
    status: "success",
    timestamp: checkIn.checkedInAt,
    ticketId: checkIn.ticketId,
    message: buildCheckInMessage(checkIn),
  };
}

function toRealtimeFeedItem(result: CheckInResult): ScanFeedItem {
  const nowIso = new Date().toISOString();

  if (result.status === "success") {
    return {
      id: `success:${result.checkIn.id}`,
      status: "success",
      timestamp: result.checkIn.checkedInAt,
      ticketId: result.checkIn.ticketId,
      message: buildCheckInMessage(result.checkIn),
    };
  }

  if (result.status === "already_used") {
    return {
      id: `already_used:${result.checkIn?.id ?? nowIso}`,
      status: "already_used",
      timestamp: result.checkIn?.checkedInAt ?? nowIso,
      ticketId: result.checkIn?.ticketId,
      message: "Duplicate scan attempt detected",
    };
  }

  if (result.status === "wrong_event") {
    return {
      id: `wrong_event:${nowIso}`,
      status: "wrong_event",
      timestamp: nowIso,
      message: "Scanned ticket belongs to another event",
    };
  }

  if (result.status === "cancelled") {
    return {
      id: `cancelled:${nowIso}`,
      status: "cancelled",
      timestamp: nowIso,
      message: "Cancelled ticket was scanned",
    };
  }

  return {
    id: `invalid_ticket:${nowIso}`,
    status: "invalid_ticket",
    timestamp: nowIso,
    message: "Invalid ticket scan",
  };
}

function mergeFeedItem(current: ScanFeedItem[], item: ScanFeedItem): ScanFeedItem[] {
  const deduped = current.filter((entry) => entry.id !== item.id);
  return [item, ...deduped].slice(0, FEED_LIMIT);
}

function statusLabel(status: FeedStatus): string {
  switch (status) {
    case "success":
      return "VALID";
    case "already_used":
      return "ALREADY USED";
    case "wrong_event":
      return "WRONG EVENT";
    case "cancelled":
      return "CANCELLED";
    case "invalid_ticket":
    default:
      return "INVALID";
  }
}

function statusClasses(status: FeedStatus): string {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800";
    case "already_used":
      return "bg-amber-100 text-amber-800";
    case "wrong_event":
    case "cancelled":
    case "invalid_ticket":
    default:
      return "bg-red-100 text-red-800";
  }
}

export default function DashboardPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const token = useAppSelector((state) => state.auth.token);

  const [dashboard, setDashboard] = useState<DashboardDTO | null>(null);
  const [feed, setFeed] = useState<ScanFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [socketError, setSocketError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!eventId) {
        setError("Event ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        setSocketError("");
        const response = await eventsApi.getDashboard(eventId);
        setDashboard(response);
        setFeed(response.recentCheckIns.map(toInitialFeedItem));
      } catch (err: any) {
        setError(err?.response?.data?.error || "Failed to load dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboard();
  }, [eventId]);

  useEffect(() => {
    if (!eventId || !token) {
      return;
    }

    connectSocket(token);
    joinEventRoom(eventId);

    const handleCheckIn = (result: CheckInResult) => {
      const feedItem = toRealtimeFeedItem(result);
      setFeed((prev) => mergeFeedItem(prev, feedItem));

      if (result.status !== "success") {
        return;
      }

      setDashboard((prev) => {
        if (!prev) {
          return prev;
        }

        const isDuplicate = prev.recentCheckIns.some(
          (item) => item.id === result.checkIn.id
        );
        const nextRecent = [
          result.checkIn,
          ...prev.recentCheckIns.filter((item) => item.id !== result.checkIn.id),
        ].slice(0, 20);

        return {
          ...prev,
          checkedInCount: isDuplicate
            ? prev.checkedInCount
            : Math.min(prev.capacity, prev.checkedInCount + 1),
          recentCheckIns: nextRecent,
        };
      });
    };

    const handleRoomError = (data: { message: string }) => {
      setSocketError(data.message || "Unable to subscribe to live updates.");
    };

    onCheckIn(handleCheckIn);
    onRoomError(handleRoomError);

    return () => {
      offCheckIn(handleCheckIn);
      offRoomError(handleRoomError);
      leaveEventRoom(eventId);
    };
  }, [eventId, token]);

  const checkedInCount = dashboard?.checkedInCount ?? 0;
  const capacity = dashboard?.capacity ?? 0;
  const occupancyPercent =
    capacity > 0 ? Math.min(100, Math.round((checkedInCount / capacity) * 100)) : 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10" data-demo="dashboard-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Live Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Event ID: <span className="font-mono">{eventId ?? "Unknown"}</span>
        </p>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
          Loading dashboard...
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!isLoading && !error && dashboard && (
        <div className="space-y-6">
          {socketError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              {socketError}
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Checked In</p>
              <p
                className="mt-2 text-3xl font-bold text-gray-900"
                data-demo="dashboard-checked-in-count"
              >
                {dashboard.checkedInCount}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Capacity</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{dashboard.capacity}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Tickets Sold</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {dashboard.ticketsSold}
              </p>
            </div>
          </section>

          <section
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            data-demo="dashboard-occupancy"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Occupancy</p>
              <p className="text-sm text-gray-500">{occupancyPercent}%</p>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-black transition-all"
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </section>

          <section
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            data-demo="dashboard-recent-feed"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Scan Feed</h2>
              <p className="text-sm text-gray-500">
                Valid scans and duplicate/invalid alerts appear here in realtime.
              </p>
            </div>

            {feed.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                No scans yet.
              </div>
            ) : (
              <div className="space-y-3">
                {feed.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.message}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                      {item.ticketId && (
                        <p className="mt-1 text-xs text-gray-500">
                          Ticket ID: <span className="font-mono">{item.ticketId}</span>
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex h-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(item.status)}`}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

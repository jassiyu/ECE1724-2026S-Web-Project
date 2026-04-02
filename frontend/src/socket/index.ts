import { io, Socket } from "socket.io-client";
import type { CheckInResult } from "../types";

let socket: Socket | null = null;
let authToken: string | null = null;
const joinedEventRooms = new Set<string>();

function resolveSocketUrl(): string {
  const explicitUrl =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL;

  if (typeof explicitUrl === "string" && explicitUrl.trim()) {
    return explicitUrl.trim().replace(/\/api\/?$/, "").replace(/\/+$/, "");
  }

  if (import.meta.env.DEV) {
    return "http://localhost:3000";
  }

  return window.location.origin;
}

function rejoinEventRooms(): void {
  if (!socket?.connected) {
    return;
  }

  for (const eventId of joinedEventRooms) {
    socket.emit("join:event", eventId);
  }
}

export function connectSocket(token: string): Socket {
  if (socket && authToken === token) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  authToken = token;

  socket = io(resolveSocketUrl(), {
    auth: { token },
    path: "/socket.io",
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
    rejoinEventRooms();
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  authToken = null;
  joinedEventRooms.clear();
}

export function joinEventRoom(eventId: string): void {
  const normalizedEventId = eventId.trim();
  if (!normalizedEventId) {
    return;
  }

  joinedEventRooms.add(normalizedEventId);
  if (socket?.connected) {
    socket.emit("join:event", normalizedEventId);
  }
}

export function leaveEventRoom(eventId: string): void {
  const normalizedEventId = eventId.trim();
  if (!normalizedEventId) {
    return;
  }

  joinedEventRooms.delete(normalizedEventId);
  socket?.emit("leave:event", normalizedEventId);
}

export function onCheckIn(callback: (data: CheckInResult) => void): void {
  socket?.on("checkin:new", callback);
}

export function offCheckIn(callback: (data: CheckInResult) => void): void {
  socket?.off("checkin:new", callback);
}

export function onRoomError(
  callback: (data: { message: string; eventId?: string }) => void
): void {
  socket?.on("room:error", callback);
}

export function offRoomError(
  callback: (data: { message: string; eventId?: string }) => void
): void {
  socket?.off("room:error", callback);
}

export function getSocket(): Socket | null {
  return socket;
}

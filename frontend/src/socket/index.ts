import { io, Socket } from "socket.io-client";
import type { CheckInResult } from "../types";

let socket: Socket | null = null;
let authToken: string | null = null;

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

  socket = io("/", {
    auth: { token },
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
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
}

export function joinEventRoom(eventId: string): void {
  socket?.emit("join:event", eventId);
}

export function leaveEventRoom(eventId: string): void {
  socket?.emit("leave:event", eventId);
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

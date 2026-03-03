import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

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
}

export function joinEventRoom(eventId: string): void {
  socket?.emit("join:event", eventId);
}

export function leaveEventRoom(eventId: string): void {
  socket?.emit("leave:event", eventId);
}

export function onCheckIn(callback: (data: unknown) => void): void {
  socket?.on("checkin:new", callback);
}

export function offCheckIn(callback: (data: unknown) => void): void {
  socket?.off("checkin:new", callback);
}

export function getSocket(): Socket | null {
  return socket;
}

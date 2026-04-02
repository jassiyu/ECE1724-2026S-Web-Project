import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import { eventClient } from "../clients/event.client";
import { eventStaffClient } from "../clients/eventStaff.client";
import { JwtPayload, UserRole } from "../types";

export interface ISocketSetup {
  init(httpServer: HttpServer): SocketServer;
  emitCheckIn(eventId: string, data: unknown): void;
}

let io: SocketServer | null = null;
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

async function canJoinEventRoom(user: JwtPayload, eventId: string): Promise<boolean> {
  const event = await eventClient.findById(eventId);
  if (!event) {
    return false;
  }

  if (user.role === UserRole.ORGANIZER) {
    return event.organizerId === user.userId;
  }

  if (user.role === UserRole.STAFF) {
    return eventStaffClient.isStaffForEvent(eventId, user.userId);
  }

  return false;
}

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const authToken = socket.handshake.auth?.token;
    const token =
      typeof authToken === "string"
        ? authToken
        : Array.isArray(authToken)
          ? authToken[0]
          : undefined;

    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join:event", async (eventId: string) => {
      const user = socket.data.user as JwtPayload | undefined;
      if (!user || typeof eventId !== "string" || !eventId.trim()) {
        return;
      }

      const trimmedEventId = eventId.trim();

      try {
        const canJoin = await canJoinEventRoom(user, trimmedEventId);
        if (!canJoin) {
          socket.emit("room:error", {
            eventId: trimmedEventId,
            message: "Not authorized for this event room",
          });
          return;
        }

        socket.join(`event:${trimmedEventId}`);
      } catch {
        socket.emit("room:error", {
          eventId: trimmedEventId,
          message: "Unable to join event room",
        });
      }
    });

    socket.on("leave:event", (eventId: string) => {
      if (typeof eventId !== "string" || !eventId.trim()) {
        return;
      }
      socket.leave(`event:${eventId.trim()}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocket first.");
  }
  return io;
}

export function emitCheckIn(eventId: string, data: unknown): void {
  getIO().to(`event:${eventId}`).emit("checkin:new", data);
}

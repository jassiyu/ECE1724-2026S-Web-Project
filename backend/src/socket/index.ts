import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";

export interface ISocketSetup {
  init(httpServer: HttpServer): SocketServer;
  emitCheckIn(eventId: string, data: unknown): void;
}

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // TODO:
    // 1. Authenticate socket connection (verify JWT from handshake auth)
    // 2. On 'join:event' → socket.join(`event:${eventId}`)
    // 3. On 'leave:event' → socket.leave(`event:${eventId}`)
    // 4. On 'disconnect' → cleanup

    socket.on("join:event", (eventId: string) => {
      socket.join(`event:${eventId}`);
    });

    socket.on("leave:event", (eventId: string) => {
      socket.leave(`event:${eventId}`);
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
  // TODO: called by CheckInService after successful check-in
  getIO().to(`event:${eventId}`).emit("checkin:new", data);
}

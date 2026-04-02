import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { apiPostMock, ioMock } = vi.hoisted(() => ({
  apiPostMock: vi.fn(),
  ioMock: vi.fn(),
}));

vi.mock("../api/client", () => ({
  default: {
    post: apiPostMock,
  },
}));

vi.mock("socket.io-client", () => ({
  io: ioMock,
}));

import { filesApi } from "../api/files.api";
import {
  connectSocket,
  disconnectSocket,
  joinEventRoom,
  leaveEventRoom,
  onCheckIn,
  offCheckIn,
  onRoomError,
  offRoomError,
} from "../socket";

describe("Advanced feature frontend tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disconnectSocket();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("filesApi", () => {
    it("calls presign endpoint with expected payload", async () => {
      apiPostMock.mockResolvedValue({
        data: { uploadUrl: "u", fileId: "f", bucketKey: "b" },
      });

      const result = await filesApi.presignUpload("poster.png", "image/png", 321);

      expect(apiPostMock).toHaveBeenCalledWith("/files/presign-upload", {
        fileName: "poster.png",
        mimeType: "image/png",
        sizeBytes: 321,
      });
      expect(result.fileId).toBe("f");
    });

    it("encodes file id for download url", () => {
      const encoded = filesApi.getDownloadUrl("file/id with spaces");
      expect(encoded).toBe("/api/files/file%2Fid%20with%20spaces/download");
    });

    it("throws if upload to presigned url fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
        })
      );

      await expect(
        filesApi.uploadToPresignedUrl(
          "https://upload.example",
          { type: "image/png" } as File
        )
      ).rejects.toThrow("Failed to upload file to storage");
    });
  });

  describe("socket helpers", () => {
    it("connects socket with auth token and websocket transport", () => {
      const fakeSocket = {
        connected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };
      ioMock.mockReturnValue(fakeSocket);

      connectSocket("token-1");

      expect(ioMock).toHaveBeenCalledWith(
        "http://localhost:3000",
        expect.objectContaining({
          auth: { token: "token-1" },
          path: "/socket.io",
          transports: ["websocket"],
        })
      );
    });

    it("joins and leaves event rooms", () => {
      const fakeSocket = {
        connected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };
      ioMock.mockReturnValue(fakeSocket);

      connectSocket("token-2");
      joinEventRoom("event-1");
      leaveEventRoom("event-1");

      expect(fakeSocket.emit).toHaveBeenNthCalledWith(1, "join:event", "event-1");
      expect(fakeSocket.emit).toHaveBeenNthCalledWith(2, "leave:event", "event-1");
    });

    it("rejoins subscribed event rooms after reconnect", () => {
      const handlers = new Map<string, () => void>();
      const fakeSocket = {
        connected: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        emit: vi.fn(),
        on: vi.fn((event: string, callback: () => void) => {
          handlers.set(event, callback);
        }),
        off: vi.fn(),
      };
      ioMock.mockReturnValue(fakeSocket);

      connectSocket("token-2");
      joinEventRoom("event-1");

      expect(fakeSocket.emit).not.toHaveBeenCalled();

      fakeSocket.connected = true;
      handlers.get("connect")?.();

      expect(fakeSocket.emit).toHaveBeenCalledWith("join:event", "event-1");
    });

    it("registers and unregisters realtime listeners", () => {
      const fakeSocket = {
        connected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };
      ioMock.mockReturnValue(fakeSocket);
      connectSocket("token-3");

      const checkinCb = vi.fn();
      const roomErrorCb = vi.fn();

      onCheckIn(checkinCb);
      onRoomError(roomErrorCb);
      offCheckIn(checkinCb);
      offRoomError(roomErrorCb);

      expect(fakeSocket.on).toHaveBeenCalledWith("checkin:new", checkinCb);
      expect(fakeSocket.on).toHaveBeenCalledWith("room:error", roomErrorCb);
      expect(fakeSocket.off).toHaveBeenCalledWith("checkin:new", checkinCb);
      expect(fakeSocket.off).toHaveBeenCalledWith("room:error", roomErrorCb);
    });
  });
});

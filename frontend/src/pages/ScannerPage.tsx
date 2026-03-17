import { useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { checkinsApi } from "../api/checkins.api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  clearScanResult,
  setScanResult,
} from "../store/slices/scanSlice";
import type { CheckInResult } from "../types";

function getResultView(result: CheckInResult) {
  switch (result.status) {
    case "success":
      return {
        title: "VALID",
        subtitle: "Ticket check-in completed.",
        classes: "border-green-300 bg-green-100 text-green-800",
      };
    case "already_used":
      return {
        title: "ALREADY USED",
        subtitle: result.checkIn
          ? `Previous check-in: ${new Date(result.checkIn.checkedInAt).toLocaleString()}`
          : "This ticket has already been scanned.",
        classes: "border-amber-300 bg-amber-100 text-amber-800",
      };
    case "wrong_event":
      return {
        title: "WRONG EVENT",
        subtitle: "This ticket belongs to another event.",
        classes: "border-red-300 bg-red-100 text-red-800",
      };
    case "cancelled":
      return {
        title: "CANCELLED",
        subtitle: "This ticket is cancelled and cannot be checked in.",
        classes: "border-red-300 bg-red-100 text-red-800",
      };
    case "invalid_ticket":
    default:
      return {
        title: "INVALID",
        subtitle: "Ticket token not found.",
        classes: "border-red-300 bg-red-100 text-red-800",
      };
  }
}

export default function ScannerPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const dispatch = useAppDispatch();
  const { lastResult } = useAppSelector((state) => state.scan);
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleValidate = async (rawToken: string) => {
    if (!eventId) {
      setError("Missing event ID in route.");
      return;
    }

    const qrToken = rawToken.trim();
    if (!qrToken) {
      setError("Enter or scan a QR token.");
      return;
    }

    setError(null);
    setIsScanning(true);

    try {
      const result = await checkinsApi.validate(eventId, qrToken);
      dispatch(setScanResult(result));
      setTokenInput("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Validation request failed.";
      setError(message);
      dispatch(clearScanResult());
    } finally {
      setIsScanning(false);
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleValidate(tokenInput);
  };

  const resultView = lastResult ? getResultView(lastResult) : null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center p-4">
      <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Scan Ticket</h1>
        <p className="mt-1 text-sm text-gray-600">
          Event ID: <span className="font-mono">{eventId ?? "Unknown"}</span>
        </p>

        <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
          Camera scanner can be added later; this page supports rapid scanner-keyboard
          and manual token entry fallback now.
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <label htmlFor="qrToken" className="block text-sm font-medium text-gray-700">
            QR Token
          </label>
          <input
            id="qrToken"
            value={tokenInput}
            onChange={(e) => {
              if (lastResult) {
                dispatch(clearScanResult());
              }
              setTokenInput(e.target.value);
            }}
            placeholder="Paste or scan token here"
            className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm outline-none ring-blue-500 focus:ring-2"
          />
          <button
            type="submit"
            disabled={isScanning}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isScanning ? "Validating..." : "Validate Ticket"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {resultView && (
          <div className={`mt-5 rounded-lg border p-4 ${resultView.classes}`}>
            <p className="text-2xl font-extrabold">{resultView.title}</p>
            <p className="mt-1 text-sm">{resultView.subtitle}</p>
          </div>
        )}
      </div>
    </div>
  );
}

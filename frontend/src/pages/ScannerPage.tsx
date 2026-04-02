import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { useParams } from "react-router-dom";
import { checkinsApi } from "../api/checkins.api";
import { eventsApi } from "../api/events.api";
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
  const [accessError, setAccessError] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessingCameraScan, setIsProcessingCameraScan] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    if (!lastResult) return;

    const timeoutId = window.setTimeout(() => {
      dispatch(clearScanResult());
    }, 3500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dispatch, lastResult]);

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!isCameraOpen || !videoRef.current) return;
  
    void startCameraScan();
  }, [isCameraOpen]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!eventId) {
        setAccessError("Missing event ID in route.");
        setIsCheckingAccess(false);
        return;
      }
  
      try {
        setIsCheckingAccess(true);
        setAccessError(null);
        await eventsApi.getDashboard(eventId);
      } catch (err: any) {
        setAccessError(err?.response?.data?.error || "Failed to load scanner access.");
      } finally {
        setIsCheckingAccess(false);
      }
    };
  
    void checkAccess();
  }, [eventId]);
  const [isScanning, setIsScanning] = useState(false);

  const handleValidate = async (rawToken: string) => {
    if (!eventId) {
      setScannerError("Missing event ID in route.");
      return;
    }

    const qrToken = rawToken.trim();
    if (!qrToken) {
      setScannerError("Enter or scan a QR token.");
      return;
    }

    setScannerError(null);
    setIsScanning(true);

    try {
      const result = await checkinsApi.validate(eventId, qrToken);
      dispatch(setScanResult(result));
      setTokenInput("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Validation request failed.";
      setScannerError(message);
      dispatch(clearScanResult());
    } finally {
      setIsScanning(false);
    }
  };

  const stopCameraScan = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    scannerRef.current = null;
    setIsCameraOpen(false);
  };

  const startCameraScan = async () => {  
    if (!videoRef.current || scannerRef.current) return;

    try {
      setScannerError(null);
  
      const reader = new BrowserMultiFormatReader();
      scannerRef.current = reader;
  
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
  
      if (!devices.length) {
        stopCameraScan();
        setScannerError("No camera found on this device.");
        return;
      }
  
      const deviceId = devices[0].deviceId;
      
      const controls = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        async (result, error) => {
          if (result && !isProcessingCameraScan) {
            const scannedText = result.getText();
            setIsProcessingCameraScan(true);
      
            try {
              await handleValidate(scannedText);
              stopCameraScan();
            } finally {
              setIsProcessingCameraScan(false);
            }
          }
      
          if (error) {
            // ignore continuous decode misses
          }
        }
      );
      
      controlsRef.current = controls;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start camera scanner.";
      stopCameraScan();
      setScannerError(message);
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleValidate(tokenInput);
  };

  const resultView = lastResult ? getResultView(lastResult) : null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center p-4">
      {isCheckingAccess ? (
        <div className="w-full rounded-xl border border-gray-200 bg-white p-6 text-gray-500 shadow-sm">
          Checking scanner access...
        </div>
      ) : accessError ? (
        <div className="w-full rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {accessError}
        </div>
      ) : (
        <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Scan Ticket</h1>
          <p className="mt-1 text-sm text-gray-600">
            Event ID: <span className="font-mono">{eventId ?? "Unknown"}</span>
          </p>

          {scannerError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {scannerError}
            </div>
          )}
  
          <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            Use the camera to scan a QR code, or paste the ticket token below for manual validation.
          </div>
          
          <div className="mt-4 flex gap-3">
            {!isCameraOpen ? (
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Open Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCameraScan}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close Camera
              </button>
            )}
          </div>
  
          {isCameraOpen && (
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-black">
              <video ref={videoRef} className="h-72 w-full object-cover" />
            </div>
          )}
  
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <label htmlFor="qrToken" className="block text-sm font-medium text-gray-700">
              QR Token
            </label>
            <input
              id="qrToken"
              autoFocus
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
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
  
          {resultView && (
            <div className={`mt-5 rounded-lg border p-4 ${resultView.classes}`}>
              <p className="text-2xl font-extrabold">{resultView.title}</p>
              <p className="mt-1 text-sm">{resultView.subtitle}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

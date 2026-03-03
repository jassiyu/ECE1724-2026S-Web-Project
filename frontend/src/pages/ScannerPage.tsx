export default function ScannerPage() {
  // TODO:
  // 1. Read eventId from useParams()
  // 2. Camera-based QR scanner (use a library like html5-qrcode or react-qr-reader)
  // 3. Manual token entry fallback input
  // 4. On scan/submit: call checkinsApi.validate(eventId, qrToken)
  // 5. Display large feedback: VALID (green), INVALID (red), ALREADY USED (yellow)
  // 6. Auto-reset after a few seconds for next scan
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold">Scan Ticket</h1>
      <p className="text-gray-500">TODO: Implement QR scanner with validation feedback</p>
    </div>
  );
}

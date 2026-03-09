export default function TicketDetailPage() {
  // TODO:
  // 1. Read ticketId from useParams()
  // 2. Fetch ticket via ticketsApi.getTicket(ticketId)
  // 3. Display ticket info (event, type, status)
  // 4. Render QR code from ticket.qrToken (use a QR library like qrcode.react)
  return (
    <div className="mx-auto max-w-md p-6 text-center">
      <h1 className="text-2xl font-bold">Ticket</h1>
      <p className="text-gray-500">TODO: Implement QR code display</p>
    </div>
  );
}

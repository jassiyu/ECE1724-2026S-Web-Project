export default function EventDetailPage() {
  // TODO:
  // 1. Read eventId from useParams()
  // 2. Fetch event via eventsApi.get(eventId)
  // 3. Fetch ticket types via eventsApi.listTicketTypes(eventId)
  // 4. Show event details (title, description, venue, dates, poster)
  // 5. Show ticket types with claim button (for attendees)
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">Event Detail</h1>
      <p className="text-gray-500">TODO: Implement event detail view with ticket types</p>
    </div>
  );
}

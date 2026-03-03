export default function DashboardPage() {
  // TODO:
  // 1. Read eventId from useParams()
  // 2. Fetch dashboard data via eventsApi.getDashboard(eventId)
  // 3. Connect to Socket.IO room for real-time updates (joinEventRoom)
  // 4. Display: checked-in count vs capacity, recent check-ins feed
  // 5. Listen for 'checkin:new' events and update UI in real-time
  // 6. Cleanup: leaveEventRoom on unmount
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">Live Dashboard</h1>
      <p className="text-gray-500">TODO: Implement real-time attendance dashboard</p>
    </div>
  );
}

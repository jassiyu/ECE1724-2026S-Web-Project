import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EventListPage from "./pages/EventListPage";
import EventDetailPage from "./pages/EventDetailPage";
import CreateEventPage from "./pages/CreateEventPage";
import EditEventPage from "./pages/EditEventPage";
import DashboardPage from "./pages/DashboardPage";
import StaffManagementPage from "./pages/StaffManagementPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import ScannerPage from "./pages/ScannerPage";

// TODO: Add Layout component with navbar (navigation, auth status, role-based links)
// TODO: Add ProtectedRoute wrapper for auth-gated pages
// TODO: Add role-based route guards

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/events" element={<EventListPage />} />
      <Route path="/events/:eventId" element={<EventDetailPage />} />

      {/* Organizer */}
      <Route path="/events/new" element={<CreateEventPage />} />
      <Route path="/events/:eventId/edit" element={<EditEventPage />} />
      <Route path="/events/:eventId/dashboard" element={<DashboardPage />} />
      <Route path="/events/:eventId/staff" element={<StaffManagementPage />} />

      {/* Attendee */}
      <Route path="/my-tickets" element={<MyTicketsPage />} />
      <Route path="/my-tickets/:ticketId" element={<TicketDetailPage />} />

      {/* Staff */}
      <Route path="/scan/:eventId" element={<ScannerPage />} />

      {/* Fallback */}
      <Route path="/" element={<EventListPage />} />
      <Route path="*" element={<div className="p-8 text-center">404 — Page not found</div>} />
    </Routes>
  );
}

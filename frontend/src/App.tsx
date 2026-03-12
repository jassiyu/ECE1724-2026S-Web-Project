import { Link, Navigate, Outlet, Route, Routes } from "react-router-dom";

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
import { useAppSelector } from "./store/hooks";
import type { UserRole } from "./types";

function ProtectedRoute() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function RoleGuard({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const user = useAppSelector((s) => s.auth.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/events" replace />;
  }

  return <Outlet />;
}

function AppLayout() {
  const auth = useAppSelector((s) => s.auth);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 gap-4">
          <Link to="/events" className="font-semibold text-lg">
            Campus Events
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/events" className="hover:underline">
              Events
            </Link>
            {auth.isAuthenticated && auth.user?.role === "ATTENDEE" && (
              <Link to="/my-tickets" className="hover:underline">
                My Tickets
              </Link>
            )}
            {auth.isAuthenticated && auth.user?.role === "ORGANIZER" && (
              <>
                <Link to="/events/new" className="hover:underline">
                  Create Event
                </Link>
              </>
            )}
            {auth.isAuthenticated && auth.user?.role === "STAFF" && (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium">
                Staff
              </span>
            )}
            <span className="mx-2 h-4 w-px bg-slate-300" />
            {auth.isAuthenticated && auth.user ? (
              <span className="text-xs text-slate-600">
                {auth.user.email} · {auth.user.role.toLowerCase()}
              </span>
            ) : (
              <>
                <Link to="/login" className="hover:underline">
                  Login
                </Link>
                <Link to="/register" className="hover:underline">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public auth pages (no layout to keep them minimal) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* App shell with navbar + protected content */}
      <Route element={<AppLayout />}>
        {/* Public within shell */}
        <Route path="/" element={<EventListPage />} />
        <Route path="/events" element={<EventListPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />

        {/* Auth-only routes */}
        <Route element={<ProtectedRoute />}>
          {/* Organizer + Staff */}
          <Route element={<RoleGuard allowedRoles={["ORGANIZER", "STAFF"]} />}>
            <Route
              path="/events/:eventId/dashboard"
              element={<DashboardPage />}
            />
          </Route>

          {/* Organizer */}
          <Route element={<RoleGuard allowedRoles={["ORGANIZER"]} />}>
            <Route path="/events/new" element={<CreateEventPage />} />
            <Route path="/events/:eventId/edit" element={<EditEventPage />} />
            <Route
              path="/events/:eventId/staff"
              element={<StaffManagementPage />}
            />
          </Route>

          {/* Attendee */}
          <Route element={<RoleGuard allowedRoles={["ATTENDEE"]} />}>
            <Route path="/my-tickets" element={<MyTicketsPage />} />
            <Route
              path="/my-tickets/:ticketId"
              element={<TicketDetailPage />}
            />
          </Route>

          {/* Staff */}
          <Route element={<RoleGuard allowedRoles={["STAFF"]} />}>
            <Route path="/scan/:eventId" element={<ScannerPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<div className="p-8 text-center">404 — Page not found</div>}
      />
    </Routes>
  );
}

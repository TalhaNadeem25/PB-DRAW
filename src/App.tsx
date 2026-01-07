import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Tournaments from "./pages/Tournaments";
import TournamentDetail from "./pages/TournamentDetail";
import CreateTournament from "./pages/CreateTournament";
import PoolManagement from "./pages/PoolManagement";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import EditTournament from "./pages/EditTournament";
import Teams from "./pages/Teams";
import Live from "./pages/Live";
import LiveTournamentDetail from "./pages/LiveTournamentDetail";
import Discover from "./pages/Discover";
import PaymentSuccess from "./pages/PaymentSuccess";
import EventRegistration from "./pages/EventRegistration";
import AcceptInvitation from "./pages/AcceptInvitation";
import NotFound from "./pages/NotFound";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import MyTickets from "./pages/MyTickets";
import OrganizerScanner from "./pages/OrganizerScanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <Teams />
                </ProtectedRoute>
              }
            />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="/tournaments/:id/register" element={<Register />} />
            <Route path="/tournaments/:tournamentId/register/:eventId" element={<EventRegistration />} />
            <Route path="/invitations/:id/accept" element={<AcceptInvitation />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/live" element={<Live />} />
            <Route path="/live/:id" element={<LiveTournamentDetail />} />
            <Route
              path="/tournaments/:id/edit"
              element={
                <ProtectedRoute requireRole={['organizer', 'admin']}>
                  <EditTournament />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-tournament"
              element={
                <ProtectedRoute requireRole={['organizer', 'admin']}>
                  <CreateTournament />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tournaments/:id/events/:eventId/pools"
              element={
                <ProtectedRoute requireRole={['organizer', 'admin']}>
                  <PoolManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requireRole={['organizer', 'admin']}>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <MyTickets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scanner"
              element={
                <ProtectedRoute requireRole={['organizer', 'admin']}>
                  <OrganizerScanner />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

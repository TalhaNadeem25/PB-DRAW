import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AcceptInvitation from "./pages/AcceptInvitation";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import AuthPage from "./pages/AuthPage";
import CourtManager from "./pages/CourtManager";
import CreateTournament from "./pages/CreateTournament";
import Dashboard from "./pages/Dashboard";
import EditTournament from "./pages/EditTournament";
import EventRegistration from "./pages/EventRegistration";
import FindPartner from "./pages/FindPartner";
import ForgotPassword from "./pages/ForgotPassword";
import Index from "./pages/Index";
import Live from "./pages/Live";
import LiveTournamentDetail from "./pages/LiveTournamentDetail";
import MyTickets from "./pages/MyTickets";
import NotFound from "./pages/NotFound";
import OrganizerScanner from "./pages/OrganizerScanner";
import PartnerCancellationResponse from "./pages/PartnerCancellationResponse";
import PaymentSuccess from "./pages/PaymentSuccess";
import PoolManagement from "./pages/PoolManagement";
import Privacy from "./pages/Privacy";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Teams from "./pages/Teams";
import Terms from "./pages/Terms";
import TournamentCommunications from "./pages/TournamentCommunications";
import TournamentDetail from "./pages/TournamentDetail";
import TournamentPlanner from "./pages/TournamentPlanner";
import Tournaments from "./pages/Tournaments";
import VerifyEmail from "./pages/VerifyEmail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/auth" element={<AuthPage />} />
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
            <Route path="/tournament-planner" element={<TournamentPlanner />} />
            <Route
              path="/tournaments/:id/communications"
              element={
                <ProtectedRoute requireRole={['organizer', 'admin']}>
                  <TournamentCommunications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tournaments/:id/courts"
              element={
                <ProtectedRoute requireRole={['organizer', 'admin']}>
                  <CourtManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/find-partner"
              element={
                <ProtectedRoute>
                  <FindPartner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/partner-response/:cancellationId"
              element={
                <ProtectedRoute>
                  <PartnerCancellationResponse />
                </ProtectedRoute>
              }
            />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
      </TooltipProvider>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

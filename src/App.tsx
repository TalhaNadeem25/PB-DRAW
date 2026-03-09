import AuthGate from "@/components/AuthGate";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { setOnUnauthorized } from "@/services/api";
import { Users, Ticket } from "lucide-react";
import { Loader2 } from "lucide-react";

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading" />
  </div>
);

const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const CourtManager = lazy(() => import("./pages/CourtManager"));
const CreateTournament = lazy(() => import("./pages/CreateTournament"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditTournament = lazy(() => import("./pages/EditTournament"));
const EventRegistration = lazy(() => import("./pages/EventRegistration"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Index = lazy(() => import("./pages/Index"));
const Live = lazy(() => import("./pages/Live"));
const LiveTournamentDetail = lazy(() => import("./pages/LiveTournamentDetail"));
const MyTickets = lazy(() => import("./pages/MyTickets"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OrganizerScanner = lazy(() => import("./pages/OrganizerScanner"));
const PartnerCancellationResponse = lazy(() => import("./pages/PartnerCancellationResponse"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PoolManagement = lazy(() => import("./pages/PoolManagement"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Profile = lazy(() => import("./pages/Profile"));
const Register = lazy(() => import("./pages/Register"));
const RegistrationSuccess = lazy(() => import("./pages/RegistrationSuccess"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SkillQuiz = lazy(() => import("./pages/SkillQuiz"));
const Teams = lazy(() => import("./pages/Teams"));
const Terms = lazy(() => import("./pages/Terms"));
const TournamentCommunications = lazy(() => import("./pages/TournamentCommunications"));
const TournamentDetail = lazy(() => import("./pages/TournamentDetail"));
const TournamentPlanner = lazy(() => import("./pages/TournamentPlanner"));
const Tournaments = lazy(() => import("./pages/Tournaments"));
const Spectator = lazy(() => import("./pages/Spectator"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

const queryClient = new QueryClient();

function AppRoutes() {
  const navigate = useNavigate();
  useEffect(() => {
    setOnUnauthorized(() => navigate("/login"));
    return () => setOnUnauthorized(null);
  }, [navigate]);
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
            <Route path="/" element={<Index />} />
            {/* Single auth page: login + signup tabs; /auth redirects here */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <ErrorBoundary>
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
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
                <ProtectedRoute
                  unauthenticatedFallback={
                    <AuthGate
                      title="Your Teams"
                      description="Sign in to view and manage your teams."
                      icon={<Users className="w-7 h-7" />}
                    />
                  }
                >
                  <Teams />
                </ProtectedRoute>
              }
            />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:id" element={<ErrorBoundary><TournamentDetail /></ErrorBoundary>} />
            <Route path="/tournaments/:id/register" element={<Register />} />
            <Route path="/tournaments/:tournamentId/register/:eventId" element={<EventRegistration />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/invitations/:id/accept" element={<AcceptInvitation />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/live" element={<Live />} />
            <Route path="/live/:id" element={<LiveTournamentDetail />} />
            <Route path="/spectator/:id" element={<Spectator />} />
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
                <ErrorBoundary>
                  <ProtectedRoute requireRole={['organizer', 'admin']}>
                    <CreateTournament />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/tournaments/:id/events/:eventId/pools"
              element={
                <ErrorBoundary>
                  <ProtectedRoute requireRole={['organizer', 'admin']}>
                    <PoolManagement />
                  </ProtectedRoute>
                </ErrorBoundary>
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
                <ProtectedRoute
                  unauthenticatedFallback={
                    <AuthGate
                      title="My Tickets"
                      description="Sign in to view your match tickets and check-in."
                      icon={<Ticket className="w-7 h-7" />}
                    />
                  }
                >
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
            <Route path="/skill-quiz" element={<SkillQuiz />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
        <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ErrorBoundary>
      </TooltipProvider>
        </ThemeProvider>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;

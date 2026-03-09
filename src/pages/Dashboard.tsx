import Layout from "@/components/layout/Layout";
import CancelRegistrationDialog from "@/components/registration/CancelRegistrationDialog";
import OrganizerDashboard from "@/components/dashboard/OrganizerDashboard";
import PlayerDashboard from "@/components/dashboard/PlayerDashboard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Warning, Bell, Gear } from "@phosphor-icons/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { user } = useAuth();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedCancellation, setSelectedCancellation] = useState<{
    eventId: string;
    eventName: string;
    tournamentName: string;
    isDoubles?: boolean;
    partnerName?: string;
  } | null>(null);

  const {
    dashboardLoading,
    stats,
    winRate,
    myTournaments,
    activeTournaments,
    myEventRegistrations,
    liveMatchesCount,
    recommendedTournaments,
    myTeams,
    pendingInvitations,
    ticketsData,
    waitlistData,
    tournamentsLoading,
    teamsLoading,
    ticketsLoading,
  } = useDashboardData(user ?? null);

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Warning className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">Please log in</h2>
              <p className="text-muted-foreground mb-4">You need to be logged in to view your dashboard.</p>
              <Button asChild>
                <Link to="/login">Log In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const isOrganizer = user.role === "organizer" || user.role === "admin";

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Compact top bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="border-b border-border/60 bg-card/50"
        >
          <div className="container mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-1 break-words">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-muted-foreground text-sm">
                  {isOrganizer
                    ? "Manage your tournaments and track your events"
                    : liveMatchesCount > 0
                    ? `You have ${liveMatchesCount} live match${liveMatchesCount > 1 ? "es" : ""} today. Let's get that win.`
                    : "Track your progress and find new tournaments"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="icon" className="w-9 h-9 sm:w-10 sm:h-10">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button variant="outline" size="icon" className="w-9 h-9 sm:w-10 sm:h-10" asChild>
                  <Link to="/profile">
                    <Gear className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {dashboardLoading ? (
            <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader className="space-y-0 pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-12 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
              </div>
            </div>
          ) : isOrganizer ? (
            <OrganizerDashboard
              myTournaments={myTournaments}
              activeTournaments={activeTournaments}
              tournamentsLoading={tournamentsLoading}
            />
          ) : (
            <PlayerDashboard
              stats={stats}
              winRate={winRate}
              user={{ skillLevel: user.skillLevel }}
              myEventRegistrations={myEventRegistrations}
              recommendedTournaments={recommendedTournaments}
              myTeams={myTeams}
              pendingInvitations={pendingInvitations}
              ticketsData={ticketsData}
              waitlistData={waitlistData}
              teamsLoading={teamsLoading}
              ticketsLoading={ticketsLoading}
              onCancelRegistration={(payload) => {
                setSelectedCancellation(payload);
                setCancelDialogOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {selectedCancellation && (
        <CancelRegistrationDialog
          eventId={selectedCancellation.eventId}
          eventName={selectedCancellation.eventName}
          tournamentName={selectedCancellation.tournamentName}
          isDoubles={selectedCancellation.isDoubles}
          partnerName={selectedCancellation.partnerName}
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          onSuccess={() => window.location.reload()}
        />
      )}
    </Layout>
  );
};

export default Dashboard;

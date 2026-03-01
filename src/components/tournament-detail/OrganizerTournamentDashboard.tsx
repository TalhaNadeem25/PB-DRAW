import Layout from "@/components/layout/Layout";
import RefundsPanel from "@/components/tournament-dashboard/RefundsPanel";
import ScoresPanel from "@/components/tournament-dashboard/ScoresPanel";
import TestDataPanel from "@/components/tournament-dashboard/TestDataPanel";
import BracketViewer from "@/components/tournament/BracketViewer";
import AIPlannerChat from "@/components/tournament/EnhancedAIPlannerChat";
import RegisteredPlayers from "@/components/tournament/RegisteredPlayers";
import TournamentPlanner from "@/components/tournament/TournamentPlanner";
import TournamentSchedule from "@/components/tournament/TournamentSchedule";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardOverview, { type ActivityItem } from "@/components/tournament-dashboard/DashboardOverview";
import DashboardTopBar from "@/components/tournament-dashboard/DashboardTopBar";
import OrganizerEventsPanel from "@/components/tournament-dashboard/OrganizerEventsPanel";
import TournamentDashboardSidebar, {
  MobileDashboardNav,
  type DashboardSection,
} from "@/components/tournament-dashboard/TournamentDashboardSidebar";
import { ChevronRight, Layers, Trophy } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export interface OrganizerTournamentDashboardProps {
  tournament: any;
  tournamentId: string;
  activeSection: DashboardSection;
  setActiveSection: (section: DashboardSection) => void;
  recentActivities: ActivityItem[];
  isCreateEventOpen: boolean;
  setIsCreateEventOpen: (open: boolean) => void;
  newEvent: any;
  setNewEvent: (e: any) => void;
  onCreateEvent: () => void;
  createEventPending: boolean;
  onDeleteEvent: (eventId: string, eventName: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onStartTournament: () => void;
  onCompleteTournament: () => void;
  onDeleteTournament: () => void;
  onEventsCreated?: () => void;
}

export default function OrganizerTournamentDashboard({
  tournament,
  tournamentId: id,
  activeSection,
  setActiveSection,
  recentActivities,
  isCreateEventOpen,
  setIsCreateEventOpen,
  newEvent,
  setNewEvent,
  onCreateEvent,
  createEventPending,
  onDeleteEvent,
  isFavorite,
  onToggleFavorite,
  onStartTournament,
  onCompleteTournament,
  onDeleteTournament,
  onEventsCreated,
}: OrganizerTournamentDashboardProps) {
  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview tournament={tournament} recentActivities={recentActivities} />;
      case "events":
        return (
          <OrganizerEventsPanel
            tournamentId={id}
            tournament={tournament}
            events={tournament.events || []}
            isCreateEventOpen={isCreateEventOpen}
            setIsCreateEventOpen={setIsCreateEventOpen}
            newEvent={newEvent}
            setNewEvent={setNewEvent}
            onCreateEvent={onCreateEvent}
            createEventPending={createEventPending}
            onDeleteEvent={onDeleteEvent}
          />
        );
      case "pools":
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="font-display font-bold text-2xl flex items-center gap-2">
                <Layers className="w-6 h-6 text-primary" />
                Pools
              </h2>
              <p className="text-muted-foreground mt-1">
                Manage pools, standings, and matches for each event. Select an event to create pools, assign teams, and run pool play or playoffs.
              </p>
            </div>
            {(tournament.events?.length ?? 0) > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {(tournament.events || []).map((event: any) => (
                  <div
                    key={event._id}
                    className="glass-card rounded-2xl border border-border/50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-primary/30 hover:shadow-float transition-all"
                  >
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-lg truncate">{event.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="capitalize text-xs">
                          {event.format?.replace("-", " ") ?? "—"}
                        </Badge>
                        <span>
                          {(event.currentTeams || 0)} / {event.maxTeams || "—"} {(event.format || "").toLowerCase() === "singles" ? "players" : "teams"}
                        </span>
                      </div>
                    </div>
                    <Button asChild className="shrink-0">
                      <Link to={`/tournaments/${id}/events/${event._id}/pools`}>
                        Manage pools
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-border/50 p-12 text-center">
                <Layers className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground font-medium">No events yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add events in the Events tab, then come back here to manage pools for each event.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveSection("events")}>
                  <Trophy className="w-4 h-4 mr-2" />
                  Go to Events
                </Button>
              </div>
            )}
          </div>
        );
      case "registrations":
        return <RegisteredPlayers tournamentId={id} />;
      case "planner":
        return <TournamentPlanner tournament={tournament} events={tournament.events || []} />;
      case "ai-planner":
        return (
          <AIPlannerChat
            tournamentId={id}
            onEventsCreated={onEventsCreated ?? (() => {})}
          />
        );
      case "schedule":
        return <TournamentSchedule tournamentId={id} tournamentStartDate={tournament.startDate} />;
      case "brackets":
        return <BracketViewer tournamentId={id} />;
      case "scores":
        return <ScoresPanel tournamentId={id} events={tournament.events || []} />;
      case "refunds":
        return <RefundsPanel tournamentId={id} tournamentName={tournament.name} />;
      case "test":
        return <TestDataPanel tournamentId={id} />;
      default:
        return <DashboardOverview tournament={tournament} recentActivities={recentActivities} />;
    }
  };

  return (
    <Layout variant="minimal">
      <Helmet>
        <title>Dashboard - {tournament.name} | Pickle Rally</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <DashboardTopBar
            tournament={tournament}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onStartTournament={onStartTournament}
            onCompleteTournament={onCompleteTournament}
            onDeleteTournament={onDeleteTournament}
          />

          <MobileDashboardNav activeSection={activeSection} onSectionChange={setActiveSection} />

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <TournamentDashboardSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              tournamentId={id}
            />

            <main className="flex-1 min-w-0 font-sans">{renderSection()}</main>
          </div>
        </div>
      </div>
    </Layout>
  );
}

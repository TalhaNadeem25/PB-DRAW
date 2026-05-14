import Layout from "@/components/layout/Layout";
import RefundsPanel from "@/components/tournament-dashboard/RefundsPanel";
import ScoresPanel from "@/components/tournament-dashboard/ScoresPanel";
import TestDataPanel from "@/components/tournament-dashboard/TestDataPanel";
import BracketViewer from "@/components/tournament/BracketViewer";
import AIPlannerChat from "@/components/tournament/EnhancedAIPlannerChat";
import RegisteredPlayers from "@/components/tournament/RegisteredPlayers";
import TournamentPlanner from "@/components/tournament/TournamentPlanner";
import TournamentSchedule from "@/components/tournament/TournamentSchedule";
import DashboardOverview, { type ActivityItem } from "@/components/tournament-dashboard/DashboardOverview";
import DashboardTopBar from "@/components/tournament-dashboard/DashboardTopBar";
import OrganizerEventsPanel from "@/components/tournament-dashboard/OrganizerEventsPanel";
import OrganizerWaitlistPanel from "@/components/tournament-dashboard/OrganizerWaitlistPanel";
import TournamentDashboardSidebar, {
  MobileDashboardNav,
  type DashboardSection,
} from "@/components/tournament-dashboard/TournamentDashboardSidebar";
import { CaretRight, Stack, Trophy } from "@phosphor-icons/react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Pill, PbBtn, Eyebrow } from "@/components/ui/pb";

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
      case "waitlist":
        return (
          <OrganizerWaitlistPanel
            tournamentId={id}
            tournament={tournament}
            events={tournament.events || []}
          />
        );
      case "pools":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-extrabold text-[28px] tracking-[-0.03em] text-pb-ink leading-none mb-1">
                Pools
              </h2>
              <p className="text-[12px] font-mono text-pb-muted max-w-prose">
                Manage pools, standings, and matches for each event. Select an event to create pools,
                assign teams, and run pool play or playoffs.
              </p>
            </div>

            {(tournament.events?.length ?? 0) > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {(tournament.events || []).map((event: any) => (
                  <div
                    key={event._id}
                    className="bg-pb-surface border border-pb-hairline rounded-[6px] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-pb-rule transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-[16px] tracking-[-0.02em] text-pb-ink truncate mb-1.5">
                        {event.name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Pill tone="neutral" mono className="capitalize">
                          {(event.format || "").replace("-", " ") || "—"}
                        </Pill>
                        <span className="text-[11px] font-mono text-pb-muted">
                          {event.currentTeams || 0}{" "}
                          {(event.format || "").toLowerCase() === "singles" ? "players" : "teams"} registered
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/tournaments/${id}/events/${event._id}/pools`}
                      className="shrink-0 h-9 px-4 rounded-[6px] border border-pb-hairline bg-pb-surface2 flex items-center gap-1.5 text-[12px] font-mono text-pb-ink hover:border-pb-rule hover:bg-pb-surface transition-colors"
                    >
                      Manage pools
                      <CaretRight size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-pb-surface border border-pb-hairline rounded-[6px] px-5 py-14 text-center">
                <Stack size={28} className="mx-auto mb-3 text-pb-faint" />
                <p className="text-[13px] font-sans font-medium text-pb-ink mb-1">No events yet</p>
                <p className="text-[12px] font-mono text-pb-muted mb-4">
                  Add events in the Events tab, then come back here to manage pools.
                </p>
                <button
                  onClick={() => setActiveSection("events")}
                  className="h-9 px-4 rounded-[6px] border border-pb-hairline bg-pb-surface2 flex items-center gap-1.5 text-[12px] font-mono text-pb-ink hover:border-pb-rule transition-colors mx-auto"
                >
                  <Trophy size={13} />
                  Go to Events
                </button>
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
        <title>Dashboard - {tournament.name} | PB Draw</title>
      </Helmet>
      <div className="min-h-screen bg-pb-paper">
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

import TicketCard from "@/components/check-in/TicketCard";
import WaitlistStatus from "@/components/registration/WaitlistStatus";
import { Pill, Eyebrow } from "@/components/ui/pb";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import {
  ArrowRight,
  Medal,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Trophy,
  TrendUp,
  UserPlus,
  Users,
  XCircle,
} from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";

export interface PlayerDashboardStats {
  matchesPlayed: number;
  matchesWon: number;
  tournamentsPlayed: number;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
}

export interface PlayerDashboardUser {
  skillLevel?: number | string;
}

export interface EventRegistration {
  eventId: string;
  eventName: string;
  eventFormat?: string;
  tournamentId: string;
  tournamentName: string;
  tournamentStartDate?: string;
  tournamentLocation?: string;
  tournamentStatus?: string;
  isDoubles?: boolean;
  partnerName?: string;
  [key: string]: unknown;
}

export interface CancelRegistrationPayload {
  eventId: string;
  eventName: string;
  tournamentName: string;
  isDoubles?: boolean;
  partnerName?: string;
}

export interface PlayerDashboardProps {
  stats: PlayerDashboardStats;
  winRate: string;
  user: PlayerDashboardUser;
  myEventRegistrations: EventRegistration[];
  recommendedTournaments: Array<{
    _id: string;
    name: string;
    location?: string;
    startDate?: string;
    [key: string]: unknown;
  }>;
  myTeams: Array<{ _id: string; name?: string; players?: unknown[]; [key: string]: unknown }>;
  pendingInvitations: unknown[];
  ticketsData: unknown[];
  waitlistData: unknown[];
  teamsLoading: boolean;
  ticketsLoading: boolean;
  onCancelRegistration: (payload: CancelRegistrationPayload) => void;
}

type Tab = "overview" | "events" | "teams";

const PlayerDashboard = ({
  stats,
  winRate,
  user,
  myEventRegistrations,
  recommendedTournaments,
  myTeams,
  pendingInvitations,
  ticketsData,
  waitlistData,
  teamsLoading,
  ticketsLoading,
  onCancelRegistration,
}: PlayerDashboardProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const isNewUser =
    myEventRegistrations.length === 0 &&
    myTeams.length === 0 &&
    stats.matchesPlayed === 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "events", label: "Events & Waitlist" },
    { id: "teams", label: "Teams & Network" },
  ];

  // Mobile-only: win/loss form bar from last 10 matches (synthetic from win rate)
  const totalRecentMatches = Math.min(10, stats.matchesPlayed);
  const recentWins = totalRecentMatches > 0
    ? Math.round((stats.matchesWon / Math.max(1, stats.matchesPlayed)) * totalRecentMatches)
    : 0;
  const recentForm: ("W" | "L")[] = totalRecentMatches > 0
    ? [
        ...Array(recentWins).fill("W"),
        ...Array(totalRecentMatches - recentWins).fill("L"),
      ].sort(() => Math.random() - 0.5) as ("W" | "L")[]
    : [];

  return (
    <div className="space-y-8">

      {/* ── Mobile-only quick stats section ── */}
      <div className="md:hidden space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "SKILL LVL", value: user.skillLevel?.toString() ?? "N/A" },
            { label: `WINS · ${totalRecentMatches > 0 ? `${totalRecentMatches}M` : "ALL"}`, value: String(stats.matchesWon) },
            { label: "MEDALS", value: String(stats.goldMedals + stats.silverMedals + stats.bronzeMedals) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-pb-surface border border-pb-hairline rounded-[8px] px-3 py-3 flex flex-col gap-1">
              <Eyebrow>{label}</Eyebrow>
              <span className="font-mono text-[22px] font-bold text-pb-court leading-none">{value}</span>
            </div>
          ))}
        </div>

        {/* Upcoming events list */}
        {myEventRegistrations.length > 0 && (
          <div>
            <Eyebrow className="mb-2">UPCOMING · {myEventRegistrations.length} EVENT{myEventRegistrations.length !== 1 ? "S" : ""}</Eyebrow>
            <div className="bg-pb-surface border border-pb-hairline rounded-[8px] divide-y divide-pb-hairline overflow-hidden">
              {myEventRegistrations.slice(0, 5).map((reg) => (
                <div
                  key={reg.eventId}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-pb-surface2 transition-colors"
                  onClick={() => navigate(`/tournaments/${reg.tournamentId}`)}
                >
                  {/* Date column */}
                  <div className="shrink-0 w-10 text-center">
                    <p className="font-mono text-[9px] text-pb-faint uppercase tracking-[0.06em]">
                      {reg.tournamentStartDate
                        ? format(new Date(reg.tournamentStartDate), "MMM").toUpperCase()
                        : "TBD"}
                    </p>
                    <p className="font-mono text-[18px] font-bold text-pb-ink leading-none">
                      {reg.tournamentStartDate
                        ? format(new Date(reg.tournamentStartDate), "dd")
                        : "--"}
                    </p>
                  </div>
                  {/* Event info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-[13px] text-pb-ink leading-snug truncate">{reg.eventName}</p>
                    <p className="text-[11px] font-mono text-pb-muted truncate">{reg.tournamentName}</p>
                  </div>
                  {/* Status pill */}
                  {reg.tournamentStatus && (
                    <Pill
                      tone={reg.tournamentStatus === "in-progress" ? "court" : reg.tournamentStatus === "open" ? "neutral" : "neutral"}
                      mono
                      className="shrink-0"
                    >
                      {String(reg.tournamentStatus).replace("-", " ")}
                    </Pill>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent form bar */}
        {recentForm.length > 0 && (
          <div>
            <Eyebrow className="mb-2">RECENT FORM</Eyebrow>
            <div className="flex gap-1.5">
              {recentForm.map((result, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-6 flex-1 rounded-[3px] min-w-[18px]",
                    result === "W" ? "bg-pb-court" : "bg-pb-faint/40"
                  )}
                  title={result}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New user onboarding */}
      {isNewUser && (
        <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[6px] bg-pb-court-tint2 border border-pb-hairline flex items-center justify-center shrink-0">
              <Trophy size={18} className="text-pb-court" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-black text-[14px] uppercase tracking-tight text-pb-ink mb-0.5">Get started</p>
              <p className="text-[12px] font-mono text-pb-muted mb-4">You're all set — here's what to do first.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { to: "/profile", icon: Medal, label: "1. Complete Profile", sub: "Set your skill level" },
                  { to: "/tournaments", icon: Calendar, label: "2. Find a Tournament", sub: "Register for an event" },
                  { to: "/teams", icon: UserPlus, label: "3. Find a Partner", sub: "Connect with players" },
                ].map(({ to, icon: Icon, label, sub }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-3 p-3 rounded-[6px] bg-pb-paper border border-pb-hairline hover:border-pb-rule transition-colors"
                  >
                    <Icon size={16} className="text-pb-court shrink-0" />
                    <div>
                      <p className="text-[11px] font-display font-bold uppercase tracking-wide text-pb-ink">{label}</p>
                      <p className="text-[11px] font-mono text-pb-muted mt-0.5">{sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab strip */}
      <div className="flex gap-1 border-b border-pb-hairline">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "px-4 py-2.5 text-[11px] font-mono uppercase tracking-[0.08em] border-b-2 transition-colors -mb-px",
              activeTab === id
                ? "border-pb-ink text-pb-ink"
                : "border-transparent text-pb-muted hover:text-pb-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Up Next banner */}
          {myEventRegistrations.length > 0 && (
            <div className="bg-pb-court rounded-[6px] overflow-hidden">
              <div className="px-6 py-5 flex flex-col md:flex-row items-start md:items-center gap-5">
                <div className="flex items-center gap-5">
                  <div className="text-center">
                    <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-white/70 mb-0.5">
                      {myEventRegistrations[0].tournamentStartDate
                        ? format(new Date(myEventRegistrations[0].tournamentStartDate), "MMM")
                        : "TBD"}
                    </p>
                    <p className="font-display font-black text-[40px] leading-none text-white">
                      {myEventRegistrations[0].tournamentStartDate
                        ? format(new Date(myEventRegistrations[0].tournamentStartDate), "dd")
                        : "--"}
                    </p>
                  </div>
                  <div className="w-px h-12 bg-white/20" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-pb-amber animate-pulse" />
                      <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-white/70">Up Next</span>
                    </div>
                    <h3 className="font-display font-black text-[18px] text-white leading-tight line-clamp-1">
                      {myEventRegistrations[0].eventName}
                    </h3>
                    <p className="text-[12px] font-mono text-white/70 flex items-center gap-1.5 mt-0.5">
                      <Trophy size={11} />
                      {myEventRegistrations[0].tournamentName}
                    </p>
                  </div>
                </div>
                <div className="md:ml-auto">
                  <Link
                    to={`/tournaments/${myEventRegistrations[0].tournamentId}`}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-[6px] bg-white text-pb-court font-display font-bold text-[13px] uppercase tracking-wide hover:bg-white/90 transition-colors"
                  >
                    View Bracket <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Win Rate — spans 2 cols on md */}
            <div className="md:col-span-2 bg-pb-court rounded-[6px] p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-white/70 mb-1">Win Rate</p>
                  <p className="font-display font-black text-[40px] leading-none text-white">{winRate}%</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
                  <TrendUp size={12} className="text-white/80" />
                  <span className="text-[11px] font-mono text-white/80">
                    {stats.matchesWon}W / {stats.matchesPlayed}M
                  </span>
                </div>
              </div>
              <p className="text-[11px] font-mono text-white/60 mt-auto">
                Keep playing to improve your ranking and unlock new events.
              </p>
            </div>

            <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-[4px] bg-pb-court-tint2 border border-pb-hairline flex items-center justify-center">
                  <Trophy size={14} className="text-pb-court" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-pb-faint">Active</span>
              </div>
              <p className="text-[11px] font-mono text-pb-muted mb-1">Tournaments</p>
              <p className="font-display font-black text-[26px] text-pb-ink">{stats.tournamentsPlayed}</p>
            </div>

            <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-[4px] bg-pb-court-tint2 border border-pb-hairline flex items-center justify-center">
                  <Medal size={14} className="text-pb-court" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-pb-faint">Rating</span>
              </div>
              <p className="text-[11px] font-mono text-pb-muted mb-1">Skill Level</p>
              <p className="font-display font-black text-[26px] text-pb-ink">{user.skillLevel ?? "N/A"}</p>
            </div>
          </div>

          {/* Medals row */}
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-pb-muted mb-4">Medals</p>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="font-display font-black text-[28px] text-yellow-600">{stats.goldMedals}</p>
                <p className="text-[10px] font-mono text-pb-faint uppercase tracking-[0.06em] mt-0.5">Gold</p>
              </div>
              <div className="w-px h-10 bg-pb-hairline" />
              <div className="text-center">
                <p className="font-display font-black text-[28px] text-pb-muted">{stats.silverMedals}</p>
                <p className="text-[10px] font-mono text-pb-faint uppercase tracking-[0.06em] mt-0.5">Silver</p>
              </div>
              <div className="w-px h-10 bg-pb-hairline" />
              <div className="text-center">
                <p className="font-display font-black text-[28px] text-orange-600">{stats.bronzeMedals}</p>
                <p className="text-[10px] font-mono text-pb-faint uppercase tracking-[0.06em] mt-0.5">Bronze</p>
              </div>
            </div>
          </div>

          {/* My Event Registrations */}
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px]">
            <div className="border-b border-pb-hairline px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-display font-black text-[15px] uppercase tracking-tight text-pb-ink">My Event Registrations</p>
                <p className="text-[11px] font-mono text-pb-muted mt-0.5">Events you're registered for across all tournaments</p>
              </div>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-pb-court hover:underline underline-offset-2"
              >
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="p-4">
              {teamsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-pb-paper border border-pb-hairline rounded-[6px] animate-pulse" />
                  ))}
                </div>
              ) : myEventRegistrations.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {myEventRegistrations.map((reg) => (
                    <div
                      key={reg.eventId}
                      className="bg-pb-paper border border-pb-hairline rounded-[6px] p-4 cursor-pointer hover:border-pb-rule transition-colors flex flex-col justify-between"
                      onClick={() => navigate(`/tournaments/${reg.tournamentId}`)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex flex-col items-center justify-center rounded-[4px] bg-pb-surface border border-pb-hairline px-2.5 py-2 min-w-[60px]">
                          <p className="text-[10px] font-mono text-pb-faint uppercase">
                            {reg.tournamentStartDate
                              ? format(new Date(reg.tournamentStartDate), "MMM").toUpperCase()
                              : "TBD"}
                          </p>
                          <p className="font-display font-black text-[18px] text-pb-ink leading-none">
                            {reg.tournamentStartDate
                              ? format(new Date(reg.tournamentStartDate), "dd")
                              : "--"}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-display font-bold text-[13px] text-pb-ink truncate">{reg.eventName}</h3>
                            {reg.eventFormat && <Pill tone="neutral">{reg.eventFormat}</Pill>}
                            {reg.isDoubles && <Pill tone="amber">Doubles</Pill>}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-pb-muted mb-1">
                            <Trophy size={11} />
                            <span className="truncate">{reg.tournamentName}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-mono text-pb-faint">
                            <span className="flex items-center gap-1">
                              <MapPin size={10} />
                              {reg.tournamentLocation ?? "TBD"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {reg.tournamentStatus && (
                          <Pill tone={reg.tournamentStatus === "in-progress" ? "court" : "neutral"}>
                            {String(reg.tournamentStatus).replace("-", " ")}
                          </Pill>
                        )}
                        <button
                          className="text-[11px] font-mono text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelRegistration({
                              eventId: reg.eventId,
                              eventName: reg.eventName,
                              tournamentName: reg.tournamentName,
                              isDoubles: reg.isDoubles,
                              partnerName: reg.partnerName,
                            });
                          }}
                        >
                          <XCircle size={13} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 text-center">
                  <Trophy size={28} className="text-pb-faint mb-3" />
                  <p className="text-[13px] font-mono text-pb-muted mb-1">No registrations yet</p>
                  <p className="text-[12px] font-mono text-pb-faint max-w-xs mb-4">
                    Find a tournament near you and sign up for your first event.
                  </p>
                  <Link
                    to="/tournaments"
                    className="inline-flex items-center gap-2 h-9 px-5 rounded-[6px] bg-pb-ink text-white font-display font-bold text-[12px] uppercase tracking-wide hover:bg-pb-ink/90 transition-colors"
                  >
                    Browse Tournaments <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Tournaments */}
          {recommendedTournaments.length > 0 && (
            <div className="bg-pb-surface border border-pb-hairline rounded-[6px]">
              <div className="border-b border-pb-hairline px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-display font-black text-[15px] uppercase tracking-tight text-pb-ink">Recommended For You</p>
                  <p className="text-[11px] font-mono text-pb-muted mt-0.5">Based on your skill level and location</p>
                </div>
                <Link
                  to="/tournaments"
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-pb-court hover:underline underline-offset-2"
                >
                  Browse All <ArrowRight size={12} />
                </Link>
              </div>
              <div className="p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendedTournaments.map((tournament) => (
                  <div
                    key={tournament._id}
                    className="bg-pb-paper border border-pb-hairline rounded-[6px] p-4 cursor-pointer hover:border-pb-rule transition-colors"
                    onClick={() => navigate(`/tournaments/${tournament._id}`)}
                  >
                    <div className="flex items-start justify-between mb-2.5">
                      <h3 className="font-display font-bold text-[13px] text-pb-ink">{tournament.name}</h3>
                      <Pill tone="court">Open</Pill>
                    </div>
                    <div className="space-y-1 text-[11px] font-mono text-pb-faint">
                      {tournament.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={11} />
                          {tournament.location}
                        </div>
                      )}
                      {tournament.startDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={11} />
                          {format(new Date(tournament.startDate), "MMM dd")}
                        </div>
                      )}
                    </div>
                    <button className="w-full mt-3 h-8 rounded-[4px] border border-pb-hairline text-[11px] font-mono text-pb-muted hover:border-pb-rule hover:text-pb-ink transition-colors">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Insights */}
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-6">
            <p className="font-display font-black text-[15px] uppercase tracking-tight text-pb-ink mb-1">Performance Insights</p>
            <p className="text-[11px] font-mono text-pb-muted mb-5">Key stats over recent matches</p>
            <div className="space-y-4">
              {[
                { label: "Serve Accuracy", value: Math.min(100, Number(winRate) + 10) },
                { label: "Third Shot Consistency", value: Math.max(40, Math.min(95, Number(winRate))) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="flex justify-between text-[12px] font-mono mb-1.5">
                    <span className="text-pb-muted">{label}</span>
                    <span className="font-bold text-pb-ink">{value}%</span>
                  </div>
                  <div className="h-1.5 bg-pb-hairline rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pb-court rounded-full transition-all duration-700"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-[11px] font-mono text-pb-faint italic mt-2">
                Your backhand drive has improved over recent events — keep trusting it on big points.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Events tab */}
      {activeTab === "events" && (
        <div className="space-y-8">
          {/* My Tickets */}
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px]">
            <div className="border-b border-pb-hairline px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Ticket size={16} className="text-pb-court" />
                <div>
                  <p className="font-display font-black text-[15px] uppercase tracking-tight text-pb-ink">My Tickets</p>
                  <p className="text-[11px] font-mono text-pb-muted">Your tournament tickets with QR codes</p>
                </div>
              </div>
              <Link
                to="/tickets"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-pb-court hover:underline underline-offset-2"
              >
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="p-4">
              {ticketsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-24 bg-pb-paper border border-pb-hairline rounded-[6px] animate-pulse" />)}
                </div>
              ) : ticketsData && Array.isArray(ticketsData) && ticketsData.length > 0 ? (
                <div className="space-y-3">
                  {ticketsData.slice(0, 3).map((ticket: any, index: number) => (
                    <TicketCard key={ticket?.paymentId ?? index} payment={ticket} compact />
                  ))}
                  {ticketsData.length > 3 && (
                    <Link
                      to="/tickets"
                      className="flex items-center justify-center gap-2 w-full h-9 rounded-[6px] border border-pb-hairline text-[12px] font-mono text-pb-muted hover:border-pb-rule hover:text-pb-ink transition-colors"
                    >
                      View All {ticketsData.length} Tickets <ArrowRight size={12} />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 text-center">
                  <Ticket size={28} className="text-pb-faint mb-3" />
                  <p className="text-[13px] font-mono text-pb-muted mb-1">No tickets yet</p>
                  <p className="text-[12px] font-mono text-pb-faint max-w-xs mb-4">
                    Register for a tournament event and your ticket will show up here for check-in.
                  </p>
                  <Link
                    to="/tournaments"
                    className="inline-flex items-center gap-2 h-9 px-5 rounded-[6px] border border-pb-hairline text-[12px] font-mono text-pb-ink hover:border-pb-rule transition-colors"
                  >
                    Find a Tournament <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Waitlist entries */}
          {waitlistData && Array.isArray(waitlistData) && waitlistData.length > 0 && (
            <div className="bg-pb-surface border border-pb-hairline rounded-[6px]">
              <div className="border-b border-pb-hairline px-6 py-4 flex items-center gap-2.5">
                <Clock size={15} className="text-pb-amber" />
                <div>
                  <p className="font-display font-black text-[15px] uppercase tracking-tight text-pb-ink">Waitlist Entries</p>
                  <p className="text-[11px] font-mono text-pb-muted">Events you're waiting to join</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {waitlistData.slice(0, 3).map((entry: any) => (
                  <WaitlistStatus key={entry?._id ?? Math.random()} entry={entry} />
                ))}
                {waitlistData.length > 3 && (
                  <button className="flex items-center justify-center gap-2 w-full h-9 rounded-[6px] border border-pb-hairline text-[12px] font-mono text-pb-muted hover:border-pb-rule hover:text-pb-ink transition-colors">
                    View All {waitlistData.length} Waitlist Entries
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teams tab */}
      {activeTab === "teams" && (
        <div className="space-y-8">
          {/* Pending invitations */}
          {pendingInvitations.length > 0 && (
            <div className="bg-pb-surface border border-pb-amber/40 rounded-[6px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-[4px] bg-pb-amber/10 border border-pb-amber/20 flex items-center justify-center shrink-0">
                  <UserPlus size={15} className="text-pb-amber" />
                </div>
                <div>
                  <p className="font-display font-bold text-[14px] text-pb-ink">Pending team invitation</p>
                  <p className="text-[12px] font-mono text-pb-muted">
                    You have {pendingInvitations.length} team invitation{pendingInvitations.length > 1 ? "s" : ""} waiting for your response.
                  </p>
                </div>
              </div>
              <Link
                to="/teams"
                className="inline-flex items-center justify-center h-9 px-5 rounded-[6px] bg-pb-amber text-white font-display font-bold text-[12px] uppercase tracking-wide hover:bg-pb-amber/90 transition-colors shrink-0"
              >
                Review
              </Link>
            </div>
          )}

          {/* My Teams */}
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px]">
            <div className="border-b border-pb-hairline px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-display font-black text-[15px] uppercase tracking-tight text-pb-ink">My Teams</p>
                <p className="text-[11px] font-mono text-pb-muted mt-0.5">Teams you're a part of</p>
              </div>
              <Link
                to="/teams"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-pb-court hover:underline underline-offset-2"
              >
                Manage <ArrowRight size={12} />
              </Link>
            </div>
            <div className="p-4">
              {teamsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-14 bg-pb-paper border border-pb-hairline rounded-[6px] animate-pulse" />)}
                </div>
              ) : myTeams.length > 0 ? (
                <div className="divide-y divide-pb-hairline">
                  {myTeams.slice(0, 5).map((team) => (
                    <div key={team._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="font-display font-bold text-[13px] text-pb-ink">{team.name}</p>
                        <p className="text-[11px] font-mono text-pb-faint">{team.players?.length ?? 0} player(s)</p>
                      </div>
                      <Link
                        to="/teams"
                        className="text-[11px] font-mono text-pb-court hover:underline underline-offset-2"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 text-center">
                  <Users size={28} className="text-pb-faint mb-3" />
                  <p className="text-[13px] font-mono text-pb-muted mb-1">No teams yet</p>
                  <p className="text-[12px] font-mono text-pb-faint max-w-xs mb-4">
                    Register for a doubles event to form a team, or accept a partner invitation.
                  </p>
                  <Link
                    to="/tournaments"
                    className="inline-flex items-center gap-2 h-9 px-5 rounded-[6px] border border-pb-hairline text-[12px] font-mono text-pb-ink hover:border-pb-rule transition-colors"
                  >
                    Find a Tournament <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDashboard;

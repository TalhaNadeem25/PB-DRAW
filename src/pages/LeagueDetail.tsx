import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { leagueAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  CalendarBlank,
  Users,
  CurrencyDollar,
  Trophy,
  Gear,
  CaretLeft,
  Envelope,
  Phone,
  Star,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const LEAGUE_TYPE_LABELS: Record<string, string> = {
  ladder: "Ladder",
  traditional: "Traditional",
  "king-of-court": "King of Court",
  "dupr-session": "DUPR Session",
};

const PLAYER_GROUP_LABELS: Record<string, string> = {
  mens: "Men's",
  womens: "Women's",
  mixed: "Mixed",
  coed: "Coed",
};

const TABS = ["Overview", "Players", "Standings", "Sessions"];

export default function LeagueDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Overview");

  const { data, isLoading, error } = useQuery({
    queryKey: ["league", id],
    queryFn: () => leagueAPI.getById(id!),
    enabled: !!id,
  });

  const league = data?.data;

  const isRegistered =
    isAuthenticated &&
    league?.players?.some((p: any) => {
      const playerId = p.player?._id ?? p.player;
      return playerId?.toString() === user?._id?.toString();
    });

  const isOrganizer =
    isAuthenticated &&
    (league?.organizer?._id?.toString() === user?._id?.toString() ||
      user?.role === "admin");

  const registerMutation = useMutation({
    mutationFn: () => leagueAPI.register(id!),
    onSuccess: () => {
      toast({ title: "Registered!", description: "You've joined the league." });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to register.",
        variant: "destructive",
      });
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: () => leagueAPI.unregister(id!),
    onSuccess: () => {
      toast({ title: "Unregistered", description: "You've left the league." });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to unregister.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4 animate-pulse">
          <div className="h-4 rounded bg-pb-surface2 w-24" />
          <div className="h-10 rounded bg-pb-surface2 w-1/2" />
          <div className="h-4 rounded bg-pb-surface2 w-2/3" />
          <div className="h-[3px] rounded bg-pb-surface2 w-full" />
        </div>
      </Layout>
    );
  }

  if (error || !league) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
            League not found
          </h2>
          <Link
            to="/leagues"
            className="mt-4 inline-flex items-center gap-1.5 border border-pb-hairline rounded-[6px] font-mono text-[12px] text-pb-ink px-4 h-9 hover:bg-pb-surface2 transition-colors"
          >
            <CaretLeft className="w-4 h-4" />
            Back to Leagues
          </Link>
        </div>
      </Layout>
    );
  }

  const playerCount = league.players?.length ?? 0;
  const pct = Math.min(100, Math.round((playerCount / (league.maxPlayers || 32)) * 100));

  const statusPillColors: Record<string, string> = {
    open: "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30",
    active: "bg-blue-500/15 text-blue-700 border border-blue-500/30",
    completed: "bg-pb-surface2 text-pb-muted border border-pb-hairline",
    draft: "bg-pb-surface2 text-pb-muted border border-pb-hairline",
  };

  return (
    <Layout>
      {/* Flat editorial header */}
      <div className="bg-pb-paper border-b border-pb-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          {/* Back link */}
          <Link
            to="/leagues"
            className="inline-flex items-center gap-1 font-mono text-[12px] text-pb-muted hover:text-pb-ink transition-colors mb-5"
          >
            <CaretLeft className="w-3.5 h-3.5" />
            All Leagues
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div className="flex-1 min-w-0">
              {/* Pills */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-[4px]",
                    statusPillColors[league.status] ?? statusPillColors.draft
                  )}
                >
                  {league.status}
                </span>
                {league.leagueType && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-[4px] bg-pb-surface2 text-pb-muted border border-pb-hairline">
                    {LEAGUE_TYPE_LABELS[league.leagueType] ?? league.leagueType}
                  </span>
                )}
                {league.playerGroup && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-[4px] bg-pb-surface2 text-pb-muted border border-pb-hairline">
                    {PLAYER_GROUP_LABELS[league.playerGroup] ?? league.playerGroup}
                  </span>
                )}
              </div>

              {/* League name */}
              <h1 className="font-display font-extrabold text-[40px] tracking-[-0.04em] leading-tight text-pb-ink mb-3">
                {league.name}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {league.location && (
                  <span className="font-mono text-[13px] text-pb-muted flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {league.location}
                  </span>
                )}
                {league.startDate && (
                  <span className="font-mono text-[13px] text-pb-muted flex items-center gap-1.5">
                    <CalendarBlank className="w-3.5 h-3.5 shrink-0" />
                    {format(new Date(league.startDate), "MMM d")}
                    {league.endDate && ` – ${format(new Date(league.endDate), "MMM d, yyyy")}`}
                  </span>
                )}
                <span className="font-mono text-[13px] text-pb-muted flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  {playerCount} / {league.maxPlayers} players
                </span>
                <span className="font-mono text-[13px] text-pb-muted flex items-center gap-1.5">
                  <CurrencyDollar className="w-3.5 h-3.5 shrink-0" />
                  {league.entryFee === 0 ? "Free" : `$${league.entryFee}`}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              {isOrganizer && (
                <Link
                  to={`/leagues/${id}/manage`}
                  className="inline-flex items-center gap-2 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] px-5 h-10 hover:opacity-90 transition-opacity"
                >
                  <Gear className="w-4 h-4" />
                  Manage League
                </Link>
              )}
              {!isOrganizer && isAuthenticated && league.status === "open" && (
                <>
                  {isRegistered ? (
                    <button
                      onClick={() => unregisterMutation.mutate()}
                      disabled={unregisterMutation.isPending}
                      className="border border-pb-hairline rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] text-pb-ink px-5 h-10 hover:bg-pb-surface2 transition-colors disabled:opacity-50"
                    >
                      {unregisterMutation.isPending ? "Leaving..." : "Leave League"}
                    </button>
                  ) : (
                    <button
                      onClick={() => registerMutation.mutate()}
                      disabled={registerMutation.isPending || playerCount >= league.maxPlayers}
                      className="bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] px-5 h-10 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {registerMutation.isPending
                        ? "Registering..."
                        : playerCount >= league.maxPlayers
                        ? "League Full"
                        : "Join League"}
                    </button>
                  )}
                </>
              )}
              {!isAuthenticated && league.status === "open" && (
                <Link
                  to="/login"
                  className="bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] px-5 h-10 flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  Sign In to Join
                </Link>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[11px] text-pb-muted">{playerCount} registered</span>
              <span className="font-mono text-[11px] text-pb-muted">{league.maxPlayers - playerCount} spots left</span>
            </div>
            <div className="h-[3px] bg-pb-hairline rounded-full overflow-hidden">
              <div
                className="h-full bg-pb-court rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[4.5rem] z-30 bg-pb-paper border-b border-pb-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "shrink-0 px-5 py-3.5 font-mono text-[13px] uppercase tracking-[0.06em] transition-all duration-200 border-b-2",
                  activeTab === tab
                    ? "border-pb-ink text-pb-ink"
                    : "border-transparent text-pb-muted hover:text-pb-ink"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 bg-pb-paper">
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main info */}
            <div className="lg:col-span-2 space-y-4">
              {league.description && (
                <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted mb-3">
                    About
                  </p>
                  <p className="text-[14px] text-pb-ink leading-relaxed">{league.description}</p>
                </div>
              )}
              {league.rules && (
                <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted mb-3">
                    Rules
                  </p>
                  <p className="text-[14px] text-pb-ink leading-relaxed whitespace-pre-wrap">{league.rules}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Details card */}
              <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
                  Details
                </p>
                {[
                  {
                    label: "Entry Fee",
                    value: league.entryFee === 0 ? "Free" : `$${league.entryFee}`,
                    icon: CurrencyDollar,
                  },
                  league.skillLevel?.min != null && {
                    label: "Skill Level",
                    value: `${league.skillLevel.min} – ${league.skillLevel.max}`,
                    icon: Star,
                  },
                  league.registrationDeadline && {
                    label: "Reg. Deadline",
                    value: format(new Date(league.registrationDeadline), "MMM d, yyyy"),
                    icon: CalendarBlank,
                  },
                ]
                  .filter(Boolean)
                  .map((item: any) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-[6px] bg-pb-surface2 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-pb-muted" />
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-pb-muted">
                            {item.label}
                          </p>
                          <p className="font-mono text-[13px] text-pb-ink">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Organizer */}
              <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
                  Organizer
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center shrink-0">
                    <span className="font-mono text-[13px] font-bold text-pb-ink">
                      {league.organizer?.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-[13px] text-pb-ink">{league.organizer?.name}</p>
                    <p className="font-mono text-[11px] text-pb-muted">{league.organizer?.email}</p>
                  </div>
                </div>
                {league.contactEmail && (
                  <a
                    href={`mailto:${league.contactEmail}`}
                    className="flex items-center gap-2 font-mono text-[12px] text-pb-court hover:underline"
                  >
                    <Envelope className="w-3.5 h-3.5 shrink-0" />
                    {league.contactEmail}
                  </a>
                )}
                {league.contactPhone && (
                  <div className="flex items-center gap-2 font-mono text-[12px] text-pb-muted">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {league.contactPhone}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Players" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-[20px] tracking-[-0.02em] text-pb-ink">
                Registered Players
              </h3>
              <span className="font-mono text-[12px] text-pb-muted">
                {playerCount} / {league.maxPlayers}
              </span>
            </div>
            {league.players?.length === 0 ? (
              <div className="text-center py-16 bg-pb-surface border border-pb-hairline rounded-[8px]">
                <Users className="w-9 h-9 mx-auto mb-3 text-pb-muted opacity-40" />
                <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-pb-muted">No players yet</p>
              </div>
            ) : (
              <div className="bg-pb-surface border border-pb-hairline rounded-[8px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm divide-y divide-pb-hairline">
                    <thead className="bg-pb-surface2">
                      <tr>
                        {["Player", "Skill", "Joined", "Payment"].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted text-left"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pb-hairline">
                      {league.players.map((entry: any, i: number) => {
                        const p = entry.player;
                        return (
                          <tr
                            key={entry._id ?? i}
                            className="hover:bg-pb-surface2/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center shrink-0">
                                  <span className="font-mono text-[11px] font-bold text-pb-ink">
                                    {p?.name?.charAt(0)?.toUpperCase() ?? "?"}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-mono text-[13px] text-pb-ink">{p?.name ?? "Unknown"}</p>
                                  <p className="font-mono text-[11px] text-pb-muted">{p?.email ?? ""}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-[12px] text-pb-muted">
                              {p?.skillLevel ?? "—"}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-pb-muted">
                              {entry.joinedAt ? format(new Date(entry.joinedAt), "MMM d, yyyy") : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-[4px]",
                                  entry.paymentStatus === "paid"
                                    ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                                    : "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                                )}
                              >
                                {entry.paymentStatus ?? "unpaid"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Standings" && (
          <div>
            <h3 className="font-display font-bold text-[20px] tracking-[-0.02em] text-pb-ink mb-5">
              Standings
            </h3>
            {!league.standings || league.standings.length === 0 ? (
              <div className="text-center py-16 bg-pb-surface border border-pb-hairline rounded-[8px]">
                <Trophy className="w-9 h-9 mx-auto mb-3 text-pb-muted opacity-40" />
                <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-pb-muted">No standings yet</p>
                <p className="font-mono text-[11px] text-pb-faint mt-1">Standings will appear once the organizer updates them.</p>
              </div>
            ) : (
              <div className="bg-pb-surface border border-pb-hairline rounded-[8px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm divide-y divide-pb-hairline">
                    <thead className="bg-pb-surface2">
                      <tr>
                        {["Rank", "Player", "W", "L", "Pts", "Played"].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted text-center first:text-left"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pb-hairline">
                      {[...league.standings]
                        .sort((a: any, b: any) => (a.rank || 999) - (b.rank || 999))
                        .map((s: any, i: number) => (
                          <tr
                            key={s._id ?? i}
                            className="hover:bg-pb-surface2/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex w-7 h-7 items-center justify-center rounded-[4px] font-mono text-[12px] font-bold",
                                  s.rank === 1
                                    ? "bg-yellow-500/20 text-yellow-700"
                                    : s.rank === 2
                                    ? "bg-slate-400/20 text-slate-600"
                                    : s.rank === 3
                                    ? "bg-amber-700/20 text-amber-700"
                                    : "bg-pb-surface2 text-pb-muted"
                                )}
                              >
                                {s.rank ?? i + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center shrink-0">
                                  <span className="font-mono text-[10px] font-bold text-pb-ink">
                                    {s.player?.name?.charAt(0)?.toUpperCase() ?? "?"}
                                  </span>
                                </div>
                                <span className="font-mono text-[13px] text-pb-ink">{s.player?.name ?? "Unknown"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-[13px] text-emerald-700">{s.wins ?? 0}</td>
                            <td className="px-4 py-3 text-center font-mono text-[13px] text-red-600">{s.losses ?? 0}</td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-[13px] text-pb-ink">{s.points ?? 0}</td>
                            <td className="px-4 py-3 text-center font-mono text-[13px] text-pb-muted">{s.gamesPlayed ?? 0}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Sessions" && (
          <div>
            <h3 className="font-display font-bold text-[20px] tracking-[-0.02em] text-pb-ink mb-5">
              Sessions
            </h3>
            {!league.sessions || league.sessions.length === 0 ? (
              <div className="text-center py-16 bg-pb-surface border border-pb-hairline rounded-[8px]">
                <CalendarBlank className="w-9 h-9 mx-auto mb-3 text-pb-muted opacity-40" />
                <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-pb-muted">No sessions scheduled</p>
              </div>
            ) : (
              <div className="space-y-2">
                {league.sessions.map((session: any, i: number) => {
                  const sessionStatusColors: Record<string, string> = {
                    upcoming: "bg-pb-surface2 text-pb-muted border border-pb-hairline",
                    active: "bg-blue-500/15 text-blue-700 border border-blue-500/30",
                    completed: "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30",
                  };
                  return (
                    <div
                      key={session._id ?? i}
                      className="bg-pb-surface border border-pb-hairline rounded-[6px] p-4 flex items-start gap-4"
                    >
                      <div className="w-9 h-9 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center shrink-0">
                        <span className="font-mono font-bold text-[13px] text-pb-ink">
                          {session.sessionNumber ?? i + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-[13px] text-pb-ink">
                            Session {session.sessionNumber ?? i + 1}
                          </span>
                          <span
                            className={cn(
                              "font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-[4px]",
                              sessionStatusColors[session.status] ?? sessionStatusColors.upcoming
                            )}
                          >
                            {session.status}
                          </span>
                        </div>
                        {session.date && (
                          <p className="font-mono text-[11px] text-pb-muted mt-1 flex items-center gap-1">
                            <CalendarBlank className="w-3 h-3 shrink-0" />
                            {format(new Date(session.date), "EEEE, MMM d, yyyy")}
                          </p>
                        )}
                        {session.notes && (
                          <p className="font-mono text-[11px] text-pb-muted mt-1">{session.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ClipboardText,
  ArrowSquareOut,
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

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
  active: "bg-primary/15 text-primary border border-primary/30",
  completed: "bg-muted text-muted-foreground",
};

const SESSION_STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary border border-primary/30",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
};

const TABS = ["Overview", "Players", "Standings", "Sessions"];

export default function LeagueDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
          <div className="h-48 rounded-2xl bg-muted/50" />
          <div className="h-8 rounded bg-muted/50 w-1/3" />
          <div className="h-4 rounded bg-muted/50 w-2/3" />
        </div>
      </Layout>
    );
  }

  if (error || !league) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display font-black text-2xl uppercase">League not found</h2>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/leagues">
              <CaretLeft className="w-4 h-4 mr-2" />
              Back to Leagues
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const playerCount = league.players?.length ?? 0;
  const pct = Math.min(100, Math.round((playerCount / (league.maxPlayers || 32)) * 100));

  return (
    <Layout>
      {/* Hero */}
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 relative z-10">
          {/* Back link */}
          <Link
            to="/leagues"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <CaretLeft className="w-4 h-4" />
            All Leagues
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`text-[10px] font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${STATUS_COLORS[league.status] || STATUS_COLORS.draft}`}
                >
                  {league.status}
                </span>
                <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/20">
                  {LEAGUE_TYPE_LABELS[league.leagueType] ?? league.leagueType}
                </span>
                <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/20">
                  {PLAYER_GROUP_LABELS[league.playerGroup] ?? league.playerGroup}
                </span>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight leading-tight">
                {league.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-white/75 text-sm">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {league.location}
                </span>
                {league.startDate && (
                  <span className="flex items-center gap-1.5">
                    <CalendarBlank className="w-4 h-4 shrink-0" />
                    {format(new Date(league.startDate), "MMM d")}
                    {league.endDate && ` – ${format(new Date(league.endDate), "MMM d, yyyy")}`}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 shrink-0" />
                  {playerCount} / {league.maxPlayers} players
                </span>
                <span className="flex items-center gap-1.5">
                  <CurrencyDollar className="w-4 h-4 shrink-0" />
                  {league.entryFee === 0 ? "Free" : `$${league.entryFee}`}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              {isOrganizer && (
                <Button
                  asChild
                  className="bg-white text-primary hover:bg-white/90 font-display font-black uppercase tracking-wide shadow-md"
                >
                  <Link to={`/leagues/${id}/manage`}>
                    <Gear className="w-4 h-4 mr-2" />
                    Manage League
                  </Link>
                </Button>
              )}
              {!isOrganizer && isAuthenticated && league.status === "open" && (
                <>
                  {isRegistered ? (
                    <Button
                      variant="outline"
                      onClick={() => unregisterMutation.mutate()}
                      disabled={unregisterMutation.isPending}
                      className="border-white/40 text-white hover:bg-white/10 font-display font-bold uppercase tracking-wide"
                    >
                      {unregisterMutation.isPending ? "Leaving..." : "Leave League"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => registerMutation.mutate()}
                      disabled={registerMutation.isPending || playerCount >= league.maxPlayers}
                      className="bg-white text-primary hover:bg-white/90 font-display font-black uppercase tracking-wide shadow-md"
                    >
                      {registerMutation.isPending
                        ? "Registering..."
                        : playerCount >= league.maxPlayers
                        ? "League Full"
                        : "Join League"}
                    </Button>
                  )}
                </>
              )}
              {!isAuthenticated && league.status === "open" && (
                <Button
                  asChild
                  className="bg-white text-primary hover:bg-white/90 font-display font-black uppercase tracking-wide shadow-md"
                >
                  <Link to="/login">Sign In to Join</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-1.5 text-white/70 text-xs">
              <span>{playerCount} registered</span>
              <span>{league.maxPlayers - playerCount} spots left</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-[4.5rem] z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "shrink-0 px-4 py-2.5 text-sm font-display font-bold uppercase tracking-wide rounded-xl transition-all duration-200",
                  activeTab === tab
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "Overview" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Main info */}
            <div className="lg:col-span-2 space-y-6">
              {league.description && (
                <div className="glass-card rounded-2xl p-5 border border-border/50">
                  <h3 className="font-display font-black text-sm uppercase tracking-wide text-muted-foreground mb-3">
                    About
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">{league.description}</p>
                </div>
              )}
              {league.rules && (
                <div className="glass-card rounded-2xl p-5 border border-border/50">
                  <h3 className="font-display font-black text-sm uppercase tracking-wide text-muted-foreground mb-3">
                    Rules
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{league.rules}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Details card */}
              <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-3">
                <h3 className="font-display font-black text-sm uppercase tracking-wide text-muted-foreground">
                  Details
                </h3>
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
                      <div key={item.label} className="flex items-center gap-3 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-display font-bold uppercase tracking-wide text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="text-sm font-medium text-foreground">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Organizer */}
              <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-3">
                <h3 className="font-display font-black text-sm uppercase tracking-wide text-muted-foreground">
                  Organizer
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-hero-gradient flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-sm font-display font-black text-white">
                      {league.organizer?.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{league.organizer?.name}</p>
                    <p className="text-xs text-muted-foreground">{league.organizer?.email}</p>
                  </div>
                </div>
                {league.contactEmail && (
                  <a
                    href={`mailto:${league.contactEmail}`}
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <Envelope className="w-3.5 h-3.5 shrink-0" />
                    {league.contactEmail}
                  </a>
                )}
                {league.contactPhone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {league.contactPhone}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "Players" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-foreground">
                Registered Players
              </h3>
              <span className="text-sm text-muted-foreground">
                {playerCount} / {league.maxPlayers}
              </span>
            </div>
            {league.players?.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-display font-bold uppercase tracking-wide text-sm">No players yet</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-4 py-3 font-display font-bold text-xs uppercase tracking-wide text-muted-foreground">
                          Player
                        </th>
                        <th className="text-center px-4 py-3 font-display font-bold text-xs uppercase tracking-wide text-muted-foreground">
                          Skill
                        </th>
                        <th className="text-center px-4 py-3 font-display font-bold text-xs uppercase tracking-wide text-muted-foreground">
                          Joined
                        </th>
                        <th className="text-center px-4 py-3 font-display font-bold text-xs uppercase tracking-wide text-muted-foreground">
                          Payment
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {league.players.map((entry: any, i: number) => {
                        const p = entry.player;
                        return (
                          <tr
                            key={entry._id ?? i}
                            className="border-b border-border/30 last:border-0 hover:bg-accent/20 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-hero-gradient flex items-center justify-center shrink-0">
                                  <span className="text-xs font-display font-black text-white">
                                    {p?.name?.charAt(0)?.toUpperCase() ?? "?"}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{p?.name ?? "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">{p?.email ?? ""}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground">
                              {p?.skillLevel ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                              {entry.joinedAt ? format(new Date(entry.joinedAt), "MMM d, yyyy") : "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={cn(
                                  "text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                                  entry.paymentStatus === "paid"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
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
          </motion.div>
        )}

        {activeTab === "Standings" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="font-display font-black text-lg uppercase tracking-tight text-foreground mb-4">
              Standings
            </h3>
            {!league.standings || league.standings.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-display font-bold uppercase tracking-wide text-sm">No standings yet</p>
                <p className="text-xs mt-1">Standings will appear once the organizer updates them.</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        {["Rank", "Player", "W", "L", "Pts", "Played"].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 font-display font-bold text-xs uppercase tracking-wide text-muted-foreground text-center first:text-left"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...league.standings]
                        .sort((a: any, b: any) => (a.rank || 999) - (b.rank || 999))
                        .map((s: any, i: number) => (
                          <tr
                            key={s._id ?? i}
                            className="border-b border-border/30 last:border-0 hover:bg-accent/20 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-display font-black",
                                  s.rank === 1
                                    ? "bg-yellow-500/20 text-yellow-600"
                                    : s.rank === 2
                                    ? "bg-slate-400/20 text-slate-500"
                                    : s.rank === 3
                                    ? "bg-amber-700/20 text-amber-700"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {s.rank ?? i + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-hero-gradient flex items-center justify-center shrink-0">
                                  <span className="text-[10px] font-display font-black text-white">
                                    {s.player?.name?.charAt(0)?.toUpperCase() ?? "?"}
                                  </span>
                                </div>
                                <span className="font-medium text-foreground">{s.player?.name ?? "Unknown"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-600">{s.wins ?? 0}</td>
                            <td className="px-4 py-3 text-center font-bold text-destructive">{s.losses ?? 0}</td>
                            <td className="px-4 py-3 text-center font-black text-primary">{s.points ?? 0}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{s.gamesPlayed ?? 0}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "Sessions" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="font-display font-black text-lg uppercase tracking-tight text-foreground mb-4">
              Sessions
            </h3>
            {!league.sessions || league.sessions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CalendarBlank className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-display font-bold uppercase tracking-wide text-sm">No sessions scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {league.sessions.map((session: any, i: number) => (
                  <div
                    key={session._id ?? i}
                    className="glass-card rounded-xl p-4 border border-border/50 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center shrink-0 shadow-sm">
                      <span className="font-display font-black text-sm text-white">
                        {session.sessionNumber ?? i + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-sm uppercase tracking-wide text-foreground">
                          Session {session.sessionNumber ?? i + 1}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                            SESSION_STATUS_COLORS[session.status] ?? SESSION_STATUS_COLORS.upcoming
                          )}
                        >
                          {session.status}
                        </span>
                      </div>
                      {session.date && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <CalendarBlank className="w-3.5 h-3.5 shrink-0" />
                          {format(new Date(session.date), "EEEE, MMM d, yyyy")}
                        </p>
                      )}
                      {session.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{session.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}

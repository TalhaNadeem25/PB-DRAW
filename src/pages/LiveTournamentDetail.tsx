import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Radio,
  ArrowLeft,
  Trophy,
  Clock,
  Warning,
  WifiHigh,
  WifiSlash,
  CircleNotch,
  Square,
  Plus,
} from "@phosphor-icons/react";
import { tournamentAPI, eventAPI, poolAPI, matchAPI } from "@/services/api";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSocket } from "@/contexts/SocketContext";
import { cn } from "@/lib/utils";

const LiveTournamentDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { socket, connected, joinTournament, leaveTournament } = useSocket();
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("in-progress");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const scoreFlashRef = useRef<string | null>(null);

  useEffect(() => {
    if (id) {
      joinTournament(id);
      return () => {
        leaveTournament(id);
      };
    }
  }, [id, joinTournament, leaveTournament]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleScoreUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-live-matches", id] });
      setLastUpdate(new Date());
      setTimeout(() => {
        scoreFlashRef.current = null;
      }, 1500);
    };

    const handleMatchUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-live-matches", id] });
      setLastUpdate(new Date());
    };

    const handleTournamentUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      setLastUpdate(new Date());
    };

    socket.on("score-updated", handleScoreUpdate);
    socket.on("match-updated", handleMatchUpdate);
    socket.on("tournament-updated", handleTournamentUpdate);
    socket.on("match-scheduled", handleMatchUpdate);
    socket.on("matches-auto-scheduled", handleMatchUpdate);

    return () => {
      socket.off("score-updated", handleScoreUpdate);
      socket.off("match-updated", handleMatchUpdate);
      socket.off("tournament-updated", handleTournamentUpdate);
      socket.off("match-scheduled", handleMatchUpdate);
      socket.off("matches-auto-scheduled", handleMatchUpdate);
    };
  }, [socket, id, queryClient]);

  const { data: tournamentData, isLoading: tournamentLoading } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => tournamentAPI.getById(id!),
    enabled: !!id,
  });

  const tournament = tournamentData?.data;

  const { data: eventsData } = useQuery({
    queryKey: ["tournament-events", id],
    queryFn: () => eventAPI.getByTournament(id!),
    enabled: !!id,
  });

  const events = eventsData?.data || [];

  const { data: allMatchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ["tournament-live-matches", id, selectedEventId],
    queryFn: async () => {
      const eventsToFetch =
        selectedEventId === "all"
          ? events
          : events.filter((e: any) => e._id === selectedEventId);

      const allMatches: any[] = [];

      for (const event of eventsToFetch) {
        const poolsResponse = await poolAPI.getByEvent(event._id);
        const pools = poolsResponse.data || [];

        for (const pool of pools) {
          const matchesResponse = await matchAPI.getByPool(pool._id);
          const matches = matchesResponse.data || [];

          const matchesWithContext = matches.map((match: any) => ({
            ...match,
            pool: { _id: pool._id, name: pool.name },
            event: { _id: event._id, name: event.name },
          }));

          allMatches.push(...matchesWithContext);
        }
      }

      return allMatches;
    },
    enabled: !!id && events.length > 0,
    refetchInterval: connected ? 60000 : 5000,
  });

  const allMatches = allMatchesData || [];

  const filteredMatches = allMatches.filter((match: any) => {
    if (statusFilter === "all") return true;
    return match.status === statusFilter;
  });

  const sortedMatches = [...filteredMatches].sort((a: any, b: any) => {
    if (a.status === "in-progress" && b.status !== "in-progress") return -1;
    if (a.status !== "in-progress" && b.status === "in-progress") return 1;
    if (a.scheduledTime && b.scheduledTime) {
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    }
    return 0;
  });

  const liveMatchCount = allMatches.filter((m: any) => m.status === "in-progress").length;
  const completedMatches = allMatches.filter((m: any) => m.status === "completed");
  const onDeckMatches = allMatches
    .filter((m: any) => m.status === "scheduled")
    .sort(
      (a: any, b: any) =>
        new Date(a.scheduledTime || 0).getTime() - new Date(b.scheduledTime || 0).getTime()
    )
    .slice(0, 8);

  const courtsInUse = new Set(
    allMatches
      .filter((m: any) => m.status === "in-progress" && m.courtNumber != null)
      .map((m: any) => m.courtNumber)
  );

  const maxCourtFromMatches = allMatches.reduce(
    (max: number, m: any) => (m.courtNumber != null && m.courtNumber > max ? m.courtNumber : max),
    0
  );
  const totalCourts = (tournament?.venue?.courts as number) || Math.max(16, maxCourtFromMatches);
  const openCourts = Array.from({ length: Math.max(1, totalCourts) }, (_, i) => i + 1).filter(
    (c) => !courtsInUse.has(c)
  );

  const matchesByEvent = sortedMatches.reduce((acc: Record<string, any[]>, match: any) => {
    const key = match.event._id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});

  const getTeamName = (team: any) => {
    if (!team) return "TBD";
    if (team.name) return team.name;
    if (team.players && team.players.length > 0) {
      return team.players.map((p: any) => p.name).join(" / ");
    }
    return "Unknown Team";
  };

  const isMatchPoint = (match: any) => {
    if (match.status !== "in-progress") return false;
    const t1 = match.score?.team1Score ?? 0;
    const t2 = match.score?.team2Score ?? 0;
    return (t1 >= 10 && t1 - t2 === 1) || (t2 >= 10 && t2 - t1 === 1);
  };

  if (tournamentLoading) {
    return (
      <Layout variant="minimal">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <CircleNotch className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout variant="minimal">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Alert className="max-w-md">
            <Warning className="h-4 w-4" />
            <AlertDescription>Tournament not found</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout variant="minimal">
      <div className="min-h-screen bg-background">
        {/* Top header: brand, title, live count, venue time */}
        <div className="border-b border-border/60 bg-card/50 sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Link
                  to="/live"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </Link>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center shadow-md shrink-0">
                    <Trophy className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-display font-bold text-foreground text-lg sm:text-xl truncate">
                      PICKLIX LIVE
                    </h1>
                    <p className="text-sm text-muted-foreground truncate">{tournament.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="font-display font-bold text-sm text-primary">
                    {liveMatchCount} LIVE
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-display font-semibold tracking-wider text-muted-foreground uppercase">
                    Venue Time
                  </p>
                  <p className="font-display font-bold text-primary text-sm sm:text-base">
                    {format(new Date(), "HH:mm a")}
                  </p>
                </div>
                {lastUpdate && (
                  <span className="text-xs text-muted-foreground hidden lg:inline">
                    Updated {format(lastUpdate, "h:mm a")}
                  </span>
                )}
                {connected ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <WifiHigh className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted border border-border">
                    <WifiSlash className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Polling</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Completed results strip — horizontal scroll */}
          {completedMatches.length > 0 && (
            <div className="border-t border-border/40 bg-muted/30">
              <div className="container mx-auto px-4 py-2">
                <p className="text-[10px] font-display font-semibold tracking-wider text-muted-foreground uppercase mb-2">
                  Latest results
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  {completedMatches.slice(0, 20).map((match: any) => {
                    const t1 = match.score?.team1Score ?? 0;
                    const t2 = match.score?.team2Score ?? 0;
                    const team1Won = t1 > t2;
                    return (
                      <div
                        key={match._id}
                        className="flex items-center gap-2 shrink-0 text-sm font-medium"
                      >
                        <span className={cn("truncate max-w-[100px]", team1Won && "text-primary")}>
                          {getTeamName(match.team1)}
                        </span>
                        <span className={cn("font-display font-bold", team1Won && "text-primary")}>
                          {t1}
                        </span>
                        <span className="text-muted-foreground">–</span>
                        <span className={cn("font-display font-bold", !team1Won && "text-primary")}>
                          {t2}
                        </span>
                        <span className={cn("truncate max-w-[100px]", !team1Won && "text-primary")}>
                          {getTeamName(match.team2)}
                        </span>
                        <span className="text-muted-foreground text-xs">FINAL</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="border-t border-border/40">
            <div className="container mx-auto px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {events.map((event: any) => (
                      <SelectItem key={event._id} value={event._id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Main + Sidebar */}
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Main: matches grouped by event */}
            <main className="flex-1 min-w-0">
              {matchesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <CircleNotch className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : sortedMatches.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <Radio className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">
                    No Matches Found
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {statusFilter === "in-progress"
                      ? "No matches in progress"
                      : "No matches match your filters"}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(matchesByEvent).map(([eventId, matches]: [string, any]) => {
                    const event = events.find((e: any) => e._id === eventId);
                    const eventName = event?.name || "Event";

                    return (
                      <section key={eventId}>
                        <div className="flex items-baseline gap-3 mb-2">
                          <div className="w-1 h-6 rounded-full bg-primary shrink-0" />
                          <h2 className="font-display font-bold text-foreground text-lg uppercase tracking-tight">
                            {eventName}
                          </h2>
                        </div>
                        <p className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase mb-4">
                          {matches[0]?.pool?.name || "Matches"}
                        </p>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {matches.map((match: any) => {
                            const isLive = match.status === "in-progress";
                            const isScheduled = match.status === "scheduled";
                            const isCompleted = match.status === "completed";
                            const team1Score = match.score?.team1Score ?? 0;
                            const team2Score = match.score?.team2Score ?? 0;
                            const isFlashing = scoreFlashRef.current === match._id;
                            const matchPoint = isMatchPoint(match);
                            const leadingTeam1 = team1Score > team2Score;

                            return (
                              <div
                                key={match._id}
                                className={cn(
                                  "glass-card rounded-2xl overflow-hidden transition-all duration-300",
                                  isLive && "border-2 border-primary/50 shadow-lg",
                                  matchPoint && "ring-2 ring-primary/30",
                                  isFlashing && "ring-2 ring-primary ring-offset-2 scale-[1.02]"
                                )}
                              >
                                <div className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-display font-semibold tracking-wider text-muted-foreground">
                                      COURT {String(match.courtNumber ?? "—").padStart(2, "0")}
                                    </span>
                                    {matchPoint && isLive && (
                                      <span className="text-xs font-display font-bold text-primary">
                                        MATCH POINT
                                      </span>
                                    )}
                                    {isScheduled && (
                                      <span className="text-xs font-display font-semibold text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </div>

                                  {/* Team 1 */}
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {(isLive || isCompleted) && (
                                        <span
                                          className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            leadingTeam1 ? "bg-primary" : "bg-muted-foreground/50"
                                          )}
                                        />
                                      )}
                                      <span
                                        className={cn(
                                          "text-sm font-semibold truncate",
                                          (isCompleted && leadingTeam1) || (isLive && leadingTeam1)
                                            ? "text-primary"
                                            : "text-foreground"
                                        )}
                                      >
                                        {getTeamName(match.team1)}
                                      </span>
                                    </div>
                                    <span
                                      className={cn(
                                        "font-display font-bold text-xl tabular-nums shrink-0",
                                        (isCompleted && leadingTeam1) || (isLive && leadingTeam1)
                                          ? "text-primary"
                                          : "text-foreground"
                                      )}
                                    >
                                      {isScheduled ? "0" : team1Score}
                                    </span>
                                  </div>

                                  {/* Team 2 */}
                                  <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {(isLive || isCompleted) && (
                                        <span
                                          className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            !leadingTeam1 ? "bg-primary" : "bg-muted-foreground/50"
                                          )}
                                        />
                                      )}
                                      <span
                                        className={cn(
                                          "text-sm font-semibold truncate",
                                          (isCompleted && !leadingTeam1) || (isLive && !leadingTeam1)
                                            ? "text-primary"
                                            : "text-foreground"
                                        )}
                                      >
                                        {getTeamName(match.team2)}
                                      </span>
                                    </div>
                                    <span
                                      className={cn(
                                        "font-display font-bold text-xl tabular-nums shrink-0",
                                        (isCompleted && !leadingTeam1) || (isLive && !leadingTeam1)
                                          ? "text-primary"
                                          : "text-foreground"
                                      )}
                                    >
                                      {isScheduled ? "0" : team2Score}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
                                    {isLive && (
                                      <>
                                        <span className="font-medium">
                                          Game 1 ({team1Score}-{team2Score})
                                        </span>
                                        <span className="font-display font-semibold text-primary">
                                          LIVE
                                        </span>
                                      </>
                                    )}
                                    {isScheduled && (
                                      <>
                                        <span>Starting soon</span>
                                        <span>Warm-up</span>
                                      </>
                                    )}
                                    {isCompleted && (
                                      <>
                                        <span>Final</span>
                                        <span>{team1Score}-{team2Score}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </main>

            {/* Right sidebar: Matches On Deck, Open Courts, Assign Match */}
            <aside className="lg:w-[320px] shrink-0 space-y-6">
              {/* Matches On Deck */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-bold text-foreground uppercase tracking-tight">
                    Matches On Deck
                  </h3>
                </div>
                {onDeckMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming matches</p>
                ) : (
                  <ul className="space-y-3">
                    {onDeckMatches.map((match: any, idx: number) => (
                      <li key={match._id} className="relative glass rounded-xl p-3 border border-border/50">
                        {idx === 0 && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-display font-bold bg-primary text-primary-foreground rounded uppercase">
                            Next up
                          </span>
                        )}
                        <p className="text-[10px] font-display font-semibold tracking-wider text-muted-foreground uppercase mb-1">
                          Est. start: {match.scheduledTime ? format(new Date(match.scheduledTime), "HH:mm") : "—"}
                        </p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {getTeamName(match.team1)} vs {getTeamName(match.team2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {match.event?.name || "Event"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Open Courts */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Square className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-bold text-foreground uppercase tracking-tight">
                    Open Courts
                  </h3>
                </div>
                {openCourts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">All courts in use</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {openCourts.slice(0, 12).map((courtNum) => (
                      <span
                        key={courtNum}
                        className="inline-flex items-center justify-center min-w-[48px] h-10 rounded-lg bg-primary/10 text-primary font-display font-bold text-sm border border-primary/20"
                      >
                        C{String(courtNum).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign Match — placeholder for organizer flow */}
              <Button
                variant="default"
                size="lg"
                className="w-full rounded-xl font-display font-bold shadow-md hover:shadow-glow transition-shadow gap-2"
                asChild
              >
                <Link to={id ? `/tournaments/${id}` : "/live"}>
                  <Plus className="w-5 h-5" />
                  Assign Match
                </Link>
              </Button>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LiveTournamentDetail;

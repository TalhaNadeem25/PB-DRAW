import Layout from "@/components/layout/Layout";
import BracketViewer from "@/components/tournament/BracketViewer";
import TournamentSchedule from "@/components/tournament/TournamentSchedule";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSocket } from "@/contexts/SocketContext";
import { cn } from "@/lib/utils";
import { eventAPI, matchAPI, poolAPI, tournamentAPI } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Copy,
  Loader2,
  MapPin,
  Radio,
  Trophy,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const Spectator = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { socket, connected, joinTournament, leaveTournament } = useSocket();

  const activeTab = searchParams.get("tab") || "matches";
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Join/leave tournament room for real-time updates
  useEffect(() => {
    if (id) {
      joinTournament(id);
      return () => {
        leaveTournament(id);
      };
    }
  }, [id, joinTournament, leaveTournament]);

  // Socket listeners — invalidate matches on any score/match/tournament update
  useEffect(() => {
    if (!socket || !id) return;

    const handleScoreUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["spectator-matches", id] });
      setLastUpdate(new Date());
    };
    const handleMatchUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["spectator-matches", id] });
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

  // Tournament info
  const { data: tournamentData, isLoading: tournamentLoading } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => tournamentAPI.getById(id!),
    enabled: !!id,
  });
  const tournament = tournamentData?.data;

  // Events list
  const { data: eventsData } = useQuery({
    queryKey: ["tournament-events", id],
    queryFn: () => eventAPI.getByTournament(id!),
    enabled: !!id,
  });
  const events = eventsData?.data || [];

  // All matches — waterfall: events → pools → matches
  const { data: allMatchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ["spectator-matches", id, selectedEventId],
    queryFn: async () => {
      const eventsToFetch =
        selectedEventId === "all"
          ? events
          : events.filter((e: any) => e._id === selectedEventId);

      const allMatches: any[] = [];
      for (const event of eventsToFetch) {
        const pools = (await poolAPI.getByEvent(event._id)).data || [];
        for (const pool of pools) {
          const matches = (await matchAPI.getByPool(pool._id)).data || [];
          allMatches.push(
            ...matches.map((m: any) => ({
              ...m,
              pool: { _id: pool._id, name: pool.name },
              event: { _id: event._id, name: event.name },
            }))
          );
        }
      }
      return allMatches;
    },
    enabled: !!id && events.length > 0,
    refetchInterval: connected ? 60000 : 5000,
  });
  const allMatches = allMatchesData || [];

  // Helpers
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

  const getStatusLabel = (status: string) => {
    if (status === "in-progress") return "LIVE";
    if (status === "scheduled") return "UP NEXT";
    if (status === "completed") return "FINAL";
    return status.toUpperCase();
  };

  // Derived
  const liveMatchCount = allMatches.filter((m: any) => m.status === "in-progress").length;
  const completedMatches = allMatches.filter((m: any) => m.status === "completed");

  const filteredMatches = allMatches.filter((match: any) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "live") return match.status === "in-progress";
    if (statusFilter === "upnext") return match.status === "scheduled";
    if (statusFilter === "completed") return match.status === "completed";
    return true;
  });

  const sortedMatches = [...filteredMatches].sort((a: any, b: any) => {
    if (a.status === "in-progress" && b.status !== "in-progress") return -1;
    if (a.status !== "in-progress" && b.status === "in-progress") return 1;
    if (a.scheduledTime && b.scheduledTime) {
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    }
    return 0;
  });

  const matchesByEvent = sortedMatches.reduce((acc: Record<string, any[]>, match: any) => {
    const key = match.event._id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Spectator link copied!"))
      .catch(() => toast.error("Could not copy link"));
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Status badge info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "in-progress":
        return { label: "LIVE", className: "bg-destructive text-destructive-foreground" };
      case "upcoming":
        return { label: "Upcoming", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
      case "completed":
        return { label: "Completed", className: "bg-muted text-muted-foreground" };
      case "open":
        return { label: "Open", className: "bg-primary/20 text-primary border-primary/30" };
      default:
        return { label: status, className: "bg-muted text-muted-foreground" };
    }
  };

  if (tournamentLoading) {
    return (
      <Layout variant="minimal">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout variant="minimal">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="glass-card rounded-2xl p-8 max-w-md text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-display font-bold text-lg mb-2">Tournament Not Found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              This tournament may have been removed or the link is invalid.
            </p>
            <Button asChild variant="default">
              <Link to="/tournaments">Browse Tournaments</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const statusInfo = getStatusInfo(tournament.status);

  return (
    <Layout variant="minimal">
      <Helmet>
        <title>{tournament.name} — Spectator View | Picklix</title>
        <meta
          name="description"
          content={`Follow ${tournament.name} live — match scores, standings, brackets, and schedule.`}
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Sticky header */}
        <div className="border-b border-border/60 bg-card/50 sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Left: back + tournament info */}
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  to={`/tournaments/${id}`}
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Back</span>
                </Link>

                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-hero-gradient flex items-center justify-center shadow-md shrink-0">
                    <Trophy className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-display font-bold text-foreground text-base sm:text-lg truncate">
                        {tournament.name}
                      </h1>
                      <Badge className={cn("text-[10px] px-2 py-0.5 shrink-0", statusInfo.className)}>
                        {statusInfo.label === "LIVE" && (
                          <span className="relative flex h-1.5 w-1.5 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                          </span>
                        )}
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {tournament.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(tournament.startDate), "MMM dd")} –{" "}
                        {format(new Date(tournament.endDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: live indicator, copy link */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {lastUpdate && (
                  <span className="text-xs text-muted-foreground hidden lg:inline">
                    Updated {format(lastUpdate, "h:mm a")}
                  </span>
                )}
                {connected ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <Wifi className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary hidden sm:inline">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted border border-border">
                    <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Polling</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  onClick={handleCopyLink}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy Link</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Latest results ticker */}
          {completedMatches.length > 0 && (
            <div className="border-t border-border/40 bg-muted/30">
              <div className="container mx-auto px-4 py-2">
                <p className="text-[10px] font-display font-semibold tracking-wider text-muted-foreground uppercase mb-1.5">
                  Latest results
                </p>
                <div className="flex gap-4 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  {completedMatches.slice(0, 20).map((match: any) => {
                    const t1 = match.score?.team1Score ?? 0;
                    const t2 = match.score?.team2Score ?? 0;
                    const team1Won = t1 > t2;
                    return (
                      <div
                        key={match._id}
                        className="flex items-center gap-1.5 shrink-0 text-xs font-medium"
                      >
                        <span className={cn("truncate max-w-[90px]", team1Won && "text-primary")}>
                          {getTeamName(match.team1)}
                        </span>
                        <span className={cn("font-display font-bold", team1Won && "text-primary")}>
                          {t1}
                        </span>
                        <span className="text-muted-foreground">–</span>
                        <span className={cn("font-display font-bold", !team1Won && "text-primary")}>
                          {t2}
                        </span>
                        <span className={cn("truncate max-w-[90px]", !team1Won && "text-primary")}>
                          {getTeamName(match.team2)}
                        </span>
                        <span className="text-muted-foreground/60">FINAL</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              <TabsTrigger value="matches" className="gap-2">
                <Radio className="w-4 h-4" />
                Matches
                {liveMatchCount > 0 && (
                  <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-destructive text-destructive-foreground">
                    {liveMatchCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="standings" className="gap-2">
                <Trophy className="w-4 h-4" />
                Standings &amp; Brackets
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-2">
                <Calendar className="w-4 h-4" />
                Schedule
              </TabsTrigger>
            </TabsList>

            {/* ── Matches Tab ── */}
            <TabsContent value="matches">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Status filter strip */}
                <div className="flex gap-1.5">
                  {[
                    { key: "all", label: "All" },
                    { key: "live", label: "Live" },
                    { key: "upnext", label: "Up Next" },
                    { key: "completed", label: "Completed" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
                        statusFilter === key
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Event filter */}
                {events.length > 1 && (
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
                )}
              </div>

              {/* Match cards */}
              {matchesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : sortedMatches.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <Radio className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">
                    No Matches Found
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {statusFilter === "live"
                      ? "No matches currently in progress"
                      : "No matches match the selected filters"}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(matchesByEvent).map(([eventId, matches]: [string, any]) => {
                    const event = events.find((e: any) => e._id === eventId);
                    const eventName = event?.name || "Event";

                    return (
                      <section key={eventId}>
                        <div className="flex items-baseline gap-3 mb-4">
                          <div className="w-1 h-6 rounded-full bg-primary shrink-0" />
                          <h2 className="font-display font-bold text-foreground text-lg uppercase tracking-tight">
                            {eventName}
                          </h2>
                          <span className="text-xs text-muted-foreground">
                            {matches.length} match{matches.length !== 1 ? "es" : ""}
                          </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {matches.map((match: any) => {
                            const isLive = match.status === "in-progress";
                            const isScheduled = match.status === "scheduled";
                            const isCompleted = match.status === "completed";
                            const team1Score = match.score?.team1Score ?? 0;
                            const team2Score = match.score?.team2Score ?? 0;
                            const matchPoint = isMatchPoint(match);
                            const leadingTeam1 = team1Score > team2Score;

                            return (
                              <div
                                key={match._id}
                                className={cn(
                                  "glass-card rounded-2xl overflow-hidden transition-all duration-300",
                                  isLive &&
                                    "border-l-4 border-l-primary border border-primary/30 shadow-lg",
                                  matchPoint && "ring-2 ring-primary/30"
                                )}
                              >
                                <div className="p-4">
                                  {/* Header row */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      {isLive && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 border border-destructive/30">
                                          <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
                                          </span>
                                          <span className="text-[10px] font-display font-bold text-destructive">
                                            LIVE
                                          </span>
                                        </span>
                                      )}
                                      {isScheduled && (
                                        <span className="text-[10px] font-display font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                                          UP NEXT
                                        </span>
                                      )}
                                      {isCompleted && (
                                        <span className="text-[10px] font-display font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                                          FINAL
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {matchPoint && isLive && (
                                        <span className="text-[10px] font-display font-bold text-primary animate-pulse">
                                          MATCH POINT
                                        </span>
                                      )}
                                      {match.courtNumber != null && (
                                        <span className="text-[10px] font-display font-semibold tracking-wider text-muted-foreground">
                                          COURT {String(match.courtNumber).padStart(2, "0")}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Round/pool label */}
                                  {match.pool?.name && (
                                    <p className="text-[10px] font-display font-semibold tracking-wider text-muted-foreground uppercase mb-2">
                                      {match.pool.name}
                                    </p>
                                  )}

                                  {/* Team 1 */}
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {(isLive || isCompleted) && (
                                        <span
                                          className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            leadingTeam1
                                              ? "bg-primary"
                                              : "bg-muted-foreground/30"
                                          )}
                                        />
                                      )}
                                      <span
                                        className={cn(
                                          "text-sm font-semibold truncate",
                                          (isLive || isCompleted) && leadingTeam1
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
                                        (isLive || isCompleted) && leadingTeam1
                                          ? "text-primary"
                                          : "text-foreground"
                                      )}
                                    >
                                      {isScheduled ? "–" : team1Score}
                                    </span>
                                  </div>

                                  {/* Team 2 */}
                                  <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {(isLive || isCompleted) && (
                                        <span
                                          className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            !leadingTeam1
                                              ? "bg-primary"
                                              : "bg-muted-foreground/30"
                                          )}
                                        />
                                      )}
                                      <span
                                        className={cn(
                                          "text-sm font-semibold truncate",
                                          (isLive || isCompleted) && !leadingTeam1
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
                                        (isLive || isCompleted) && !leadingTeam1
                                          ? "text-primary"
                                          : "text-foreground"
                                      )}
                                    >
                                      {isScheduled ? "–" : team2Score}
                                    </span>
                                  </div>

                                  {/* Footer */}
                                  {isScheduled && match.scheduledTime && (
                                    <div className="pt-2 border-t border-border/60">
                                      <p className="text-xs text-muted-foreground">
                                        Scheduled:{" "}
                                        {format(new Date(match.scheduledTime), "h:mm a")}
                                      </p>
                                    </div>
                                  )}
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
            </TabsContent>

            {/* ── Standings & Brackets Tab ── */}
            <TabsContent value="standings">
              <BracketViewer tournamentId={id!} />
            </TabsContent>

            {/* ── Schedule Tab ── */}
            <TabsContent value="schedule">
              <TournamentSchedule
                tournamentId={id!}
                tournamentStartDate={tournament.startDate}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Spectator;

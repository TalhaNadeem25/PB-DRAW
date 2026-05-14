import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
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
  ShareNetwork,
} from "@phosphor-icons/react";
import { tournamentAPI, eventAPI, poolAPI, matchAPI } from "@/services/api";
import { format } from "date-fns";
import { useSocket } from "@/contexts/SocketContext";
import { cn } from "@/lib/utils";
import { Dot, Eyebrow, Pill, PbBtn } from "@/components/ui/pb";

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
      return () => { leaveTournament(id); };
    }
  }, [id, joinTournament, leaveTournament]);

  useEffect(() => {
    if (!socket || !id) return;
    const handleScoreUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-live-matches", id] });
      setLastUpdate(new Date());
      setTimeout(() => { scoreFlashRef.current = null; }, 1500);
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
          allMatches.push(...matches.map((match: any) => ({
            ...match,
            pool: { _id: pool._id, name: pool.name },
            event: { _id: event._id, name: event.name },
          })));
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
    .sort((a: any, b: any) => new Date(a.scheduledTime || 0).getTime() - new Date(b.scheduledTime || 0).getTime())
    .slice(0, 8);

  const courtsInUse = new Set(
    allMatches.filter((m: any) => m.status === "in-progress" && m.courtNumber != null).map((m: any) => m.courtNumber)
  );
  const maxCourtFromMatches = allMatches.reduce(
    (max: number, m: any) => (m.courtNumber != null && m.courtNumber > max ? m.courtNumber : max), 0
  );
  const totalCourts = (tournament?.venue?.courts as number) || Math.max(16, maxCourtFromMatches);
  const openCourts = Array.from({ length: Math.max(1, totalCourts) }, (_, i) => i + 1).filter((c) => !courtsInUse.has(c));

  const matchesByEvent = sortedMatches.reduce((acc: Record<string, any[]>, match: any) => {
    const key = match.event._id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});

  const getTeamName = (team: any) => {
    if (!team) return "TBD";
    if (team.name) return team.name;
    if (team.players && team.players.length > 0) return team.players.map((p: any) => p.name).join(" / ");
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
        <div className="min-h-screen bg-pb-paper flex items-center justify-center">
          <CircleNotch size={32} className="animate-spin text-pb-court" />
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout variant="minimal">
        <div className="min-h-screen bg-pb-paper flex items-center justify-center">
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-6 max-w-sm text-center">
            <Warning size={28} className="mx-auto mb-3 text-pb-muted" />
            <p className="text-[13px] font-mono text-pb-muted">Tournament not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout variant="minimal">
      <div className="min-h-screen bg-pb-paper">

        {/* ── Mobile sticky top bar ── */}
        <div className="md:hidden sticky top-0 z-30 bg-pb-surface border-b border-pb-hairline px-4 pb-3 flex items-center justify-between gap-3" style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/live" className="shrink-0 text-pb-muted">
              <ArrowLeft size={18} />
            </Link>
            <span className="font-display font-bold text-[15px] text-pb-ink truncate">{tournament.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pb-amber-tint border border-[#E8C9A1]">
              <Dot color="amber" size={5} pulse />
              <span className="font-mono text-[10px] font-bold text-[#7C3F0A] uppercase tracking-wide">LIVE</span>
            </div>
            <button onClick={() => navigator.share?.({ title: tournament.name, url: window.location.href }).catch(() => {})} className="text-pb-muted">
              <ShareNetwork size={18} />
            </button>
          </div>
        </div>

        {/* ── Mobile hero strip ── */}
        <div className="md:hidden h-44 bg-pb-court relative overflow-hidden">
          {/* Subtle court lines overlay */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 390 176"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="20" y="16" width="350" height="144" rx="2" stroke="rgba(245,242,235,0.25)" strokeWidth="1.5" />
            <rect x="60" y="16" width="270" height="144" stroke="rgba(245,242,235,0.25)" strokeWidth="1.5" />
            <line x1="195" y1="16" x2="195" y2="160" stroke="rgba(245,242,235,0.25)" strokeWidth="1.5" />
            <circle cx="195" cy="88" r="22" stroke="rgba(245,242,235,0.25)" strokeWidth="1.5" />
          </svg>
          {/* Bottom-left status pill */}
          <div className="absolute bottom-4 left-4">
            {liveMatchCount > 0 ? (
              <Pill tone="amber" mono className="flex items-center gap-1.5">
                <Dot color="amber" size={5} pulse />
                LIVE · {liveMatchCount} MATCH{liveMatchCount !== 1 ? "ES" : ""}
              </Pill>
            ) : (
              <Pill tone="court" mono>OPEN</Pill>
            )}
          </div>
          {/* Bottom-right match count */}
          <div className="absolute bottom-4 right-4">
            <span className="font-mono text-[11px] text-white/50">
              {allMatches.length} matches
            </span>
          </div>
        </div>

        {/* ── Mobile info section ── */}
        <div className="md:hidden px-4 pt-4 pb-3 border-b border-pb-hairline">
          <Eyebrow className="mb-1">
            {tournament.startDate
              ? format(new Date(tournament.startDate), "MMM d")
              : ""}
            {tournament.endDate && tournament.endDate !== tournament.startDate
              ? ` – ${format(new Date(tournament.endDate), "MMM d, yyyy")}`
              : tournament.startDate
              ? `, ${format(new Date(tournament.startDate), "yyyy")}`
              : ""}
            {tournament.location ? ` · ${tournament.location}` : ""}
          </Eyebrow>
          <h2 className="font-display font-extrabold text-[28px] tracking-[-0.035em] leading-none text-pb-ink mt-1 mb-3">
            {tournament.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {tournament.format && (
              <Pill tone="neutral" mono>{tournament.format}</Pill>
            )}
            {tournament.entryFee != null && (
              <Pill tone="neutral" mono>
                {tournament.entryFee === 0 ? "FREE" : `$${tournament.entryFee}`}
              </Pill>
            )}
            {events.length > 0 && (
              <Pill tone="neutral" mono>{events.length} EVENT{events.length !== 1 ? "S" : ""}</Pill>
            )}
          </div>
        </div>

        {/* ── Mobile filters strip ── */}
        <div className="md:hidden bg-pb-surface border-b border-pb-hairline px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="h-8 px-2.5 rounded-[6px] border border-pb-hairline bg-pb-surface2 text-[11px] font-mono text-pb-ink focus:outline-none shrink-0"
          >
            <option value="all">All Events</option>
            {events.map((event: any) => (
              <option key={event._id} value={event._id}>{event.name}</option>
            ))}
          </select>
          {[
            { key: "in-progress", label: "Live" },
            { key: "scheduled", label: "Up Next" },
            { key: "completed", label: "Final" },
            { key: "all", label: "All" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-colors",
                statusFilter === key
                  ? "bg-pb-ink text-white border-pb-ink"
                  : "border-pb-hairline text-pb-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Mobile match list ── */}
        <div className="md:hidden px-4 py-4 space-y-3 pb-20">
          {matchesLoading ? (
            <div className="flex items-center justify-center py-12">
              <CircleNotch size={24} className="animate-spin text-pb-court" />
            </div>
          ) : sortedMatches.length === 0 ? (
            <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-10 text-center">
              <Radio size={24} className="mx-auto mb-3 text-pb-faint" />
              <p className="font-display font-bold text-[14px] text-pb-ink mb-1">No Matches</p>
              <p className="text-[12px] font-mono text-pb-muted">
                {statusFilter === "in-progress" ? "No live matches right now" : "No matches match filters"}
              </p>
            </div>
          ) : (
            sortedMatches.map((match: any) => {
              const isLive = match.status === "in-progress";
              const isScheduled = match.status === "scheduled";
              const isCompleted = match.status === "completed";
              const team1Score = match.score?.team1Score ?? 0;
              const team2Score = match.score?.team2Score ?? 0;
              const matchPoint = isMatchPoint(match);
              const leadingTeam1 = team1Score > team2Score;
              const scoreDiff = Math.abs(team1Score - team2Score);
              const isTight = isLive && scoreDiff <= 2 && (team1Score + team2Score) >= 14;

              return (
                <div
                  key={match._id}
                  className={cn(
                    "bg-pb-surface rounded-[8px] overflow-hidden border",
                    isTight ? "border-pb-amber" : "border-pb-hairline"
                  )}
                >
                  {/* Card header */}
                  <div className={cn(
                    "flex items-center justify-between px-3 py-2",
                    isTight ? "bg-pb-amber-tint" : "bg-pb-surface2"
                  )}>
                    <div className="flex items-center gap-2">
                      {isLive && (
                        <Pill tone="amber" mono className="flex items-center gap-1 text-[10px]">
                          <Dot color="amber" size={4} pulse />
                          {matchPoint ? "MATCH PT" : "LIVE"}
                        </Pill>
                      )}
                      {isScheduled && <Pill tone="neutral" mono className="text-[10px]">UP NEXT</Pill>}
                      {isCompleted && <Pill tone="neutral" mono className="text-[10px]">FINAL</Pill>}
                    </div>
                    <span className="font-mono text-[10px] text-pb-faint uppercase tracking-[0.06em]">
                      CT {String(match.courtNumber ?? "—").padStart(2, "0")}
                    </span>
                  </div>

                  {/* Teams */}
                  <div className="px-3 py-2.5 space-y-2">
                    {([1, 2] as const).map((t) => {
                      const isT1 = t === 1;
                      const name = isT1 ? getTeamName(match.team1) : getTeamName(match.team2);
                      const score = isT1 ? team1Score : team2Score;
                      const isWinning = isT1 ? leadingTeam1 : !leadingTeam1;
                      return (
                        <div key={t} className="flex items-center justify-between">
                          <span className={cn(
                            "text-[14px] font-display font-bold truncate max-w-[65%]",
                            (isLive || isCompleted) && isWinning ? "text-pb-ink" : "text-pb-muted"
                          )}>
                            {name}
                          </span>
                          <span className={cn(
                            "font-mono text-[18px] font-bold tabular-nums leading-none",
                            (isLive || isCompleted) && isWinning ? "text-pb-ink" : "text-pb-muted"
                          )}>
                            {isScheduled ? "–" : score}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  {isScheduled && match.scheduledTime && (
                    <div className="border-t border-pb-hairline px-3 py-1.5">
                      <span className="font-mono text-[10px] text-pb-faint">
                        {format(new Date(match.scheduledTime), "h:mm a")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Desktop sticky header ── */}
        <div className="hidden md:block border-b border-pb-hairline bg-pb-surface sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Link
                  to="/live"
                  className="inline-flex items-center gap-1.5 text-[12px] font-mono text-pb-muted hover:text-pb-ink transition-colors shrink-0"
                >
                  <ArrowLeft size={14} />
                  <span className="hidden sm:inline">Back</span>
                </Link>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-[6px] bg-pb-court-tint2 border border-pb-hairline flex items-center justify-center shrink-0">
                    <Trophy size={16} className="text-pb-court" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-display font-black text-[16px] uppercase tracking-tight text-pb-ink truncate">
                      PB Draw Live
                    </h1>
                    <p className="text-[11px] font-mono text-pb-muted truncate">{tournament.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Live count */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pb-court-tint2 border border-pb-court/20">
                  <Dot color="amber" size={6} pulse />
                  <span className="font-mono text-[11px] font-bold text-pb-court uppercase tracking-wide">
                    {liveMatchCount} Live
                  </span>
                </div>

                {/* Venue time */}
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] font-mono uppercase tracking-[0.08em] text-pb-faint">Venue Time</p>
                  <p className="font-display font-black text-[13px] text-pb-court">{format(new Date(), "HH:mm a")}</p>
                </div>

                {lastUpdate && (
                  <span className="text-[11px] font-mono text-pb-faint hidden lg:inline">
                    Updated {format(lastUpdate, "h:mm a")}
                  </span>
                )}

                {/* Connection status */}
                {connected ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-pb-court-tint2 border border-pb-court/20">
                    <WifiHigh size={12} className="text-pb-court" />
                    <span className="text-[10px] font-mono text-pb-court">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-pb-surface2 border border-pb-hairline">
                    <WifiSlash size={12} className="text-pb-muted" />
                    <span className="text-[10px] font-mono text-pb-muted">Polling</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Latest results strip */}
          {completedMatches.length > 0 && (
            <div className="border-t border-pb-hairline bg-pb-paper">
              <div className="container mx-auto px-4 py-2">
                <p className="text-[9px] font-mono uppercase tracking-[0.1em] text-pb-faint mb-1.5">Latest results</p>
                <div className="flex gap-5 overflow-x-auto pb-1 scrollbar-thin">
                  {completedMatches.slice(0, 20).map((match: any) => {
                    const t1 = match.score?.team1Score ?? 0;
                    const t2 = match.score?.team2Score ?? 0;
                    const team1Won = t1 > t2;
                    return (
                      <div key={match._id} className="flex items-center gap-2 shrink-0 text-[12px] font-mono">
                        <span className={cn("truncate max-w-[80px]", team1Won ? "text-pb-ink font-bold" : "text-pb-muted")}>
                          {getTeamName(match.team1)}
                        </span>
                        <span className={cn("font-display font-black", team1Won ? "text-pb-ink" : "text-pb-muted")}>{t1}</span>
                        <span className="text-pb-faint">–</span>
                        <span className={cn("font-display font-black", !team1Won ? "text-pb-ink" : "text-pb-muted")}>{t2}</span>
                        <span className={cn("truncate max-w-[80px]", !team1Won ? "text-pb-ink font-bold" : "text-pb-muted")}>
                          {getTeamName(match.team2)}
                        </span>
                        <span className="text-pb-faint text-[10px] uppercase tracking-wide">Final</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="border-t border-pb-hairline">
            <div className="container mx-auto px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="h-8 px-3 rounded-[6px] border border-pb-hairline bg-pb-surface2 text-[12px] font-mono text-pb-ink focus:outline-none focus:border-pb-rule"
                >
                  <option value="all">All Events</option>
                  {events.map((event: any) => (
                    <option key={event._id} value={event._id}>{event.name}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-3 rounded-[6px] border border-pb-hairline bg-pb-surface2 text-[12px] font-mono text-pb-ink focus:outline-none focus:border-pb-rule"
                >
                  <option value="in-progress">In Progress</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main content + sidebar — desktop only */}
        <div className="hidden md:block container mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

            {/* Main: matches by event */}
            <main className="flex-1 min-w-0">
              {matchesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <CircleNotch size={24} className="animate-spin text-pb-court" />
                </div>
              ) : sortedMatches.length === 0 ? (
                <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-12 text-center">
                  <Radio size={28} className="mx-auto mb-3 text-pb-faint" />
                  <p className="font-display font-black text-[15px] uppercase tracking-tight text-pb-ink mb-1">No Matches Found</p>
                  <p className="text-[12px] font-mono text-pb-muted">
                    {statusFilter === "in-progress" ? "No matches in progress" : "No matches match your filters"}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(matchesByEvent).map(([eventId, matches]: [string, any]) => {
                    const event = events.find((e: any) => e._id === eventId);
                    const eventName = event?.name || "Event";
                    return (
                      <section key={eventId}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-1 h-5 bg-pb-court rounded-full shrink-0" />
                          <h2 className="font-display font-black text-[16px] uppercase tracking-tight text-pb-ink">{eventName}</h2>
                          <span className="text-[10px] font-mono text-pb-faint uppercase tracking-[0.06em]">
                            {(matches[0] as any)?.pool?.name || ""}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                                  "bg-pb-surface border rounded-[6px] overflow-hidden transition-all duration-300",
                                  isLive ? "border-pb-court" : "border-pb-hairline",
                                  isFlashing && "ring-2 ring-pb-court ring-offset-2 scale-[1.02]"
                                )}
                              >
                                <div className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-pb-faint">
                                      Court {String(match.courtNumber ?? "—").padStart(2, "0")}
                                    </span>
                                    {matchPoint && isLive && (
                                      <span className="text-[10px] font-mono font-bold text-pb-amber uppercase tracking-wide">Match Point</span>
                                    )}
                                    {isLive && !matchPoint && (
                                      <div className="flex items-center gap-1.5">
                                        <Dot color="amber" size={5} pulse />
                                        <span className="text-[10px] font-mono text-pb-amber uppercase tracking-wide">Live</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Team 1 */}
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {(isLive || isCompleted) && (
                                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", leadingTeam1 ? "bg-pb-court" : "bg-pb-hairline")} />
                                      )}
                                      <span className={cn("text-[13px] font-display font-bold truncate", (isCompleted || isLive) && leadingTeam1 ? "text-pb-court" : "text-pb-ink")}>
                                        {getTeamName(match.team1)}
                                      </span>
                                    </div>
                                    <span className={cn("font-display font-black text-[22px] tabular-nums shrink-0 leading-none", (isCompleted || isLive) && leadingTeam1 ? "text-pb-court" : "text-pb-ink")}>
                                      {isScheduled ? "0" : team1Score}
                                    </span>
                                  </div>

                                  {/* Team 2 */}
                                  <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {(isLive || isCompleted) && (
                                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", !leadingTeam1 ? "bg-pb-court" : "bg-pb-hairline")} />
                                      )}
                                      <span className={cn("text-[13px] font-display font-bold truncate", (isCompleted || isLive) && !leadingTeam1 ? "text-pb-court" : "text-pb-ink")}>
                                        {getTeamName(match.team2)}
                                      </span>
                                    </div>
                                    <span className={cn("font-display font-black text-[22px] tabular-nums shrink-0 leading-none", (isCompleted || isLive) && !leadingTeam1 ? "text-pb-court" : "text-pb-ink")}>
                                      {isScheduled ? "0" : team2Score}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-[11px] font-mono text-pb-faint pt-2.5 border-t border-pb-hairline">
                                    {isLive && <span>Game 1 ({team1Score}–{team2Score})</span>}
                                    {isScheduled && <span>Starting soon</span>}
                                    {isCompleted && <span>Final</span>}
                                    {isScheduled && <span className="text-pb-muted">Warm-up</span>}
                                    {isCompleted && <span>{team1Score}–{team2Score}</span>}
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

            {/* Right sidebar */}
            <aside className="lg:w-[300px] shrink-0 space-y-5">
              {/* On Deck */}
              <div className="bg-pb-surface border border-pb-hairline rounded-[6px]">
                <div className="border-b border-pb-hairline px-5 py-3.5 flex items-center gap-2">
                  <Clock size={14} className="text-pb-court" />
                  <p className="font-display font-black text-[13px] uppercase tracking-tight text-pb-ink">Matches On Deck</p>
                </div>
                <div className="p-4">
                  {onDeckMatches.length === 0 ? (
                    <p className="text-[12px] font-mono text-pb-muted">No upcoming matches</p>
                  ) : (
                    <ul className="divide-y divide-pb-hairline">
                      {onDeckMatches.map((match: any, idx: number) => (
                        <li key={match._id} className="py-3 first:pt-0 last:pb-0">
                          {idx === 0 && (
                            <span className="inline-block px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide bg-pb-court-tint2 text-pb-court rounded mb-1">
                              Next up
                            </span>
                          )}
                          <p className="text-[10px] font-mono text-pb-faint uppercase tracking-[0.06em] mb-0.5">
                            Est. {match.scheduledTime ? format(new Date(match.scheduledTime), "HH:mm") : "—"}
                          </p>
                          <p className="text-[12px] font-display font-bold text-pb-ink truncate">
                            {getTeamName(match.team1)} vs {getTeamName(match.team2)}
                          </p>
                          <p className="text-[11px] font-mono text-pb-muted">{match.event?.name || "Event"}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Open Courts */}
              <div className="bg-pb-surface border border-pb-hairline rounded-[6px]">
                <div className="border-b border-pb-hairline px-5 py-3.5 flex items-center gap-2">
                  <Square size={14} className="text-pb-court" />
                  <p className="font-display font-black text-[13px] uppercase tracking-tight text-pb-ink">Open Courts</p>
                </div>
                <div className="p-4">
                  {openCourts.length === 0 ? (
                    <p className="text-[12px] font-mono text-pb-muted">All courts in use</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {openCourts.slice(0, 12).map((courtNum) => (
                        <span
                          key={courtNum}
                          className="inline-flex items-center justify-center min-w-[44px] h-9 rounded-[4px] bg-pb-court-tint2 border border-pb-court/20 text-pb-court font-display font-black text-[12px]"
                        >
                          C{String(courtNum).padStart(2, "0")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Assign match CTA */}
              <Link
                to={id ? `/tournaments/${id}` : "/live"}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-[6px] bg-pb-ink text-white font-display font-bold text-[13px] uppercase tracking-wide hover:bg-pb-ink/90 transition-colors"
              >
                <Plus size={14} />
                Assign Match
              </Link>
            </aside>
          </div>
        </div>

        {/* ── Mobile sticky bottom CTA ── */}
        <div className="md:hidden fixed bottom-[54px] left-0 right-0 bg-pb-surface border-t border-pb-hairline p-4 flex gap-2 z-20">
          <PbBtn
            variant="outline"
            size="sm"
            full
            asChild
          >
            <Link to={id ? `/tournaments/${id}` : "/tournaments"}>
              Bracket
            </Link>
          </PbBtn>
          <PbBtn
            variant={liveMatchCount > 0 ? "court" : "primary"}
            size="sm"
            full
            asChild
          >
            <Link to={id ? `/tournaments/${id}` : "/tournaments"}>
              {liveMatchCount > 0 ? "View Live" : "Register"}
            </Link>
          </PbBtn>
        </div>
      </div>
    </Layout>
  );
};

export default LiveTournamentDetail;

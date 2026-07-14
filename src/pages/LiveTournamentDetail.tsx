import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import {
  Radio,
  ArrowLeft,
  Warning,
  CircleNotch,
  ShareNetwork,
  TreeStructure,
} from "@phosphor-icons/react";
import { tournamentAPI, eventAPI, poolAPI, matchAPI } from "@/services/api";
import { format } from "date-fns";
import { useSocket } from "@/contexts/SocketContext";
import { cn } from "@/lib/utils";
import { Dot, Eyebrow, Pill, PbBtn } from "@/components/ui/pb";

type Tab = "pool-play" | "bracket" | "schedule" | "standings";

const LiveTournamentDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { socket, connected, joinTournament, leaveTournament } = useSocket();

  // Mobile states
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("in-progress");

  // Desktop states
  const [activeTab, setActiveTab] = useState<Tab>("pool-play");
  const [selectedPoolFilter, setSelectedPoolFilter] = useState<string>("all");
  const [focusedPoolId, setFocusedPoolId] = useState<string | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ["live-pools", id] });
      setLastUpdate(new Date());
      setTimeout(() => { scoreFlashRef.current = null; }, 1500);
    };
    const handleMatchUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-live-matches", id] });
      queryClient.invalidateQueries({ queryKey: ["live-pools", id] });
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

  // Pool standings with team stats (desktop)
  const { data: poolsData } = useQuery({
    queryKey: ["live-pools", id, events.length],
    queryFn: async () => {
      const result: any[] = [];
      for (const event of events) {
        const res = await poolAPI.getByEvent(event._id);
        const pools = res.data || [];
        result.push(...pools.map((p: any) => ({ ...p, eventRef: event })));
      }
      return result;
    },
    enabled: !!id && events.length > 0,
    refetchInterval: connected ? 30000 : 5000,
  });

  // All matches (shared mobile + desktop)
  const { data: allMatchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ["tournament-live-matches", id],
    queryFn: async () => {
      const allMatches: any[] = [];
      for (const event of events) {
        const poolsRes = await poolAPI.getByEvent(event._id);
        const pools = poolsRes.data || [];
        for (const pool of pools) {
          const matchesRes = await matchAPI.getByPool(pool._id);
          const matches = matchesRes.data || [];
          allMatches.push(...matches.map((m: any) => ({
            ...m,
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

  const allPools = poolsData || [];
  const allMatches = allMatchesData || [];

  // Auto-focus first live pool (or first pool)
  useEffect(() => {
    if (focusedPoolId || allPools.length === 0) return;
    const livePoolId = allMatches.find((m: any) => m.status === "in-progress")?.pool._id;
    setFocusedPoolId(livePoolId || allPools[0]._id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPools.length]);

  const getTeamName = (team: any) => {
    if (!team) return "TBD";
    if (team.name) return team.name;
    if (team.players?.length > 0) return team.players.map((p: any) => p.name).join(" / ");
    return "Unknown";
  };

  const isMatchPoint = (match: any) => {
    if (match.status !== "in-progress") return false;
    const t1 = match.score?.team1Score ?? 0;
    const t2 = match.score?.team2Score ?? 0;
    return (t1 >= 10 && t1 - t2 === 1) || (t2 >= 10 && t2 - t1 === 1);
  };

  // ── Mobile derived ───────────────────────────────────────────────────────
  const filteredMatches = allMatches.filter((m: any) => {
    const eventOk = selectedEventId === "all" || m.event._id === selectedEventId;
    const statusOk = statusFilter === "all" || m.status === statusFilter;
    return eventOk && statusOk;
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

  // ── Desktop derived ──────────────────────────────────────────────────────
  const matchesByPool = allMatches.reduce((acc: Record<string, any[]>, m: any) => {
    if (!acc[m.pool._id]) acc[m.pool._id] = [];
    acc[m.pool._id].push(m);
    return acc;
  }, {});

  const livePoolIds = new Set(
    allMatches.filter((m: any) => m.status === "in-progress").map((m: any) => m.pool._id)
  );
  const playingTeamIds = new Set(
    allMatches
      .filter((m: any) => m.status === "in-progress")
      .flatMap((m: any) => [m.team1?._id, m.team2?._id].filter(Boolean))
  );

  const displayedPools = selectedPoolFilter === "all"
    ? allPools
    : allPools.filter((p: any) => p._id === selectedPoolFilter);

  const focusedPool = focusedPoolId ? allPools.find((p: any) => p._id === focusedPoolId) : null;
  const focusedPoolMatches = focusedPool
    ? [...(matchesByPool[focusedPool._id] || [])].sort((a: any, b: any) => {
        const order: Record<string, number> = { "in-progress": 0, "scheduled": 1, "completed": 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      })
    : [];
  const completedInPool = focusedPoolMatches.filter((m: any) => m.status === "completed").length;

  // ── Header text ──────────────────────────────────────────────────────────
  const startDate = tournament?.startDate ? new Date(tournament.startDate) : null;
  const dayNumber = startDate
    ? Math.max(1, Math.floor((new Date().getTime() - startDate.getTime()) / 86400000) + 1)
    : 1;
  const dateLabel = startDate ? format(startDate, "EEE dd MMM").toUpperCase() : "";
  const eyebrowText = [dateLabel, `DAY ${dayNumber}`, "POOL PLAY"].filter(Boolean).join(" · ");

  const firstEvent = events[0];
  const totalTeams = allPools.reduce((s: number, p: any) => s + (p.teams?.length || 0), 0);
  const teamsToAdvance = allPools[0]?.advancementRules?.teamsToAdvance ?? 2;
  const poolSize = allPools.length > 0 && totalTeams > 0 ? Math.round(totalTeams / allPools.length) : 0;
  const bracketSize = allPools.length * teamsToAdvance;
  const subtitle = [
    firstEvent?.name,
    firstEvent?.skillLevel != null ? String(firstEvent.skillLevel) : null,
    totalTeams > 0 ? `${totalTeams} teams` : null,
    allPools.length > 0 && poolSize > 0 ? `${allPools.length} pools of ${poolSize}` : null,
    teamsToAdvance > 0 ? `Top ${teamsToAdvance} advance` : null,
    bracketSize > 0 ? `${bracketSize}-team bracket` : null,
  ].filter(Boolean).join(" · ");

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

        {/* ══ MOBILE ══════════════════════════════════════════════════════════ */}
        <div className="md:hidden">

          {/* Sticky top bar */}
          <div className="sticky top-0 z-30 bg-pb-surface border-b border-pb-hairline px-4 pb-3 flex items-center justify-between gap-3" style={{ paddingTop: "max(env(safe-area-inset-top), 14px)" }}>
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

          {/* Hero strip */}
          <div className="h-44 bg-pb-court relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 176" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="16" width="350" height="144" rx="2" stroke="rgba(245,242,235,0.25)" strokeWidth="1.5" />
              <rect x="60" y="16" width="270" height="144" stroke="rgba(245,242,235,0.25)" strokeWidth="1.5" />
              <line x1="195" y1="16" x2="195" y2="160" stroke="rgba(245,242,235,0.25)" strokeWidth="1.5" />
              <circle cx="195" cy="88" r="22" stroke="rgba(245,242,235,0.25)" strokeWidth="1.5" />
            </svg>
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
            <div className="absolute bottom-4 right-4">
              <span className="font-mono text-[11px] text-white/50">{allMatches.length} matches</span>
            </div>
          </div>

          {/* Info */}
          <div className="px-4 pt-4 pb-3 border-b border-pb-hairline">
            <Eyebrow className="mb-1">
              {tournament.startDate ? format(new Date(tournament.startDate), "MMM d") : ""}
              {tournament.endDate && tournament.endDate !== tournament.startDate
                ? ` – ${format(new Date(tournament.endDate), "MMM d, yyyy")}`
                : tournament.startDate ? `, ${format(new Date(tournament.startDate), "yyyy")}` : ""}
              {tournament.location ? ` · ${tournament.location}` : ""}
            </Eyebrow>
            <h2 className="font-display font-extrabold text-[28px] tracking-[-0.035em] leading-none text-pb-ink mt-1 mb-3">
              {tournament.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {tournament.format && <Pill tone="neutral" mono>{tournament.format}</Pill>}
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

          {/* Filters */}
          <div className="bg-pb-surface border-b border-pb-hairline px-4 py-2 flex items-center gap-2 overflow-x-auto">
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
                  statusFilter === key ? "bg-pb-ink text-white border-pb-ink" : "border-pb-hairline text-pb-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Match list */}
          <div className="px-4 py-4 space-y-3 pb-24">
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

          {/* Mobile sticky bottom CTA */}
          <div className="fixed bottom-[54px] left-0 right-0 bg-pb-surface border-t border-pb-hairline p-4 flex gap-2 z-20">
            <PbBtn variant="outline" size="sm" full asChild>
              <Link to={id ? `/tournaments/${id}` : "/tournaments"}>Bracket</Link>
            </PbBtn>
            <PbBtn variant={liveMatchCount > 0 ? "court" : "primary"} size="sm" full asChild>
              <Link to={id ? `/tournaments/${id}` : "/tournaments"}>
                {liveMatchCount > 0 ? "View Live" : "Register"}
              </Link>
            </PbBtn>
          </div>
        </div>

        {/* ══ DESKTOP ═══════════════════════════════════════════════════════ */}
        <div className="hidden md:flex flex-col min-h-screen">

          {/* Header */}
          <div className="max-w-[1280px] mx-auto w-full px-8 pt-8 pb-5">
            <div className="flex items-start justify-between gap-6">
              <div>
                <Eyebrow className="mb-1">{eyebrowText}</Eyebrow>
                <h1 className="font-display font-black text-[46px] text-pb-ink tracking-[-0.03em] leading-[1.05] mb-2">
                  {tournament.name} · Pool standings
                </h1>
                {subtitle && (
                  <p className="font-mono text-[12px] text-pb-muted">{subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 mt-2">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/spectator/${id}`;
                    navigator.clipboard?.writeText(url).catch(() => {});
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-pb-hairline bg-white font-mono text-[11px] text-pb-ink hover:bg-pb-surface transition-colors"
                >
                  <ShareNetwork size={12} />
                  Public link
                </button>
                <Link
                  to={`/tournaments/${id}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-pb-hairline bg-white font-mono text-[11px] text-pb-ink hover:bg-pb-surface transition-colors"
                >
                  <TreeStructure size={12} />
                  Generate playoff bracket
                </Link>
              </div>
            </div>
          </div>

          {/* Tab bar + pool filters */}
          <div className="bg-pb-paper border-b border-pb-hairline sticky top-0 z-20">
            <div className="max-w-[1280px] mx-auto w-full px-8 flex items-center justify-between py-2">
              {/* Tabs */}
              <div className="flex items-center gap-0.5">
                {(["pool-play", "bracket", "schedule", "standings"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-[6px] font-display font-bold text-[13px] transition-colors",
                      activeTab === tab
                        ? "bg-pb-ink text-white"
                        : "text-pb-muted hover:text-pb-ink"
                    )}
                  >
                    {tab === "pool-play" ? "Pool play" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Pool filter chips + timestamp */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  {[
                    { pid: "all", name: "All pools" },
                    ...allPools.map((p: any) => ({ pid: p._id, name: p.name })),
                  ].map(({ pid, name }) => (
                    <button
                      key={pid}
                      onClick={() => setSelectedPoolFilter(pid)}
                      className={cn(
                        "px-3 py-1 rounded-full font-mono text-[11px] border transition-colors",
                        selectedPoolFilter === pid
                          ? "bg-pb-ink text-white border-pb-ink"
                          : "border-pb-hairline text-pb-muted hover:text-pb-ink"
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                {lastUpdate && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-pb-faint ml-3">
                    UPDATED {format(lastUpdate, "HH:mm")} PT
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="max-w-[1280px] mx-auto w-full px-8 py-8 flex-1">

            {/* Pool play tab */}
            {activeTab === "pool-play" && (
              <>
                {matchesLoading && allPools.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <CircleNotch size={24} className="animate-spin text-pb-court" />
                  </div>
                ) : displayedPools.length === 0 ? (
                  <div className="border border-pb-hairline rounded-[8px] p-12 text-center bg-white">
                    <Radio size={28} className="mx-auto mb-3 text-pb-faint" />
                    <p className="font-display font-bold text-[14px] text-pb-ink mb-1">No pools yet</p>
                    <p className="font-mono text-[12px] text-pb-muted">Pool standings will appear here once configured</p>
                  </div>
                ) : (
                  <>
                    {/* Pool standings grid */}
                    <div className={cn(
                      "grid gap-5 mb-8",
                      displayedPools.length === 1 ? "grid-cols-1 max-w-[640px]" : "grid-cols-2"
                    )}>
                      {displayedPools.map((pool: any) => {
                        const isLive = livePoolIds.has(pool._id);
                        const isFocused = focusedPoolId === pool._id;
                        const sortedTeams = [...(pool.teams || [])].sort((a: any, b: any) => {
                          if ((b.stats?.wins ?? 0) !== (a.stats?.wins ?? 0))
                            return (b.stats?.wins ?? 0) - (a.stats?.wins ?? 0);
                          return (b.stats?.pointDifferential ?? 0) - (a.stats?.pointDifferential ?? 0);
                        });
                        const advancing = pool.advancementRules?.teamsToAdvance ?? 2;

                        return (
                          <div
                            key={pool._id}
                            onClick={() => setFocusedPoolId(pool._id)}
                            className={cn(
                              "border rounded-[8px] bg-white cursor-pointer overflow-hidden transition-shadow",
                              isFocused
                                ? "border-pb-ink shadow-sm"
                                : "border-pb-hairline hover:border-pb-rule/60 hover:shadow-sm"
                            )}
                          >
                            {/* Pool header */}
                            <div className="px-5 py-3.5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-display font-bold text-[15px] text-pb-ink">{pool.name}</span>
                                {isLive && (
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#FEF3E2] border border-[#F5D79E]">
                                    <Dot color="amber" size={4} pulse />
                                    <span className="font-mono text-[9px] font-bold text-[#92400E] uppercase tracking-wider">LIVE</span>
                                  </div>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.1em]">
                                {advancing} ADVANCE
                              </span>
                            </div>

                            {/* Column headers */}
                            <div
                              className="px-5 py-1.5 bg-pb-paper border-t border-b border-pb-hairline grid items-center text-[9px] font-mono text-pb-muted uppercase tracking-[0.1em]"
                              style={{ gridTemplateColumns: "24px 1fr 28px 28px 36px 36px 40px 14px" }}
                            >
                              <span>#</span>
                              <span>TEAM</span>
                              <span className="text-right">W</span>
                              <span className="text-right">L</span>
                              <span className="text-right">PF</span>
                              <span className="text-right">PA</span>
                              <span className="text-right">±</span>
                              <span />
                            </div>

                            {/* Team rows */}
                            {sortedTeams.length === 0 ? (
                              <div className="px-5 py-5 text-center">
                                <p className="font-mono text-[11px] text-pb-faint">No teams assigned</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-pb-hairline">
                                {sortedTeams.map((team: any, idx: number) => {
                                  const isAdvancing = idx < advancing;
                                  const isPlaying = playingTeamIds.has(team._id);
                                  const diff = team.stats?.pointDifferential ?? 0;
                                  return (
                                    <div
                                      key={team._id}
                                      className={cn(
                                        "px-5 py-2.5 grid items-center",
                                        isPlaying ? "bg-[#FFFBF5]" : ""
                                      )}
                                      style={{ gridTemplateColumns: "24px 1fr 28px 28px 36px 36px 40px 14px" }}
                                    >
                                      <span className="font-mono text-[11px] text-pb-muted">{idx + 1}</span>
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        {isPlaying && <Dot color="amber" size={4} pulse />}
                                        <span className={cn(
                                          "font-display font-bold text-[13px] truncate",
                                          isAdvancing ? "text-pb-ink" : "text-pb-muted"
                                        )}>
                                          {getTeamName(team)}
                                        </span>
                                      </div>
                                      <span className={cn(
                                        "font-mono text-[12px] text-right tabular-nums",
                                        isAdvancing ? "font-bold text-pb-ink" : "text-pb-muted"
                                      )}>
                                        {team.stats?.wins ?? 0}
                                      </span>
                                      <span className="font-mono text-[12px] text-pb-muted text-right tabular-nums">
                                        {team.stats?.losses ?? 0}
                                      </span>
                                      <span className="font-mono text-[11px] text-pb-muted text-right tabular-nums">
                                        {team.stats?.pointsFor ?? 0}
                                      </span>
                                      <span className="font-mono text-[11px] text-pb-muted text-right tabular-nums">
                                        {team.stats?.pointsAgainst ?? 0}
                                      </span>
                                      <span className={cn(
                                        "font-mono text-[11px] text-right tabular-nums",
                                        diff > 0 ? "text-pb-ink" : "text-pb-muted"
                                      )}>
                                        {diff > 0 ? `+${diff}` : diff === 0 ? "0" : diff}
                                      </span>
                                      <div className="flex justify-end">
                                        {isAdvancing && (
                                          <div className="w-1.5 h-[22px] rounded-sm bg-[#1F4A2E]" />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Match timeline for focused pool */}
                    {focusedPool && (
                      <div className="border border-pb-hairline rounded-[8px] bg-white overflow-hidden">
                        <div className="px-6 py-4 border-b border-pb-hairline flex items-center justify-between">
                          <div>
                            <p className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.1em] mb-0.5">
                              {focusedPool.name}{livePoolIds.has(focusedPool._id) ? " · LIVE" : ""}
                            </p>
                            <h3 className="font-display font-bold text-[20px] text-pb-ink leading-none">
                              Round-robin · {focusedPoolMatches.length} match{focusedPoolMatches.length !== 1 ? "es" : ""}
                            </h3>
                          </div>
                          <span className="font-mono text-[11px] text-pb-muted">
                            {completedInPool} of {focusedPoolMatches.length} complete
                          </span>
                        </div>

                        {focusedPoolMatches.length === 0 ? (
                          <div className="px-6 py-8 text-center">
                            <p className="font-mono text-[11px] text-pb-faint">No matches scheduled yet</p>
                          </div>
                        ) : (
                          <div className="px-5 py-5 flex gap-4 overflow-x-auto">
                            {focusedPoolMatches.map((match: any) => {
                              const isLiveMatch = match.status === "in-progress";
                              const isFinal = match.status === "completed";
                              const t1 = match.score?.team1Score ?? 0;
                              const t2 = match.score?.team2Score ?? 0;
                              const t1Won = t1 > t2;
                              return (
                                <div
                                  key={match._id}
                                  className={cn(
                                    "shrink-0 w-[160px] rounded-[8px] p-3 border",
                                    isLiveMatch
                                      ? "bg-[#FEF3E2] border-[#F5D79E]"
                                      : "border-pb-hairline bg-white"
                                  )}
                                >
                                  <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-1">
                                      {isLiveMatch && <Dot color="amber" size={4} pulse />}
                                      <span className={cn(
                                        "font-mono text-[10px] font-bold uppercase tracking-[0.06em]",
                                        isLiveMatch ? "text-[#92400E]" : "text-pb-muted"
                                      )}>
                                        {isFinal ? "FINAL" : isLiveMatch ? "LIVE" : "NEXT"}
                                      </span>
                                    </div>
                                    <span className={cn(
                                      "font-mono font-bold text-[14px] tabular-nums",
                                      isLiveMatch ? "text-[#92400E]" : "text-pb-ink"
                                    )}>
                                      {isFinal || isLiveMatch
                                        ? `${t1}–${t2}`
                                        : match.scheduledTime
                                          ? format(new Date(match.scheduledTime), "HH:mm")
                                          : "—"}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className={cn(
                                      "font-display font-bold text-[12px] truncate leading-tight",
                                      isFinal && !t1Won ? "text-pb-muted" : "text-pb-ink"
                                    )}>
                                      {getTeamName(match.team1)}
                                    </p>
                                    <p className="font-mono text-[9px] text-pb-faint uppercase">vs</p>
                                    <p className={cn(
                                      "font-display font-bold text-[12px] truncate leading-tight",
                                      isFinal && t1Won ? "text-pb-muted" : "text-pb-ink"
                                    )}>
                                      {getTeamName(match.team2)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Other tabs → link to full tournament */}
            {activeTab !== "pool-play" && (
              <div className="border border-pb-hairline rounded-[8px] bg-white p-12 text-center">
                <p className="font-mono text-[12px] text-pb-faint uppercase tracking-[0.08em] mb-3">
                  {activeTab.replace("-", " ")}
                </p>
                <Link
                  to={`/tournaments/${id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-pb-ink text-white font-mono text-[12px] hover:bg-pb-ink/90 transition-colors"
                >
                  View tournament →
                </Link>
              </div>
            )}

          </div>
        </div>

      </div>
    </Layout>
  );
};

export default LiveTournamentDetail;

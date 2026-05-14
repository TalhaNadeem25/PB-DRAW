import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleNotch, Trophy, Warning } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { eventAPI, poolAPI, playoffAPI } from "@/services/api";
import { formatEventSkillLevel } from "@/types/tournament";
import PlayoffBracket from "./PlayoffBracket";
import PoolStandings from "./PoolStandings";
import PlayoffResults from "./PlayoffResults";
import { Eyebrow, Pill } from "@/components/ui/pb";

interface BracketViewerProps {
  tournamentId: string;
  tournamentName?: string;
  tournamentStatus?: string;
}

const BracketViewer = ({ tournamentId, tournamentName, tournamentStatus }: BracketViewerProps) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["tournament-events", tournamentId],
    queryFn: () => eventAPI.getByTournament(tournamentId),
    enabled: !!tournamentId,
  });

  const { data: poolsData, isLoading: poolsLoading } = useQuery({
    queryKey: ["event-pools", selectedEventId],
    queryFn: () => poolAPI.getByEvent(selectedEventId!),
    enabled: !!selectedEventId,
  });

  const { data: playoffsData, isLoading: playoffsLoading } = useQuery({
    queryKey: ["playoffs", selectedEventId, selectedPoolId],
    queryFn: () => playoffAPI.get(selectedEventId!, selectedPoolId!),
    enabled: !!selectedEventId && !!selectedPoolId,
  });

  const events   = eventsData?.data || [];
  const pools    = poolsData?.data || [];
  const playoffs = playoffsData?.data || [];

  const selectedEvent = events.find((e: any) => e._id === selectedEventId);
  const isSingles     = selectedEvent?.format === "singles";

  const { data: fullEventData } = useQuery({
    queryKey: ["event", selectedEventId],
    queryFn: () => eventAPI.getById(selectedEventId!),
    enabled: !!selectedEventId && isSingles,
  });

  const fullEvent = fullEventData?.data;

  const getPoolMembers = (pool: any) => {
    if (isSingles) {
      const playersInPool = (fullEvent?.registeredPlayers || [])
        .filter((reg: any) => reg.paymentStatus === "paid" && reg.pool?.toString() === pool._id?.toString())
        .map((reg: any) => ({
          _id: reg.player._id,
          name: reg.player?.name ?? reg.player?.email ?? "Player",
          players: [{ _id: reg.player._id, name: reg.player?.name ?? reg.player?.email ?? "Player" }],
          stats: { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointDifferential: 0 },
        }));

      const statsByPlayerId = new Map<string, (typeof playersInPool)[0]["stats"]>();
      playersInPool.forEach((p: any) => statsByPlayerId.set(p._id?.toString(), { ...p.stats }));

      (pool.matches || []).filter((m: any) => m.status === "completed").forEach((m: any) => {
        const id1 = m.team1?._id?.toString() ?? m.team1?.toString();
        const id2 = m.team2?._id?.toString() ?? m.team2?.toString();
        const s1 = m.score?.team1Score ?? 0;
        const s2 = m.score?.team2Score ?? 0;
        const st1 = id1 ? statsByPlayerId.get(id1) : null;
        const st2 = id2 ? statsByPlayerId.get(id2) : null;
        if (st1 && st2) {
          st1.pointsFor += s1; st1.pointsAgainst += s2;
          st2.pointsFor += s2; st2.pointsAgainst += s1;
          if (s1 > s2) { st1.wins += 1; st2.losses += 1; }
          else if (s2 > s1) { st2.wins += 1; st1.losses += 1; }
        }
      });

      statsByPlayerId.forEach((st) => { st.pointDifferential = st.pointsFor - st.pointsAgainst; });

      return playersInPool.map((p: any) => ({
        ...p,
        stats: statsByPlayerId.get(p._id?.toString()) ?? p.stats,
      }));
    }
    return pool.teams || [];
  };

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedPoolId(null);
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <CircleNotch size={24} className="animate-spin text-pb-muted" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Trophy size={28} className="text-pb-faint" />
        <p className="text-[13px] font-mono text-pb-muted text-center max-w-xs">
          No events yet. Brackets appear once events are added and pools are set up.
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isLive = tournamentStatus === "in-progress";
  const isOpen = tournamentStatus === "open";

  return (
    <div className="space-y-6">

      {/* ── Mobile: sticky top bar (only when tournamentName provided) ── */}
      {tournamentName && (
        <div className="md:hidden -mx-4 sticky top-0 z-20 bg-pb-surface border-b border-pb-hairline px-4 pb-3 flex items-center justify-between gap-3" style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)' }}>
          <span className="font-display font-bold text-[15px] text-pb-ink truncate">
            {tournamentName}
          </span>
          <div className="shrink-0">
            {isLive ? (
              <Pill tone="amber" mono className="flex items-center gap-1.5 text-[10px]">
                <span
                  className="inline-block rounded-full shrink-0"
                  style={{ width: 5, height: 5, background: "var(--pb-amber)", animation: "pbpulse 1.6s ease-out infinite" }}
                />
                LIVE
              </Pill>
            ) : isOpen ? (
              <Pill tone="court" mono className="text-[10px]">OPEN</Pill>
            ) : tournamentStatus ? (
              <Pill tone="neutral" mono className="text-[10px]">{tournamentStatus.toUpperCase()}</Pill>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Mobile: horizontal scrollable event/pool tabs ── */}
      <div className="md:hidden -mx-4">
        {/* Event tabs */}
        <div className="flex gap-0 overflow-x-auto border-b border-pb-hairline bg-pb-surface px-4">
          {events.map((event: any) => (
            <button
              key={event._id}
              onClick={() => handleEventChange(event._id)}
              className={cn(
                "shrink-0 px-4 py-2.5 text-[11px] font-mono uppercase tracking-[0.08em] border-b-2 transition-colors -mb-px whitespace-nowrap",
                selectedEventId === event._id
                  ? "border-pb-ink text-pb-ink"
                  : "border-transparent text-pb-muted"
              )}
            >
              {event.name}
            </button>
          ))}
        </div>

        {/* Pool tabs */}
        {selectedEventId && (
          <div className="flex gap-0 overflow-x-auto border-b border-pb-hairline bg-pb-surface2 px-4">
            {poolsLoading ? (
              <div className="flex items-center gap-2 py-2">
                <CircleNotch size={12} className="animate-spin text-pb-muted" />
                <span className="text-[11px] font-mono text-pb-muted">Loading…</span>
              </div>
            ) : pools.length > 0 ? (
              pools.map((pool: any) => {
                const memberCount = isSingles
                  ? (fullEvent?.registeredPlayers || []).filter(
                      (r: any) => r.paymentStatus === "paid" && r.pool?.toString() === pool._id?.toString()
                    ).length
                  : pool.teams?.length || 0;
                return (
                  <button
                    key={pool._id}
                    onClick={() => setSelectedPoolId(pool._id)}
                    className={cn(
                      "shrink-0 px-4 py-2 text-[11px] font-mono border-b-2 transition-colors -mb-px whitespace-nowrap",
                      selectedPoolId === pool._id
                        ? "border-pb-ink text-pb-ink font-medium"
                        : "border-transparent text-pb-muted"
                    )}
                  >
                    {pool.name}
                    <span className="ml-1 opacity-60 text-[10px]">{memberCount}</span>
                  </button>
                );
              })
            ) : (
              <span className="py-2 text-[11px] font-mono text-pb-muted">No pools yet</span>
            )}
          </div>
        )}
      </div>

      {/* ── Desktop: Selector card ── */}
      <div className="hidden md:block bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
        <div className="px-5 py-3 border-b border-pb-hairline bg-pb-surface2">
          <Eyebrow>Select bracket</Eyebrow>
        </div>

        <div className="px-5 py-4 flex flex-col sm:flex-row gap-4">
          {/* Event */}
          <div className="flex-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-muted mb-2">Event</p>
            <div className="flex flex-wrap gap-1.5">
              {events.map((event: any) => (
                <button
                  key={event._id}
                  onClick={() => handleEventChange(event._id)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-[6px] text-[12px] font-mono border transition-colors",
                    selectedEventId === event._id
                      ? "bg-pb-ink text-white border-pb-ink"
                      : "border-pb-hairline text-pb-muted hover:border-pb-rule hover:text-pb-ink"
                  )}
                >
                  {event.name}
                  {event.skillLevel && (
                    <span className="ml-1 opacity-60">{formatEventSkillLevel(event.skillLevel)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pool */}
          {selectedEventId && (
            <div className="flex-1">
              <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-muted mb-2">Pool</p>
              {poolsLoading ? (
                <div className="flex items-center gap-2 py-1">
                  <CircleNotch size={14} className="animate-spin text-pb-muted" />
                  <span className="text-[12px] font-mono text-pb-muted">Loading pools…</span>
                </div>
              ) : pools.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {pools.map((pool: any) => {
                    const memberCount = isSingles
                      ? (fullEvent?.registeredPlayers || []).filter(
                          (r: any) => r.paymentStatus === "paid" && r.pool?.toString() === pool._id?.toString()
                        ).length
                      : pool.teams?.length || 0;
                    return (
                      <button
                        key={pool._id}
                        onClick={() => setSelectedPoolId(pool._id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-[6px] text-[12px] font-mono border transition-colors",
                          selectedPoolId === pool._id
                            ? "bg-pb-ink text-white border-pb-ink"
                            : "border-pb-hairline text-pb-muted hover:border-pb-rule hover:text-pb-ink"
                        )}
                      >
                        {pool.name}
                        <span className="ml-1 opacity-60">
                          {memberCount} {isSingles ? "players" : "teams"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[12px] font-mono text-pb-muted py-1">
                  No pools for this event yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bracket content ────────────────────────────────────────────────── */}
      {selectedEventId && selectedPoolId && (
        <div className="space-y-6">
          {poolsLoading ? (
            <div className="flex items-center justify-center py-12">
              <CircleNotch size={24} className="animate-spin text-pb-muted" />
            </div>
          ) : (
            <>
              {/* Pool standings */}
              <PoolStandings
                teams={getPoolMembers(pools.find((p: any) => p._id === selectedPoolId))}
                poolName={pools.find((p: any) => p._id === selectedPoolId)?.name}
                showPlayoffIndicators
              />

              {/* Bracket */}
              {playoffsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <CircleNotch size={24} className="animate-spin text-pb-muted" />
                </div>
              ) : playoffs.length > 0 ? (
                <>
                  <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
                    <div className="px-5 py-3 border-b border-pb-hairline flex items-center justify-between">
                      <Eyebrow>Playoff Bracket</Eyebrow>
                      <Pill tone="neutral" mono>
                        {pools.find((p: any) => p._id === selectedPoolId)?.name}
                      </Pill>
                    </div>
                    <div className="p-5">
                      <PlayoffBracket matches={playoffs} />
                    </div>
                  </div>

                  <PlayoffResults
                    eventId={selectedEventId}
                    poolId={selectedPoolId}
                    poolName={pools.find((p: any) => p._id === selectedPoolId)?.name}
                    eventName={events.find((e: any) => e._id === selectedEventId)?.name}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Trophy size={24} className="text-pb-faint" />
                  <p className="text-[13px] font-mono text-pb-muted text-center max-w-xs">
                    Playoffs not generated yet. The organizer will create the bracket once pool play is complete.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Prompt when nothing selected ───────────────────────────────────── */}
      {(!selectedEventId || !selectedPoolId) && events.length > 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <p className="text-[12px] font-mono text-pb-faint">
            {!selectedEventId
              ? "Select an event above to view its bracket."
              : "Select a pool above to view the bracket."}
          </p>
        </div>
      )}
    </div>
  );
};

export default BracketViewer;

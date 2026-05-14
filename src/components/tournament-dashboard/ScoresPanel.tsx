import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ClipboardText, Calendar, Check, X, PencilSimple, CircleNotch,
  CaretDown, Trophy, Users, Warning,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { poolAPI, matchAPI } from "@/services/api";
import { Eyebrow, Pill, PbBtn, Dot } from "@/components/ui/pb";

// ─── Types ────────────────────────────────────────────────────────────────────

type MatchWithMeta = {
  _id: string;
  team1?: { _id: string; name?: string; players?: Array<{ name: string }> };
  team2?: { _id: string; name?: string; players?: Array<{ name: string }> };
  score?: { team1Score: number; team2Score: number };
  status?: string;
  scheduledTime?: string;
  courtNumber?: number;
  round?: number;
  eventId: string;
  eventName: string;
  poolId: string;
  poolName: string;
};

interface ScoresPanelProps {
  tournamentId: string;
  events: Array<{ _id: string; name: string }>;
}

type RoundGroup = { round: number | null; matches: MatchWithMeta[] };
type PoolGroup  = { poolId: string; poolName: string; rounds: RoundGroup[] };
type EventGroup = { eventId: string; eventName: string; pools: PoolGroup[] };

// ─── Dispute score input ──────────────────────────────────────────────────────

const DisputeInput = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => (
  <input
    type="number"
    min={0}
    value={value}
    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
    className="w-full h-10 text-center font-mono font-bold text-[18px] tabular-nums bg-pb-surface2 border border-pb-hairline focus:border-pb-rule focus:outline-none rounded-[6px] text-pb-ink [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
  />
);

// ─── Component ────────────────────────────────────────────────────────────────

const ScoresPanel = ({ tournamentId, events }: ScoresPanelProps) => {
  const queryClient = useQueryClient();
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editScores, setEditScores] = useState({ team1Score: 0, team2Score: 0 });
  const [openEvents, setOpenEvents] = useState<Set<string>>(new Set());
  const [openPools, setOpenPools] = useState<Set<string>>(new Set());
  const [resolveMatch, setResolveMatch] = useState<MatchWithMeta | null>(null);
  const [resolveScores, setResolveScores] = useState({ team1Score: 0, team2Score: 0 });

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: allMatches = [], isLoading } = useQuery({
    queryKey: ["scores", tournamentId],
    queryFn: async (): Promise<MatchWithMeta[]> => {
      const result: MatchWithMeta[] = [];
      for (const event of events || []) {
        const poolsRes = await poolAPI.getByEvent(event._id);
        for (const pool of poolsRes?.data || []) {
          const matchesRes = await matchAPI.getByPool(pool._id);
          for (const m of matchesRes?.data || []) {
            result.push({ ...m, eventId: event._id, eventName: event.name, poolId: pool._id, poolName: pool.name || "Pool" });
          }
        }
      }
      return result;
    },
    enabled: !!tournamentId && !!events?.length,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const updateScoreMutation = useMutation({
    mutationFn: ({ matchId, scores }: { matchId: string; scores: { team1Score: number; team2Score: number } }) =>
      matchAPI.updateScore(matchId, { ...scores, status: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scores", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setEditingMatchId(null);
      toast.success("Score updated");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update score"),
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: ({ matchId, scores }: { matchId: string; scores: { team1Score: number; team2Score: number } }) =>
      matchAPI.resolveDispute(matchId, scores),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scores", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setResolveMatch(null);
      toast.success("Dispute resolved");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to resolve dispute"),
  });

  // ── Hierarchy ─────────────────────────────────────────────────────────────

  const hierarchy = useMemo((): EventGroup[] => {
    const result: EventGroup[] = [];
    for (const event of events) {
      const eventMatches = allMatches.filter((m) => m.eventId === event._id);
      if (eventMatches.length === 0) continue;
      const poolMap = new Map<string, { poolName: string; matches: MatchWithMeta[] }>();
      for (const m of eventMatches) {
        const ex = poolMap.get(m.poolId);
        if (!ex) poolMap.set(m.poolId, { poolName: m.poolName, matches: [m] });
        else ex.matches.push(m);
      }
      const pools: PoolGroup[] = Array.from(poolMap.entries()).map(([poolId, { poolName, matches }]) => {
        const roundMap = new Map<number | null, MatchWithMeta[]>();
        for (const m of matches) {
          const r = m.round ?? null;
          if (!roundMap.has(r)) roundMap.set(r, []);
          roundMap.get(r)!.push(m);
        }
        const rounds: RoundGroup[] = Array.from(roundMap.entries())
          .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a - b))
          .map(([round, ms]) => ({ round, matches: ms }));
        return { poolId, poolName, rounds };
      }).sort((a, b) => a.poolName.localeCompare(b.poolName));
      result.push({ eventId: event._id, eventName: event.name, pools });
    }
    return result;
  }, [events, allMatches]);

  // Auto-expand all on first load
  useEffect(() => {
    if (hierarchy.length === 0) return;
    setOpenEvents((prev) => prev.size > 0 ? prev : new Set(hierarchy.map((e) => e.eventId)));
    setOpenPools((prev) => {
      if (prev.size > 0) return prev;
      return new Set(hierarchy.flatMap((e) => e.pools.map((p) => p.poolId)));
    });
  }, [hierarchy.length]);

  const toggleEvent = (id: string) => setOpenEvents((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const togglePool  = (id: string) => setOpenPools((prev)  => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const totalCompleted = allMatches.filter((m) => m.status === "completed").length;
  const totalMatches   = allMatches.length;
  const totalDisputed  = allMatches.filter((m) => m.status === "disputed").length;

  // ── Match card ────────────────────────────────────────────────────────────

  const renderMatchCard = (match: MatchWithMeta) => {
    const isCompleted = match.status === "completed";
    const isDisputed  = match.status === "disputed";
    const isEditing   = editingMatchId === match._id;

    const t1Score = match.score?.team1Score ?? 0;
    const t2Score = match.score?.team2Score ?? 0;
    const t1Wins  = isCompleted && t1Score > t2Score;
    const t2Wins  = isCompleted && t2Score > t1Score;

    return (
      <div
        key={match._id}
        className={cn(
          "bg-pb-surface border rounded-[6px] overflow-hidden",
          isDisputed ? "border-pb-amber/50" : "border-pb-hairline"
        )}
      >
        {/* Match meta strip */}
        <div className={cn(
          "flex items-center justify-between px-4 py-2 border-b border-pb-hairline text-[11px] font-mono",
          isDisputed ? "bg-amber-50/60" : "bg-pb-surface2"
        )}>
          <div className="flex items-center gap-3 text-pb-muted">
            {match.scheduledTime && (
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {format(new Date(match.scheduledTime), "h:mm a")}
              </span>
            )}
            {match.courtNumber != null && (
              <span>Court {match.courtNumber}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && (
              <Pill tone="court" mono className="flex items-center gap-1">
                <Dot color="court" size={5} /> Complete
              </Pill>
            )}
            {isDisputed && (
              <Pill tone="amber" mono className="flex items-center gap-1">
                <Warning size={10} /> Disputed
              </Pill>
            )}
            {!isCompleted && !isDisputed && (
              <span className="text-pb-faint uppercase tracking-[0.08em]">Pending</span>
            )}
          </div>
        </div>

        {/* Score body */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            {/* Team 1 */}
            <div className="text-right min-w-0">
              <p className={cn(
                "font-display font-bold text-[15px] tracking-[-0.02em] truncate",
                t1Wins ? "text-pb-court" : "text-pb-ink"
              )}>
                {match.team1?.name || "Team 1"}
              </p>
              {match.team1?.players?.length ? (
                <p className="text-[11px] font-mono text-pb-muted truncate mt-0.5">
                  {match.team1.players.map((p: any) => p.name).filter(Boolean).join(" / ")}
                </p>
              ) : null}
            </div>

            {/* Center: score / inline edit */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              {isEditing ? (
                <div className="flex flex-col items-center gap-2.5 p-3 bg-pb-paper border border-pb-rule rounded-[6px]">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={editScores.team1Score}
                      onChange={(e) => setEditScores((s) => ({ ...s, team1Score: parseInt(e.target.value) || 0 }))}
                      className="w-14 h-12 text-center font-mono font-bold text-[22px] tabular-nums bg-pb-surface border border-pb-hairline focus:border-pb-rule focus:outline-none rounded-[6px] text-pb-ink [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-[13px] font-mono text-pb-faint">:</span>
                    <input
                      type="number"
                      min={0}
                      value={editScores.team2Score}
                      onChange={(e) => setEditScores((s) => ({ ...s, team2Score: parseInt(e.target.value) || 0 }))}
                      className="w-14 h-12 text-center font-mono font-bold text-[22px] tabular-nums bg-pb-surface border border-pb-hairline focus:border-pb-rule focus:outline-none rounded-[6px] text-pb-ink [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="flex gap-1.5 w-full">
                    <button
                      onClick={() => updateScoreMutation.mutate({ matchId: match._id, scores: editScores })}
                      disabled={updateScoreMutation.isPending}
                      className="flex-1 h-8 rounded-[6px] bg-pb-court text-white text-[12px] font-mono font-medium flex items-center justify-center gap-1 hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {updateScoreMutation.isPending
                        ? <CircleNotch size={12} className="animate-spin" />
                        : <><Check size={12} /> Save</>}
                    </button>
                    <button
                      onClick={() => setEditingMatchId(null)}
                      className="w-8 h-8 rounded-[6px] border border-pb-hairline text-pb-muted hover:text-pb-ink hover:border-pb-rule flex items-center justify-center transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 bg-pb-surface2 border border-pb-hairline rounded-[6px]">
                    <span className={cn(
                      "font-mono text-[26px] font-bold tabular-nums leading-none min-w-[1.5ch] text-center",
                      t1Wins ? "text-pb-court" : t2Wins ? "text-pb-muted" : "text-pb-ink"
                    )}>
                      {isCompleted ? t1Score : "–"}
                    </span>
                    <span className="text-[11px] font-mono text-pb-faint">:</span>
                    <span className={cn(
                      "font-mono text-[26px] font-bold tabular-nums leading-none min-w-[1.5ch] text-center",
                      t2Wins ? "text-pb-court" : t1Wins ? "text-pb-muted" : "text-pb-ink"
                    )}>
                      {isCompleted ? t2Score : "–"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingMatchId(match._id);
                      setEditScores({ team1Score: t1Score, team2Score: t2Score });
                    }}
                    className="flex items-center gap-1 text-[11px] font-mono text-pb-muted hover:text-pb-ink transition-colors"
                  >
                    <PencilSimple size={10} />
                    {isCompleted ? "Edit score" : "Enter score"}
                  </button>
                </>
              )}
            </div>

            {/* Team 2 */}
            <div className="min-w-0">
              <p className={cn(
                "font-display font-bold text-[15px] tracking-[-0.02em] truncate",
                t2Wins ? "text-pb-court" : "text-pb-ink"
              )}>
                {match.team2?.name || "Team 2"}
              </p>
              {match.team2?.players?.length ? (
                <p className="text-[11px] font-mono text-pb-muted truncate mt-0.5">
                  {match.team2.players.map((p: any) => p.name).filter(Boolean).join(" / ")}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Disputed banner */}
        {isDisputed && (
          <div className="px-4 py-3 border-t border-pb-amber/30 bg-amber-50/40 flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-mono font-medium text-pb-amber">
                Score mismatch — organizer action required
              </p>
              {(match as any).scoreSubmission?.team1?.submitted && (match as any).scoreSubmission?.team2?.submitted && (
                <p className="text-[11px] font-mono text-pb-muted mt-1">
                  {match.team1?.name}: {(match as any).scoreSubmission.team1.team1Score}–{(match as any).scoreSubmission.team1.team2Score}
                  {" · "}
                  {match.team2?.name}: {(match as any).scoreSubmission.team2.team1Score}–{(match as any).scoreSubmission.team2.team2Score}
                </p>
              )}
            </div>
            <PbBtn
              size="sm"
              variant="outline"
              className="shrink-0 border-pb-amber/40 text-pb-amber hover:bg-amber-50"
              onClick={() => {
                setResolveMatch(match);
                setResolveScores({ team1Score: t1Score, team2Score: t2Score });
              }}
            >
              Resolve
            </PbBtn>
          </div>
        )}
      </div>
    );
  };

  // ── Empty / loading states ─────────────────────────────────────────────────

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-[6px] bg-pb-surface border border-pb-hairline flex items-center justify-center">
          <ClipboardText size={22} className="text-pb-faint" />
        </div>
        <p className="text-[13px] font-mono text-pb-muted text-center max-w-xs">
          Create events and pools first. Matches will appear here for score entry.
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-[28px] tracking-[-0.03em] text-pb-ink leading-none mb-1">
            Score Entry
          </h2>
          <p className="text-[12px] font-mono text-pb-muted">
            Record match results for all events and pools.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          {totalDisputed > 0 && (
            <Pill tone="amber" mono className="flex items-center gap-1">
              <Warning size={10} /> {totalDisputed} disputed
            </Pill>
          )}
          <Pill tone={totalCompleted === totalMatches && totalMatches > 0 ? "court" : "neutral"} mono>
            {totalCompleted}/{totalMatches} complete
          </Pill>
        </div>
      </div>

      {/* ── Progress bar ── */}
      {totalMatches > 0 && (
        <div className="h-[3px] bg-pb-hairline rounded-full overflow-hidden">
          <div
            className="h-full bg-pb-court rounded-full transition-all duration-700"
            style={{ width: `${(totalCompleted / totalMatches) * 100}%` }}
          />
        </div>
      )}

      {/* ── Body ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2">
          <CircleNotch size={18} className="animate-spin text-pb-muted" />
          <span className="text-[13px] font-mono text-pb-muted">Loading matches…</span>
        </div>
      ) : hierarchy.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <div className="w-12 h-12 rounded-[6px] bg-pb-surface border border-pb-hairline flex items-center justify-center">
            <ClipboardText size={20} className="text-pb-faint" />
          </div>
          <p className="text-[13px] font-mono text-pb-muted text-center max-w-xs">
            No matches generated yet. Generate matches from the Pools page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hierarchy.map((event) => {
            const eventTotal     = event.pools.reduce((s, p) => s + p.rounds.reduce((r, rg) => r + rg.matches.length, 0), 0);
            const eventCompleted = event.pools.reduce((s, p) => s + p.rounds.reduce((r, rg) => r + rg.matches.filter((m) => m.status === "completed").length, 0), 0);
            const isOpen = openEvents.has(event.eventId);

            return (
              <Collapsible
                key={event.eventId}
                open={isOpen}
                onOpenChange={() => toggleEvent(event.eventId)}
              >
                {/* ── Event header ── */}
                <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-pb-surface2 transition-colors group">
                      <div className="w-7 h-7 rounded-[4px] bg-pb-court-tint2 border border-pb-hairline flex items-center justify-center shrink-0">
                        <Trophy size={13} className="text-pb-court" />
                      </div>
                      <span className="font-display font-bold text-[15px] tracking-[-0.02em] text-pb-ink flex-1 text-left">
                        {event.eventName}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Mini progress */}
                        <div className="hidden sm:flex items-center gap-2">
                          <div className="w-20 h-[3px] bg-pb-hairline rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                eventCompleted === eventTotal && eventTotal > 0 ? "bg-pb-court" : "bg-pb-rule"
                              )}
                              style={{ width: eventTotal > 0 ? `${(eventCompleted / eventTotal) * 100}%` : "0%" }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-pb-muted tabular-nums">
                            {eventCompleted}/{eventTotal}
                          </span>
                        </div>
                        <CaretDown
                          size={14}
                          className={cn("text-pb-faint transition-transform", isOpen && "rotate-180")}
                        />
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-pb-hairline p-4 space-y-3 bg-pb-paper">
                      {event.pools.map((pool) => {
                        const poolTotal     = pool.rounds.reduce((s, r) => s + r.matches.length, 0);
                        const poolCompleted = pool.rounds.reduce((s, r) => s + r.matches.filter((m) => m.status === "completed").length, 0);
                        const isPoolOpen    = openPools.has(pool.poolId);

                        return (
                          <Collapsible
                            key={pool.poolId}
                            open={isPoolOpen}
                            onOpenChange={() => togglePool(pool.poolId)}
                          >
                            <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
                              <CollapsibleTrigger asChild>
                                <button className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-pb-surface2 transition-colors">
                                  <Users size={12} className="text-pb-faint shrink-0" />
                                  <span className="font-mono text-[13px] font-medium text-pb-ink flex-1">
                                    {pool.poolName}
                                  </span>
                                  <span className="text-[11px] font-mono text-pb-muted tabular-nums shrink-0">
                                    {poolCompleted}/{poolTotal}
                                  </span>
                                  <CaretDown
                                    size={12}
                                    className={cn("text-pb-faint shrink-0 transition-transform", isPoolOpen && "rotate-180")}
                                  />
                                </button>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <div className="border-t border-pb-hairline p-3 space-y-4 bg-pb-paper">
                                  {pool.rounds.map(({ round, matches }) => (
                                    <div key={round ?? "other"}>
                                      {/* Round header */}
                                      <div className="flex items-center gap-2 mb-2.5">
                                        <Eyebrow>
                                          {round != null ? `Round ${round}` : "Matches"}
                                        </Eyebrow>
                                        <span className="text-[11px] font-mono text-pb-faint">
                                          {matches.length} match{matches.length !== 1 ? "es" : ""}
                                        </span>
                                        <div className="flex-1 h-px bg-pb-hairline" />
                                      </div>
                                      <div className="space-y-2">
                                        {matches.map((m) => renderMatchCard(m))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* ── Resolve Dispute Dialog ── */}
      <AlertDialog open={!!resolveMatch} onOpenChange={(open) => { if (!open) setResolveMatch(null); }}>
        <AlertDialogContent className="max-w-sm bg-pb-surface border border-pb-hairline rounded-[8px] p-0 shadow-none">
          <AlertDialogHeader className="px-5 pt-5 pb-4 border-b border-pb-hairline">
            <AlertDialogTitle className="flex items-center gap-2 font-display font-bold text-[17px] tracking-[-0.025em] text-pb-ink">
              <Warning size={16} className="text-pb-amber shrink-0" />
              Resolve Score Dispute
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12px] font-mono text-pb-muted mt-1">
              Enter the official score to override disputed submissions.
              {resolveMatch && (
                <span className="block mt-1 font-medium text-pb-ink">
                  {resolveMatch.team1?.name || "Team 1"} vs {resolveMatch.team2?.name || "Team 2"}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="px-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-muted block mb-1.5">
                  {resolveMatch?.team1?.name || "Team 1"}
                </label>
                <DisputeInput
                  value={resolveScores.team1Score}
                  onChange={(v) => setResolveScores((s) => ({ ...s, team1Score: v }))}
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-muted block mb-1.5">
                  {resolveMatch?.team2?.name || "Team 2"}
                </label>
                <DisputeInput
                  value={resolveScores.team2Score}
                  onChange={(v) => setResolveScores((s) => ({ ...s, team2Score: v }))}
                />
              </div>
            </div>
          </div>

          <AlertDialogFooter className="px-5 pb-5 flex gap-2">
            <AlertDialogCancel
              disabled={resolveDisputeMutation.isPending}
              className="flex-1 h-9 rounded-[6px] border border-pb-hairline text-[13px] font-mono text-pb-muted hover:text-pb-ink hover:border-pb-rule bg-transparent"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                resolveDisputeMutation.mutate({ matchId: resolveMatch!._id, scores: resolveScores });
              }}
              disabled={resolveDisputeMutation.isPending}
              className="flex-1 h-9 rounded-[6px] bg-pb-court text-white text-[13px] font-mono font-medium hover:opacity-90 flex items-center justify-center gap-1.5"
            >
              {resolveDisputeMutation.isPending
                ? <CircleNotch size={13} className="animate-spin" />
                : <><Check size={13} /> Save Official Score</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ScoresPanel;

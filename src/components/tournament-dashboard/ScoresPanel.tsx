import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ClipboardList, Calendar, Check, X, Edit2, Loader2, ChevronDown, ChevronRight, Trophy, Users, Layers, Activity } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { poolAPI, matchAPI } from "@/services/api";

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
type PoolGroup = { poolId: string; poolName: string; rounds: RoundGroup[] };
type EventGroup = { eventId: string; eventName: string; pools: PoolGroup[] };

const ScoresPanel = ({ tournamentId, events }: ScoresPanelProps) => {
  const queryClient = useQueryClient();
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editScores, setEditScores] = useState({ team1Score: 0, team2Score: 0 });
  const [openEvents, setOpenEvents] = useState<Set<string>>(new Set());
  const [openPools, setOpenPools] = useState<Set<string>>(new Set());

  const { data: allMatches = [], isLoading } = useQuery({
    queryKey: ["scores", tournamentId],
    queryFn: async (): Promise<MatchWithMeta[]> => {
      const eventsList = events || [];
      const result: MatchWithMeta[] = [];
      for (const event of eventsList) {
        const poolsRes = await poolAPI.getByEvent(event._id);
        const pools = poolsRes?.data || [];
        for (const pool of pools) {
          const matchesRes = await matchAPI.getByPool(pool._id);
          const matches = matchesRes?.data || [];
          for (const m of matches) {
            result.push({
              ...m,
              eventId: event._id,
              eventName: event.name,
              poolId: pool._id,
              poolName: pool.name || "Pool",
            });
          }
        }
      }
      return result;
    },
    enabled: !!tournamentId && !!events?.length,
  });

  const updateScoreMutation = useMutation({
    mutationFn: ({
      matchId,
      scores,
    }: {
      matchId: string;
      scores: { team1Score: number; team2Score: number; status?: string };
    }) => matchAPI.updateScore(matchId, { ...scores, status: "completed" }),
    onSuccess: (_, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: ["scores", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setEditingMatchId(null);
      toast.success("Score updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update score");
    },
  });

  // Hierarchy: Event → Pool → Round → matches (matches without round go under "Other")
  const hierarchy = useMemo((): EventGroup[] => {
    const result: EventGroup[] = [];
    for (const event of events) {
      const eventMatches = allMatches.filter((m) => m.eventId === event._id);
      if (eventMatches.length === 0) continue;
      const poolMap = new Map<string, { poolName: string; matches: MatchWithMeta[] }>();
      for (const m of eventMatches) {
        const existing = poolMap.get(m.poolId);
        if (!existing) poolMap.set(m.poolId, { poolName: m.poolName, matches: [m] });
        else existing.matches.push(m);
      }
      const pools: PoolGroup[] = Array.from(poolMap.entries())
        .map(([poolId, { poolName, matches }]) => {
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
        })
        .sort((a, b) => a.poolName.localeCompare(b.poolName));
      result.push({ eventId: event._id, eventName: event.name, pools });
    }
    return result;
  }, [events, allMatches]);

  const totalCompleted = allMatches.filter((m) => m.status === "completed").length;
  const totalMatches = allMatches.length;

  const toggleEvent = (eventId: string) => {
    setOpenEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };
  const togglePool = (poolId: string) => {
    setOpenPools((prev) => {
      const next = new Set(prev);
      if (next.has(poolId)) next.delete(poolId);
      else next.add(poolId);
      return next;
    });
  };
  const isEventOpen = (eventId: string) => openEvents.has(eventId);
  const isPoolOpen = (poolId: string) => openPools.has(poolId);

  // Default: expand first event and first pool of each event when hierarchy loads
  useEffect(() => {
    if (hierarchy.length === 0) return;
    setOpenEvents((prev) => {
      if (prev.size > 0) return prev;
      return new Set(hierarchy.map((e) => e.eventId));
    });
    setOpenPools((prev) => {
      if (prev.size > 0) return prev;
      const poolIds = hierarchy.flatMap((e) => e.pools.map((p) => p.poolId));
      return new Set(poolIds);
    });
  }, [hierarchy.length]);

  const handleSaveScore = (matchId: string) => {
    updateScoreMutation.mutate({
      matchId,
      scores: {
        team1Score: editScores.team1Score,
        team2Score: editScores.team2Score,
      },
    });
  };

  const renderMatchCard = (match: MatchWithMeta) => {
    const isCompleted = match.status === "completed";
    const isEditing = editingMatchId === match._id;
    return (
      <Card
        key={match._id}
        className={`glass-card-hover rounded-2xl border-2 transition-all relative overflow-hidden group ${isCompleted
          ? "bg-muted/30 border-primary/20"
          : "border-border/60 hover:border-primary/50 hover:shadow-glow"
          }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 relative z-10">
            <div className="flex items-center gap-2">
              {match.scheduledTime && (
                <Badge variant="outline" className="gap-1.5 rounded-lg text-xs bg-background/50 backdrop-blur-sm">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {format(new Date(match.scheduledTime), "MMM d, h:mm a")}
                </Badge>
              )}
              {match.courtNumber != null && (
                <Badge variant="outline" className="rounded-lg text-xs bg-background/50 backdrop-blur-sm">
                  Court {match.courtNumber}
                </Badge>
              )}
            </div>
            {isCompleted && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 rounded-lg text-xs font-semibold backdrop-blur-sm">
                Completed
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-center relative z-10">
            {/* Team 1 (Left) */}
            <div className="text-right flex flex-col justify-center">
              <div className="font-display font-bold text-lg sm:text-xl truncate">
                {match.team1?.name || "Team 1"}
              </div>
              {match.team1?.players?.length ? (
                <div className="text-sm text-muted-foreground truncate mt-0.5">
                  {match.team1.players
                    .map((p: any) => p.name)
                    .filter(Boolean)
                    .join(" / ") || "—"}
                </div>
              ) : null}
            </div>

            {/* Score / Center */}
            <div className="flex flex-col items-center justify-center px-1 sm:px-4 min-w-[120px]">
              {isEditing ? (
                <div className="glass-dark p-3 rounded-xl border border-border/50 animate-fade-in shadow-lg">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <Input
                      type="number"
                      className="input-no-spinner w-14 sm:w-16 h-12 sm:h-14 text-center text-xl sm:text-2xl font-display font-bold rounded-lg bg-background/50 border-primary/30 focus-visible:ring-primary focus-visible:border-primary shadow-inner"
                      value={editScores.team1Score}
                      onChange={(e) =>
                        setEditScores((s) => ({
                          ...s,
                          team1Score: parseInt(e.target.value) || 0,
                        }))
                      }
                      min={0}
                    />
                    <span className="text-xl font-bold text-muted-foreground">:</span>
                    <Input
                      type="number"
                      className="input-no-spinner w-14 sm:w-16 h-12 sm:h-14 text-center text-xl sm:text-2xl font-display font-bold rounded-lg bg-background/50 border-primary/30 focus-visible:ring-primary focus-visible:border-primary shadow-inner"
                      value={editScores.team2Score}
                      onChange={(e) =>
                        setEditScores((s) => ({
                          ...s,
                          team2Score: parseInt(e.target.value) || 0,
                        }))
                      }
                      min={0}
                    />
                  </div>
                  <div className="flex gap-2 mt-3 w-full">
                    <Button
                      size="sm"
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm h-8"
                      onClick={() => handleSaveScore(match._id)}
                      disabled={updateScoreMutation.isPending}
                    >
                      {updateScoreMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><Check className="w-4 h-4 mr-1" /> Save</>}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setEditingMatchId(null)}
                      className="w-8 h-8 shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center group/score">
                  <div className="flex items-center gap-2 sm:gap-3 bg-background/60 backdrop-blur-md px-3 sm:px-4 py-2 rounded-xl border border-border/50 shadow-sm transition-transform group-hover/score:scale-105 group-hover/score:shadow-glow-sm">
                    <span
                      className={`text-2xl sm:text-4xl font-bold font-display tracking-tighter ${isCompleted && (match.score?.team1Score ?? 0) > (match.score?.team2Score ?? 0)
                        ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                        : isCompleted && (match.score?.team1Score ?? 0) < (match.score?.team2Score ?? 0)
                          ? "text-muted-foreground"
                          : "text-foreground"
                        }`}
                    >
                      {match.score?.team1Score ?? "–"}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-muted-foreground/40 mx-0.5 sm:mx-1">:</span>
                    <span
                      className={`text-2xl sm:text-4xl font-bold font-display tracking-tighter ${isCompleted && (match.score?.team2Score ?? 0) > (match.score?.team1Score ?? 0)
                        ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                        : isCompleted && (match.score?.team2Score ?? 0) < (match.score?.team1Score ?? 0)
                          ? "text-muted-foreground"
                          : "text-foreground"
                        }`}
                    >
                      {match.score?.team2Score ?? "–"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2 text-xs h-7 px-3 text-foreground hover:text-primary hover:bg-primary/10 transition-colors rounded-full opacity-0 group-hover:opacity-100 absolute -bottom-3 glass shadow-md z-20"
                    onClick={() => {
                      setEditingMatchId(match._id);
                      setEditScores({
                        team1Score: match.score?.team1Score ?? 0,
                        team2Score: match.score?.team2Score ?? 0,
                      });
                    }}
                  >
                    <Edit2 className="w-3 h-3 mr-1.5" />
                    {isCompleted ? "Edit" : "Score"}
                  </Button>
                </div>
              )}
            </div>

            {/* Team 2 (Right) */}
            <div className="text-left flex flex-col justify-center">
              <div className="font-display font-bold text-lg sm:text-xl truncate">
                {match.team2?.name || "Team 2"}
              </div>
              {match.team2?.players?.length ? (
                <div className="text-sm text-muted-foreground truncate mt-0.5">
                  {match.team2.players
                    .map((p: any) => p.name)
                    .filter(Boolean)
                    .join(" / ") || "—"}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (events.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <Card className="glass-card-hover rounded-3xl border border-border/50 bg-gradient-to-br from-background to-muted/30 relative z-10 shadow-xl overflow-hidden">
          <CardContent className="py-20 text-center relative">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-inner ring-1 ring-primary/20">
              <ClipboardList className="w-10 h-10 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">No Events Yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto text-lg">
              Create events and pools first. Matches will appear here for score
              entry.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col min-h-[50vh] animate-fade-in">
      {/* Top Stylish Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 sm:px-8 sm:py-6 rounded-3xl border-border/50 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none z-0" />

        <div className="relative z-10 flex-col">
          <h2 className="font-display font-bold text-3xl tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-primary via-primary/80 to-primary/40 leading-tight">
            Tournament Scores
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 font-medium max-w-lg">
            Browse by event and pool to update match results lively.
          </p>
        </div>
        <Badge variant="secondary" className="rounded-2xl px-5 py-2 font-bold text-sm shadow-inner backdrop-blur-md bg-background/80 border border-primary/20 relative z-10 flex items-center gap-2 mt-2 sm:mt-0">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <span><span className="text-primary">{totalCompleted}</span> / {totalMatches} completed</span>
        </Badge>
      </div>

      {isLoading ? (
        <Card className="glass-card rounded-3xl border border-border/50 min-h-[300px] flex items-center justify-center relative overflow-hidden">
          <CardContent className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
              <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10 drop-shadow-sm" />
            </div>
            <span className="text-muted-foreground font-medium text-lg mt-2 tracking-wide">Gathering matches…</span>
          </CardContent>
        </Card>
      ) : hierarchy.length === 0 ? (
        <Card className="glass-card-hover rounded-3xl border border-border/50 min-h-[300px] flex items-center justify-center bg-gradient-to-br from-background to-muted/20 shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
          <CardContent className="py-20 text-center relative z-10">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-inner ring-1 ring-primary/20">
              <ClipboardList className="w-10 h-10 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">No Matches Generated</h3>
            <p className="text-muted-foreground max-w-md mx-auto text-lg leading-relaxed">
              Generate matches from the <span className="text-foreground font-semibold">Pools page</span> for each
              event to start entering scores.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5 relative z-10">
          {hierarchy.map((event) => {
            const eventMatchCount = event.pools.reduce(
              (sum, p) => sum + p.rounds.reduce((s, r) => s + r.matches.length, 0),
              0
            );
            const eventCompleted = event.pools.reduce(
              (sum, p) =>
                sum +
                p.rounds.reduce(
                  (s, r) => s + r.matches.filter((m) => m.status === "completed").length,
                  0
                ),
              0
            );
            return (
              <Collapsible
                key={event.eventId}
                open={isEventOpen(event.eventId)}
                onOpenChange={() => toggleEvent(event.eventId)}
                className="group/event"
              >
                <Card className="rounded-3xl border border-border/50 overflow-hidden glass-card transition-all duration-300 hover:border-primary/40 focus-within:border-primary/40 focus-within:shadow-glow-sm shadow-sm relative">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 text-left transition-colors relative overflow-hidden group-data-[state=open]/event:bg-muted/10 hover:bg-muted/30">
                      <div className="absolute inset-y-0 left-0 w-1.5 bg-primary group-data-[state=open]/event:opacity-100 opacity-0 transition-opacity" />
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-data-[state=open]/event:bg-primary group-data-[state=open]/event:text-primary-foreground group-hover/event:scale-105 group-hover/event:shadow-glow-sm transition-all duration-300 hidden sm:flex">
                        <Trophy className="w-6 h-6 text-primary group-data-[state=open]/event:text-primary-foreground transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-display font-bold text-xl sm:text-2xl tracking-tight truncate block">
                          {event.eventName}
                        </span>
                      </div>
                      <Badge variant="outline" className="rounded-xl ml-auto bg-background/50 backdrop-blur-sm hidden sm:inline-flex border-primary/20 shadow-sm py-1 px-3">
                        <span className="text-primary font-bold mr-1.5 text-sm">{eventCompleted}</span> / {eventMatchCount} done
                      </Badge>
                      <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center border border-border/50 shrink-0 group-data-[state=open]/event:bg-primary group-data-[state=open]/event:border-primary transition-all duration-300 shadow-sm">
                        <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]/event:text-primary-foreground group-data-[state=open]/event:rotate-180 transition-transform duration-500" />
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-4 data-[state=open]:slide-in-from-top-4 origin-top transition-all duration-300">
                    <div className="border-t border-border/30 p-4 sm:p-6 space-y-4 bg-background/30 backdrop-blur-md relative">
                      {event.pools.map((pool) => {
                        const poolMatchCount = pool.rounds.reduce(
                          (s, r) => s + r.matches.length,
                          0
                        );
                        const poolCompleted = pool.rounds.reduce(
                          (s, r) =>
                            s + r.matches.filter((m) => m.status === "completed").length,
                          0
                        );
                        return (
                          <Collapsible
                            key={pool.poolId}
                            open={isPoolOpen(pool.poolId)}
                            onOpenChange={() => togglePool(pool.poolId)}
                            className="group/pool"
                          >
                            <div className="rounded-2xl border border-border/60 overflow-hidden bg-card/60 shadow-sm transition-colors duration-300 hover:border-primary/30 relative">
                              <CollapsibleTrigger asChild>
                                <button className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left hover:bg-muted/40 transition-colors group-data-[state=open]/pool:bg-muted/20 relative">
                                  <div className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center shrink-0 border border-border/50 shadow-inner group-data-[state=open]/pool:border-primary/20 transition-colors">
                                    <Users className="w-5 h-5 text-muted-foreground group-data-[state=open]/pool:text-primary transition-colors" />
                                  </div>
                                  <span className="font-display font-semibold text-lg text-foreground/90 group-data-[state=open]/pool:text-foreground tracking-tight">{pool.poolName}</span>
                                  <Badge variant="secondary" className="rounded-xl text-xs sm:text-sm ml-auto shadow-inner bg-background font-semibold px-2 sm:px-3">
                                    <span className={poolCompleted === poolMatchCount && poolMatchCount > 0 ? "text-primary" : ""}>{poolCompleted}</span> / {poolMatchCount}
                                  </Badge>
                                  <ChevronDown className="w-4 h-4 text-muted-foreground ml-1 sm:ml-2 group-data-[state=open]/pool:rotate-180 group-data-[state=open]/pool:text-primary transition-all duration-300 shrink-0" />
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 origin-top transition-all duration-300">
                                <div className="p-3 sm:p-5 pt-1 space-y-6 sm:space-y-8 bg-background/50 relative">
                                  <div className="absolute left-6 top-1 bottom-6 w-px bg-gradient-to-b from-border/80 via-border/40 to-transparent pointer-events-none hidden sm:block" />
                                  {pool.rounds.map(({ round, matches }, rIdx) => (
                                    <div key={round ?? "other"} className="space-y-4 relative sm:pl-7">
                                      <div className="hidden sm:block absolute left-[-11px] top-1.5 w-6 h-6 rounded-full bg-background border-2 border-border/80 flex items-center justify-center shadow-sm z-10 transition-colors marker">
                                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground marker-inner" />
                                      </div>
                                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sticky top-0 bg-background/90 backdrop-blur-sm pb-2 z-10 -mx-2 px-2 sm:mx-0 sm:px-0">
                                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 shadow-inner sm:hidden">
                                          <Layers className="w-4 h-4 text-primary" />
                                        </div>
                                        <h4 className="text-sm font-bold tracking-wider uppercase text-muted-foreground drop-shadow-sm">
                                          {round != null ? `Round ${round}` : "Other matches"}
                                        </h4>
                                        <Badge variant="outline" className="rounded-lg text-[10px] px-2 py-0.5 h-5 ml-1 sm:ml-2 border-border/50 text-muted-foreground uppercase font-bold bg-background/50">
                                          {matches.length} match{matches.length !== 1 ? "es" : ""}
                                        </Badge>
                                        <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent ml-2" />
                                      </div>
                                      <div className="space-y-3 sm:space-y-4">
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
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScoresPanel;

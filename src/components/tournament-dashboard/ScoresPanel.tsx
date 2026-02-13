import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Calendar, Check, X, Edit2, Loader2 } from "lucide-react";
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

const ScoresPanel = ({ tournamentId, events }: ScoresPanelProps) => {
  const queryClient = useQueryClient();
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [poolFilter, setPoolFilter] = useState<string>("all");
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editScores, setEditScores] = useState({ team1Score: 0, team2Score: 0 });

  // Reset pool filter when event filter changes (pool list is event-specific)
  useEffect(() => {
    setPoolFilter("all");
  }, [eventFilter]);

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

  const poolOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { poolId: string; poolName: string }[] = [];
    for (const m of allMatches) {
      if (eventFilter !== "all" && m.eventId !== eventFilter) continue;
      if (seen.has(m.poolId)) continue;
      seen.add(m.poolId);
      list.push({ poolId: m.poolId, poolName: m.poolName });
    }
    return list.sort((a, b) => a.poolName.localeCompare(b.poolName));
  }, [allMatches, eventFilter]);

  const filteredMatches = useMemo(() => {
    let list = eventFilter === "all"
      ? allMatches
      : allMatches.filter((m) => m.eventId === eventFilter);
    if (poolFilter !== "all") {
      list = list.filter((m) => m.poolId === poolFilter);
    }
    return list;
  }, [allMatches, eventFilter, poolFilter]);

  const completedCount = filteredMatches.filter(
    (m) => m.status === "completed"
  ).length;
  const totalCount = filteredMatches.length;

  const handleSaveScore = (matchId: string) => {
    updateScoreMutation.mutate({
      matchId,
      scores: {
        team1Score: editScores.team1Score,
        team2Score: editScores.team2Score,
      },
    });
  };

  if (events.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="glass-card rounded-2xl border border-border/50">
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              Create events and pools first. Matches will appear here for score
              entry.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-lg">Enter match scores</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Update scores for pool play and round-robin matches in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {events.map((e) => (
                <SelectItem key={e._id} value={e._id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={poolFilter}
            onValueChange={setPoolFilter}
            disabled={poolOptions.length === 0}
          >
            <SelectTrigger className="w-[160px] rounded-xl">
              <SelectValue placeholder="All pools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All pools</SelectItem>
              {poolOptions.map((p) => (
                <SelectItem key={p.poolId} value={p.poolId}>
                  {p.poolName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="rounded-lg">
            {completedCount} / {totalCount} completed
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <Card className="glass-card rounded-2xl border border-border/50">
          <CardContent className="py-12 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading matches…</span>
          </CardContent>
        </Card>
      ) : filteredMatches.length === 0 ? (
        <Card className="glass-card rounded-2xl border border-border/50">
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              No matches found. Generate matches from the Pools page for each
              event.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const isCompleted = match.status === "completed";
            const isEditing = editingMatchId === match._id;
            return (
              <Card
                key={match._id}
                className={`rounded-2xl border-2 transition-all ${
                  isCompleted
                    ? "bg-muted/40 border-primary/20"
                    : "border-border/60 hover:border-primary/40"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="secondary" className="rounded-lg text-xs">
                      {match.eventName} · {match.poolName}
                    </Badge>
                    {match.round != null && (
                      <Badge variant="outline" className="rounded-lg text-xs">
                        Round {match.round}
                      </Badge>
                    )}
                    {match.scheduledTime && (
                      <Badge variant="outline" className="gap-1 rounded-lg text-xs">
                        <Calendar className="w-3 h-3" />
                        {format(
                          new Date(match.scheduledTime),
                          "MMM d, h:mm a"
                        )}
                      </Badge>
                    )}
                    {match.courtNumber != null && (
                      <Badge variant="outline" className="rounded-lg text-xs">
                        Court {match.courtNumber}
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge className="bg-primary text-primary-foreground border-0 rounded-lg text-xs">
                        Completed
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-[2fr_1fr_2fr] gap-4 items-center">
                    <div className="text-right">
                      <div className="font-display font-bold text-lg">
                        {match.team1?.name || "Team 1"}
                      </div>
                      {match.team1?.players?.length ? (
                        <div className="text-sm text-muted-foreground">
                          {match.team1.players
                            .map((p: any) => p.name)
                            .filter(Boolean)
                            .join(" / ") || "—"}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      {isEditing ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-16 text-center text-xl font-bold rounded-lg"
                              value={editScores.team1Score}
                              onChange={(e) =>
                                setEditScores((s) => ({
                                  ...s,
                                  team1Score: parseInt(e.target.value) || 0,
                                }))
                              }
                              min={0}
                            />
                            <span className="text-lg font-bold">–</span>
                            <Input
                              type="number"
                              className="w-16 text-center text-xl font-bold rounded-lg"
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
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-court-green text-white hover:bg-court-green-dark rounded-lg"
                              onClick={() => handleSaveScore(match._id)}
                              disabled={updateScoreMutation.isPending}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingMatchId(null)}
                              className="rounded-lg"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-2xl sm:text-3xl font-bold font-display ${
                                isCompleted &&
                                (match.score?.team1Score ?? 0) >
                                  (match.score?.team2Score ?? 0)
                                  ? "text-primary"
                                  : ""
                              }`}
                            >
                              {match.score?.team1Score ?? "–"}
                            </span>
                            <span className="text-xl text-muted-foreground">
                              –
                            </span>
                            <span
                              className={`text-2xl sm:text-3xl font-bold font-display ${
                                isCompleted &&
                                (match.score?.team2Score ?? 0) >
                                  (match.score?.team1Score ?? 0)
                                  ? "text-primary"
                                  : ""
                              }`}
                            >
                              {match.score?.team2Score ?? "–"}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={() => {
                              setEditingMatchId(match._id);
                              setEditScores({
                                team1Score: match.score?.team1Score ?? 0,
                                team2Score: match.score?.team2Score ?? 0,
                              });
                            }}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            {isCompleted ? "Edit score" : "Enter score"}
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="text-left">
                      <div className="font-display font-bold text-lg">
                        {match.team2?.name || "Team 2"}
                      </div>
                      {match.team2?.players?.length ? (
                        <div className="text-sm text-muted-foreground">
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
          })}
        </div>
      )}
    </div>
  );
};

export default ScoresPanel;

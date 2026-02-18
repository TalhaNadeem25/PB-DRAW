import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Users, Trophy, Shuffle, Loader2, AlertCircle, Edit2, Check, X, Trash2, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { eventAPI, poolAPI, teamAPI, matchAPI, playoffAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import PlayoffBracket from "@/components/tournament/PlayoffBracket";
import PoolStandings from "@/components/tournament/PoolStandings";
import PlayoffResults from "@/components/tournament/PlayoffResults";
import { MATCH_FORMAT_LABELS, formatMatchFormatShort } from "@/constants/matchFormat";

const PoolManagement = () => {
  const { id, eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolMatchFormat, setNewPoolMatchFormat] = useState<string>(MATCH_FORMAT_LABELS[0]);
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editScores, setEditScores] = useState({ team1Score: 0, team2Score: 0 });
  const [schedulingMatch, setSchedulingMatch] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState({ scheduledTime: "", courtNumber: 1 });
  const [activeTab, setActiveTab] = useState<string>("standings");
  const [poolToRemove, setPoolToRemove] = useState<string | null>(null);

  // Fetch event data with teams and pools
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventAPI.getById(eventId!),
    enabled: !!eventId,
  });

  const { data: teamsData } = useQuery({
    queryKey: ['teams', eventId],
    queryFn: () => teamAPI.getByEvent(eventId!),
    enabled: !!eventId,
  });

  const { data: poolsData } = useQuery({
    queryKey: ['pools', eventId],
    queryFn: () => poolAPI.getByEvent(eventId!),
    enabled: !!eventId,
  });

  // Fetch playoffs for selected pool
  const { data: playoffsData } = useQuery({
    queryKey: ['playoffs', eventId, selectedPoolId],
    queryFn: () => playoffAPI.get(eventId!, selectedPoolId!),
    enabled: !!eventId && !!selectedPoolId,
  });

  const event = eventData?.data;
  const teams = teamsData?.data || [];
  const pools = poolsData?.data || [];
  const playoffs = playoffsData?.data || [];

  // Check if this is a singles event
  const isSingles = event?.format === 'singles';

  // Get unassigned teams (teams without a pool) OR unassigned players for singles
  const unassignedTeams = isSingles
    ? [] // For singles, we'll handle players separately
    : teams.filter((team: any) => !team.pool);

  // Get unassigned players for singles events (players not in any pool)
  const unassignedPlayers = isSingles
    ? (event?.registeredPlayers || [])
        .filter((reg: any) => reg.paymentStatus === 'paid' && !reg.pool)
        .map((reg: any) => reg.player)
    : [];

  // Helper function to get pool member count (for singles, count from registeredPlayers)
  const getPoolMemberCount = (pool: any) => {
    if (isSingles) {
      return (event?.registeredPlayers || []).filter(
        (reg: any) => reg.paymentStatus === 'paid' && reg.pool?.toString() === pool._id?.toString()
      ).length;
    }
    return pool.teams?.length || 0;
  };

  // Helper function to get pool members (for singles, get players from registeredPlayers)
  const getPoolMembers = (pool: any) => {
    if (isSingles) {
      // For singles, transform players into team-like objects with stats
      return (event?.registeredPlayers || [])
        .filter((reg: any) => reg.paymentStatus === 'paid' && reg.pool?.toString() === pool._id?.toString())
        .map((reg: any) => ({
          _id: reg.player._id,
          name: reg.player.name,
          players: [{ _id: reg.player._id, name: reg.player.name }],
          stats: {
            wins: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            pointDifferential: 0
          }
        }));
    }
    return pool.teams || [];
  };

  // Create pool mutation
  const createPoolMutation = useMutation({
    mutationFn: (data: any) => poolAPI.create(eventId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools', eventId] });
      setNewPoolName("");
      setNewPoolMatchFormat(MATCH_FORMAT_LABELS[0]);
      setIsCreatePoolOpen(false);
      toast.success("Pool created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create pool");
    },
  });

  // Delete pool mutation
  const deletePoolMutation = useMutation({
    mutationFn: (poolId: string) => poolAPI.delete(poolId),
    onSuccess: (_, poolId) => {
      queryClient.invalidateQueries({ queryKey: ['pools', eventId] });
      queryClient.invalidateQueries({ queryKey: ['teams', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      if (selectedPoolId === poolId) setSelectedPoolId(null);
      setPoolToRemove(null);
      toast.success("Pool removed successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to remove pool");
      setPoolToRemove(null);
    },
  });

  // Add team to pool mutation
  const addTeamToPoolMutation = useMutation({
    mutationFn: ({ poolId, teamId }: { poolId: string; teamId: string }) =>
      poolAPI.addTeams(poolId, [teamId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools', eventId] });
      queryClient.invalidateQueries({ queryKey: ['teams', eventId] });
      toast.success("Team added to pool successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add team to pool");
    },
  });

  const handleAssignTeamToPool = (teamId: string, poolId: string) => {
    if (!poolId) return;
    addTeamToPoolMutation.mutate({ poolId, teamId });
  };

  // Assign player to pool for singles events
  const handleAssignPlayerToPool = async (playerId: string, poolId: string) => {
    if (!poolId) return;

    try {
      // For singles, we need to update the player's registration to include pool
      await eventAPI.assignPlayerToPool(eventId!, playerId, poolId);
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['pools', eventId] });
      toast.success("Player assigned to pool successfully");

      // Auto-generate matches if pool has 2+ players
      const poolPlayerCount = (event?.registeredPlayers || []).filter(
        (reg: any) => reg.paymentStatus === 'paid' && reg.pool?.toString() === poolId
      ).length + 1; // +1 for the player we just assigned

      if (poolPlayerCount >= 2) {
        try {
          await poolAPI.generateSinglesMatches(poolId);
          queryClient.invalidateQueries({ queryKey: ['pools', eventId] });
          toast.success("Matches generated successfully");
        } catch (error: any) {
          console.error("Failed to generate matches:", error);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign player to pool");
    }
  };

  // Remove team from pool mutation
  const removeTeamFromPoolMutation = useMutation({
    mutationFn: async ({ teamId, poolId }: { teamId: string; poolId: string }) => {
      // Remove team from pool by setting pool to null
      await teamAPI.removeFromPool(teamId);
      // Update pool to remove team from teams array and regenerate matches
      const pool = pools.find((p: any) => p._id === poolId);
      if (pool) {
        const updatedTeams = pool.teams
          .map((t: any) => t._id || t)
          .filter((tid: string) => tid !== teamId);
        return poolAPI.update(poolId, { teams: updatedTeams });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools', eventId] });
      queryClient.invalidateQueries({ queryKey: ['teams', eventId] });
      toast.success("Team removed from pool successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to remove team from pool");
    },
  });

  const handleRemoveTeamFromPool = async (teamId: string, poolId: string) => {
    // For singles events, handle player removal differently
    if (isSingles) {
      try {
        await eventAPI.removePlayerFromPool(eventId!, teamId);
        queryClient.invalidateQueries({ queryKey: ['event', eventId] });
        queryClient.invalidateQueries({ queryKey: ['pools', eventId] });
        toast.success("Player removed from pool successfully");

        // Regenerate matches with remaining players
        const poolPlayerCount = (event?.registeredPlayers || []).filter(
          (reg: any) => reg.paymentStatus === 'paid' && reg.pool?.toString() === poolId && reg.player?.toString() !== teamId
        ).length;

        if (poolPlayerCount >= 2) {
          try {
            await poolAPI.generateSinglesMatches(poolId);
            queryClient.invalidateQueries({ queryKey: ['pools', eventId] });
          } catch (error: any) {
            console.error("Failed to regenerate matches:", error);
          }
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to remove player from pool");
      }
    } else {
      removeTeamFromPoolMutation.mutate({ teamId, poolId });
    }
  };

  // Update match score mutation
  const updateMatchScoreMutation = useMutation({
    mutationFn: ({ matchId, scores }: any) => matchAPI.updateScore(matchId, scores),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools', eventId] });
      queryClient.invalidateQueries({ queryKey: ['teams', eventId] });
      queryClient.invalidateQueries({ queryKey: ['playoffs', eventId, selectedPoolId] });
      setEditingMatch(null);
      toast.success("Score updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update score");
    },
  });

  // Update match schedule mutation
  const updateMatchScheduleMutation = useMutation({
    mutationFn: ({ matchId, data }: any) => matchAPI.update(matchId, data),
    onSuccess: () => {
      // Invalidate all related queries so schedule shows up everywhere
      queryClient.invalidateQueries({ queryKey: ['pools', eventId] });
      queryClient.invalidateQueries({ queryKey: ['playoffs', eventId, selectedPoolId] });
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', id] });
      queryClient.invalidateQueries({ queryKey: ['schedule-grid', id] });
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      setSchedulingMatch(null);
      toast.success("Match scheduled successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to schedule match");
    },
  });

  // Generate playoffs mutation (per pool)
  const generatePlayoffsMutation = useMutation({
    mutationFn: (poolId: string) => playoffAPI.generate(eventId!, poolId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pools', eventId] });
      toast.success(data.message || "Playoff bracket generated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to generate playoffs");
    },
  });

  const createPool = () => {
    if (!newPoolName) {
      toast.error("Please enter a pool name");
      return;
    }

    createPoolMutation.mutate({
      name: newPoolName,
      matchFormat: newPoolMatchFormat || undefined,
      teamIds: [],
    });
  };

  const saveScore = (matchId: string) => {
    if (editScores.team1Score === 0 && editScores.team2Score === 0) {
      toast.error("Please enter valid scores");
      return;
    }

    updateMatchScoreMutation.mutate({
      matchId,
      scores: {
        team1Score: editScores.team1Score,
        team2Score: editScores.team2Score,
        status: 'completed',
      },
    });
  };

  const saveSchedule = (matchId: string) => {
    if (!scheduleData.scheduledTime) {
      toast.error("Please select a date and time");
      return;
    }

    updateMatchScheduleMutation.mutate({
      matchId,
      data: {
        scheduledTime: new Date(scheduleData.scheduledTime).toISOString(),
        courtNumber: scheduleData.courtNumber,
      },
    });
  };

  if (eventLoading) {
    return (
      <Layout variant="minimal">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading pool management...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout variant="minimal">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
            <Button onClick={() => navigate(`/tournaments/${id}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournament
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const selectedPool = pools.find((p: any) => p._id === selectedPoolId);

  return (
    <Layout variant="minimal">
      <div className="min-h-screen bg-background">
        {/* Top bar — same structure as TournamentDetail organizer (DashboardTopBar) */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 mb-6 animate-fade-in">
            <div className="flex items-start gap-3 min-w-0">
              <Link
                to={`/tournaments/${id}`}
                className="shrink-0 w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all mt-0.5"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display font-bold text-xl sm:text-2xl truncate max-w-[200px] sm:max-w-none">
                    {event.name}
                  </h1>
                  <Badge variant="outline" className="font-medium border shrink-0 text-xs bg-primary/10 text-primary border-primary/20">
                    <span className="w-2 h-2 rounded-full mr-1.5 bg-primary" />
                    Pool Play
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {event.startDate && event.endDate
                      ? `${format(new Date(event.startDate), "MMM dd, yyyy")} – ${format(new Date(event.endDate), "MMM dd, yyyy")}`
                      : "Manage pools, matches, and scores"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
              <Dialog open={isCreatePoolOpen} onOpenChange={setIsCreatePoolOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-court-green text-white hover:bg-court-green-dark shadow-lg shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="whitespace-nowrap">Create Pool</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card rounded-2xl border border-border/50">
                  <DialogHeader>
                    <DialogTitle className="font-display">Create New Pool</DialogTitle>
                    <DialogDescription>Enter a name and select the match format for this pool</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pool-name">Pool Name</Label>
                      <Input
                        id="pool-name"
                        placeholder="e.g., Pool A"
                        value={newPoolName}
                        onChange={(e) => setNewPoolName(e.target.value)}
                        className="focus:shadow-glow transition-shadow rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pool-match-format">Pool Match Format</Label>
                      <Select
                        value={newPoolMatchFormat}
                        onValueChange={setNewPoolMatchFormat}
                      >
                        <SelectTrigger id="pool-match-format" className="rounded-xl">
                          <SelectValue placeholder="Select match format" />
                        </SelectTrigger>
                        <SelectContent>
                          {MATCH_FORMAT_LABELS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Scoring format for matches in this pool
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreatePoolOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={createPool}
                      disabled={createPoolMutation.isPending}
                      className="bg-court-green text-white hover:bg-court-green-dark shadow-lg"
                    >
                      {createPoolMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Content — full width */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-0 sm:py-2">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Pools List */}
            <div className="space-y-4">
              <Card className="glass-card-hover rounded-2xl border border-border/50 shadow-float">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    Pools ({pools.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pools.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pools created yet</p>
                  ) : (
                    <div className="space-y-2">
                      {pools.map((pool: any) => (
                        <div
                          key={pool._id}
                          className="flex items-center gap-1 w-full group"
                        >
                          <Button
                            variant={selectedPoolId === pool._id ? "default" : "outline"}
                            className={`flex-1 justify-start transition-all min-w-0 rounded-xl ${selectedPoolId === pool._id ? 'bg-hero-gradient text-primary-foreground shadow-glow border-0' : 'hover:border-primary/50 hover:bg-primary/5'}`}
                            onClick={() => setSelectedPoolId(pool._id)}
                          >
                            <span className="flex flex-col items-start text-left min-w-0 flex-1">
                              <span className="font-semibold truncate w-full">{pool.name}</span>
                              {pool.matchFormat && (
                                <span className={`text-xs truncate w-full ${selectedPoolId === pool._id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                  {formatMatchFormatShort(pool.matchFormat)}
                                </span>
                              )}
                            </span>
                            <Badge variant="secondary" className="ml-auto shrink-0">
                              {getPoolMemberCount(pool)} {isSingles ? 'players' : 'teams'}
                            </Badge>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPoolToRemove(pool._id);
                            }}
                            title="Remove pool"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card-hover rounded-2xl border border-border/50 shadow-float">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    {isSingles
                      ? `Unassigned Players (${unassignedPlayers.length})`
                      : `Unassigned Teams (${unassignedTeams.length})`
                    }
                  </CardTitle>
                  <CardDescription>
                    {isSingles ? 'Players not in any pool' : 'Teams not in any pool'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(isSingles ? unassignedPlayers.length === 0 : unassignedTeams.length === 0) ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {isSingles ? 'All players assigned' : 'All teams assigned'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {isSingles ? (
                        // Display players for singles events
                        unassignedPlayers.map((player: any) => (
                          <div
                            key={player._id}
                            className="flex items-center justify-between gap-2 p-3 bg-muted/40 rounded-xl border border-border/60 hover:border-primary/30 transition-colors"
                          >
                            <div className="flex-1">
                              <span className="font-medium text-sm">{player.name}</span>
                              <p className="text-xs text-muted-foreground">{player.email}</p>
                              {player.skillLevel && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  Skill: {player.skillLevel}
                                </Badge>
                              )}
                            </div>
                            {pools.length > 0 ? (
                              <Select
                                onValueChange={(poolId) => handleAssignPlayerToPool(player._id, poolId)}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue placeholder="Assign to" />
                                </SelectTrigger>
                                <SelectContent>
                                  {pools.map((pool: any) => (
                                    <SelectItem key={pool._id} value={pool._id}>
                                      {pool.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs text-muted-foreground">No pools</span>
                            )}
                          </div>
                        ))
                      ) : (
                        // Display teams for doubles/mixed events
                        unassignedTeams.map((team: any) => (
                          <div
                            key={team._id}
                            className="flex items-center justify-between gap-2 p-3 bg-muted/40 rounded-xl border border-border/60 hover:border-primary/30 transition-colors"
                          >
                            <span className="font-medium text-sm flex-1">{team.name}</span>
                            {pools.length > 0 ? (
                              <Select
                                onValueChange={(poolId) => handleAssignTeamToPool(team._id, poolId)}
                                disabled={addTeamToPoolMutation.isPending}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue placeholder="Assign to" />
                                </SelectTrigger>
                                <SelectContent>
                                  {pools.map((pool: any) => (
                                    <SelectItem key={pool._id} value={pool._id}>
                                      {pool.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs text-muted-foreground">No pools</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pool Details */}
            <div className="lg:col-span-3">
              {selectedPool ? (
                <div className="space-y-6">
                  {/* Tabbed Navigation */}
                  <Card className="glass-card rounded-2xl border border-border/50 shadow-float">
                    <CardContent className="p-0">
                      {(() => {
                        const matches = selectedPool.matches || [];
                        const rounds = [...new Set(matches.map((m: any) => m.round || 1))].sort((a: number, b: number) => a - b);

                        return (
                          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="border-b border-border/40 px-4 pt-4">
                              <TabsList className="w-full justify-start flex-wrap h-auto gap-1.5 glass border border-border/50 p-1.5 rounded-xl">
                                <TabsTrigger value="standings" className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
                                  Standings
                                </TabsTrigger>
                                {rounds.map((round: number) => {
                                  const roundMatches = matches.filter((m: any) => (m.round || 1) === round);
                                  const completedCount = roundMatches.filter((m: any) => m.status === 'completed').length;
                                  return (
                                    <TabsTrigger
                                      key={round}
                                      value={`round-${round}`}
                                      className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all"
                                    >
                                      Round {round}
                                      <Badge variant="secondary" className="ml-2 text-[10px]">
                                        {completedCount}/{roundMatches.length}
                                      </Badge>
                                    </TabsTrigger>
                                  );
                                })}
                                {event?.addPlayoffStage && (
                                  <TabsTrigger
                                    value="playoffs"
                                    className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all"
                                  >
                                    <Trophy className="w-4 h-4 mr-1" />
                                    Playoffs
                                  </TabsTrigger>
                                )}
                              </TabsList>
                            </div>

                            {/* Pool format description – visible for organizer on every tab (Standings, Rounds, Playoffs) */}
                            <div className="px-4 pt-2 pb-1">
                              <Card className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 shadow-float">
                                <CardContent className="pt-6">
                                  <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                                      <Trophy className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <h3 className="font-display font-bold text-lg">
                                          {event?.playFormat ? event.playFormat.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Round Robin'}
                                        </h3>
                                        <Badge variant="secondary" className="capitalize">
                                          {event?.format?.replace('-', ' ') ?? '—'} Game
                                        </Badge>
                                        {selectedPool?.matchFormat && (
                                          <Badge variant="outline" className="text-xs">
                                            {formatMatchFormatShort(selectedPool.matchFormat)}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {event?.playFormat === 'round-robin' && "Each team plays every other team in their pool once. Teams are ranked by wins, then point differential. Top teams can advance to playoffs."}
                                        {event?.playFormat === 'single-elimination' && "Single elimination bracket - lose once and you're out. Winner advances to the next round."}
                                        {event?.playFormat === 'double-elimination' && "Teams must lose twice to be eliminated. Includes a winners bracket and a losers bracket."}
                                        {event?.playFormat === 'pool-play' && "Pool play followed by playoffs. Top teams from each pool advance to elimination rounds."}
                                        {event?.playFormat === 'swiss' && "Swiss system - teams are paired based on their current record. No elimination until final rounds."}
                                        {!event?.playFormat && "Each team plays every other team in their pool once. Teams are ranked by wins, then point differential."}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Standings Tab */}
                            <TabsContent value="standings" className="p-6 space-y-6">
                              <PoolStandings
                                teams={getPoolMembers(selectedPool)}
                                poolName={selectedPool.name}
                                showPlayoffIndicators={!!event?.addPlayoffStage}
                                onRemoveTeam={(teamId) => handleRemoveTeamFromPool(teamId, selectedPool._id)}
                                isRemoving={removeTeamFromPoolMutation.isPending}
                              />
                            </TabsContent>

                            {/* Round Tabs */}
                            {rounds.map((round: number) => {
                              const roundMatches = matches.filter((m: any) => (m.round || 1) === round);
                              return (
                                <TabsContent key={round} value={`round-${round}`} className="p-6">
                                  <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-display font-bold text-lg">Round {round} Matches</h3>
                                    <Badge variant="outline" className="rounded-lg">
                                      {roundMatches.filter((m: any) => m.status === 'completed').length} of {roundMatches.length} completed
                                    </Badge>
                                  </div>
                                  {roundMatches.length > 0 ? (
                                    <div className="space-y-4">
                                      {roundMatches.map((match: any, index: number) => {
                                        const isSinglesMatch = event.format === 'singles';
                                        const isCompleted = match.status === 'completed';

                                        return (
                                          <div
                                            key={match._id}
                                            className={`p-4 rounded-2xl border-2 transition-all ${
                                              isCompleted
                                                ? 'bg-muted/40 border-primary/20'
                                                : 'bg-card border-border/60 hover:border-primary/40 hover:shadow-float'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="secondary" className="rounded-lg">Match {index + 1}</Badge>
                                                {isCompleted && (
                                                  <Badge className="bg-primary text-primary-foreground border-0 rounded-lg">Completed</Badge>
                                                )}
                                                {match.scheduledTime && (
                                                  <Badge variant="outline" className="gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(match.scheduledTime).toLocaleDateString()} {new Date(match.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                  </Badge>
                                                )}
                                                {match.courtNumber && (
                                                  <Badge variant="outline">Court {match.courtNumber}</Badge>
                                                )}
                                              </div>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  setSchedulingMatch(match._id);
                                                  setScheduleData({
                                                    scheduledTime: match.scheduledTime ? new Date(match.scheduledTime).toISOString().slice(0, 16) : "",
                                                    courtNumber: match.courtNumber || 1,
                                                  });
                                                }}
                                              >
                                                <Clock className="w-4 h-4 mr-1" />
                                                Schedule
                                              </Button>
                                            </div>

                                            <div className="grid grid-cols-[2fr_1fr_2fr] gap-4 items-center">
                                              <div className="text-right">
                                                <div className="font-bold text-lg mb-1">
                                                  {match.team1?.name || "Team 1"}
                                                </div>
                                                {!isSinglesMatch && match.team1?.players && (
                                                  <div className="text-sm text-muted-foreground">
                                                    {match.team1.players.map((p: any, i: number) => (
                                                      <div key={i}>{p.name || `Player ${i + 1}`}</div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>

                                              <div className="flex flex-col items-center gap-2">
                                                {editingMatch === match._id ? (
                                                  <div className="flex items-center gap-2">
                                                    <Input
                                                      type="number"
                                                      className="w-16 text-center text-xl font-bold"
                                                      value={editScores.team1Score}
                                                      onChange={(e) =>
                                                        setEditScores({ ...editScores, team1Score: parseInt(e.target.value) || 0 })
                                                      }
                                                      min="0"
                                                    />
                                                    <span className="text-lg font-bold">-</span>
                                                    <Input
                                                      type="number"
                                                      className="w-16 text-center text-xl font-bold"
                                                      value={editScores.team2Score}
                                                      onChange={(e) =>
                                                        setEditScores({ ...editScores, team2Score: parseInt(e.target.value) || 0 })
                                                      }
                                                      min="0"
                                                    />
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center gap-3">
                                                    <span className={`text-3xl font-bold font-display ${
                                                      isCompleted && match.score?.team1Score > match.score?.team2Score
                                                        ? 'text-primary'
                                                        : ''
                                                    }`}>
                                                      {match.score?.team1Score ?? "-"}
                                                    </span>
                                                    <span className="text-2xl text-muted-foreground">-</span>
                                                    <span className={`text-3xl font-bold font-display ${
                                                      isCompleted && match.score?.team2Score > match.score?.team1Score
                                                        ? 'text-primary'
                                                        : ''
                                                    }`}>
                                                      {match.score?.team2Score ?? "-"}
                                                    </span>
                                                  </div>
                                                )}

                                                <div className="flex gap-2">
                                                  {editingMatch === match._id ? (
                                                    <>
                                                      <Button
                                                        size="sm"
                                                        onClick={() => saveScore(match._id)}
                                                        disabled={updateMatchScoreMutation.isPending}
                                                      >
                                                        <Check className="w-4 h-4 mr-1" />
                                                        Save
                                                      </Button>
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setEditingMatch(null)}
                                                      >
                                                        <X className="w-4 h-4 mr-1" />
                                                        Cancel
                                                      </Button>
                                                    </>
                                                  ) : (
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => {
                                                        setEditingMatch(match._id);
                                                        setEditScores({
                                                          team1Score: match.score?.team1Score || 0,
                                                          team2Score: match.score?.team2Score || 0,
                                                        });
                                                      }}
                                                    >
                                                      <Edit2 className="w-4 h-4 mr-1" />
                                                      {isCompleted ? 'Edit Score' : 'Enter Score'}
                                                    </Button>
                                                  )}
                                                </div>
                                              </div>

                                              <div className="text-left">
                                                <div className="font-bold text-lg mb-1">
                                                  {match.team2?.name || "Team 2"}
                                                </div>
                                                {!isSinglesMatch && match.team2?.players && (
                                                  <div className="text-sm text-muted-foreground">
                                                    {match.team2.players.map((p: any, i: number) => (
                                                      <div key={i}>{p.name || `Player ${i + 1}`}</div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground text-center py-8">
                                      No matches in this round
                                    </p>
                                  )}
                                </TabsContent>
                              );
                            })}

                            {/* Playoffs Tab */}
                            {event?.addPlayoffStage && (
                              <TabsContent value="playoffs" className="p-6 space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="font-display font-bold text-lg">Playoff Bracket</h3>
                                  <Button
                                    onClick={() => generatePlayoffsMutation.mutate(selectedPool._id)}
                                    disabled={generatePlayoffsMutation.isPending}
                                    size="sm"
                                    className="bg-court-green text-white hover:bg-court-green-dark shadow-lg shrink-0 rounded-xl"
                                  >
                                    {generatePlayoffsMutation.isPending ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating...
                                      </>
                                    ) : playoffs.length > 0 ? (
                                      "Regenerate Playoffs"
                                    ) : (
                                      <>
                                        <Trophy className="w-4 h-4 mr-2" />
                                        Generate Playoffs
                                      </>
                                    )}
                                  </Button>
                                </div>

                                {playoffs.length > 0 ? (
                                  <>
                                    <PlayoffBracket
                                      matches={playoffs}
                                      onUpdateScore={(matchId, team1Score, team2Score) => {
                                        updateMatchScoreMutation.mutate({
                                          matchId,
                                          scores: { team1Score, team2Score }
                                        });
                                      }}
                                      isUpdating={updateMatchScoreMutation.isPending}
                                    />
                                    <PlayoffResults
                                      eventId={eventId!}
                                      poolId={selectedPoolId!}
                                      poolName={selectedPool.name}
                                      eventName={event.name}
                                    />
                                  </>
                                ) : (
                                  <div className="text-center py-12 rounded-2xl bg-muted/30 border border-border/40">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                      <Trophy className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-display font-bold mb-2">No Playoff Bracket Yet</h3>
                                    <p className="text-muted-foreground">
                                      Generate the playoff bracket once pool play matches are complete
                                    </p>
                                  </div>
                                )}
                              </TabsContent>
                            )}
                          </Tabs>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="h-full flex items-center justify-center glass-card rounded-2xl border border-border/50 shadow-float">
                  <CardContent className="text-center py-16">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-display font-bold mb-2">Select a Pool</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Choose a pool from the left to view standings and manage matches
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Match Dialog */}
      <Dialog open={!!schedulingMatch} onOpenChange={(open) => !open && setSchedulingMatch(null)}>
        <DialogContent className="glass-card rounded-2xl border border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display">Schedule Match</DialogTitle>
            <DialogDescription>
              Set the date, time, and court for this match
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-time">Date & Time *</Label>
              <Input
                id="schedule-time"
                type="datetime-local"
                value={scheduleData.scheduledTime}
                onChange={(e) => setScheduleData({ ...scheduleData, scheduledTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="court-number">Court Number *</Label>
              <Input
                id="court-number"
                type="number"
                min="1"
                max="20"
                value={scheduleData.courtNumber}
                onChange={(e) => setScheduleData({ ...scheduleData, courtNumber: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSchedulingMatch(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveSchedule(schedulingMatch!)}
              disabled={updateMatchScheduleMutation.isPending}
              className="bg-court-green text-white hover:bg-court-green-dark shadow-lg rounded-xl"
            >
              {updateMatchScheduleMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Schedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove pool confirmation */}
      <AlertDialog open={!!poolToRemove} onOpenChange={(open) => !open && setPoolToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove pool?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing &quot;{pools.find((p: any) => p._id === poolToRemove)?.name || 'this pool'}&quot; will
              unassign all {isSingles ? 'players' : 'teams'} and remove its matches. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => poolToRemove && deletePoolMutation.mutate(poolToRemove)}
              disabled={deletePoolMutation.isPending}
            >
              {deletePoolMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing…
                </>
              ) : (
                'Remove pool'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default PoolManagement;

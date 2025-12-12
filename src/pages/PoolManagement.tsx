import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Users, Trophy, Shuffle, Loader2, AlertCircle, Edit2, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { eventAPI, poolAPI, teamAPI, matchAPI, playoffAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import PlayoffBracket from "@/components/tournament/PlayoffBracket";

const PoolManagement = () => {
  const { id, eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [newPoolName, setNewPoolName] = useState("");
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editScores, setEditScores] = useState({ team1Score: 0, team2Score: 0 });

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

  // Get unassigned teams (teams without a pool)
  const unassignedTeams = teams.filter((team: any) => !team.pool);

  // Create pool mutation
  const createPoolMutation = useMutation({
    mutationFn: (data: any) => poolAPI.create(eventId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools', eventId] });
      setNewPoolName("");
      setIsCreatePoolOpen(false);
      toast.success("Pool created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create pool");
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

  const handleRemoveTeamFromPool = (teamId: string, poolId: string) => {
    removeTeamFromPoolMutation.mutate({ teamId, poolId });
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

  if (eventLoading) {
    return (
      <Layout>
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
      <Layout>
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
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-12">
          <div className="container mx-auto px-4">
            <Link
              to={`/tournaments/${id}`}
              className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tournament
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="animate-fade-in">
                <Badge className="bg-secondary text-secondary-foreground mb-2">
                  Pool Play
                </Badge>
                <h1 className="text-4xl font-display font-bold text-primary-foreground">
                  {event.name}
                </h1>
                <p className="text-primary-foreground/80 mt-1">
                  Manage pools, matches, and scores
                </p>
              </div>
              <div className="flex gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <Dialog open={isCreatePoolOpen} onOpenChange={setIsCreatePoolOpen}>
                  <DialogTrigger asChild>
                    <Button variant="glass">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Pool
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Pool</DialogTitle>
                      <DialogDescription>Enter a name for the new pool</DialogDescription>
                    </DialogHeader>
                    <Input
                      placeholder="e.g., Pool A"
                      value={newPoolName}
                      onChange={(e) => setNewPoolName(e.target.value)}
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreatePoolOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createPool} disabled={createPoolMutation.isPending}>
                        {createPoolMutation.isPending ? "Creating..." : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Pools List */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Pools ({pools.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pools.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pools created yet</p>
                  ) : (
                    <div className="space-y-2">
                      {pools.map((pool: any) => (
                        <Button
                          key={pool._id}
                          variant={selectedPoolId === pool._id ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => setSelectedPoolId(pool._id)}
                        >
                          {pool.name}
                          <Badge variant="secondary" className="ml-auto">
                            {pool.teams?.length || 0} teams
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Unassigned Teams ({unassignedTeams.length})
                  </CardTitle>
                  <CardDescription>Teams not in any pool</CardDescription>
                </CardHeader>
                <CardContent>
                  {unassignedTeams.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">All teams assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {unassignedTeams.map((team: any) => (
                        <div
                          key={team._id}
                          className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border border-border"
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
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pool Details */}
            <div className="lg:col-span-3">
              {selectedPool ? (
                <div className="space-y-6">
                  {/* Standings */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Standings - {selectedPool.name}</CardTitle>
                        {(event?.playFormat === 'pool-play' || event?.playFormat === 'round-robin') && (
                          <Button
                            onClick={() => generatePlayoffsMutation.mutate(selectedPool._id)}
                            disabled={generatePlayoffsMutation.isPending}
                            size="sm"
                          >
                            {generatePlayoffsMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Trophy className="w-4 h-4 mr-2" />
                                Generate Playoffs
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedPool.teams && selectedPool.teams.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Team</TableHead>
                              <TableHead className="text-center">W</TableHead>
                              <TableHead className="text-center">L</TableHead>
                              <TableHead className="text-center">PF</TableHead>
                              <TableHead className="text-center">PA</TableHead>
                              <TableHead className="text-center">Diff</TableHead>
                              <TableHead className="w-12">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedPool.teams
                              .sort((a: any, b: any) => {
                                const aDiff = (a.stats?.wins || 0) - (a.stats?.losses || 0);
                                const bDiff = (b.stats?.wins || 0) - (b.stats?.losses || 0);
                                return bDiff - aDiff || (b.stats?.pointDifferential || 0) - (a.stats?.pointDifferential || 0);
                              })
                              .map((team: any, index: number) => (
                                <TableRow key={team._id}>
                                  <TableCell className="font-medium">{index + 1}</TableCell>
                                  <TableCell className="font-medium">{team.name}</TableCell>
                                  <TableCell className="text-center">{team.stats?.wins || 0}</TableCell>
                                  <TableCell className="text-center">{team.stats?.losses || 0}</TableCell>
                                  <TableCell className="text-center">{team.stats?.pointsFor || 0}</TableCell>
                                  <TableCell className="text-center">{team.stats?.pointsAgainst || 0}</TableCell>
                                  <TableCell className="text-center">{team.stats?.pointDifferential || 0}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveTeamFromPool(team._id, selectedPool._id)}
                                      disabled={removeTeamFromPoolMutation.isPending}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      title="Remove from pool"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">No teams in this pool yet</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Game Format Info */}
                  <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-display font-bold text-lg">
                              {event.playFormat ? event.playFormat.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Round Robin'}
                            </h3>
                            <Badge variant="secondary" className="capitalize">
                              {event.format.replace('-', ' ')} Game
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {event.playFormat === 'round-robin' && "Each team plays every other team in their pool once. Teams are ranked by wins, then point differential."}
                            {event.playFormat === 'single-elimination' && "Single elimination bracket - lose once and you're out. Winner advances to the next round."}
                            {event.playFormat === 'double-elimination' && "Teams must lose twice to be eliminated. Includes a winners bracket and a losers bracket."}
                            {event.playFormat === 'pool-play' && "Pool play followed by playoffs. Top teams from each pool advance to elimination rounds."}
                            {event.playFormat === 'swiss' && "Swiss system - teams are paired based on their current record. No elimination until final rounds."}
                            {!event.playFormat && "Each team plays every other team in their pool once. Teams are ranked by wins, then point differential."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Matches */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Matches</CardTitle>
                          <CardDescription>
                            {event.playFormat === 'round-robin' || !event.playFormat
                              ? "All teams play each other once in pool play"
                              : event.playFormat === 'single-elimination'
                              ? "Bracket matches - win to advance"
                              : event.playFormat === 'double-elimination'
                              ? "Winners and losers bracket matches"
                              : "Matches based on current standings"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedPool.matches && selectedPool.matches.length > 0 ? (
                        <div className="space-y-4">
                          {selectedPool.matches.map((match: any, index: number) => {
                            const isSingles = event.format === 'singles';
                            const isCompleted = match.status === 'completed';
                            const playFormat = event.playFormat || 'round-robin';

                            return (
                              <div
                                key={match._id}
                                className={`p-4 rounded-lg border-2 transition-colors ${
                                  isCompleted
                                    ? 'bg-muted/50 border-muted'
                                    : 'bg-card border-border hover:border-primary/50'
                                }`}
                              >
                                {/* Match Header */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    {playFormat === 'single-elimination' || playFormat === 'double-elimination' ? (
                                      <>
                                        <Badge variant="secondary">
                                          {match.bracket ? `${match.bracket.charAt(0).toUpperCase() + match.bracket.slice(1)} Bracket` : `Round ${match.round || 1}`}
                                        </Badge>
                                        <Badge variant="outline">Match #{match.matchNumber || index + 1}</Badge>
                                      </>
                                    ) : playFormat === 'swiss' ? (
                                      <Badge variant="secondary">Round {match.round || 1} - Match {index + 1}</Badge>
                                    ) : (
                                      <Badge variant="secondary">Match {index + 1}</Badge>
                                    )}
                                    {isCompleted && (
                                      <Badge variant="default" className="bg-green-500">Completed</Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Match Content */}
                                <div className="grid grid-cols-[2fr_1fr_2fr] gap-4 items-center">
                                  {/* Team 1 */}
                                  <div className="text-right">
                                    <div className="font-bold text-lg mb-1">
                                      {match.team1?.name || "Team 1"}
                                    </div>
                                    {!isSingles && match.team1?.players && (
                                      <div className="text-sm text-muted-foreground">
                                        {match.team1.players.map((p: any, i: number) => (
                                          <div key={i}>{p.name || `Player ${i + 1}`}</div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Score */}
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
                                          max="21"
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
                                          max="21"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3">
                                        <span className={`text-3xl font-bold ${
                                          isCompleted && match.score?.team1Score > match.score?.team2Score
                                            ? 'text-green-600'
                                            : ''
                                        }`}>
                                          {match.score?.team1Score ?? "-"}
                                        </span>
                                        <span className="text-2xl text-muted-foreground">-</span>
                                        <span className={`text-3xl font-bold ${
                                          isCompleted && match.score?.team2Score > match.score?.team1Score
                                            ? 'text-green-600'
                                            : ''
                                        }`}>
                                          {match.score?.team2Score ?? "-"}
                                        </span>
                                      </div>
                                    )}

                                    {/* Action Buttons */}
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

                                  {/* Team 2 */}
                                  <div className="text-left">
                                    <div className="font-bold text-lg mb-1">
                                      {match.team2?.name || "Team 2"}
                                    </div>
                                    {!isSingles && match.team2?.players && (
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
                          {selectedPool.teams?.length < 2
                            ? "Add at least 2 teams to generate matches"
                            : "No matches generated yet"}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Playoff Bracket for this Pool */}
                  {(event?.playFormat === 'pool-play' || event?.playFormat === 'round-robin') && playoffs.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Trophy className="w-6 h-6 text-primary" />
                          <div>
                            <CardTitle>Playoff Bracket - {selectedPool.name}</CardTitle>
                            <CardDescription>Top 3 teams advancing to elimination rounds</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
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
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center py-12">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-bold mb-2">Select a Pool</h3>
                    <p className="text-muted-foreground">
                      Choose a pool from the left to view standings and manage matches
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PoolManagement;

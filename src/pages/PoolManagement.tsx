import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Users,
  Trophy,
  Shuffle,
  Save,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Pool,
  Team,
  Match,
  generateRoundRobinMatches,
  calculateStandings,
} from "@/types/tournament";

// Mock event data
const mockEvent = {
  id: "1",
  name: "Men's Singles",
  format: "Singles" as const,
  skillLevel: "4.0" as const,
  maxTeams: 32,
  entryFee: 50,
  registeredTeams: 16,
};

// Mock teams
const mockTeams: Team[] = [
  { id: "t1", name: "John Smith", players: ["John Smith"], seed: 1 },
  { id: "t2", name: "Mike Johnson", players: ["Mike Johnson"], seed: 2 },
  { id: "t3", name: "David Williams", players: ["David Williams"], seed: 3 },
  { id: "t4", name: "James Brown", players: ["James Brown"], seed: 4 },
  { id: "t5", name: "Robert Davis", players: ["Robert Davis"], seed: 5 },
  { id: "t6", name: "Chris Miller", players: ["Chris Miller"], seed: 6 },
  { id: "t7", name: "Tom Wilson", players: ["Tom Wilson"], seed: 7 },
  { id: "t8", name: "Alex Taylor", players: ["Alex Taylor"], seed: 8 },
];

const PoolManagement = () => {
  const { id, eventId } = useParams();
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [unassignedTeams, setUnassignedTeams] = useState<Team[]>(mockTeams);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editScores, setEditScores] = useState({ team1: "", team2: "" });
  const [newPoolName, setNewPoolName] = useState("");
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);

  const createPool = () => {
    if (!newPoolName) {
      toast.error("Please enter a pool name");
      return;
    }
    const newPool: Pool = {
      id: `pool-${Date.now()}`,
      name: newPoolName,
      eventId: eventId || "1",
      teams: [],
      matches: [],
      standings: [],
    };
    setPools([...pools, newPool]);
    setNewPoolName("");
    setIsCreatePoolOpen(false);
    toast.success(`Pool "${newPoolName}" created`);
  };

  const autoGeneratePools = () => {
    if (unassignedTeams.length < 4) {
      toast.error("Need at least 4 teams to generate pools");
      return;
    }

    const numPools = Math.ceil(unassignedTeams.length / 4);
    const newPools: Pool[] = [];
    const shuffled = [...unassignedTeams].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numPools; i++) {
      const poolTeams = shuffled.slice(i * 4, (i + 1) * 4);
      const pool: Pool = {
        id: `pool-${Date.now()}-${i}`,
        name: `Pool ${String.fromCharCode(65 + i)}`,
        eventId: eventId || "1",
        teams: poolTeams,
        matches: generateRoundRobinMatches(`pool-${Date.now()}-${i}`, poolTeams),
        standings: calculateStandings(poolTeams, []),
      };
      newPools.push(pool);
    }

    setPools(newPools);
    setUnassignedTeams([]);
    toast.success(`Generated ${numPools} pools with ${shuffled.length} teams`);
  };

  const addTeamToPool = (poolId: string, team: Team) => {
    setPools(
      pools.map((pool) => {
        if (pool.id === poolId) {
          const newTeams = [...pool.teams, team];
          const newMatches = generateRoundRobinMatches(poolId, newTeams);
          return {
            ...pool,
            teams: newTeams,
            matches: newMatches,
            standings: calculateStandings(newTeams, newMatches),
          };
        }
        return pool;
      })
    );
    setUnassignedTeams(unassignedTeams.filter((t) => t.id !== team.id));
  };

  const removeTeamFromPool = (poolId: string, team: Team) => {
    setPools(
      pools.map((pool) => {
        if (pool.id === poolId) {
          const newTeams = pool.teams.filter((t) => t.id !== team.id);
          const newMatches = generateRoundRobinMatches(poolId, newTeams);
          return {
            ...pool,
            teams: newTeams,
            matches: newMatches,
            standings: calculateStandings(newTeams, newMatches),
          };
        }
        return pool;
      })
    );
    setUnassignedTeams([...unassignedTeams, team]);
  };

  const startEditScore = (match: Match) => {
    setEditingMatch(match.id);
    setEditScores({
      team1: match.team1Score?.toString() || "",
      team2: match.team2Score?.toString() || "",
    });
  };

  const saveScore = (poolId: string, matchId: string) => {
    const score1 = parseInt(editScores.team1);
    const score2 = parseInt(editScores.team2);

    if (isNaN(score1) || isNaN(score2)) {
      toast.error("Please enter valid scores");
      return;
    }

    setPools(
      pools.map((pool) => {
        if (pool.id === poolId) {
          const newMatches = pool.matches.map((match) => {
            if (match.id === matchId) {
              return {
                ...match,
                team1Score: score1,
                team2Score: score2,
                status: "completed" as const,
                winner: score1 > score2 ? match.team1.id : match.team2.id,
              };
            }
            return match;
          });
          return {
            ...pool,
            matches: newMatches,
            standings: calculateStandings(pool.teams, newMatches),
          };
        }
        return pool;
      })
    );

    setEditingMatch(null);
    toast.success("Score saved");
  };

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
                  {mockEvent.name}
                </h1>
                <p className="text-primary-foreground/80 mt-1">
                  Manage pools, matches, and scores
                </p>
              </div>
              <div className="flex gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <Button variant="glass" onClick={autoGeneratePools}>
                  <Shuffle className="w-4 h-4 mr-2" />
                  Auto Generate Pools
                </Button>
                <Dialog open={isCreatePoolOpen} onOpenChange={setIsCreatePoolOpen}>
                  <DialogTrigger asChild>
                    <Button variant="accent">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Pool
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Pool</DialogTitle>
                      <DialogDescription>
                        Enter a name for your new pool
                      </DialogDescription>
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
                      <Button onClick={createPool}>Create Pool</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Unassigned Teams Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-primary" />
                    Unassigned Teams
                  </CardTitle>
                  <CardDescription>
                    {unassignedTeams.length} teams waiting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {unassignedTeams.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      All teams assigned to pools
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {unassignedTeams.map((team) => (
                        <div
                          key={team.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <span className="font-medium text-sm">{team.name}</span>
                            {team.seed && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                #{team.seed}
                              </Badge>
                            )}
                          </div>
                          {pools.length > 0 && (
                            <Select
                              onValueChange={(poolId) => addTeamToPool(poolId, team)}
                            >
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue placeholder="Add to" />
                              </SelectTrigger>
                              <SelectContent>
                                {pools.map((pool) => (
                                  <SelectItem key={pool.id} value={pool.id}>
                                    {pool.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pools Grid */}
            <div className="lg:col-span-3">
              {pools.length === 0 ? (
                <Card className="py-16">
                  <CardContent className="text-center">
                    <Trophy className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-display font-bold mb-2">
                      No Pools Created
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Create pools manually or auto-generate them from registered teams
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={() => setIsCreatePoolOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Pool
                      </Button>
                      <Button onClick={autoGeneratePools}>
                        <Shuffle className="w-4 h-4 mr-2" />
                        Auto Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  {pools.map((pool) => (
                    <Card key={pool.id} className="animate-fade-in">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center text-primary-foreground font-bold">
                              {pool.name.charAt(pool.name.length - 1)}
                            </div>
                            {pool.name}
                          </CardTitle>
                          <Badge variant="outline">
                            {pool.teams.length} Teams • {pool.matches.length} Matches
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Teams */}
                        <div>
                          <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                            Teams
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {pool.teams.map((team) => (
                              <Badge
                                key={team.id}
                                variant="secondary"
                                className="py-1.5 px-3 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                onClick={() => removeTeamFromPool(pool.id, team)}
                              >
                                {team.name}
                                {team.seed && (
                                  <span className="ml-1 opacity-60">#{team.seed}</span>
                                )}
                                <X className="w-3 h-3 ml-1" />
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Standings */}
                        {pool.teams.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                              Standings
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">#</TableHead>
                                  <TableHead>Team</TableHead>
                                  <TableHead className="text-center">W</TableHead>
                                  <TableHead className="text-center">L</TableHead>
                                  <TableHead className="text-center">PF</TableHead>
                                  <TableHead className="text-center">PA</TableHead>
                                  <TableHead className="text-center">+/-</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pool.standings.map((standing, idx) => (
                                  <TableRow key={standing.team.id}>
                                    <TableCell className="font-bold">{idx + 1}</TableCell>
                                    <TableCell className="font-medium">
                                      {standing.team.name}
                                    </TableCell>
                                    <TableCell className="text-center text-primary font-semibold">
                                      {standing.wins}
                                    </TableCell>
                                    <TableCell className="text-center text-destructive">
                                      {standing.losses}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {standing.pointsFor}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {standing.pointsAgainst}
                                    </TableCell>
                                    <TableCell
                                      className={`text-center font-semibold ${
                                        standing.pointDifferential > 0
                                          ? "text-primary"
                                          : standing.pointDifferential < 0
                                          ? "text-destructive"
                                          : ""
                                      }`}
                                    >
                                      {standing.pointDifferential > 0 ? "+" : ""}
                                      {standing.pointDifferential}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {/* Matches */}
                        {pool.matches.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                              Matches
                            </h4>
                            <div className="space-y-2">
                              {pool.matches.map((match) => (
                                <div
                                  key={match.id}
                                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border"
                                >
                                  <div className="flex items-center gap-4 flex-1">
                                    <div
                                      className={`flex-1 text-right font-medium ${
                                        match.winner === match.team1.id
                                          ? "text-primary"
                                          : ""
                                      }`}
                                    >
                                      {match.team1.name}
                                    </div>

                                    {editingMatch === match.id ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          className="w-16 text-center"
                                          value={editScores.team1}
                                          onChange={(e) =>
                                            setEditScores({
                                              ...editScores,
                                              team1: e.target.value,
                                            })
                                          }
                                        />
                                        <span className="text-muted-foreground">-</span>
                                        <Input
                                          type="number"
                                          className="w-16 text-center"
                                          value={editScores.team2}
                                          onChange={(e) =>
                                            setEditScores({
                                              ...editScores,
                                              team2: e.target.value,
                                            })
                                          }
                                        />
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => saveScore(pool.id, match.id)}
                                        >
                                          <Check className="w-4 h-4 text-primary" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => setEditingMatch(null)}
                                        >
                                          <X className="w-4 h-4 text-destructive" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`w-8 text-center font-display font-bold text-lg ${
                                            match.status === "completed" &&
                                            match.team1Score! > match.team2Score!
                                              ? "text-primary"
                                              : ""
                                          }`}
                                        >
                                          {match.team1Score ?? "-"}
                                        </span>
                                        <span className="text-muted-foreground">vs</span>
                                        <span
                                          className={`w-8 text-center font-display font-bold text-lg ${
                                            match.status === "completed" &&
                                            match.team2Score! > match.team1Score!
                                              ? "text-primary"
                                              : ""
                                          }`}
                                        >
                                          {match.team2Score ?? "-"}
                                        </span>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => startEditScore(match)}
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    )}

                                    <div
                                      className={`flex-1 font-medium ${
                                        match.winner === match.team2.id
                                          ? "text-primary"
                                          : ""
                                      }`}
                                    >
                                      {match.team2.name}
                                    </div>
                                  </div>

                                  <Badge
                                    variant={
                                      match.status === "completed"
                                        ? "default"
                                        : match.status === "in-progress"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="ml-4"
                                  >
                                    {match.status === "completed"
                                      ? "Final"
                                      : match.status === "in-progress"
                                      ? "Live"
                                      : "Pending"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PoolManagement;

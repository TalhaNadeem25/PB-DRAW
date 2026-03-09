import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Medal as AwardIcon, TrendingUp, TrendingDown, Trash } from "@phosphor-icons/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Team {
  _id: string;
  name?: string;
  players: Array<{ _id: string; name: string }>;
  stats: {
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    pointDifferential: number;
  };
}

interface PoolStandingsProps {
  teams: Team[];
  poolName?: string;
  showPlayoffIndicators?: boolean;
  onRemoveTeam?: (teamId: string) => void;
  isRemoving?: boolean;
  /** When true, first 4 rows show final medals (gold, silver, bronze, 4th) */
  isPlayoffsFinalized?: boolean;
  /** Other pools this member can be moved to */
  availablePools?: { _id: string; name: string }[];
  onMoveTeam?: (teamId: string, toPoolId: string) => void;
  isMoving?: boolean;
}

const PoolStandings = ({ teams, poolName, showPlayoffIndicators = true, onRemoveTeam, isRemoving = false, isPlayoffsFinalized = false, availablePools, onMoveTeam, isMoving = false }: PoolStandingsProps) => {
  // Sort teams by wins (desc), then point differential (desc)
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.stats.wins !== a.stats.wins) {
      return b.stats.wins - a.stats.wins;
    }
    return b.stats.pointDifferential - a.stats.pointDifferential;
  });

  // Get team display name
  const getTeamName = (team: Team) => {
    if (team.name) return team.name;
    return team.players.map(p => p.name).join(' / ') || 'Unnamed Team';
  };

  // Medal label for finalized playoffs (gold, silver, bronze, 4th)
  const getMedalLabel = (rank: number) => {
    if (!isPlayoffsFinalized || rank > 4) return null;
    switch (rank) {
      case 1: return <span className="inline-flex items-center gap-1 font-semibold text-amber-600">🥇 Gold</span>;
      case 2: return <span className="inline-flex items-center gap-1 font-semibold text-slate-500">🥈 Silver</span>;
      case 3: return <span className="inline-flex items-center gap-1 font-semibold text-amber-700">🥉 Bronze</span>;
      case 4: return <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">4th place</span>;
      default: return null;
    }
  };

  // Get rank badge/icon (pre-playoff seeds)
  const getRankBadge = (rank: number) => {
    if (!showPlayoffIndicators || isPlayoffsFinalized) return null;

    switch (rank) {
      case 1:
        return (
          <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 gap-1">
            <Trophy className="w-3 h-3" />
            #1 Seed
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-gray-400 text-white hover:bg-gray-500 gap-1">
            <Medal className="w-3 h-3" />
            #2 Seed
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-orange-600 text-white hover:bg-orange-700 gap-1">
            <AwardIcon className="w-3 h-3" />
            #3 Seed
          </Badge>
        );
      default:
        return null;
    }
  };

  // Calculate win percentage
  const getWinPercentage = (team: Team) => {
    const totalGames = team.stats.wins + team.stats.losses;
    if (totalGames === 0) return '0.000';
    return (team.stats.wins / totalGames).toFixed(3);
  };

  if (!teams || teams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pool Standings</CardTitle>
          <CardDescription>No teams in this pool yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          {poolName ? `${poolName} - Standings` : 'Pool Standings'}
        </CardTitle>
        <CardDescription>
          {isPlayoffsFinalized
            ? 'Final standings with playoff results'
            : showPlayoffIndicators && 'Top 3 teams advance to playoffs'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 text-center font-bold">Rank</TableHead>
                <TableHead className="font-bold">Team</TableHead>
                <TableHead className="text-center font-bold">W</TableHead>
                <TableHead className="text-center font-bold">L</TableHead>
                <TableHead className="text-center font-bold">PCT</TableHead>
                <TableHead className="text-center font-bold">PF</TableHead>
                <TableHead className="text-center font-bold">PA</TableHead>
                <TableHead className="text-center font-bold">DIFF</TableHead>
                {showPlayoffIndicators && <TableHead className="font-bold">Playoff Seed</TableHead>}
                {(onRemoveTeam || onMoveTeam) && <TableHead className="font-bold">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeams.map((team, index) => {
                const rank = index + 1;
                const isPlayoffTeam = rank <= 3;
                const pointDiff = team.stats.pointDifferential;

                return (
                  <TableRow
                    key={team._id}
                    className={`
                      ${isPlayoffTeam && showPlayoffIndicators ? 'bg-primary/5 font-medium' : ''}
                      hover:bg-muted/50 transition-colors
                    `}
                  >
                    <TableCell className="text-center font-bold text-lg">
                      {rank}
                    </TableCell>
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getMedalLabel(rank) ?? (rank === 1 && showPlayoffIndicators && <Trophy className="w-4 h-4 text-yellow-500" />)}
                        {getTeamName(team)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-green-600">
                      {team.stats.wins}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-red-600">
                      {team.stats.losses}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {getWinPercentage(team)}
                    </TableCell>
                    <TableCell className="text-center">
                      {team.stats.pointsFor}
                    </TableCell>
                    <TableCell className="text-center">
                      {team.stats.pointsAgainst}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {pointDiff > 0 && <TrendingUp className="w-4 h-4 text-green-600" />}
                        {pointDiff < 0 && <TrendingDown className="w-4 h-4 text-red-600" />}
                        <span className={`font-semibold ${
                          pointDiff > 0 ? 'text-green-600' :
                          pointDiff < 0 ? 'text-red-600' :
                          'text-muted-foreground'
                        }`}>
                          {pointDiff > 0 ? '+' : ''}{pointDiff}
                        </span>
                      </div>
                    </TableCell>
                    {showPlayoffIndicators && (
                      <TableCell>
                        {getRankBadge(rank)}
                      </TableCell>
                    )}
                    {(onRemoveTeam || onMoveTeam) && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {onMoveTeam && availablePools && availablePools.length > 0 && (
                            <Select
                              onValueChange={(toPoolId) => onMoveTeam(team._id, toPoolId)}
                              disabled={isMoving}
                            >
                              <SelectTrigger className="h-7 w-28 text-xs rounded-lg">
                                <SelectValue placeholder="Move to…" />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePools.map((p) => (
                                  <SelectItem key={p._id} value={p._id} className="text-xs">
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {onRemoveTeam && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveTeam(team._id)}
                              disabled={isRemoving}
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Remove from pool"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        {showPlayoffIndicators && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Legend:</span>
              </div>
              <div>W = Wins</div>
              <div>L = Losses</div>
              <div>PCT = Win Percentage</div>
              <div>PF = Points For</div>
              <div>PA = Points Against</div>
              <div>DIFF = Point Differential</div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              * Teams are ranked by wins, then point differential
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PoolStandings;

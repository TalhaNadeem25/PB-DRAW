import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Users, Loader2, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Team {
  _id: string;
  name: string;
  players: any[];
  stats?: {
    wins: number;
    losses: number;
  };
}

interface Match {
  _id: string;
  team1: Team;
  team2: Team | null;
  team1Score: number;
  team2Score: number;
  status: string;
  bracket: string;
  round: number;
  matchNumber: number;
}

interface PlayoffBracketProps {
  matches: Match[];
  onUpdateScore?: (matchId: string, team1Score: number, team2Score: number) => void;
  isUpdating?: boolean;
}

const PlayoffBracket = ({ matches, onUpdateScore, isUpdating }: PlayoffBracketProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);

  // Separate matches by bracket type
  const semifinals = matches.filter(m => m.bracket === 'semifinals');
  const finals = matches.find(m => m.bracket === 'finals');

  const handleEditClick = (match: Match) => {
    setEditingMatch(match);
    setTeam1Score(match.team1Score || 0);
    setTeam2Score(match.team2Score || 0);
  };

  const handleSaveScore = () => {
    if (editingMatch && onUpdateScore) {
      onUpdateScore(editingMatch._id, team1Score, team2Score);
      setEditingMatch(null);
    }
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
  };

  const MatchCard = ({ match, position }: { match: Match; position: 'left' | 'right' | 'center' }) => {
    const matchTeam1Score = match.team1Score || 0;
    const matchTeam2Score = match.team2Score || 0;
    const winner = matchTeam1Score > matchTeam2Score ? match.team1 :
                   matchTeam2Score > matchTeam1Score ? match.team2 : null;

    return (
      <div
        className={cn(
          "relative bg-card border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
          selectedMatch?._id === match._id && "border-primary shadow-lg"
        )}
        onClick={() => handleMatchClick(match)}
      >
        {/* Match Title */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            {match.bracket === 'semifinals' ? 'Semifinal' : 'Final'}
          </Badge>
          {onUpdateScore && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(match);
              }}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Team 1 */}
        <div className={cn(
          "flex items-center justify-between p-2 rounded mb-2 transition-colors",
          winner?._id === match.team1._id && "bg-green-500/10 border border-green-500/20"
        )}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.bracket === 'finals' && match.team1.stats && (
              <Badge variant="secondary" className="text-xs shrink-0">#1</Badge>
            )}
            <span className="font-medium truncate">{match.team1.name}</span>
          </div>
          <div className="font-bold text-lg ml-2">
            {team1Score}
          </div>
        </div>

        {/* Team 2 */}
        <div className={cn(
          "flex items-center justify-between p-2 rounded transition-colors",
          match.team2 ? (
            winner?._id === match.team2._id && "bg-green-500/10 border border-green-500/20"
          ) : "bg-muted/50"
        )}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.team2 ? (
              <>
                {match.bracket === 'semifinals' && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    #{match.matchNumber === 1 ? '2 vs 3' : ''}
                  </Badge>
                )}
                <span className="font-medium truncate">{match.team2.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground italic">Winner of Semifinal</span>
            )}
          </div>
          <div className="font-bold text-lg ml-2">
            {match.team2 ? team2Score : '-'}
          </div>
        </div>

        {/* Winner Indicator */}
        {winner && match.status === 'completed' && (
          <div className="absolute -top-2 -right-2">
            <div className="bg-green-500 rounded-full p-1">
              <Trophy className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Bracket Visualization */}
      <div className="grid lg:grid-cols-3 gap-8 items-center">
        {/* Semifinals Column */}
        <div className="space-y-6">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg">Semifinals</h3>
            <p className="text-sm text-muted-foreground">Round 1</p>
          </div>
          {semifinals.map((match) => (
            <MatchCard key={match._id} match={match} position="left" />
          ))}
        </div>

        {/* Connector Lines */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="w-full h-px bg-border relative">
            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Finals Column */}
        <div>
          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg">Championship</h3>
            <p className="text-sm text-muted-foreground">Final</p>
          </div>
          {finals && <MatchCard match={finals} position="center" />}
        </div>
      </div>

      {/* Legend */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-primary" />
              <span className="text-muted-foreground">Selected Match</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/10 border border-green-500/20" />
              <span className="text-muted-foreground">Winner</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-green-500" />
              <span className="text-muted-foreground">Match Complete</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Match Details Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {selectedMatch?.bracket === 'semifinals' ? 'Semifinal Match' : 'Championship Match'}
            </DialogTitle>
            <DialogDescription>
              Match details and information
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Team 1</p>
                  <p className="font-semibold">{selectedMatch.team1.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedMatch.team1.players.map(p => p.name).join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Team 2</p>
                  <p className="font-semibold">
                    {selectedMatch.team2?.name || 'TBD'}
                  </p>
                  {selectedMatch.team2 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedMatch.team2.players.map(p => p.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-3xl font-bold mt-1">
                      {selectedMatch.team1Score || 0}
                    </p>
                  </div>
                  <div className="text-muted-foreground">vs</div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-3xl font-bold mt-1">
                      {selectedMatch.team2 ? (selectedMatch.team2Score || 0) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant={selectedMatch.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                  {selectedMatch.status}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMatch(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Score Dialog */}
      <Dialog open={!!editingMatch} onOpenChange={() => setEditingMatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Match Score</DialogTitle>
            <DialogDescription>
              Enter the final scores for this match
            </DialogDescription>
          </DialogHeader>

          {editingMatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {editingMatch.team1.name}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={team1Score}
                    onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {editingMatch.team2?.name || 'TBD'}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={team2Score}
                    onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
                    disabled={!editingMatch.team2}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMatch(null)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveScore} disabled={isUpdating || !editingMatch?.team2}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Score
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayoffBracket;

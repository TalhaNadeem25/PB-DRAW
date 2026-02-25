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
import { formatMatchFormatShort } from "@/constants/matchFormat";

interface Team {
  _id: string;
  name: string;
  players?: { name?: string }[];
  stats?: {
    wins: number;
    losses: number;
  };
}

interface GameScore {
  team1Score: number;
  team2Score: number;
}

interface MatchFormatConfig {
  games_to_win: number;
  max_games: number;
  points_to_win: number;
  win_by: number;
  hard_cap: number | null;
}

interface Match {
  _id: string;
  team1: Team | null;
  team2: Team | null;
  team1Score?: number;
  team2Score?: number;
  score?: { team1Score: number; team2Score: number };
  games?: GameScore[];
  status: string;
  bracket: string;
  round: number;
  matchNumber: number;
  matchFormat?: string;
  matchFormatConfig?: MatchFormatConfig;
  isGrandFinalReset?: boolean;
}

interface PlayoffBracketProps {
  matches: Match[];
  onUpdateScore?: (matchId: string, data: { team1Score?: number; team2Score?: number; games?: GameScore[]; status?: string }) => void;
  isUpdating?: boolean;
}

const PlayoffBracket = ({ matches, onUpdateScore, isUpdating }: PlayoffBracketProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [editGames, setEditGames] = useState<GameScore[]>([]);

  // Detect double-elimination
  const isDoubleElim = matches.some(m => m.bracket === 'losers');

  // SE match partitions (used only when !isDoubleElim)
  const qualifiers = matches.filter(m => m.bracket === 'winners');
  const semifinals = matches.filter(m => m.bracket === 'semifinals');
  const finals = matches.find(m => m.bracket === 'finals' && !m.isGrandFinalReset);
  const bronzeMatch = matches.find(m => m.bracket === 'bronze');

  // DE match partitions
  const deWinnersMatches = matches.filter(m => m.bracket === 'winners');
  const deLosersMatches = matches.filter(m => m.bracket === 'losers');
  const deGfMatch = matches.find(m => m.bracket === 'finals' && !m.isGrandFinalReset);
  const deGfReset = matches.find(m => m.bracket === 'finals' && m.isGrandFinalReset);

  // WR round labels
  const wrMaxRound = deWinnersMatches.reduce((max, m) => Math.max(max, m.round), 0);
  const lrMaxRound = deLosersMatches.reduce((max, m) => Math.max(max, m.round), 0);

  const getMatchScore = (match: Match) => ({
    team1: match.team1Score ?? match.score?.team1Score ?? 0,
    team2: match.team2Score ?? match.score?.team2Score ?? 0,
  });

  const isMatchMultiGame = (match: Match) =>
    (match.matchFormatConfig?.games_to_win ?? 1) > 1;

  const handleEditClick = (match: Match) => {
    setEditingMatch(match);
    if (isMatchMultiGame(match)) {
      const maxGames = match.matchFormatConfig!.max_games;
      const existing = match.games?.length
        ? match.games
        : Array.from({ length: maxGames }, () => ({ team1Score: 0, team2Score: 0 }));
      setEditGames(existing);
    } else {
      const s = getMatchScore(match);
      setTeam1Score(s.team1);
      setTeam2Score(s.team2);
    }
  };

  const handleSaveScore = () => {
    if (!editingMatch || !onUpdateScore) return;
    if (isMatchMultiGame(editingMatch)) {
      onUpdateScore(editingMatch._id, { games: editGames, status: 'completed' });
    } else {
      onUpdateScore(editingMatch._id, { team1Score, team2Score, status: 'completed' });
    }
    setEditingMatch(null);
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
  };

  const getTbdLabel = (bracket: string) => {
    if (bracket === 'bronze') return 'Semifinal loser';
    if (bracket === 'finals') return 'Winner of Semifinal';
    if (bracket === 'semifinals') return qualifiers.length > 0 ? 'Winner of Qualifier' : 'TBD';
    return 'TBD'; // 'winners' qualifier waiting for play-in winner
  };

  const getMatchLabel = (match: Match): string => {
    if (isDoubleElim) {
      if (match.bracket === 'winners') {
        return match.round === wrMaxRound ? 'Winners Final' : `WR Round ${match.round}`;
      }
      if (match.bracket === 'losers') {
        return match.round === lrMaxRound ? 'Losers Final' : `LR Round ${match.round}`;
      }
      if (match.bracket === 'finals') {
        return match.isGrandFinalReset ? 'Bracket Reset' : 'Grand Final';
      }
    }
    if (match.bracket === 'semifinals') return 'Semifinal';
    if (match.bracket === 'winners') return 'Qualifier';
    if (match.bracket === 'bronze') return 'Bronze Medal';
    return 'Final';
  };

  const MatchCard = ({ match, position }: { match: Match; position: 'left' | 'right' | 'center' }) => {
    const score = getMatchScore(match);
    const matchTeam1Score = score.team1;
    const matchTeam2Score = score.team2;
    const multiGame = isMatchMultiGame(match);
    const displayGames = match.games ?? [];
    const t1GamesWon = displayGames.filter(g => g.team1Score > g.team2Score).length;
    const t2GamesWon = displayGames.filter(g => g.team2Score > g.team1Score).length;
    const winner = multiGame && displayGames.length
      ? (t1GamesWon > t2GamesWon ? match.team1 : t2GamesWon > t1GamesWon ? match.team2 : null)
      : (matchTeam1Score > matchTeam2Score ? match.team1 : matchTeam2Score > matchTeam1Score ? match.team2 : null);
    const isEditingThis = editingMatch?._id === match._id;

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
          <div className="flex flex-col gap-0.5">
            <Badge variant="outline" className="text-xs w-fit">
              {getMatchLabel(match)}
            </Badge>
            {match.matchFormat && (
              <span className="text-[10px] text-muted-foreground">{formatMatchFormatShort(match.matchFormat)}</span>
            )}
          </div>
          {onUpdateScore && match.team1 && match.team2 && (
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
          match.team1 && winner?._id === match.team1._id && "bg-green-500/10 border border-green-500/20"
        )}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.bracket === 'finals' && match.team1?.stats && (
              <Badge variant="secondary" className="text-xs shrink-0">#1</Badge>
            )}
            <span className={cn("font-medium truncate", !match.team1 && "text-muted-foreground italic")}>{match.team1?.name ?? getTbdLabel(match.bracket)}</span>
          </div>
          <div className="font-bold text-lg ml-2">
            {isEditingThis
              ? (multiGame ? editGames.filter(g => g.team1Score > g.team2Score).length : team1Score)
              : (multiGame && displayGames.length ? t1GamesWon : matchTeam1Score)}
          </div>
        </div>

        {/* Individual game breakdown pill (multi-game only) */}
        {multiGame && displayGames.length > 0 && match.status === 'completed' && (
          <div className="flex flex-wrap gap-1 my-1">
            {displayGames.map((g, gi) => (
              <span key={gi} className="text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">
                G{gi + 1}: {g.team1Score}–{g.team2Score}
              </span>
            ))}
          </div>
        )}

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
              <span className="text-muted-foreground italic">
                {getTbdLabel(match.bracket)}
              </span>
            )}
          </div>
          <div className="font-bold text-lg ml-2">
            {match.team2
              ? isEditingThis
                ? (multiGame ? editGames.filter(g => g.team2Score > g.team1Score).length : team2Score)
                : (multiGame && displayGames.length ? t2GamesWon : matchTeam2Score)
              : '-'}
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

  // Group DE matches by round for column rendering
  const groupByRound = (ms: Match[]) => {
    const map = new Map<number, Match[]>();
    ms.forEach(m => {
      if (!map.has(m.round)) map.set(m.round, []);
      map.get(m.round)!.push(m);
    });
    return [...map.entries()].sort(([a], [b]) => a - b);
  };

  const wrByRound = groupByRound(deWinnersMatches);
  const lrByRound = groupByRound(deLosersMatches);

  return (
    <div className="space-y-6">
      {/* ── Double-Elimination Layout ── */}
      {isDoubleElim ? (
        <>
          {/* Winners Bracket */}
          <div className="pb-6 border-b border-border/50">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg">Winners Bracket</h3>
              <p className="text-sm text-muted-foreground">Lose here and drop to Losers Bracket</p>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-6 min-w-max pb-2">
                {wrByRound.map(([round, roundMatches]) => (
                  <div key={round} className="space-y-4 w-56">
                    <p className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-wide">
                      {round === wrMaxRound ? 'Winners Final' : `WR Round ${round}`}
                    </p>
                    {roundMatches.map(m => (
                      <MatchCard key={m._id} match={m} position="left" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Losers Bracket */}
          <div className="pb-6 border-b border-border/50">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg">Losers Bracket</h3>
              <p className="text-sm text-muted-foreground">Lose here and you're eliminated</p>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-6 min-w-max pb-2">
                {lrByRound.map(([round, roundMatches]) => (
                  <div key={round} className="space-y-4 w-56">
                    <p className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-wide">
                      {round === lrMaxRound ? 'Losers Final' : `LR Round ${round}`}
                    </p>
                    {roundMatches.map(m => (
                      <MatchCard key={m._id} match={m} position="left" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grand Finals */}
          <div>
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg">Grand Finals</h3>
              <p className="text-sm text-muted-foreground">
                Winners Bracket finalist (0 losses) vs Losers Bracket finalist (1 loss)
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-start">
              {deGfMatch && (
                <div className="w-full sm:w-64">
                  <p className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-wide mb-2">Grand Final</p>
                  <MatchCard match={deGfMatch} position="center" />
                </div>
              )}
              {/* Bracket reset — only show if it has been triggered (team1 populated) */}
              {deGfReset?.team1 && (
                <div className="w-full sm:w-64">
                  <p className="text-xs font-semibold text-center text-amber-600 uppercase tracking-wide mb-2">Bracket Reset</p>
                  <MatchCard match={deGfReset} position="center" />
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ── Single-Elimination Layout (unchanged) ── */}

          {/* Qualifiers (when 8+ teams: first round before semifinals) */}
          {qualifiers.length > 0 && (
            <div className="mb-8 pb-8 border-b border-border/50">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg">Qualifiers</h3>
                <p className="text-sm text-muted-foreground">Winners advance to semifinals</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {qualifiers.map((match) => (
                  <MatchCard key={match._id} match={match} position="left" />
                ))}
              </div>
            </div>
          )}

          {/* Bracket Visualization: Semifinals → Final + Bronze */}
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            {/* Semifinals Column */}
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg">Semifinals</h3>
                <p className="text-sm text-muted-foreground">{qualifiers.length > 0 ? 'Round 2' : 'Round 1'}</p>
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
                <p className="text-sm text-muted-foreground">Final — Winner 🥇 Gold, Loser 🥈 Silver</p>
              </div>
              {finals && <MatchCard match={finals} position="center" />}
            </div>
          </div>

          {/* Bronze Medal Match (semifinal losers) */}
          {bronzeMatch && (
            <div className="mt-8 pt-8 border-t border-border/50">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg">Bronze Medal Match</h3>
                <p className="text-sm text-muted-foreground">Semifinal losers — Winner 🥉 Bronze, Loser 4th place</p>
              </div>
              <div className="max-w-md mx-auto">
                <MatchCard match={bronzeMatch} position="center" />
              </div>
            </div>
          )}
        </>
      )}

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
              {selectedMatch ? getMatchLabel(selectedMatch) + ' Match' : 'Match Details'}
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
                  <p className="font-semibold">{selectedMatch.team1?.name ?? 'TBD'}</p>
                  {selectedMatch.team1?.players?.length ? (
                    <p className="text-sm text-muted-foreground">
                      {selectedMatch.team1.players.map((p: { name?: string }) => p.name).join(', ')}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Team 2</p>
                  <p className="font-semibold">
                    {selectedMatch.team2?.name ?? 'TBD'}
                  </p>
                  {selectedMatch.team2?.players?.length ? (
                    <p className="text-sm text-muted-foreground">
                      {selectedMatch.team2.players.map((p: { name?: string }) => p.name).join(', ')}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-3xl font-bold mt-1">
                      {getMatchScore(selectedMatch).team1}
                    </p>
                  </div>
                  <div className="text-muted-foreground">vs</div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-3xl font-bold mt-1">
                      {selectedMatch.team2 ? getMatchScore(selectedMatch).team2 : '-'}
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
              {isMatchMultiGame(editingMatch) ? (
                /* Multi-game score entry */
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-center truncate">{editingMatch.team1?.name ?? 'TBD'}</span>
                    <span />
                    <span className="text-sm font-semibold text-center truncate">{editingMatch.team2?.name ?? 'TBD'}</span>
                  </div>
                  {Array.from({ length: editingMatch.matchFormatConfig!.max_games }).map((_, gi) => {
                    const g = editGames[gi] ?? { team1Score: 0, team2Score: 0 };
                    const gamesToWin = editingMatch.matchFormatConfig!.games_to_win;
                    const t1w = editGames.slice(0, gi).filter(x => x.team1Score > x.team2Score).length;
                    const t2w = editGames.slice(0, gi).filter(x => x.team2Score > x.team1Score).length;
                    const seriesDone = t1w >= gamesToWin || t2w >= gamesToWin;
                    return (
                      <div key={gi} className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 ${seriesDone ? 'opacity-40 pointer-events-none' : ''}`}>
                        <Input
                          type="number"
                          className="input-no-spinner text-center font-bold"
                          min="0"
                          value={g.team1Score}
                          placeholder={`G${gi + 1}`}
                          onChange={(e) => {
                            const next = [...editGames];
                            next[gi] = { ...next[gi], team1Score: parseInt(e.target.value) || 0 };
                            setEditGames(next);
                          }}
                        />
                        <span className="text-xs text-muted-foreground text-center">G{gi + 1}</span>
                        <Input
                          type="number"
                          className="input-no-spinner text-center font-bold"
                          min="0"
                          value={g.team2Score}
                          placeholder={`G${gi + 1}`}
                          onChange={(e) => {
                            const next = [...editGames];
                            next[gi] = { ...next[gi], team2Score: parseInt(e.target.value) || 0 };
                            setEditGames(next);
                          }}
                        />
                      </div>
                    );
                  })}
                  {/* Live games-won summary */}
                  <div className="flex justify-between items-center pt-2 border-t text-sm font-semibold">
                    <span>{editGames.filter(g => g.team1Score > g.team2Score).length} games</span>
                    <span className="text-muted-foreground text-xs">Best of {editingMatch.matchFormatConfig!.max_games}</span>
                    <span>{editGames.filter(g => g.team2Score > g.team1Score).length} games</span>
                  </div>
                </div>
              ) : (
                /* Single-game score entry */
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{editingMatch.team1?.name ?? 'TBD'}</label>
                    <Input type="number" className="input-no-spinner" min="0" value={team1Score} onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{editingMatch.team2?.name || 'TBD'}</label>
                    <Input type="number" className="input-no-spinner" min="0" value={team2Score} onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)} disabled={!editingMatch.team2} />
                  </div>
                </div>
              )}
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

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, CircleNotch, PencilSimple, Check, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { formatMatchFormatShort } from "@/constants/matchFormat";
import { Eyebrow, Pill, PbBtn, Dot } from "@/components/ui/pb";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Team {
  _id: string;
  name: string;
  players?: { name?: string }[];
  stats?: { wins: number; losses: number };
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

// ─── Constants for SVG connector math ────────────────────────────────────────

const CARD_H = 106; // header(28) + team1(39) + team2(39)
const CARD_GAP = 12; // gap-3

// ─── SVG connector between adjacent rounds ───────────────────────────────────

function BracketConnectors({ sourceCount }: { sourceCount: number }) {
  if (sourceCount <= 1) return null;
  const targetCount = Math.ceil(sourceCount / 2);
  const totalH = sourceCount * CARD_H + (sourceCount - 1) * CARD_GAP;
  const W = 32;
  const midX = W / 2;

  return (
    <svg
      width={W}
      height={totalH}
      className="shrink-0 self-start"
      style={{ overflow: "visible" }}
    >
      {Array.from({ length: targetCount }).map((_, i) => {
        const topIdx = i * 2;
        const botIdx = i * 2 + 1;
        const y1 = topIdx * (CARD_H + CARD_GAP) + CARD_H / 2;
        const y2 =
          botIdx < sourceCount
            ? botIdx * (CARD_H + CARD_GAP) + CARD_H / 2
            : y1;
        const yMid = (y1 + y2) / 2;
        return (
          <g key={i}>
            <path
              d={`M 0 ${y1} H ${midX} V ${yMid} H ${W}`}
              fill="none"
              stroke="#E5E0D5"
              strokeWidth="1"
            />
            {botIdx < sourceCount && (
              <path
                d={`M 0 ${y2} H ${midX} V ${yMid}`}
                fill="none"
                stroke="#E5E0D5"
                strokeWidth="1"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Column margin — vertically centre a halved column against its source ─────

function columnMarginTop(sourceCount: number): number {
  if (sourceCount <= 1) return 0;
  // centre of first target = midpoint of card 0 and card 1
  return (CARD_H + CARD_GAP) / 2;
}

// ─── Main component ───────────────────────────────────────────────────────────

const PlayoffBracket = ({ matches, onUpdateScore, isUpdating }: PlayoffBracketProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [editGames, setEditGames] = useState<GameScore[]>([]);

  // ── Partition ──────────────────────────────────────────────────────────────

  const isDoubleElim = matches.some((m) => m.bracket === "losers");

  const qualifiers   = matches.filter((m) => m.bracket === "winners");
  const semifinals   = matches.filter((m) => m.bracket === "semifinals");
  const finals       = matches.find((m) => m.bracket === "finals" && !m.isGrandFinalReset);
  const bronzeMatch  = matches.find((m) => m.bracket === "bronze");

  const deWinnersMatches = matches.filter((m) => m.bracket === "winners");
  const deLosersMatches  = matches.filter((m) => m.bracket === "losers");
  const deGfMatch  = matches.find((m) => m.bracket === "finals" && !m.isGrandFinalReset);
  const deGfReset  = matches.find((m) => m.bracket === "finals" && m.isGrandFinalReset);

  const wrMaxRound = deWinnersMatches.reduce((max, m) => Math.max(max, m.round), 0);
  const lrMaxRound = deLosersMatches.reduce((max, m) => Math.max(max, m.round), 0);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getMatchScore = (match: Match) => ({
    team1: match.team1Score ?? match.score?.team1Score ?? 0,
    team2: match.team2Score ?? match.score?.team2Score ?? 0,
  });

  const isMatchMultiGame = (match: Match) =>
    (match.matchFormatConfig?.games_to_win ?? 1) > 1;

  const getTbdLabel = (bracket: string) => {
    if (bracket === "bronze")     return "Semifinal loser";
    if (bracket === "finals")     return "Winner of Semifinal";
    if (bracket === "semifinals") return qualifiers.length > 0 ? "Winner of Qualifier" : "TBD";
    return "TBD";
  };

  const getMatchLabel = (match: Match): string => {
    if (isDoubleElim) {
      if (match.bracket === "winners") return match.round === wrMaxRound ? "Winners Final" : `WR Round ${match.round}`;
      if (match.bracket === "losers")  return match.round === lrMaxRound ? "Losers Final" : `LR Round ${match.round}`;
      if (match.bracket === "finals")  return match.isGrandFinalReset ? "Bracket Reset" : "Grand Final";
    }
    if (match.bracket === "semifinals") return "Semifinal";
    if (match.bracket === "winners")    return "Qualifier";
    if (match.bracket === "bronze")     return "Bronze Medal";
    return "Final";
  };

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
      onUpdateScore(editingMatch._id, { games: editGames, status: "completed" });
    } else {
      onUpdateScore(editingMatch._id, { team1Score, team2Score, status: "completed" });
    }
    setEditingMatch(null);
  };

  const handleMatchClick = (match: Match) => setSelectedMatch(match);

  // ── Match card ─────────────────────────────────────────────────────────────

  const MatchCard = ({ match }: { match: Match }) => {
    const score      = getMatchScore(match);
    const multiGame  = isMatchMultiGame(match);
    const dispGames  = match.games ?? [];
    const t1GamesWon = dispGames.filter((g) => g.team1Score > g.team2Score).length;
    const t2GamesWon = dispGames.filter((g) => g.team2Score > g.team1Score).length;

    const winner =
      multiGame && dispGames.length
        ? t1GamesWon > t2GamesWon ? match.team1 : t2GamesWon > t1GamesWon ? match.team2 : null
        : score.team1 > score.team2 ? match.team1 : score.team2 > score.team1 ? match.team2 : null;

    const isEditingThis = editingMatch?._id === match._id;
    const isComplete    = match.status === "completed";
    const isSelected    = selectedMatch?._id === match._id;

    const t1Score = isEditingThis
      ? (multiGame ? editGames.filter((g) => g.team1Score > g.team2Score).length : team1Score)
      : (multiGame && dispGames.length ? t1GamesWon : score.team1);
    const t2Score = isEditingThis
      ? (multiGame ? editGames.filter((g) => g.team2Score > g.team1Score).length : team2Score)
      : (multiGame && dispGames.length ? t2GamesWon : score.team2);

    const t1Win = isComplete && winner?._id === match.team1?._id;
    const t2Win = isComplete && winner?._id === match.team2?._id;

    return (
      <div
        className={cn(
          "w-[224px] bg-pb-surface rounded-[6px] overflow-hidden cursor-pointer transition-colors shrink-0",
          isSelected ? "border border-pb-rule" : "border border-pb-hairline hover:border-pb-rule"
        )}
        onClick={() => handleMatchClick(match)}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-[6px] border-b border-pb-hairline bg-pb-surface2">
          <Eyebrow>{getMatchLabel(match)}</Eyebrow>
          <div className="flex items-center gap-2">
            {match.matchFormat && (
              <span className="text-[10px] font-mono text-pb-faint">{formatMatchFormatShort(match.matchFormat)}</span>
            )}
            {isComplete && <Dot color="court" size={5} />}
            {onUpdateScore && match.team1 && match.team2 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleEditClick(match); }}
                className="text-pb-faint hover:text-pb-muted transition-colors"
              >
                <PencilSimple size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Team 1 */}
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2.5 border-b border-pb-hairline",
            t1Win ? "bg-pb-court-tint2 border-l-2 border-l-pb-court" : "border-l-2 border-l-transparent"
          )}
        >
          <span className={cn(
            "text-[13px] font-display font-semibold tracking-[-0.015em] truncate flex-1 leading-snug",
            !match.team1 && "text-pb-faint italic font-normal text-[12px]",
            t1Win && "text-pb-court"
          )}>
            {match.team1?.name ?? getTbdLabel(match.bracket)}
          </span>
          <span className={cn(
            "font-mono text-[13px] ml-2 shrink-0 tabular-nums",
            t1Win ? "font-bold text-pb-court" : "text-pb-muted"
          )}>
            {t1Score}
          </span>
        </div>

        {/* Team 2 */}
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2.5",
            t2Win ? "bg-pb-court-tint2 border-l-2 border-l-pb-court" : "border-l-2 border-l-transparent"
          )}
        >
          <span className={cn(
            "text-[13px] font-display font-semibold tracking-[-0.015em] truncate flex-1 leading-snug",
            !match.team2 && "text-pb-faint italic font-normal text-[12px]",
            t2Win && "text-pb-court"
          )}>
            {match.team2?.name ?? getTbdLabel(match.bracket)}
          </span>
          <span className={cn(
            "font-mono text-[13px] ml-2 shrink-0 tabular-nums",
            t2Win ? "font-bold text-pb-court" : "text-pb-muted"
          )}>
            {match.team2 ? t2Score : "—"}
          </span>
        </div>

        {/* Multi-game breakdown */}
        {multiGame && dispGames.length > 0 && isComplete && (
          <div className="px-3 pt-1.5 pb-2 border-t border-pb-hairline flex flex-wrap gap-1">
            {dispGames.map((g, gi) => (
              <span key={gi} className="text-[9px] font-mono text-pb-faint bg-pb-surface2 rounded px-1.5 py-0.5">
                G{gi + 1}: {g.team1Score}–{g.team2Score}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Group DE matches by round ──────────────────────────────────────────────

  const groupByRound = (ms: Match[]) => {
    const map = new Map<number, Match[]>();
    ms.forEach((m) => {
      if (!map.has(m.round)) map.set(m.round, []);
      map.get(m.round)!.push(m);
    });
    return [...map.entries()].sort(([a], [b]) => a - b);
  };

  const wrByRound = groupByRound(deWinnersMatches);
  const lrByRound = groupByRound(deLosersMatches);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {isDoubleElim ? (
        /* ── Double-Elimination ────────────────────────────────────────────── */
        <>
          {/* Winners bracket */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Eyebrow>Winners Bracket</Eyebrow>
              <div className="flex-1 h-px bg-pb-hairline" />
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex items-start gap-0 min-w-max">
                {wrByRound.map(([round, roundMatches], colIdx) => {
                  const prevCount = colIdx > 0 ? wrByRound[colIdx - 1][1].length : 0;
                  const mt = colIdx > 0 ? columnMarginTop(prevCount) : 0;
                  return (
                    <div key={round} className="flex items-start gap-0">
                      {colIdx > 0 && (
                        <div style={{ marginTop: mt }}>
                          <BracketConnectors sourceCount={prevCount} />
                        </div>
                      )}
                      <div
                        className="flex flex-col"
                        style={{ gap: CARD_GAP, marginTop: colIdx > 0 ? mt : 0 }}
                      >
                        <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-muted text-center px-1 mb-1">
                          {round === wrMaxRound ? "Winners Final" : `WR Round ${round}`}
                        </p>
                        {roundMatches.map((m) => (
                          <MatchCard key={m._id} match={m} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Losers bracket */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Eyebrow>Losers Bracket</Eyebrow>
              <div className="flex-1 h-px bg-pb-hairline" />
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex items-start gap-0 min-w-max">
                {lrByRound.map(([round, roundMatches], colIdx) => {
                  const prevCount = colIdx > 0 ? lrByRound[colIdx - 1][1].length : 0;
                  const mt = colIdx > 0 ? columnMarginTop(prevCount) : 0;
                  return (
                    <div key={round} className="flex items-start gap-0">
                      {colIdx > 0 && (
                        <div style={{ marginTop: mt }}>
                          <BracketConnectors sourceCount={prevCount} />
                        </div>
                      )}
                      <div
                        className="flex flex-col"
                        style={{ gap: CARD_GAP, marginTop: colIdx > 0 ? mt : 0 }}
                      >
                        <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-muted text-center px-1 mb-1">
                          {round === lrMaxRound ? "Losers Final" : `LR Round ${round}`}
                        </p>
                        {roundMatches.map((m) => (
                          <MatchCard key={m._id} match={m} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grand Finals */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Eyebrow>Grand Finals</Eyebrow>
              <div className="flex-1 h-px bg-pb-hairline" />
            </div>
            <div className="flex flex-wrap gap-6">
              {deGfMatch && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-muted mb-2">Grand Final</p>
                  <MatchCard match={deGfMatch} />
                </div>
              )}
              {deGfReset?.team1 && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-amber mb-2">Bracket Reset</p>
                  <MatchCard match={deGfReset} />
                </div>
              )}
            </div>
          </div>

          {bronzeMatch && (
            <div className="pt-6 border-t border-pb-hairline">
              <div className="flex items-center gap-3 mb-4">
                <Eyebrow>Bronze Medal</Eyebrow>
                <div className="flex-1 h-px bg-pb-hairline" />
              </div>
              <MatchCard match={bronzeMatch} />
            </div>
          )}
        </>
      ) : (
        /* ── Single-Elimination ────────────────────────────────────────────── */
        <>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-start gap-0 min-w-max">

              {/* Qualifiers column */}
              {qualifiers.length > 0 && (
                <>
                  <div className="flex flex-col" style={{ gap: CARD_GAP }}>
                    <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-muted text-center px-1 mb-1">
                      Qualifiers
                    </p>
                    {qualifiers.map((m) => <MatchCard key={m._id} match={m} />)}
                  </div>
                  {semifinals.length > 0 && (
                    <div style={{ marginTop: CARD_H / 2 + 22 }}>
                      <BracketConnectors sourceCount={qualifiers.length} />
                    </div>
                  )}
                </>
              )}

              {/* Semifinals column */}
              {semifinals.length > 0 && (
                <>
                  <div
                    className="flex flex-col"
                    style={{
                      gap: CARD_GAP,
                      marginTop: qualifiers.length > 0 ? columnMarginTop(qualifiers.length) + 22 : 0,
                    }}
                  >
                    <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-muted text-center px-1 mb-1">
                      Semifinals
                    </p>
                    {semifinals.map((m) => <MatchCard key={m._id} match={m} />)}
                  </div>
                  {finals && (
                    <div
                      style={{
                        marginTop: (qualifiers.length > 0 ? columnMarginTop(qualifiers.length) + 22 : 0),
                      }}
                    >
                      <BracketConnectors sourceCount={semifinals.length} />
                    </div>
                  )}
                </>
              )}

              {/* Finals column */}
              {finals && (
                <div
                  className="flex flex-col"
                  style={{
                    marginTop:
                      (qualifiers.length > 0 ? columnMarginTop(qualifiers.length) + 22 : 0) +
                      (semifinals.length > 0 ? columnMarginTop(semifinals.length) : 0),
                  }}
                >
                  <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-muted text-center px-1 mb-1">
                    Championship
                  </p>
                  <MatchCard match={finals} />
                </div>
              )}
            </div>
          </div>

          {/* Bronze match */}
          {bronzeMatch && (
            <div className="pt-6 border-t border-pb-hairline">
              <div className="flex items-center gap-3 mb-4">
                <Eyebrow>Bronze Medal</Eyebrow>
                <div className="flex-1 h-px bg-pb-hairline" />
              </div>
              <MatchCard match={bronzeMatch} />
            </div>
          )}
        </>
      )}

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-pb-hairline">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm border-l-2 border-l-pb-court bg-pb-court-tint2" />
          <span className="text-[11px] font-mono text-pb-muted">Winner</span>
        </div>
        <div className="flex items-center gap-2">
          <Dot color="court" size={5} />
          <span className="text-[11px] font-mono text-pb-muted">Complete</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm border border-pb-rule" />
          <span className="text-[11px] font-mono text-pb-muted">Selected</span>
        </div>
      </div>

      {/* ── Match detail dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="max-w-sm bg-pb-surface border border-pb-hairline rounded-[8px] p-0">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-pb-hairline">
            <DialogTitle className="font-display font-bold text-[17px] tracking-[-0.025em] text-pb-ink">
              {selectedMatch ? getMatchLabel(selectedMatch) : "Match Details"}
            </DialogTitle>
            <DialogDescription className="text-[12px] font-mono text-pb-muted mt-0.5">
              Match details
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 divide-x divide-pb-hairline">
                <div className="pr-4">
                  <p className="text-[10px] font-mono text-pb-muted uppercase tracking-[0.1em] mb-1">Team 1</p>
                  <p className="text-[14px] font-display font-semibold text-pb-ink">
                    {selectedMatch.team1?.name ?? "TBD"}
                  </p>
                  {selectedMatch.team1?.players?.length ? (
                    <p className="text-[11px] font-mono text-pb-muted mt-0.5">
                      {selectedMatch.team1.players.map((p) => p.name).join(", ")}
                    </p>
                  ) : null}
                </div>
                <div className="pl-4">
                  <p className="text-[10px] font-mono text-pb-muted uppercase tracking-[0.1em] mb-1">Team 2</p>
                  <p className="text-[14px] font-display font-semibold text-pb-ink">
                    {selectedMatch.team2?.name ?? "TBD"}
                  </p>
                  {selectedMatch.team2?.players?.length ? (
                    <p className="text-[11px] font-mono text-pb-muted mt-0.5">
                      {selectedMatch.team2.players.map((p) => p.name).join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 py-4 bg-pb-surface2 rounded-[6px] border border-pb-hairline">
                <span className="font-mono text-[36px] font-bold text-pb-ink tabular-nums leading-none">
                  {getMatchScore(selectedMatch).team1}
                </span>
                <span className="text-[11px] font-mono text-pb-faint uppercase tracking-[0.1em]">vs</span>
                <span className="font-mono text-[36px] font-bold text-pb-ink tabular-nums leading-none">
                  {selectedMatch.team2 ? getMatchScore(selectedMatch).team2 : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <Eyebrow>Status</Eyebrow>
                <Pill
                  tone={selectedMatch.status === "completed" ? "court" : "neutral"}
                  mono
                  className="capitalize"
                >
                  {selectedMatch.status}
                </Pill>
              </div>
            </div>
          )}

          <DialogFooter className="px-5 pb-5">
            <PbBtn variant="outline" size="sm" onClick={() => setSelectedMatch(null)}>
              Close
            </PbBtn>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Score edit dialog ────────────────────────────────────────────────── */}
      <Dialog open={!!editingMatch} onOpenChange={() => setEditingMatch(null)}>
        <DialogContent className="max-w-sm bg-pb-surface border border-pb-hairline rounded-[8px] p-0">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-pb-hairline">
            <DialogTitle className="font-display font-bold text-[17px] tracking-[-0.025em] text-pb-ink">
              Update Score
            </DialogTitle>
            <DialogDescription className="text-[12px] font-mono text-pb-muted mt-0.5">
              Enter the final scores for this match
            </DialogDescription>
          </DialogHeader>

          {editingMatch && (
            <div className="px-5 py-4">
              {isMatchMultiGame(editingMatch) ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-2 mb-2">
                    <span className="text-[12px] font-display font-semibold text-pb-ink text-center truncate">
                      {editingMatch.team1?.name ?? "TBD"}
                    </span>
                    <span />
                    <span className="text-[12px] font-display font-semibold text-pb-ink text-center truncate">
                      {editingMatch.team2?.name ?? "TBD"}
                    </span>
                  </div>
                  {Array.from({ length: editingMatch.matchFormatConfig!.max_games }).map((_, gi) => {
                    const g = editGames[gi] ?? { team1Score: 0, team2Score: 0 };
                    const gamesToWin = editingMatch.matchFormatConfig!.games_to_win;
                    const t1w = editGames.slice(0, gi).filter((x) => x.team1Score > x.team2Score).length;
                    const t2w = editGames.slice(0, gi).filter((x) => x.team2Score > x.team1Score).length;
                    const done = t1w >= gamesToWin || t2w >= gamesToWin;
                    return (
                      <div
                        key={gi}
                        className={cn(
                          "grid grid-cols-[1fr_28px_1fr] items-center gap-2",
                          done && "opacity-40 pointer-events-none"
                        )}
                      >
                        <Input
                          type="number"
                          className="input-no-spinner text-center font-mono h-9 bg-pb-surface2 border-pb-hairline"
                          min="0"
                          value={g.team1Score}
                          placeholder={`G${gi + 1}`}
                          onChange={(e) => {
                            const next = [...editGames];
                            next[gi] = { ...next[gi], team1Score: parseInt(e.target.value) || 0 };
                            setEditGames(next);
                          }}
                        />
                        <span className="text-[10px] font-mono text-pb-faint text-center">G{gi + 1}</span>
                        <Input
                          type="number"
                          className="input-no-spinner text-center font-mono h-9 bg-pb-surface2 border-pb-hairline"
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
                  <div className="flex justify-between items-center pt-2 border-t border-pb-hairline text-[12px] font-mono">
                    <span className="font-medium text-pb-ink">
                      {editGames.filter((g) => g.team1Score > g.team2Score).length} games
                    </span>
                    <span className="text-pb-faint">Best of {editingMatch.matchFormatConfig!.max_games}</span>
                    <span className="font-medium text-pb-ink">
                      {editGames.filter((g) => g.team2Score > g.team1Score).length} games
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-muted block mb-1.5">
                      {editingMatch.team1?.name ?? "TBD"}
                    </label>
                    <Input
                      type="number"
                      className="input-no-spinner font-mono text-center h-10 bg-pb-surface2 border-pb-hairline"
                      min="0"
                      value={team1Score}
                      onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-muted block mb-1.5">
                      {editingMatch.team2?.name ?? "TBD"}
                    </label>
                    <Input
                      type="number"
                      className="input-no-spinner font-mono text-center h-10 bg-pb-surface2 border-pb-hairline"
                      min="0"
                      value={team2Score}
                      disabled={!editingMatch.team2}
                      onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="px-5 pb-5 flex gap-2">
            <PbBtn variant="outline" size="sm" onClick={() => setEditingMatch(null)}>
              <X size={13} /> Cancel
            </PbBtn>
            <PbBtn
              variant="primary"
              size="sm"
              onClick={handleSaveScore}
              disabled={isUpdating || !editingMatch?.team2}
            >
              {isUpdating ? (
                <><CircleNotch size={13} className="animate-spin" /> Saving…</>
              ) : (
                <><Check size={13} /> Save Score</>
              )}
            </PbBtn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayoffBracket;

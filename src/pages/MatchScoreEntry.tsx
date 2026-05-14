import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Pill, Dot } from "@/components/ui/pb";
import { Plus, Check, CircleNotch, Warning, ArrowLeft } from "@phosphor-icons/react";
import { poolAPI, matchAPI, tournamentAPI } from "@/services/api";
import { type MatchFormatConfig, formatMatchFormatShort } from "@/constants/matchFormat";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

// ─── Rally logic ──────────────────────────────────────────────────────────────

type Scorer = 1 | 2;

function gameScore(rallies: Scorer[]) {
  return rallies.reduce(
    (acc, r) => r === 1 ? { t1: acc.t1 + 1, t2: acc.t2 } : { t1: acc.t1, t2: acc.t2 + 1 },
    { t1: 0, t2: 0 }
  );
}

function rallyLabel(rallies: Scorer[], idx: number): string {
  const { t1, t2 } = gameScore(rallies.slice(0, idx + 1));
  return `${rallies[idx] === 1 ? t1 : t2}${rallies[idx] === 1 ? "A" : "B"}`;
}

function isGameDone(s: { t1: number; t2: number }, fmt: MatchFormatConfig): boolean {
  const { points_to_win, win_by, hard_cap } = fmt;
  // Hard cap: whoever hits it first wins, regardless of margin
  if (hard_cap != null && (s.t1 >= hard_cap || s.t2 >= hard_cap)) return true;
  const leader = Math.max(s.t1, s.t2);
  const trailer = Math.min(s.t1, s.t2);
  return leader >= points_to_win && leader - trailer >= win_by;
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function fetchMatchData(tournamentId: string, matchId: string) {
  const res = await tournamentAPI.getById(tournamentId);
  const tournament = res.data;
  for (const event of tournament.events ?? []) {
    const poolsRes = await poolAPI.getByEvent(event._id);
    for (const pool of poolsRes?.data ?? []) {
      const matchesRes = await matchAPI.getByPool(pool._id);
      const match = (matchesRes?.data ?? []).find((m: any) => m._id === matchId);
      if (match) return { match, tournament, event, pool };
    }
  }
  throw new Error("Match not found");
}

// ─── Default format (fallback when match has no config) ───────────────────────

const DEFAULT_FMT: MatchFormatConfig = {
  games_to_win: 1,
  max_games: 1,
  points_to_win: 11,
  win_by: 2,
  hard_cap: null,
};

// ─── Score entry page ─────────────────────────────────────────────────────────

const MatchScoreEntry = () => {
  const { tournamentId, matchId } = useParams<{ tournamentId: string; matchId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["match-entry", tournamentId, matchId],
    queryFn: () => fetchMatchData(tournamentId!, matchId!),
    enabled: !!tournamentId && !!matchId,
  });

  // ── Format config (from match data, field-level defaults for nulls) ──────
  const raw = data?.match?.matchFormatConfig;
  const fmt: MatchFormatConfig = {
    games_to_win: raw?.games_to_win   ?? DEFAULT_FMT.games_to_win,
    max_games:    raw?.max_games      ?? DEFAULT_FMT.max_games,
    points_to_win: raw?.points_to_win ?? DEFAULT_FMT.points_to_win,
    win_by:       raw?.win_by         ?? DEFAULT_FMT.win_by,
    hard_cap:     raw?.hard_cap       ?? DEFAULT_FMT.hard_cap,
  };
  const MAX_GAMES  = Math.max(1, fmt.max_games);
  const GAME_TO    = Math.max(1, fmt.points_to_win);
  const WIN_BY     = Math.max(1, fmt.win_by);
  const GAMES_NEED = Math.max(1, fmt.games_to_win);

  // ── Scoring state ────────────────────────────────────────────────────────
  const [gameRallies, setGameRallies] = useState<Scorer[][]>(() =>
    Array.from({ length: MAX_GAMES }, () => [])
  );
  const [currentGame, setCurrentGame] = useState(0);
  const [serving, setServing] = useState<1 | 2>(1);

  // Reset game array if format changes after data loads
  useEffect(() => {
    setGameRallies(Array.from({ length: MAX_GAMES }, () => []));
    setCurrentGame(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MAX_GAMES]);

  // Elapsed timer
  const [startedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState("00:00");
  useEffect(() => {
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  // Computed
  const gameScores = gameRallies.map(gameScore);
  const gamesWon = gameScores.reduce(
    (acc, s, i) => !isGameDone(s, fmt) ? acc : s.t1 > s.t2
      ? { t1: acc.t1 + 1, t2: acc.t2 }
      : { t1: acc.t1, t2: acc.t2 + 1 },
    { t1: 0, t2: 0 }
  );
  const matchWinner: 1 | 2 | null =
    gamesWon.t1 >= GAMES_NEED ? 1 : gamesWon.t2 >= GAMES_NEED ? 2 : null;

  // Win probability heuristic
  const cur = gameScores[currentGame] ?? { t1: 0, t2: 0 };
  const ptAdv = (cur.t1 - cur.t2) / Math.max(cur.t1 + cur.t2, 1) * 0.12;
  const gAdv  = (gamesWon.t1 - gamesWon.t2) / GAMES_NEED * 0.30;
  const t1ProbRaw = Math.min(0.95, Math.max(0.05, 0.5 + gAdv + ptAdv));
  const t1Prob = Math.round(t1ProbRaw * 100);
  const t2Prob = 100 - t1Prob;
  const probLeader: 1 | 2 | null = t1Prob > 54 ? 1 : t2Prob > 54 ? 2 : null;

  // ── Actions ──────────────────────────────────────────────────────────────

  const addPoint = (scorer: Scorer) => {
    setGameRallies(prev => {
      const updated = prev.map((g, i) => i === currentGame ? [...g, scorer] : g);
      const newScore = gameScore(updated[currentGame]);
      if (isGameDone(newScore, fmt) && currentGame < MAX_GAMES - 1) {
        setTimeout(() => setCurrentGame(g => g + 1), 400);
      }
      return updated;
    });
  };

  const undoLast = () => {
    setGameRallies(prev =>
      prev.map((g, i) => i === currentGame && g.length > 0 ? g.slice(0, -1) : g)
    );
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  // Single-game formats: store the actual point score (e.g. 11–9).
  // Multi-game formats: store games won (e.g. 2–1) + per-game detail array.

  const submitMutation = useMutation({
    mutationFn: () => {
      const completedGames = gameScores.filter((_, i) => i <= currentGame);
      const isSingleGame = MAX_GAMES === 1;

      const payload: Parameters<typeof matchAPI.updateScore>[1] = isSingleGame
        ? {
            team1Score: completedGames[0]?.t1 ?? 0,
            team2Score: completedGames[0]?.t2 ?? 0,
            status: "completed",
          }
        : {
            team1Score: gamesWon.t1,
            team2Score: gamesWon.t2,
            games: completedGames.map(s => ({ team1Score: s.t1, team2Score: s.t2 })),
            status: "completed",
          };

      return matchAPI.updateScore(matchId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scores", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      toast.success("Match result saved");
      navigate(`/tournaments/${tournamentId}?tab=scores`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save"),
  });

  // ── States ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Layout variant="minimal">
        <div className="min-h-screen bg-pb-paper flex items-center justify-center">
          <CircleNotch size={28} className="animate-spin text-pb-muted" />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout variant="minimal">
        <div className="min-h-screen bg-pb-paper flex items-center justify-center px-4">
          <div className="text-center">
            <Warning size={22} className="text-pb-muted mx-auto mb-3" />
            <p className="text-[13px] font-mono text-pb-muted mb-4">Match not found</p>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-[6px] border border-pb-hairline text-[13px] font-mono text-pb-ink hover:border-pb-rule transition-colors"
            >
              <ArrowLeft size={13} /> Go back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const { match, tournament, event, pool } = data;

  const t1Name    = match.team1?.name || "Team 1";
  const t2Name    = match.team2?.name || "Team 2";
  const t1Players = (match.team1?.players ?? []).map((p: any) => p.name).filter(Boolean).join(" / ");
  const t2Players = (match.team2?.players ?? []).map((p: any) => p.name).filter(Boolean).join(" / ");
  const courtStr  = match.courtNumber != null ? `Court ${match.courtNumber}` : null;
  const roundStr  = match.round != null ? `Round ${match.round}` : (pool.name || null);
  const crumbs    = [tournament.name, courtStr, roundStr].filter(Boolean).join(" · ");
  const fmtShort  = formatMatchFormatShort(match.matchFormat);
  const fmtLabel  = fmtShort !== "—"
    ? fmtShort
    : MAX_GAMES > 1
      ? `Best of ${MAX_GAMES} · to ${GAME_TO} · win by ${WIN_BY}`
      : `First to ${GAME_TO} · win by ${WIN_BY}`;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Layout variant="minimal">
      <div className="min-h-screen bg-pb-paper">

        {/* ══ MOBILE SCORE ENTRY (full-bleed dark UI) ══ */}
        <div className="md:hidden flex flex-col" style={{ minHeight: "100dvh", background: "#0F0F0E", color: "#F5F2EB" }}>

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#3A3833] shrink-0">
            <div className="min-w-0">
              <p className="font-mono text-[10px] text-[#6B6863] uppercase tracking-[0.12em] truncate">{crumbs}</p>
              <p className="font-mono text-[11px] text-[#6B6863]">{fmtLabel}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <Dot color="amber" size={5} pulse />
              <span className="font-mono text-[11px] font-bold text-pb-amber uppercase tracking-wide">LIVE</span>
            </div>
          </div>

          {/* Two tap zones */}
          <div className="flex flex-col flex-1 overflow-hidden">

            {/* Team 1 — court green */}
            <button
              className="flex-1 relative flex flex-col justify-between p-5 active:opacity-90 transition-opacity focus:outline-none"
              style={{ background: "var(--pb-court)" }}
              onClick={() => !matchWinner && addPoint(1)}
              disabled={!!matchWinner}
            >
              {/* Top: serving/receiving + seed */}
              <div className="flex items-center gap-2">
                <p className="font-mono text-[10px] text-white/70 uppercase tracking-[0.1em]">
                  {serving === 1 ? "SERVING" : "RECEIVING"}
                  {match.team1?.seed != null ? ` · SEED ${match.team1.seed}` : ""}
                </p>
                {serving === 1 && <span className="w-[5px] h-[5px] rounded-full bg-white/70 inline-block shrink-0" />}
              </div>

              {/* Team name */}
              <p className="font-display font-bold text-[22px] text-white leading-tight">{t1Name}</p>

              {/* Bottom row: hint + score */}
              <div className="flex items-end justify-between">
                <span className="font-mono text-[10px] text-white/50 uppercase tracking-[0.08em]">TAP TO ADD POINT</span>
                <span
                  className="font-mono font-bold tabular-nums leading-none text-white"
                  style={{ fontSize: "110px", lineHeight: 1 }}
                >
                  {cur.t1}
                </span>
              </div>
            </button>

            {/* Center divider */}
            <div
              className="flex items-center justify-between px-4 py-2 shrink-0"
              style={{ background: "#0F0E0C", borderTop: "1px solid #3A3833", borderBottom: "1px solid #3A3833" }}
            >
              <span className="font-mono text-[10px] text-[#6B6863] uppercase tracking-[0.1em]">
                {cur.t1 > cur.t2 ? `${t1Name} LEADS` : cur.t2 > cur.t1 ? `${t2Name} LEADS` : "TIED"}
              </span>
              <div className="flex items-center gap-1.5">
                {gameScores.slice(0, currentGame + 1).map((s, i) => {
                  const done = isGameDone(s, fmt) || i < currentGame;
                  return (
                    <span
                      key={i}
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
                      style={{
                        background: i === currentGame ? "rgba(255,255,255,0.08)" : "transparent",
                        borderColor: i === currentGame ? "#6B6863" : "#3A3833",
                        color: done ? "#9C9890" : "#F5F2EB",
                      }}
                    >
                      {s.t1}–{s.t2}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Team 2 — warm white */}
            <button
              className="flex-1 relative flex flex-col justify-between p-5 active:opacity-90 transition-opacity focus:outline-none"
              style={{ background: "#FFF" }}
              onClick={() => !matchWinner && addPoint(2)}
              disabled={!!matchWinner}
            >
              {/* Top: serving/receiving + seed */}
              <div className="flex items-center gap-2">
                <p className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.1em]">
                  {serving === 2 ? "SERVING" : "RECEIVING"}
                  {match.team2?.seed != null ? ` · SEED ${match.team2.seed}` : ""}
                </p>
                {serving === 2 && <Dot color="court" size={5} />}
              </div>

              {/* Team name */}
              <p className="font-display font-bold text-[22px] text-pb-ink leading-tight">{t2Name}</p>

              {/* Bottom row: hint + score */}
              <div className="flex items-end justify-between">
                <span className="font-mono text-[10px] text-pb-faint uppercase tracking-[0.08em]">TAP TO ADD POINT</span>
                <span
                  className="font-mono font-bold tabular-nums leading-none text-pb-ink"
                  style={{ fontSize: "110px", lineHeight: 1 }}
                >
                  {cur.t2}
                </span>
              </div>
            </button>
          </div>

          {/* Match winner banner on mobile */}
          {matchWinner && (
            <div className="px-4 py-3 shrink-0" style={{ background: "var(--pb-court)", borderTop: "1px solid #3A3833" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] text-white/60 uppercase tracking-[0.1em] mb-0.5">Match winner</p>
                  <p className="font-display font-bold text-[20px] text-white leading-none">
                    {matchWinner === 1 ? t1Name : t2Name}
                  </p>
                </div>
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="shrink-0 flex items-center gap-2 h-10 px-4 rounded-[6px] border border-white/30 text-white text-[13px] font-mono font-semibold"
                >
                  {submitMutation.isPending
                    ? <CircleNotch size={14} className="animate-spin" />
                    : <><Check size={14} weight="bold" /> Submit</>}
                </button>
              </div>
            </div>
          )}

          {/* Bottom action bar */}
          <div
            className="shrink-0 flex items-center gap-2 px-4 py-3"
            style={{ background: "#0F0E0C", borderTop: "1px solid #3A3833" }}
          >
            <button
              onClick={undoLast}
              disabled={gameRallies[currentGame]?.length === 0}
              className="flex-1 h-10 rounded-[6px] border font-mono text-[12px] font-medium transition-colors disabled:opacity-30"
              style={{ borderColor: "#3A3833", color: "#9C9890", background: "transparent" }}
            >
              Undo
            </button>
            <button
              onClick={() => setServing(s => s === 1 ? 2 : 1)}
              className="flex-1 h-10 rounded-[6px] border font-mono text-[12px] font-medium"
              style={{ borderColor: "#3A3833", color: "#9C9890", background: "transparent" }}
            >
              Side-out
            </button>
            <button
              className="flex-1 h-10 rounded-[6px] border font-mono text-[12px] font-medium"
              style={{ borderColor: "#3A3833", color: "#9C9890", background: "transparent" }}
            >
              Timeout
            </button>
          </div>
        </div>

        {/* ══ DESKTOP layout (md+) ══ */}
        <div className="hidden md:block max-w-[1100px] mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* Page header */}
          <div>
            <p className="text-[11px] font-mono text-pb-faint uppercase tracking-[0.12em] mb-2">
              {crumbs}
            </p>
            <h1 className="font-display font-extrabold text-[40px] sm:text-[52px] tracking-[-0.04em] leading-none text-pb-ink">
              Score entry
            </h1>
          </div>

          <div className="h-px bg-pb-hairline" />

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-5 items-start">

            {/* ── Left: scoring card ── */}
            <div className="flex-1 min-w-0">
              <div className="bg-pb-surface border border-pb-hairline rounded-[8px] overflow-hidden">

                {/* Status strip */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-pb-hairline bg-pb-surface2">
                  <div className="flex items-center gap-3">
                    <Pill tone="amber" mono className="flex items-center gap-1.5">
                      <Dot color="amber" size={5} pulse />
                      {MAX_GAMES > 1 ? `Live · Game ${currentGame + 1}` : "Live"}
                    </Pill>
                    <span className="text-[12px] font-mono text-pb-muted hidden sm:block">
                      {fmtLabel}
                    </span>
                  </div>
                  <span className="text-[12px] font-mono text-pb-muted tabular-nums">
                    {elapsed} elapsed
                  </span>
                </div>

                {/* Teams */}
                {([1, 2] as const).map((team) => {
                  const name    = team === 1 ? t1Name : t2Name;
                  const players = team === 1 ? t1Players : t2Players;
                  const isServing = serving === team;
                  const seed = team === 1 ? match.team1?.seed : match.team2?.seed;

                  return (
                    <div key={team} className={cn("px-5 py-5", team === 2 && "border-t border-pb-hairline")}>
                      <div className="flex items-start justify-between gap-4 mb-4">

                        {/* Team info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {seed != null && (
                              <span className="text-[10px] font-mono text-pb-faint uppercase tracking-[0.08em]">
                                Seed {seed}
                              </span>
                            )}
                            {isServing && (
                              <span className="inline-flex items-center gap-1.5 h-[18px] px-2 rounded-full bg-pb-court text-white text-[10px] font-mono font-semibold uppercase tracking-[0.05em]">
                                <span className="w-[5px] h-[5px] rounded-full bg-white/70 inline-block shrink-0" />
                                Serving
                              </span>
                            )}
                          </div>
                          <p className="font-display font-bold text-[clamp(20px,3vw,28px)] tracking-[-0.03em] leading-none text-pb-ink">
                            {name}
                          </p>
                          {players && players !== name && (
                            <p className="text-[12px] font-mono text-pb-muted mt-1.5">{players}</p>
                          )}
                        </div>

                        {/* Game score grid */}
                        <div className="flex items-end gap-2 shrink-0">
                          {Array.from({ length: MAX_GAMES }, (_, i) => {
                            const s = gameScores[i] ?? { t1: 0, t2: 0 };
                            const score    = team === 1 ? s.t1 : s.t2;
                            const oppScore = team === 1 ? s.t2 : s.t1;
                            const isCurrent = i === currentGame;
                            const isDone = isGameDone(s, fmt);
                            const won  = isDone && score > oppScore;
                            const lost = isDone && score < oppScore;

                            return (
                              <div key={i} className="text-center">
                                <p className="text-[9px] font-mono text-pb-faint uppercase tracking-[0.06em] mb-1.5">
                                  {MAX_GAMES > 1 ? `GM ${i + 1}` : "Score"}
                                </p>
                                <div className={cn(
                                  "w-[54px] h-[54px] rounded-[6px] flex items-center justify-center transition-all",
                                  isCurrent
                                    ? "border-2 border-pb-amber bg-pb-paper"
                                    : "border border-pb-hairline bg-pb-surface2"
                                )}>
                                  <span className={cn(
                                    "font-mono font-bold tabular-nums leading-none",
                                    isCurrent
                                      ? "text-[28px] text-pb-ink"
                                      : i < currentGame
                                        ? cn("text-[22px]", won ? "text-pb-court" : lost ? "text-pb-muted" : "text-pb-ink")
                                        : "text-[20px] text-pb-faint"
                                  )}>
                                    {i <= currentGame ? score : "–"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => addPoint(team)}
                          disabled={!!matchWinner}
                          className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] bg-pb-court text-white text-[13px] font-mono font-semibold hover:bg-pb-court/90 active:scale-95 transition-all disabled:opacity-40"
                        >
                          <Plus size={14} weight="bold" /> Point
                        </button>
                        <button
                          onClick={() => setServing(t => t === 1 ? 2 : 1)}
                          className="h-9 px-4 rounded-[6px] border border-pb-hairline text-[13px] font-mono text-pb-ink hover:border-pb-rule hover:bg-pb-surface2 transition-colors"
                        >
                          Side-out
                        </button>
                        <button
                          onClick={undoLast}
                          disabled={gameRallies[currentGame]?.length === 0}
                          className="h-9 px-4 rounded-[6px] text-[13px] font-mono text-pb-muted hover:text-pb-ink transition-colors disabled:opacity-30"
                        >
                          Undo last
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Rally log */}
                {(gameRallies[currentGame]?.length ?? 0) > 0 && (
                  <div className="px-5 py-4 border-t border-pb-hairline bg-pb-paper">
                    <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-pb-muted mb-3">
                      Rally Log{MAX_GAMES > 1 ? ` · Game ${currentGame + 1}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {gameRallies[currentGame].map((scorer, idx) => {
                        const isLast = idx === gameRallies[currentGame].length - 1;
                        return (
                          <span
                            key={idx}
                            className={cn(
                              "inline-flex items-center h-7 px-2.5 rounded-[4px] text-[12px] font-mono font-medium transition-colors",
                              isLast
                                ? "bg-pb-court text-white"
                                : scorer === 1
                                  ? "bg-pb-surface border border-pb-hairline text-pb-ink"
                                  : "bg-pb-surface border border-pb-hairline text-pb-muted"
                            )}
                          >
                            {rallyLabel(gameRallies[currentGame], idx)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Match winner banner */}
                {matchWinner && (
                  <div className="px-5 py-4 border-t border-pb-hairline bg-pb-court">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-[10px] font-mono text-white/60 uppercase tracking-[0.1em] mb-1">
                          Match winner
                        </p>
                        <p className="font-display font-bold text-[22px] tracking-[-0.025em] leading-none text-white">
                          {matchWinner === 1 ? t1Name : t2Name}
                        </p>
                        {MAX_GAMES > 1 && (
                          <p className="text-[12px] font-mono text-white/70 mt-1">
                            {gamesWon.t1}–{gamesWon.t2} games
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => submitMutation.mutate()}
                        disabled={submitMutation.isPending}
                        className="shrink-0 inline-flex items-center gap-2 h-10 px-5 rounded-[6px] border border-white/30 text-white text-[13px] font-mono font-semibold hover:bg-white/10 transition-colors disabled:opacity-60"
                      >
                        {submitMutation.isPending
                          ? <CircleNotch size={14} className="animate-spin" />
                          : <><Check size={14} /> Submit result</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Save partial score */}
              {!matchWinner && (gameRallies[0]?.length ?? 0) > 0 && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => submitMutation.mutate()}
                    disabled={submitMutation.isPending}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-pb-hairline text-[12px] font-mono text-pb-muted hover:text-pb-ink hover:border-pb-rule transition-colors"
                  >
                    {submitMutation.isPending
                      ? <CircleNotch size={12} className="animate-spin" />
                      : <><Check size={12} /> Save current score</>}
                  </button>
                </div>
              )}
            </div>

            {/* ── Right sidebar ── */}
            <div className="w-full lg:w-[300px] xl:w-[320px] shrink-0 space-y-4">

              {/* Match info */}
              <div className="bg-pb-surface border border-pb-hairline rounded-[8px] overflow-hidden">
                <div className="px-4 py-3 border-b border-pb-hairline bg-pb-surface2">
                  <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-pb-muted">Match</p>
                </div>
                <div className="divide-y divide-pb-hairline">
                  {[
                    { label: "Format",  value: fmtLabel },
                    { label: "Win by",  value: String(WIN_BY) },
                    ...(fmt.hard_cap != null ? [{ label: "Hard cap", value: String(fmt.hard_cap) }] : []),
                    ...(courtStr ? [{ label: "Court",   value: courtStr }] : []),
                    ...(roundStr ? [{ label: "Round",   value: roundStr }] : []),
                    ...(match.scheduledTime
                      ? [{ label: "Started", value: format(new Date(match.scheduledTime), "h:mm a") }]
                      : []),
                    { label: "Event",   value: event.name },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[12px] font-mono text-pb-muted">{label}</span>
                      <span className="text-[12px] font-mono text-pb-ink text-right max-w-[55%] truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-pb-surface border border-pb-hairline rounded-[8px] overflow-hidden">
                <div className="px-4 py-3 border-b border-pb-hairline bg-pb-surface2">
                  <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-pb-muted">Quick actions</p>
                </div>
                <div className="p-3 space-y-2">
                  {[`Time-out · ${t1Name}`, `Time-out · ${t2Name}`, "Medical pause"].map((label) => (
                    <button
                      key={label}
                      className="w-full h-10 rounded-[6px] border border-pb-hairline text-[13px] font-mono text-pb-ink hover:bg-pb-surface2 hover:border-pb-rule transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <button className="w-full h-10 rounded-[6px] text-[13px] font-mono text-pb-muted hover:text-pb-ink transition-colors">
                    Report dispute
                  </button>
                </div>
              </div>

              {/* Win probability */}
              <div className="bg-pb-ink rounded-[8px] p-5">
                <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-white/40 mb-4">
                  Win probability
                </p>
                {probLeader ? (
                  <>
                    <div className="flex items-baseline gap-0.5 mb-1">
                      <span className="font-display font-extrabold text-[56px] tracking-[-0.04em] leading-none text-white">
                        {probLeader === 1 ? t1Prob : t2Prob}
                      </span>
                      <span className="text-[20px] font-mono text-white/50 self-end pb-1">%</span>
                    </div>
                    <p className="text-[12px] font-mono text-white/50 mb-5">
                      {probLeader === 1 ? t1Name : t2Name} to advance
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display font-extrabold text-[44px] tracking-[-0.04em] leading-none text-white mb-1">
                      50 <span className="text-white/40 text-[28px]">/ 50</span>
                    </p>
                    <p className="text-[12px] font-mono text-white/50 mb-5">Match is even</p>
                  </>
                )}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pb-amber rounded-full transition-all duration-700"
                    style={{ width: `${probLeader === 1 ? t1Prob : probLeader === 2 ? t2Prob : 50}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-mono text-white/30 truncate max-w-[45%]">{t1Name}</span>
                  <span className="text-[10px] font-mono text-white/30 truncate max-w-[45%] text-right">{t2Name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>{/* end hidden md:block */}
      </div>
    </Layout>
  );
};

export default MatchScoreEntry;

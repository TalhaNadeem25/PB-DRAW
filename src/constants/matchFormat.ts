/**
 * Pool match format options and config (mirrors backend for display/validation).
 * Backend uses this for game-end validation; frontend uses for dropdown and display.
 */

export const MATCH_FORMAT_LABELS = [
  "Game to 11 – Win by 1",
  "Game to 11 – Win by 2",
  "Game to 11 – Win by 2 (Hard Cap)",
  "Game to 15 – Win by 1",
  "Game to 15 – Win by 2",
  "Game to 15 – Win by 2 (Hard Cap)",
  "Game to 21 – Win by 1",
  "Game to 21 – Win by 2",
  "Game to 21 – Win by 2 (Hard Cap)",
  "Best 2 of 3 – Games to 11 (Win by 1)",
  "Best 2 of 3 – Games to 11 (Win by 2)",
  "Best 2 of 3 – Games to 15 (Win by 1)",
  "Best 2 of 3 – Games to 15 (Win by 2)",
  "Best 3 of 5 – Games to 11 (Win by 2)",
] as const;

export type MatchFormatLabel = (typeof MATCH_FORMAT_LABELS)[number];

export interface MatchFormatConfig {
  games_to_win: number;
  max_games: number;
  points_to_win: number;
  win_by: number;
  hard_cap: number | null;
}

export const MATCH_FORMAT_CONFIGS: Record<MatchFormatLabel, MatchFormatConfig> = {
  "Game to 11 – Win by 1": { games_to_win: 1, max_games: 1, points_to_win: 11, win_by: 1, hard_cap: null },
  "Game to 11 – Win by 2": { games_to_win: 1, max_games: 1, points_to_win: 11, win_by: 2, hard_cap: null },
  "Game to 11 – Win by 2 (Hard Cap)": { games_to_win: 1, max_games: 1, points_to_win: 11, win_by: 2, hard_cap: 15 },
  "Game to 15 – Win by 1": { games_to_win: 1, max_games: 1, points_to_win: 15, win_by: 1, hard_cap: null },
  "Game to 15 – Win by 2": { games_to_win: 1, max_games: 1, points_to_win: 15, win_by: 2, hard_cap: null },
  "Game to 15 – Win by 2 (Hard Cap)": { games_to_win: 1, max_games: 1, points_to_win: 15, win_by: 2, hard_cap: 19 },
  "Game to 21 – Win by 1": { games_to_win: 1, max_games: 1, points_to_win: 21, win_by: 1, hard_cap: null },
  "Game to 21 – Win by 2": { games_to_win: 1, max_games: 1, points_to_win: 21, win_by: 2, hard_cap: null },
  "Game to 21 – Win by 2 (Hard Cap)": { games_to_win: 1, max_games: 1, points_to_win: 21, win_by: 2, hard_cap: 25 },
  "Best 2 of 3 – Games to 11 (Win by 1)": { games_to_win: 2, max_games: 3, points_to_win: 11, win_by: 1, hard_cap: null },
  "Best 2 of 3 – Games to 11 (Win by 2)": { games_to_win: 2, max_games: 3, points_to_win: 11, win_by: 2, hard_cap: null },
  "Best 2 of 3 – Games to 15 (Win by 1)": { games_to_win: 2, max_games: 3, points_to_win: 15, win_by: 1, hard_cap: null },
  "Best 2 of 3 – Games to 15 (Win by 2)": { games_to_win: 2, max_games: 3, points_to_win: 15, win_by: 2, hard_cap: null },
  "Best 3 of 5 – Games to 11 (Win by 2)": { games_to_win: 3, max_games: 5, points_to_win: 11, win_by: 2, hard_cap: null },
};

/** Short description for display (e.g. "First to 11, win by 2") */
export function formatMatchFormatShort(label: string | undefined): string {
  if (!label) return "—";
  const config = MATCH_FORMAT_CONFIGS[label as MatchFormatLabel];
  if (!config) return label;
  const { games_to_win, max_games, points_to_win, win_by, hard_cap } = config;
  if (games_to_win === 1) {
    let s = `First to ${points_to_win}, win by ${win_by}`;
    if (hard_cap != null) s += ` (cap ${hard_cap})`;
    return s;
  }
  return `Best ${games_to_win} of ${max_games} to ${points_to_win} (win by ${win_by})`;
}

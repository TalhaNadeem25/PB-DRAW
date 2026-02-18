/**
 * Match format options and their structured config.
 * Used for validation (game end / match end) and display.
 *
 * Variables per format:
 * - games_to_win: how many games needed to win the match
 * - max_games: total possible games
 * - points_to_win: target score per game
 * - win_by: margin required (1 or 2)
 * - hard_cap: null or number (game ends at this score if reached)
 */

export const MATCH_FORMAT_LABELS = [
  'Game to 11 – Win by 1',
  'Game to 11 – Win by 2',
  'Game to 11 – Win by 2 (Hard Cap)',
  'Game to 15 – Win by 1',
  'Game to 15 – Win by 2',
  'Game to 15 – Win by 2 (Hard Cap)',
  'Game to 21 – Win by 1',
  'Game to 21 – Win by 2',
  'Game to 21 – Win by 2 (Hard Cap)',
  'Best 2 of 3 – Games to 11 (Win by 1)',
  'Best 2 of 3 – Games to 11 (Win by 2)',
  'Best 2 of 3 – Games to 15 (Win by 1)',
  'Best 2 of 3 – Games to 15 (Win by 2)',
  'Best 3 of 5 – Games to 11 (Win by 2)',
];

/** @typedef {{ games_to_win: number, max_games: number, points_to_win: number, win_by: number, hard_cap: number|null }} MatchFormatConfig */

/** Map from display label to config */
export const MATCH_FORMAT_CONFIGS = {
  'Game to 11 – Win by 1': { games_to_win: 1, max_games: 1, points_to_win: 11, win_by: 1, hard_cap: null },
  'Game to 11 – Win by 2': { games_to_win: 1, max_games: 1, points_to_win: 11, win_by: 2, hard_cap: null },
  'Game to 11 – Win by 2 (Hard Cap)': { games_to_win: 1, max_games: 1, points_to_win: 11, win_by: 2, hard_cap: 15 },
  'Game to 15 – Win by 1': { games_to_win: 1, max_games: 1, points_to_win: 15, win_by: 1, hard_cap: null },
  'Game to 15 – Win by 2': { games_to_win: 1, max_games: 1, points_to_win: 15, win_by: 2, hard_cap: null },
  'Game to 15 – Win by 2 (Hard Cap)': { games_to_win: 1, max_games: 1, points_to_win: 15, win_by: 2, hard_cap: 19 },
  'Game to 21 – Win by 1': { games_to_win: 1, max_games: 1, points_to_win: 21, win_by: 1, hard_cap: null },
  'Game to 21 – Win by 2': { games_to_win: 1, max_games: 1, points_to_win: 21, win_by: 2, hard_cap: null },
  'Game to 21 – Win by 2 (Hard Cap)': { games_to_win: 1, max_games: 1, points_to_win: 21, win_by: 2, hard_cap: 25 },
  'Best 2 of 3 – Games to 11 (Win by 1)': { games_to_win: 2, max_games: 3, points_to_win: 11, win_by: 1, hard_cap: null },
  'Best 2 of 3 – Games to 11 (Win by 2)': { games_to_win: 2, max_games: 3, points_to_win: 11, win_by: 2, hard_cap: null },
  'Best 2 of 3 – Games to 15 (Win by 1)': { games_to_win: 2, max_games: 3, points_to_win: 15, win_by: 1, hard_cap: null },
  'Best 2 of 3 – Games to 15 (Win by 2)': { games_to_win: 2, max_games: 3, points_to_win: 15, win_by: 2, hard_cap: null },
  'Best 3 of 5 – Games to 11 (Win by 2)': { games_to_win: 3, max_games: 5, points_to_win: 11, win_by: 2, hard_cap: null },
};

/**
 * Get structured config for a format label (or null if unknown).
 * @param {string} label
 * @returns {MatchFormatConfig|null}
 */
export function getMatchFormatConfig(label) {
  if (!label || typeof label !== 'string') return null;
  return MATCH_FORMAT_CONFIGS[label.trim()] ?? null;
}

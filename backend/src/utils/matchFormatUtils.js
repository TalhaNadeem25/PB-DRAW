/**
 * Universal game-end and match-end logic for pool match formats.
 *
 * Game end (single game):
 * - IF hard_cap IS NOT null: game over when score == hard_cap OR (score >= points_to_win AND diff >= win_by)
 * - ELSE: game over when score >= points_to_win AND diff >= win_by
 *
 * Match end (best of N):
 * - Match over when team_wins === games_to_win
 */

/**
 * Check if a single game is over given scores and format config.
 * @param {number} score1 - Team 1 points in this game
 * @param {number} score2 - Team 2 points in this game
 * @param {{ points_to_win: number, win_by: number, hard_cap: number|null }} config - at least game-level fields
 * @returns {boolean}
 */
export function isGameOver(score1, score2, config) {
  if (!config || typeof config.points_to_win !== 'number' || typeof config.win_by !== 'number') {
    return false;
  }
  const { points_to_win, win_by, hard_cap } = config;
  const high = Math.max(score1, score2);
  const low = Math.min(score1, score2);
  const diff = high - low;

  if (hard_cap != null) {
    if (high >= hard_cap) return true;
    if (high >= points_to_win && diff >= win_by) return true;
    return false;
  }
  return high >= points_to_win && diff >= win_by;
}

/**
 * Check if the match is over (one side has won enough games).
 * @param {number} gamesWon1 - Games won by team 1
 * @param {number} gamesWon2 - Games won by team 2
 * @param {{ games_to_win: number }} config
 * @returns {boolean}
 */
export function isMatchOver(gamesWon1, gamesWon2, config) {
  if (!config || typeof config.games_to_win !== 'number') return false;
  return gamesWon1 === config.games_to_win || gamesWon2 === config.games_to_win;
}

/**
 * Validate a single-game score for the given format.
 * Returns { valid: boolean, message?: string }.
 * @param {number} team1Score
 * @param {number} team2Score
 * @param {{ games_to_win: number, points_to_win: number, win_by: number, hard_cap: number|null }|null} config
 */
export function validateSingleGameScore(team1Score, team2Score, config) {
  if (!config) return { valid: true };
  if (config.games_to_win !== 1) {
    return { valid: true }; // Best of 3/5: single score not validated here (multi-game not yet in schema)
  }
  const s1 = Number(team1Score);
  const s2 = Number(team2Score);
  if (Number.isNaN(s1) || Number.isNaN(s2) || s1 < 0 || s2 < 0) {
    return { valid: false, message: 'Scores must be non-negative numbers' };
  }
  if (!isGameOver(s1, s2, config)) {
    const { points_to_win, win_by, hard_cap } = config;
    let msg = `Score does not meet game end rules: first to ${points_to_win}, win by ${win_by}`;
    if (hard_cap != null) msg += ` (hard cap at ${hard_cap})`;
    return { valid: false, message: msg };
  }
  return { valid: true };
}

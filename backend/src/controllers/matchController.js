import Match from '../models/Match.js';
import Pool from '../models/Pool.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { emitMatchScoreUpdate, notifyTeamPlayers } from '../utils/socket.js';
import { validateSingleGameScore } from '../utils/matchFormatUtils.js';

// @desc    Get all matches for a pool
// @route   GET /api/pools/:poolId/matches
// @access  Public
export const getMatches = async (req, res, next) => {
  try {
    const { poolId } = req.params;
    
    if (!poolId) {
      return res.status(400).json({
        success: false,
        message: 'Pool ID is required'
      });
    }

    // Use refPath-aware populate: team1/team2 can be Team or User
    const matches = await Match.find({ pool: poolId })
      .populate({
        path: 'team1',
        select: 'name players email',
      })
      .populate({
        path: 'team2',
        select: 'name players email',
      })
      .populate({
        path: 'winner',
        select: 'name',
      })
      .sort({ scheduledTime: 1, createdAt: 1 });

    // Nested-populate players for matches where team refs are Team documents
    await Match.populate(matches, [
      {
        path: 'team1.players',
        select: 'name',
        model: 'User',
      },
      {
        path: 'team2.players',
        select: 'name',
        model: 'User',
      },
    ]);

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    next(error);
  }
};

// @desc    Get single match
// @route   GET /api/matches/:id
// @access  Public
export const getMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate({
        path: 'team1',
        select: 'name players email',
      })
      .populate({
        path: 'team2',
        select: 'name players email',
      })
      .populate('winner', 'name')
      .populate('pool', 'name')
      .populate('event', 'name tournament');

    // Nested-populate players for Team documents
    if (match) {
      await Match.populate(match, [
        { path: 'team1.players', select: 'name email', model: 'User' },
        { path: 'team2.players', select: 'name email', model: 'User' },
      ]);
    }

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.status(200).json({
      success: true,
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update match score
// @route   PUT /api/matches/:id/score
// @access  Private (Organizer/Admin)
export const updateMatchScore = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate({
        path: 'event',
        populate: { path: 'tournament' }
      });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Check authorization
    if (match.event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update match scores'
      });
    }

    const { team1Score, team2Score, games, status } = req.body;

    // Capture old state before updating (for reverting team stats)
    const oldTeam1Score = match.score?.team1Score ?? 0;
    const oldTeam2Score = match.score?.team2Score ?? 0;
    const wasCompleted = match.status === 'completed';
    const oldWinnerId = (match.winner?._id ?? match.winner)?.toString() ?? null;

    // Resolve format config (match-level for playoffs, pool-level for pool matches)
    let formatConfig = match.matchFormatConfig && typeof match.matchFormatConfig.games_to_win === 'number'
      ? match.matchFormatConfig
      : null;
    if (!formatConfig && match.pool) {
      const pool = await Pool.findById(match.pool).select('matchFormatConfig').lean();
      formatConfig = pool?.matchFormatConfig ?? null;
    }

    const isMultiGame = formatConfig && formatConfig.games_to_win > 1;

    let finalTeam1Score, finalTeam2Score, newWinner;

    if (isMultiGame && games && games.length > 0) {
      // ── Multi-game path ──────────────────────────────────────────────
      const gamesToWin = formatConfig.games_to_win;
      const maxGames = formatConfig.max_games;

      if (games.length > maxGames) {
        return res.status(400).json({
          success: false,
          message: `Too many games: max is ${maxGames} for this format`
        });
      }

      // Validate each individual game score
      for (let i = 0; i < games.length; i++) {
        const g = games[i];
        const bothZero = (g.team1Score ?? 0) === 0 && (g.team2Score ?? 0) === 0;
        if (bothZero) continue; // unfilled trailing game — skip
        const validation = validateSingleGameScore(
          g.team1Score ?? 0,
          g.team2Score ?? 0,
          { ...formatConfig, games_to_win: 1 } // treat each game as single-game for validation
        );
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: `Game ${i + 1}: ${validation.message}`
          });
        }
      }

      // Count games won and total points (only include games with actual scores)
      let t1GamesWon = 0, t2GamesWon = 0;
      let t1TotalPts = 0, t2TotalPts = 0;
      const playedGames = games.filter(g => (g.team1Score ?? 0) > 0 || (g.team2Score ?? 0) > 0);

      for (const g of playedGames) {
        t1TotalPts += g.team1Score ?? 0;
        t2TotalPts += g.team2Score ?? 0;
        if ((g.team1Score ?? 0) > (g.team2Score ?? 0)) t1GamesWon++;
        else if ((g.team2Score ?? 0) > (g.team1Score ?? 0)) t2GamesWon++;
      }

      // Auto-determine completion
      const seriesOver = t1GamesWon >= gamesToWin || t2GamesWon >= gamesToWin;
      const resolvedStatus = seriesOver ? 'completed' : (status || 'in-progress');

      finalTeam1Score = t1TotalPts;
      finalTeam2Score = t2TotalPts;

      match.games = playedGames;
      match.score.team1Score = finalTeam1Score;
      match.score.team2Score = finalTeam2Score;
      match.status = resolvedStatus;

      // Winner by games won (NOT by total points)
      if (resolvedStatus === 'completed') {
        newWinner = t1GamesWon > t2GamesWon ? match.team1 : match.team2;
        match.winner = newWinner;
      }
    } else {
      // ── Single-game path ─────────────────────────────────────────────
      if (formatConfig && formatConfig.games_to_win === 1 &&
          (status === 'completed' || (team1Score !== undefined && team2Score !== undefined))) {
        const validation = validateSingleGameScore(
          team1Score ?? match.score?.team1Score ?? 0,
          team2Score ?? match.score?.team2Score ?? 0,
          formatConfig
        );
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: validation.message || 'Invalid score for this match format'
          });
        }
      }

      finalTeam1Score = team1Score;
      finalTeam2Score = team2Score;

      match.score.team1Score = finalTeam1Score;
      match.score.team2Score = finalTeam2Score;
      match.status = status || 'completed';

      if (finalTeam1Score > finalTeam2Score) {
        newWinner = match.team1;
        match.winner = newWinner;
      } else if (finalTeam2Score > finalTeam1Score) {
        newWinner = match.team2;
        match.winner = newWinner;
      }
    }

    if (match.status === 'completed') {
      match.completedAt = new Date();
    }

    await match.save();

    // Update team stats: subtract old stats first, then add new
    const team1Id = match.team1?._id ?? match.team1;
    const team2Id = match.team2?._id ?? match.team2;
    const team1 = team1Id ? await Team.findById(team1Id) : null;
    const team2 = team2Id ? await Team.findById(team2Id) : null;
    const team1IdStr = team1Id?.toString();

    if (team1 && team2) {
      // Revert previous contribution
      team1.stats.pointsFor -= oldTeam1Score;
      team1.stats.pointsAgainst -= oldTeam2Score;
      team2.stats.pointsFor -= oldTeam2Score;
      team2.stats.pointsAgainst -= oldTeam1Score;
      if (wasCompleted && oldWinnerId) {
        if (oldWinnerId === team1IdStr) {
          team1.stats.wins -= 1;
          team2.stats.losses -= 1;
        } else {
          team2.stats.wins -= 1;
          team1.stats.losses -= 1;
        }
      }

      // Apply new contribution
      team1.stats.pointsFor += finalTeam1Score ?? 0;
      team1.stats.pointsAgainst += finalTeam2Score ?? 0;
      team2.stats.pointsFor += finalTeam2Score ?? 0;
      team2.stats.pointsAgainst += finalTeam1Score ?? 0;
      if (match.status === 'completed') {
        const newWinnerId = (match.winner?._id ?? match.winner)?.toString();
        if (newWinnerId === team1IdStr) {
          team1.stats.wins += 1;
          team2.stats.losses += 1;
        } else if (newWinnerId) {
          team2.stats.wins += 1;
          team1.stats.losses += 1;
        }
      }

      team1.stats.pointDifferential = team1.stats.pointsFor - team1.stats.pointsAgainst;
      team2.stats.pointDifferential = team2.stats.pointsFor - team2.stats.pointsAgainst;

      team1.markModified('stats');
      team2.markModified('stats');
      await team1.save();
      await team2.save();
    }

    // Playoff bracket advancement: qualifier winner → semifinals; semifinal winner → final, loser → bronze
    if (match.status === 'completed') {
      const winnerId = match.winner?._id ?? match.winner;

      // Qualifiers (winners round): advance winner to next match (semifinals)
      if (match.bracket === 'winners' && match.nextMatchId && winnerId) {
        const nextMatch = await Match.findById(match.nextMatchId);
        if (nextMatch) {
          const slot = nextMatch.previousMatch1Id && nextMatch.previousMatch1Id.toString() === match._id.toString()
            ? 'team1'
            : 'team2';
          if (!nextMatch[slot]) {
            nextMatch[slot] = winnerId;
            await nextMatch.save();
          }
        }
      }

      // DE: winners bracket loser → losers bracket
      if (match.bracket === 'winners' && match.loserNextMatchId) {
        const loserId = winnerId?.toString() === (match.team1?._id ?? match.team1)?.toString()
          ? (match.team2?._id ?? match.team2)
          : (match.team1?._id ?? match.team1);
        if (loserId) {
          const lrMatch = await Match.findById(match.loserNextMatchId);
          if (lrMatch) {
            const slot = lrMatch.previousMatch1Id?.toString() === match._id.toString()
              ? 'team1' : 'team2';
            if (!lrMatch[slot]) { lrMatch[slot] = loserId; await lrMatch.save(); }
          }
        }
      }

      // DE: losers bracket winner advances through LR
      if (match.bracket === 'losers' && match.nextMatchId && winnerId) {
        const nextMatch = await Match.findById(match.nextMatchId);
        if (nextMatch) {
          const slot = nextMatch.previousMatch1Id?.toString() === match._id.toString()
            ? 'team1' : 'team2';
          if (!nextMatch[slot]) { nextMatch[slot] = winnerId; await nextMatch.save(); }
        }
      }

      // DE (event-level): feed true Bronze match from Winners Final and Losers Final
      if ((match.bracket === 'winners' || match.bracket === 'losers') && winnerId) {
        const loserId = winnerId?.toString() === (match.team1?._id ?? match.team1)?.toString()
          ? (match.team2?._id ?? match.team2)
          : (match.team1?._id ?? match.team1);

        if (loserId) {
          // If this match is wired as parent1 of a bronze match, loser → team1
          const bronzeFromParent1 = await Match.findOne({
            event: match.event._id,
            pool: match.pool,
            bracket: 'bronze',
            previousMatch1Id: match._id
          });
          if (bronzeFromParent1 && !bronzeFromParent1.team1) {
            bronzeFromParent1.team1 = loserId;
            await bronzeFromParent1.save();
          }

          // If this match is wired as parent2 of a bronze match, loser → team2
          const bronzeFromParent2 = await Match.findOne({
            event: match.event._id,
            pool: match.pool,
            bracket: 'bronze',
            previousMatch2Id: match._id
          });
          if (
            bronzeFromParent2 &&
            !bronzeFromParent2.team2 &&
            // Avoid duplicate participant: if loser is already bronze team1, skip
            (!bronzeFromParent2.team1 ||
              bronzeFromParent2.team1.toString() !== loserId.toString())
          ) {
            bronzeFromParent2.team2 = loserId;
            await bronzeFromParent2.save();
          }
        }
      }

      // DE: Grand Final — check if bracket reset is needed
      if (match.bracket === 'finals' && !match.isGrandFinalReset && match.nextMatchId && winnerId) {
        const lfWinnerId = (match.team2?._id ?? match.team2)?.toString();
        if (lfWinnerId && winnerId.toString() === lfWinnerId) {
          // LF winner (was 1-loss) beat WF winner → both now have 1 loss, play reset
          const resetMatch = await Match.findById(match.nextMatchId);
          if (resetMatch?.isGrandFinalReset && !resetMatch.team1) {
            resetMatch.team1 = match.team1;
            resetMatch.team2 = match.team2;
            await resetMatch.save();
          }
        }
        // If WF winner (team1) won: no reset needed — tournament is over
      }
      // DE: Bracket Reset final — winner is champion, no further advancement needed

      // Semifinals: winner → final, loser → bronze
      if (match.bracket === 'semifinals' && winnerId) {
        // Determine loser using stored winner (works for both single and multi-game)
        const loserId = (match.winner?._id ?? match.winner)?.toString() === (match.team1?._id ?? match.team1)?.toString()
          ? (match.team2?._id ?? match.team2)
          : (match.team1?._id ?? match.team1);

        const finalsMatch = match.nextMatchId
          ? await Match.findById(match.nextMatchId)
          : await Match.findOne({
              event: match.event._id,
              pool: match.pool,
              bracket: 'finals'
            });
        if (finalsMatch && winnerId) {
          const semiSlot = finalsMatch.previousMatch1Id && finalsMatch.previousMatch1Id.toString() === match._id.toString()
            ? 'team1'
            : 'team2';
          if (!finalsMatch[semiSlot]) {
            finalsMatch[semiSlot] = winnerId;
            await finalsMatch.save();
          }
        }

        if (match.loserNextMatchId && loserId) {
          const bronzeMatch = await Match.findById(match.loserNextMatchId);
          if (bronzeMatch) {
            let bronzeSlot;
            if (bronzeMatch.previousMatch1Id && bronzeMatch.previousMatch1Id.toString() === match._id.toString()) {
              bronzeSlot = 'team1';
            } else if (bronzeMatch.previousMatch2Id && bronzeMatch.previousMatch2Id.toString() === match._id.toString()) {
              bronzeSlot = 'team2';
            } else {
              // Fallback: first semi (by matchNumber) -> team1, second semi -> team2
              const semis = await Match.find({
                event: match.event._id,
                pool: match.pool,
                bracket: 'semifinals'
              }).sort({ matchNumber: 1 });
              const semiIndex = semis.findIndex(s => s._id.toString() === match._id.toString());
              bronzeSlot = semiIndex === 0 ? 'team1' : 'team2';
            }
            if (!bronzeMatch[bronzeSlot]) {
              bronzeMatch[bronzeSlot] = loserId;
              await bronzeMatch.save();
            }
          }
        }
      }
    }

    // GET IO INSTANCE AND EMIT SOCKET EVENTS
    const io = req.app.get('io');
    const tournamentId = match.event.tournament._id.toString();

    // Emit match score update to all connected clients
    emitMatchScoreUpdate(io, match._id.toString(), tournamentId, {
      matchId: match._id,
      team1Score: match.score.team1Score,
      team2Score: match.score.team2Score,
      games: match.games,
      status: match.status,
      winner: match.winner,
      completedAt: match.completedAt
    });

    // If match completed, notify players (only for Team-based matches)
    if (match.status === 'completed' && team1 && team2) {
      const newWinnerId = (match.winner?._id ?? match.winner)?.toString();
      const winnerTeam = newWinnerId === team1Id?.toString() ? team1 : team2;
      const loserTeam = newWinnerId === team1Id?.toString() ? team2 : team1;

      // Notify winner team
      await notifyTeamPlayers(io, winnerTeam._id, {
        type: 'match-completed',
        title: 'Match Completed - Victory!',
        message: `Your match has been completed. Final score: ${team1Score}-${team2Score}`,
        matchId: match._id,
        tournamentId,
        result: 'win'
      });

      // Notify loser team
      await notifyTeamPlayers(io, loserTeam._id, {
        type: 'match-completed',
        title: 'Match Completed',
        message: `Your match has been completed. Final score: ${team1Score}-${team2Score}`,
        matchId: match._id,
        tournamentId,
        result: 'loss'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Match score updated successfully',
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update match details
// @route   PUT /api/matches/:id
// @access  Private (Organizer/Admin)
export const updateMatch = async (req, res, next) => {
  try {
    let match = await Match.findById(req.params.id).populate({
      path: 'event',
      populate: { path: 'tournament' }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Check authorization
    if (match.event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this match'
      });
    }

    match = await Match.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Match updated successfully',
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check in for a match
// @route   POST /api/matches/:id/check-in
// @access  Private (Player)
export const checkInMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('team1')
      .populate('team2');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Check if check-in is required
    if (!match.checkIn.required) {
      return res.status(400).json({
        success: false,
        message: 'Check-in is not required for this match'
      });
    }

    // Check if past deadline
    if (match.checkIn.deadline && new Date() > new Date(match.checkIn.deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Check-in deadline has passed'
      });
    }

    // Determine which team the user belongs to
    let isTeam1 = false;
    let isTeam2 = false;

    if (match.team1) {
      const team1Players = match.team1.players || [];
      isTeam1 = team1Players.some((p) => p.user?.toString() === req.user.id || p.toString() === req.user.id);
    }

    if (match.team2) {
      const team2Players = match.team2.players || [];
      isTeam2 = team2Players.some((p) => p.user?.toString() === req.user.id || p.toString() === req.user.id);
    }

    if (!isTeam1 && !isTeam2) {
      return res.status(403).json({
        success: false,
        message: 'You are not a player in this match'
      });
    }

    // Update check-in status
    if (isTeam1) {
      if (match.checkIn.team1.status === 'checked-in') {
        return res.status(400).json({
          success: false,
          message: 'Team 1 has already checked in'
        });
      }
      match.checkIn.team1.status = 'checked-in';
      match.checkIn.team1.checkedInAt = new Date();
      match.checkIn.team1.checkedInBy = req.user.id;
    }

    if (isTeam2) {
      if (match.checkIn.team2.status === 'checked-in') {
        return res.status(400).json({
          success: false,
          message: 'Team 2 has already checked in'
        });
      }
      match.checkIn.team2.status = 'checked-in';
      match.checkIn.team2.checkedInAt = new Date();
      match.checkIn.team2.checkedInBy = req.user.id;
    }

    await match.save();

    res.status(200).json({
      success: true,
      message: 'Successfully checked in for the match',
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark team as no-show (Organizer only)
// @route   POST /api/matches/:id/no-show
// @access  Private (Organizer/Admin)
export const markNoShow = async (req, res, next) => {
  try {
    const { teamNumber } = req.body; // 1 or 2

    if (!teamNumber || (teamNumber !== 1 && teamNumber !== 2)) {
      return res.status(400).json({
        success: false,
        message: 'Please specify teamNumber (1 or 2)'
      });
    }

    const match = await Match.findById(req.params.id)
      .populate({
        path: 'event',
        populate: { path: 'tournament' }
      });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Check authorization
    if (match.event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark no-shows'
      });
    }

    // Mark as no-show
    if (teamNumber === 1) {
      match.checkIn.team1.status = 'no-show';
      // Auto-forfeit: award win to team 2
      match.status = 'completed';
      match.winner = match.team2;
      match.completedAt = new Date();
    } else {
      match.checkIn.team2.status = 'no-show';
      // Auto-forfeit: award win to team 1
      match.status = 'completed';
      match.winner = match.team1;
      match.completedAt = new Date();
    }

    await match.save();

    res.status(200).json({
      success: true,
      message: 'Team marked as no-show and match forfeited',
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Player submits their match score
// @route   POST /api/matches/:id/player-score
// @access  Private (Player)
export const submitPlayerScore = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate({
        path: 'team1',
        select: 'name players email',
      })
      .populate({
        path: 'team2',
        select: 'name players email',
      })
      .populate({
        path: 'event',
        populate: { path: 'tournament' }
      });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Lock scores for terminal statuses
    if (['completed', 'cancelled', 'disputed'].includes(match.status)) {
      return res.status(400).json({ success: false, message: 'Scores are locked' });
    }

    // Nested-populate players for Team documents
    await Match.populate(match, [
      { path: 'team1.players', select: 'name email', model: 'User' },
      { path: 'team2.players', select: 'name email', model: 'User' },
    ]);

    // Determine which team the user belongs to
    let isTeam1 = false;
    let isTeam2 = false;

    if (match.team1) {
      if (match.team1Model === 'User') {
        isTeam1 = match.team1._id?.toString() === req.user.id;
      } else {
        const team1Players = match.team1.players || [];
        isTeam1 = team1Players.some((p) => p._id?.toString() === req.user.id || p.toString() === req.user.id);
      }
    }

    if (match.team2) {
      if (match.team2Model === 'User') {
        isTeam2 = match.team2._id?.toString() === req.user.id;
      } else {
        const team2Players = match.team2.players || [];
        isTeam2 = team2Players.some((p) => p._id?.toString() === req.user.id || p.toString() === req.user.id);
      }
    }

    if (!isTeam1 && !isTeam2) {
      return res.status(403).json({ success: false, message: 'You are not a player in this match' });
    }

    // Check if team already submitted
    if (isTeam1 && match.scoreSubmission?.team1?.submitted) {
      return res.status(400).json({ success: false, message: 'Your team has already submitted a score' });
    }
    if (isTeam2 && match.scoreSubmission?.team2?.submitted) {
      return res.status(400).json({ success: false, message: 'Your team has already submitted a score' });
    }

    // Validate scores
    const { team1Score, team2Score } = req.body;
    if (team1Score === undefined || team2Score === undefined || team1Score < 0 || team2Score < 0 || isNaN(Number(team1Score)) || isNaN(Number(team2Score))) {
      return res.status(400).json({ success: false, message: 'team1Score and team2Score must be non-negative numbers' });
    }

    // Save submission
    const submissionData = {
      submitted: true,
      team1Score: Number(team1Score),
      team2Score: Number(team2Score),
      submittedAt: new Date(),
      submittedBy: req.user.id
    };

    if (!match.scoreSubmission) {
      match.scoreSubmission = {};
    }

    if (isTeam1) {
      match.scoreSubmission.team1 = submissionData;
    } else {
      match.scoreSubmission.team2 = submissionData;
    }
    match.markModified('scoreSubmission');

    const bothSubmitted = match.scoreSubmission?.team1?.submitted && match.scoreSubmission?.team2?.submitted;

    if (bothSubmitted) {
      const s1 = match.scoreSubmission.team1;
      const s2 = match.scoreSubmission.team2;
      const scoresMatch = s1.team1Score === s2.team1Score && s1.team2Score === s2.team2Score;

      if (scoresMatch) {
        // Scores agree — finalize
        const finalTeam1Score = s1.team1Score;
        const finalTeam2Score = s1.team2Score;

        match.score.team1Score = finalTeam1Score;
        match.score.team2Score = finalTeam2Score;
        match.status = 'completed';
        match.completedAt = new Date();

        if (finalTeam1Score > finalTeam2Score) match.winner = match.team1;
        else if (finalTeam2Score > finalTeam1Score) match.winner = match.team2;

        await match.save();

        // Update team stats
        const team1Id = match.team1?._id ?? match.team1;
        const team2Id = match.team2?._id ?? match.team2;
        const team1 = team1Id ? await Team.findById(team1Id) : null;
        const team2 = team2Id ? await Team.findById(team2Id) : null;
        const team1IdStr = team1Id?.toString();

        if (team1 && team2) {
          team1.stats.pointsFor += finalTeam1Score;
          team1.stats.pointsAgainst += finalTeam2Score;
          team2.stats.pointsFor += finalTeam2Score;
          team2.stats.pointsAgainst += finalTeam1Score;

          const newWinnerId = (match.winner?._id ?? match.winner)?.toString();
          if (newWinnerId === team1IdStr) {
            team1.stats.wins += 1;
            team2.stats.losses += 1;
          } else if (newWinnerId) {
            team2.stats.wins += 1;
            team1.stats.losses += 1;
          }

          team1.stats.pointDifferential = team1.stats.pointsFor - team1.stats.pointsAgainst;
          team2.stats.pointDifferential = team2.stats.pointsFor - team2.stats.pointsAgainst;
          team1.markModified('stats');
          team2.markModified('stats');
          await team1.save();
          await team2.save();
        }

        // Emit socket event
        const io = req.app.get('io');
        const tournamentId = match.event?.tournament?._id?.toString();
        if (io && tournamentId) {
          emitMatchScoreUpdate(io, match._id.toString(), tournamentId, {
            matchId: match._id,
            team1Score: match.score.team1Score,
            team2Score: match.score.team2Score,
            status: match.status,
            winner: match.winner,
            completedAt: match.completedAt
          });
        }
      } else {
        // Scores conflict — disputed
        match.status = 'disputed';
        await match.save();

        // Try to notify organizer via socket
        try {
          const io = req.app.get('io');
          const tournamentId = match.event?.tournament?._id?.toString();
          if (io && tournamentId) {
            io.to(`tournament:${tournamentId}`).emit('match:disputed', {
              matchId: match._id,
              team1Submission: match.scoreSubmission.team1,
              team2Submission: match.scoreSubmission.team2
            });
          }
        } catch (socketErr) {
          console.warn('Could not emit disputed match event:', socketErr.message);
        }
      }
    } else {
      await match.save();
    }

    res.status(200).json({
      success: true,
      message: 'Score submitted successfully',
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Organizer resolves a disputed match score
// @route   POST /api/matches/:id/resolve-dispute
// @access  Private (Organizer/Admin)
export const resolveDisputedScore = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate({
        path: 'team1',
        select: 'name players email',
      })
      .populate({
        path: 'team2',
        select: 'name players email',
      })
      .populate({
        path: 'event',
        populate: { path: 'tournament' }
      });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Check authorization
    if (match.event?.tournament?.organizer?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to resolve disputes' });
    }

    const { team1Score, team2Score } = req.body;
    if (team1Score === undefined || team2Score === undefined || team1Score < 0 || team2Score < 0) {
      return res.status(400).json({ success: false, message: 'team1Score and team2Score are required and must be non-negative' });
    }

    const finalTeam1Score = Number(team1Score);
    const finalTeam2Score = Number(team2Score);

    match.score.team1Score = finalTeam1Score;
    match.score.team2Score = finalTeam2Score;
    match.status = 'completed';
    match.completedAt = new Date();

    if (finalTeam1Score > finalTeam2Score) match.winner = match.team1;
    else if (finalTeam2Score > finalTeam1Score) match.winner = match.team2;

    await match.save();

    // Update team stats
    const team1Id = match.team1?._id ?? match.team1;
    const team2Id = match.team2?._id ?? match.team2;
    const team1 = team1Id ? await Team.findById(team1Id) : null;
    const team2 = team2Id ? await Team.findById(team2Id) : null;
    const team1IdStr = team1Id?.toString();

    if (team1 && team2) {
      team1.stats.pointsFor += finalTeam1Score;
      team1.stats.pointsAgainst += finalTeam2Score;
      team2.stats.pointsFor += finalTeam2Score;
      team2.stats.pointsAgainst += finalTeam1Score;

      const newWinnerId = (match.winner?._id ?? match.winner)?.toString();
      if (newWinnerId === team1IdStr) {
        team1.stats.wins += 1;
        team2.stats.losses += 1;
      } else if (newWinnerId) {
        team2.stats.wins += 1;
        team1.stats.losses += 1;
      }

      team1.stats.pointDifferential = team1.stats.pointsFor - team1.stats.pointsAgainst;
      team2.stats.pointDifferential = team2.stats.pointsFor - team2.stats.pointsAgainst;
      team1.markModified('stats');
      team2.markModified('stats');
      await team1.save();
      await team2.save();
    }

    // Emit socket event
    const io = req.app.get('io');
    const tournamentId = match.event?.tournament?._id?.toString();
    if (io && tournamentId) {
      emitMatchScoreUpdate(io, match._id.toString(), tournamentId, {
        matchId: match._id,
        team1Score: match.score.team1Score,
        team2Score: match.score.team2Score,
        status: match.status,
        winner: match.winner,
        completedAt: match.completedAt
      });
    }

    res.status(200).json({
      success: true,
      message: 'Dispute resolved successfully',
      data: match
    });
  } catch (error) {
    next(error);
  }
};

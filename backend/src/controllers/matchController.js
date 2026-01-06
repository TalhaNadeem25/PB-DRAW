import Match from '../models/Match.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { emitMatchScoreUpdate, notifyTeamPlayers } from '../utils/socket.js';

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

    const matches = await Match.find({ pool: poolId })
      .populate({
        path: 'team1',
        select: 'name players',
        populate: { 
          path: 'players', 
          select: 'name',
          model: 'User'
        }
      })
      .populate({
        path: 'team2',
        select: 'name players',
        populate: { 
          path: 'players', 
          select: 'name',
          model: 'User'
        }
      })
      .populate({
        path: 'winner',
        select: 'name',
        model: 'Team'
      })
      .sort({ scheduledTime: 1, createdAt: 1 });

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
        populate: { path: 'players', select: 'name email' }
      })
      .populate({
        path: 'team2',
        populate: { path: 'players', select: 'name email' }
      })
      .populate('winner', 'name')
      .populate('pool', 'name')
      .populate('event', 'name tournament');

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

    const { team1Score, team2Score, status } = req.body;

    // Update match
    match.score.team1Score = team1Score;
    match.score.team2Score = team2Score;
    match.status = status || 'completed';

    // Determine winner
    if (team1Score > team2Score) {
      match.winner = match.team1;
    } else if (team2Score > team1Score) {
      match.winner = match.team2;
    }

    if (match.status === 'completed') {
      match.completedAt = new Date();
    }

    await match.save();

    // Update team stats
    const team1 = await Team.findById(match.team1);
    const team2 = await Team.findById(match.team2);

    if (team1 && team2) {
      team1.stats.pointsFor += team1Score;
      team1.stats.pointsAgainst += team2Score;
      team2.stats.pointsFor += team2Score;
      team2.stats.pointsAgainst += team1Score;

      if (team1Score > team2Score) {
        team1.stats.wins += 1;
        team2.stats.losses += 1;
      } else if (team2Score > team1Score) {
        team2.stats.wins += 1;
        team1.stats.losses += 1;
      }

      team1.stats.pointDifferential = team1.stats.pointsFor - team1.stats.pointsAgainst;
      team2.stats.pointDifferential = team2.stats.pointsFor - team2.stats.pointsAgainst;

      await team1.save();
      await team2.save();
    }

    // Playoff bracket advancement logic
    if (match.bracket === 'semifinals' && match.status === 'completed' && match.winner) {
      // Find the finals match and advance the winner
      const finalsMatch = await Match.findOne({
        event: match.event._id,
        pool: match.pool,
        bracket: 'finals'
      });

      if (finalsMatch && !finalsMatch.team2) {
        finalsMatch.team2 = match.winner;
        await finalsMatch.save();
      }
    }

    // GET IO INSTANCE AND EMIT SOCKET EVENTS
    const io = req.app.get('io');
    const tournamentId = match.event.tournament._id.toString();

    // Emit match score update to all connected clients
    emitMatchScoreUpdate(io, match._id.toString(), tournamentId, {
      matchId: match._id,
      team1Score,
      team2Score,
      status: match.status,
      winner: match.winner,
      completedAt: match.completedAt
    });

    // If match completed, notify players
    if (match.status === 'completed') {
      const winnerTeam = team1Score > team2Score ? team1 : team2;
      const loserTeam = team1Score > team2Score ? team2 : team1;

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

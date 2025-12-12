import Match from '../models/Match.js';
import Team from '../models/Team.js';

// @desc    Get all matches for a pool
// @route   GET /api/pools/:poolId/matches
// @access  Public
export const getMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ pool: req.params.poolId })
      .populate({
        path: 'team1',
        populate: { path: 'players', select: 'name' }
      })
      .populate({
        path: 'team2',
        populate: { path: 'players', select: 'name' }
      })
      .populate('winner', 'name')
      .sort({ scheduledTime: 1 });

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
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

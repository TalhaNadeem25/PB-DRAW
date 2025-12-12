import Pool from '../models/Pool.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';
import Event from '../models/Event.js';

// @desc    Generate playoff bracket from pool standings
// @route   POST /api/events/:eventId/playoffs/:poolId/generate
// @access  Private (Organizer/Admin)
export const generatePlayoffs = async (req, res, next) => {
  try {
    const pool = await Pool.findById(req.params.poolId)
      .populate('event')
      .populate({
        path: 'teams',
        populate: { path: 'players', select: 'name email' }
      });

    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }

    const event = await Event.findById(pool.event._id).populate('tournament');

    // Check authorization
    if (event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate playoffs for this pool'
      });
    }

    // Sort teams by standings
    const sortedTeams = pool.teams.sort((a, b) => {
      // First by wins
      const winsA = a.stats?.wins || 0;
      const winsB = b.stats?.wins || 0;
      if (winsB !== winsA) return winsB - winsA;

      // Then by point differential
      const diffA = a.stats?.pointDifferential || 0;
      const diffB = b.stats?.pointDifferential || 0;
      if (diffB !== diffA) return diffB - diffA;

      // Then by points scored
      const pfA = a.stats?.pointsFor || 0;
      const pfB = b.stats?.pointsFor || 0;
      return pfB - pfA;
    });

    // Take top 3 teams from this pool
    const topTeams = sortedTeams.slice(0, 3);

    if (topTeams.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Pool must have at least 3 teams to generate playoffs'
      });
    }

    // Delete existing playoff matches for this pool
    await Match.deleteMany({
      pool: pool._id,
      bracket: { $in: ['semifinals', 'finals'] }
    });

    const playoffMatches = [];

    // Semifinal: #2 vs #3
    playoffMatches.push({
      pool: pool._id,
      event: event._id,
      team1: topTeams[1]._id,
      team2: topTeams[2]._id,
      status: 'scheduled',
      round: 1,
      bracket: 'semifinals',
      matchNumber: 1
    });

    // Finals: Winner of semifinal vs #1 (created without team2 initially)
    playoffMatches.push({
      pool: pool._id,
      event: event._id,
      team1: topTeams[0]._id,
      team2: null, // Will be filled after semifinal
      status: 'scheduled',
      round: 2,
      bracket: 'finals',
      matchNumber: 1
    });

    const createdMatches = await Match.insertMany(playoffMatches);

    res.status(201).json({
      success: true,
      message: 'Playoff bracket generated successfully',
      data: {
        advancingTeams: topTeams.map((team, index) => ({
          seed: index + 1,
          teamId: team._id,
          teamName: team.name,
          wins: team.stats?.wins || 0,
          pointDifferential: team.stats?.pointDifferential || 0
        })),
        matches: createdMatches
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get playoff bracket for a pool
// @route   GET /api/events/:eventId/playoffs/:poolId
// @access  Public
export const getPlayoffs = async (req, res, next) => {
  try {
    const matches = await Match.find({
      pool: req.params.poolId,
      bracket: { $in: ['semifinals', 'finals'] }
    })
      .populate({
        path: 'team1',
        select: 'name players',
        populate: { path: 'players', select: 'name' }
      })
      .populate({
        path: 'team2',
        select: 'name players',
        populate: { path: 'players', select: 'name' }
      })
      .populate('winner', 'name')
      .sort({ round: 1, matchNumber: 1 });

    res.status(200).json({
      success: true,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

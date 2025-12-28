import Pool from '../models/Pool.js';
import Event from '../models/Event.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';

// Helper function to generate round-robin matches
const generateRoundRobinMatches = (teams, poolId, eventId) => {
  const matches = [];

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        pool: poolId,
        event: eventId,
        team1: teams[i],
        team2: teams[j],
        status: 'scheduled',
        round: 1
      });
    }
  }

  return matches;
};

// Helper function to generate single-elimination bracket matches
const generateSingleEliminationMatches = (teams, poolId, eventId) => {
  const matches = [];
  const numTeams = teams.length;

  // Single elimination requires power of 2 teams
  // If not, add byes for top seeds
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numTeams)));
  const numByes = nextPowerOf2 - numTeams;

  // Shuffle teams to randomize bracket (or use seeding if available)
  const shuffledTeams = [...teams].sort((a, b) => {
    // Sort by seed if available, otherwise random
    return Math.random() - 0.5;
  });

  // First round matches
  const firstRoundTeams = shuffledTeams.slice(numByes);
  for (let i = 0; i < firstRoundTeams.length; i += 2) {
    if (firstRoundTeams[i + 1]) {
      matches.push({
        pool: poolId,
        event: eventId,
        team1: firstRoundTeams[i],
        team2: firstRoundTeams[i + 1],
        status: 'scheduled',
        round: 1,
        matchNumber: Math.floor(i / 2) + 1
      });
    }
  }

  return matches;
};

// Helper function to generate double-elimination bracket matches
const generateDoubleEliminationMatches = (teams, poolId, eventId) => {
  const matches = [];
  const numTeams = teams.length;

  // Shuffle teams
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

  // Initial winners bracket matches (same as single elimination first round)
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    if (shuffledTeams[i + 1]) {
      matches.push({
        pool: poolId,
        event: eventId,
        team1: shuffledTeams[i],
        team2: shuffledTeams[i + 1],
        status: 'scheduled',
        round: 1,
        bracket: 'winners',
        matchNumber: Math.floor(i / 2) + 1
      });
    }
  }

  // Note: Losers bracket matches will be generated dynamically as winners bracket progresses

  return matches;
};

// Helper function to generate pool-play matches (round-robin within pool)
const generatePoolPlayMatches = (teams, poolId, eventId) => {
  // Pool play is just round-robin, then playoffs happen later
  return generateRoundRobinMatches(teams, poolId, eventId);
};

// Helper function to generate Swiss system matches (first round only)
const generateSwissMatches = (teams, poolId, eventId) => {
  const matches = [];

  // Swiss system: first round is random pairing
  // Subsequent rounds pair teams with similar records
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffledTeams.length; i += 2) {
    if (shuffledTeams[i + 1]) {
      matches.push({
        pool: poolId,
        event: eventId,
        team1: shuffledTeams[i],
        team2: shuffledTeams[i + 1],
        status: 'scheduled',
        round: 1
      });
    }
  }

  return matches;
};

// Main function to generate matches based on play format
const generateMatches = (teams, poolId, eventId, playFormat) => {
  switch (playFormat) {
    case 'single-elimination':
      return generateSingleEliminationMatches(teams, poolId, eventId);
    case 'double-elimination':
      return generateDoubleEliminationMatches(teams, poolId, eventId);
    case 'pool-play':
      return generatePoolPlayMatches(teams, poolId, eventId);
    case 'swiss':
      return generateSwissMatches(teams, poolId, eventId);
    case 'round-robin':
    default:
      return generateRoundRobinMatches(teams, poolId, eventId);
  }
};

// @desc    Get all pools for an event
// @route   GET /api/events/:eventId/pools
// @access  Public
export const getPools = async (req, res, next) => {
  try {
    const pools = await Pool.find({ event: req.params.eventId })
      .populate({
        path: 'teams',
        populate: { path: 'players', select: 'name email skillLevel' }
      })
      .populate({
        path: 'matches',
        populate: [
          {
            path: 'team1',
            select: 'name players',
            populate: { path: 'players', select: 'name email skillLevel' }
          },
          {
            path: 'team2',
            select: 'name players',
            populate: { path: 'players', select: 'name email skillLevel' }
          }
        ]
      });

    res.status(200).json({
      success: true,
      count: pools.length,
      data: pools
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single pool
// @route   GET /api/pools/:id
// @access  Public
export const getPool = async (req, res, next) => {
  try {
    const pool = await Pool.findById(req.params.id)
      .populate({
        path: 'teams',
        populate: { path: 'players', select: 'name email skillLevel' }
      })
      .populate({
        path: 'matches',
        populate: [
          { path: 'team1', select: 'name players' },
          { path: 'team2', select: 'name players' }
        ]
      })
      .populate('event', 'name tournament');

    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }

    res.status(200).json({
      success: true,
      data: pool
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create pool
// @route   POST /api/events/:eventId/pools
// @access  Private (Organizer/Admin)
export const createPool = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('tournament');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check authorization
    if (event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create pools for this event'
      });
    }

    req.body.event = req.params.eventId;
    const pool = await Pool.create(req.body);

    // Add pool to event
    event.pools.push(pool._id);
    await event.save();

    // If teams are provided, assign them to the pool
    if (req.body.teamIds && req.body.teamIds.length > 0) {
      await Team.updateMany(
        { _id: { $in: req.body.teamIds } },
        { pool: pool._id }
      );

      pool.teams = req.body.teamIds;
      await pool.save();

      // Generate matches based on play format
      const playFormat = event.playFormat || 'round-robin';
      const matches = generateMatches(req.body.teamIds, pool._id, event._id, playFormat);
      const createdMatches = await Match.insertMany(matches);

      pool.matches = createdMatches.map(m => m._id);
      await pool.save();
    }

    res.status(201).json({
      success: true,
      message: 'Pool created successfully',
      data: pool
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add teams to pool
// @route   POST /api/pools/:id/teams
// @access  Private (Organizer/Admin)
export const addTeamsToPool = async (req, res, next) => {
  try {
    const pool = await Pool.findById(req.params.id).populate({
      path: 'event',
      populate: { path: 'tournament' }
    });

    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }

    // Check authorization
    if (pool.event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this pool'
      });
    }

    const { teamIds } = req.body;

    // Add teams to pool
    await Team.updateMany(
      { _id: { $in: teamIds } },
      { pool: pool._id }
    );

    pool.teams.push(...teamIds);
    await pool.save();

    // Generate new matches based on play format
    const allTeamIds = pool.teams.map(t => t._id || t);
    const playFormat = pool.event.playFormat || 'round-robin';
    const newMatches = generateMatches(allTeamIds, pool._id, pool.event._id, playFormat);

    // Delete old matches and create new ones
    await Match.deleteMany({ pool: pool._id });
    const createdMatches = await Match.insertMany(newMatches);

    pool.matches = createdMatches.map(m => m._id);
    await pool.save();

    res.status(200).json({
      success: true,
      message: 'Teams added to pool successfully',
      data: pool
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update pool
// @route   PUT /api/pools/:id
// @access  Private (Organizer/Admin)
export const updatePool = async (req, res, next) => {
  try {
    let pool = await Pool.findById(req.params.id).populate({
      path: 'event',
      populate: { path: 'tournament' }
    });

    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }

    // Check authorization
    if (pool.event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this pool'
      });
    }

    pool = await Pool.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Pool updated successfully',
      data: pool
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete pool
// @route   DELETE /api/pools/:id
// @access  Private (Organizer/Admin)
export const deletePool = async (req, res, next) => {
  try {
    const pool = await Pool.findById(req.params.id).populate({
      path: 'event',
      populate: { path: 'tournament' }
    });

    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }

    // Check authorization
    if (pool.event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this pool'
      });
    }

    // Unassign teams from this pool
    await Team.updateMany({ pool: pool._id }, { pool: null });

    // Delete all matches in this pool
    await Match.deleteMany({ pool: pool._id });

    await pool.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Pool deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate matches for singles pool
// @route   POST /api/pools/:id/generate-singles-matches
// @access  Private (Organizer/Admin)
export const generateSinglesMatches = async (req, res, next) => {
  try {
    const pool = await Pool.findById(req.params.id).populate({
      path: 'event',
      populate: { path: 'tournament' }
    });

    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }

    // Check authorization
    if (pool.event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate matches for this pool'
      });
    }

    // Get all players assigned to this pool
    const playerIds = pool.event.registeredPlayers
      .filter(reg => reg.pool && reg.pool.toString() === pool._id.toString() && reg.paymentStatus === 'paid')
      .map(reg => reg.player);

    if (playerIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 2 players to generate matches'
      });
    }

    // Delete old matches
    await Match.deleteMany({ pool: pool._id });

    // Generate new matches (use player IDs as if they were team IDs for singles)
    const playFormat = pool.event.playFormat || 'round-robin';
    const matches = generateMatches(playerIds, pool._id, pool.event._id, playFormat);

    // Set team1Model and team2Model to 'User' for singles matches
    const singlesMatches = matches.map(match => ({
      ...match,
      team1Model: 'User',
      team2Model: 'User'
    }));

    const createdMatches = await Match.insertMany(singlesMatches);

    pool.matches = createdMatches.map(m => m._id);
    await pool.save();

    // Populate matches for response
    const populatedPool = await Pool.findById(pool._id)
      .populate({
        path: 'matches',
        populate: [
          { path: 'team1', select: 'name email skillLevel' },
          { path: 'team2', select: 'name email skillLevel' }
        ]
      });

    res.status(200).json({
      success: true,
      message: `${createdMatches.length} matches generated successfully`,
      data: populatedPool
    });
  } catch (error) {
    next(error);
  }
};

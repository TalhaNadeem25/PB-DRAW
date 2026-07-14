import Pool from '../models/Pool.js';
import Event from '../models/Event.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';
import { getMatchFormatConfig } from '../constants/matchFormatConfig.js';

// Helper function to generate round-robin matches using Circle Method
// This ensures no player plays consecutive matches
const generateRoundRobinMatches = (teams, poolId, eventId) => {
  const matches = [];
  const teamList = [...teams];

  // If odd number of teams, add a "BYE" placeholder
  const hasBye = teamList.length % 2 !== 0;
  if (hasBye) {
    teamList.push(null); // null represents a BYE
  }

  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const halfSize = numTeams / 2;

  // Create a copy for rotation (exclude first team which stays fixed)
  const rotatingTeams = teamList.slice(1);

  for (let round = 0; round < numRounds; round++) {
    // Build current round's team arrangement
    // First team is always at position 0 (fixed)
    const currentArrangement = [teamList[0], ...rotatingTeams];

    // Create matches for this round
    // Pair teams from opposite ends: [0] vs [n-1], [1] vs [n-2], etc.
    for (let i = 0; i < halfSize; i++) {
      const team1 = currentArrangement[i];
      const team2 = currentArrangement[numTeams - 1 - i];

      if (team1 === null || team2 === null) {
        // One team has a bye — create a bye match record for the non-null team
        const byeTeam = team1 !== null ? team1 : team2;
        if (byeTeam !== null) {
          matches.push({
            pool: poolId,
            event: eventId,
            team1: byeTeam,
            team2: null,
            status: 'completed',
            isByeMatch: true,
            round: round + 1,
            matchNumber: matches.length + 1,
            score: { team1Score: 0, team2Score: 0 }
          });
        }
      } else {
        matches.push({
          pool: poolId,
          event: eventId,
          team1: team1,
          team2: team2,
          status: 'scheduled',
          round: round + 1,
          matchNumber: matches.length + 1
        });
      }
    }

    // Rotate: move last element to second position (first stays fixed)
    // [a, b, c, d, e] -> [a, e, b, c, d]
    const lastTeam = rotatingTeams.pop();
    rotatingTeams.unshift(lastTeam);
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
            select: 'name email skillLevel players'
          },
          {
            path: 'team2',
            select: 'name email skillLevel players'
          }
        ]
      });

    // Manually populate players for Team matches (not needed for User/singles matches)
    for (const pool of pools) {
      if (pool.matches) {
        for (const match of pool.matches) {
          // If team1 is a Team (has players field), populate it
          if (match.team1 && match.team1.players && Array.isArray(match.team1.players)) {
            await match.populate('team1.players', 'name email skillLevel');
          }
          // If team2 is a Team (has players field), populate it
          if (match.team2 && match.team2.players && Array.isArray(match.team2.players)) {
            await match.populate('team2.players', 'name email skillLevel');
          }
        }
      }
    }

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
          { path: 'team1', select: 'name email skillLevel players' },
          { path: 'team2', select: 'name email skillLevel players' }
        ]
      })
      .populate('event', 'name tournament');

    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }

    // Manually populate players for Team matches
    if (pool.matches) {
      for (const match of pool.matches) {
        if (match.team1 && match.team1.players && Array.isArray(match.team1.players)) {
          await match.populate('team1.players', 'name email skillLevel');
        }
        if (match.team2 && match.team2.players && Array.isArray(match.team2.players)) {
          await match.populate('team2.players', 'name email skillLevel');
        }
      }
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
    if (req.body.matchFormat) {
      const config = getMatchFormatConfig(req.body.matchFormat);
      if (config) {
        req.body.matchFormatConfig = {
          games_to_win: config.games_to_win,
          max_games: config.max_games,
          points_to_win: config.points_to_win,
          win_by: config.win_by,
          hard_cap: config.hard_cap
        };
      }
    }
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
      const playFormat = pool.playFormat || 'round-robin';
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
    const playFormat = pool.playFormat || 'round-robin';
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
    const playFormat = pool.playFormat || 'round-robin';
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

// @desc    Regenerate pool-play matches (for existing pools missing bye match records)
// @route   POST /api/pools/:id/regenerate-matches
// @access  Private (Organizer/Admin)
export const regenerateMatches = async (req, res, next) => {
  try {
    const pool = await Pool.findById(req.params.id).populate({
      path: 'event',
      populate: { path: 'tournament' }
    });

    if (!pool) {
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }

    if (pool.event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (pool.poolPlayFinalizedAt) {
      return res.status(400).json({ success: false, message: 'Cannot regenerate matches for a finalized pool' });
    }

    // For singles events, delegate to the existing singles-matches generator
    const isSingles = pool.event.format === 'singles';
    if (isSingles) {
      const playerIds = pool.event.registeredPlayers
        .filter((reg) => reg.pool && reg.pool.toString() === pool._id.toString() && reg.paymentStatus === 'paid')
        .map((reg) => reg.player);

      if (playerIds.length < 2) {
        return res.status(400).json({ success: false, message: 'Need at least 2 players to generate matches' });
      }

      await Match.deleteMany({ pool: pool._id });
      const playFormat = pool.playFormat || 'round-robin';
      const matches = generateMatches(playerIds, pool._id, pool.event._id, playFormat);
      const singlesMatches = matches.map((m) => ({ ...m, team1Model: 'User', team2Model: 'User' }));
      const created = await Match.insertMany(singlesMatches);
      pool.matches = created.map((m) => m._id);
      await pool.save();
    } else {
      const teamIds = pool.teams.map((t) => t._id || t);
      if (teamIds.length < 2) {
        return res.status(400).json({ success: false, message: 'Need at least 2 teams to generate matches' });
      }

      await Match.deleteMany({ pool: pool._id });
      const playFormat = pool.playFormat || 'round-robin';
      const matches = generateMatches(teamIds, pool._id, pool.event._id, playFormat);
      const created = await Match.insertMany(matches);
      pool.matches = created.map((m) => m._id);
      await pool.save();
    }

    // Return populated pool
    const populated = await Pool.findById(pool._id)
      .populate({
        path: 'teams',
        populate: { path: 'players', select: 'name email skillLevel' }
      })
      .populate({
        path: 'matches',
        populate: [
          { path: 'team1', select: 'name email skillLevel players' },
          { path: 'team2', select: 'name email skillLevel players' }
        ]
      });

    res.status(200).json({
      success: true,
      message: 'Matches regenerated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auto-assign all unassigned players/teams evenly across pools
// @route   POST /api/events/:eventId/pools/auto-assign
// @access  Private (Organizer/Admin)
export const autoAssignMembers = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('tournament');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const pools = await Pool.find({ event: event._id, poolPlayFinalizedAt: null });
    if (pools.length === 0) {
      return res.status(400).json({ success: false, message: 'No open pools to assign to' });
    }

    const isSingles = event.format === 'singles';

    if (isSingles) {
      const unassigned = event.registeredPlayers.filter(
        (reg) => reg.paymentStatus === 'paid' && !reg.pool
      );
      if (unassigned.length === 0) {
        return res.status(400).json({ success: false, message: 'No unassigned players' });
      }

      // Distribute round-robin across pools
      unassigned.forEach((reg, i) => {
        reg.pool = pools[i % pools.length]._id;
      });
      await event.save();

      // Regenerate matches for each pool
      for (const pool of pools) {
        const playerIds = event.registeredPlayers
          .filter((r) => r.paymentStatus === 'paid' && r.pool?.toString() === pool._id.toString())
          .map((r) => r.player);

        await Match.deleteMany({ pool: pool._id });
        if (playerIds.length >= 2) {
          const playFormat = pool.playFormat || 'round-robin';
          const matches = generateMatches(playerIds, pool._id, event._id, playFormat);
          const created = await Match.insertMany(
            matches.map((m) => ({ ...m, team1Model: 'User', team2Model: 'User' }))
          );
          pool.matches = created.map((m) => m._id);
        } else {
          pool.matches = [];
        }
        await pool.save();
      }
    } else {
      const unassignedTeams = await Team.find({
        event: event._id,
        $or: [{ pool: null }, { pool: { $exists: false } }]
      });
      if (unassignedTeams.length === 0) {
        return res.status(400).json({ success: false, message: 'No unassigned teams' });
      }

      // Distribute round-robin and update pool.teams
      const poolTeamSets = pools.map((p) => ({
        pool: p,
        teamIds: p.teams.map((t) => t.toString())
      }));

      unassignedTeams.forEach((team, i) => {
        const { pool, teamIds } = poolTeamSets[i % pools.length];
        team.pool = pool._id;
        if (!teamIds.includes(team._id.toString())) {
          teamIds.push(team._id.toString());
          pool.teams.push(team._id);
        }
      });

      await Promise.all(unassignedTeams.map((t) => t.save()));

      // Regenerate matches for each pool
      for (const { pool } of poolTeamSets) {
        const teamIds = pool.teams.map((t) => t._id || t);
        await Match.deleteMany({ pool: pool._id });
        if (teamIds.length >= 2) {
          const playFormat = pool.playFormat || 'round-robin';
          const matches = generateMatches(teamIds, pool._id, event._id, playFormat);
          const created = await Match.insertMany(matches);
          pool.matches = created.map((m) => m._id);
        } else {
          pool.matches = [];
        }
        await pool.save();
      }
    }

    res.status(200).json({ success: true, message: 'Members auto-assigned successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Move a player/team from one pool to another
// @route   POST /api/events/:eventId/pools/move-member
// @access  Private (Organizer/Admin)
export const moveMember = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('tournament');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { memberId, toPoolId } = req.body;
    if (!memberId || !toPoolId) {
      return res.status(400).json({ success: false, message: 'memberId and toPoolId are required' });
    }

    const toPool = await Pool.findById(toPoolId);
    if (!toPool) return res.status(404).json({ success: false, message: 'Target pool not found' });
    if (toPool.poolPlayFinalizedAt) {
      return res.status(400).json({ success: false, message: 'Target pool is finalized' });
    }

    const isSingles = event.format === 'singles';
    const affectedPoolIds = new Set([toPoolId]);

    if (isSingles) {
      const reg = event.registeredPlayers.find(
        (r) => r.player.toString() === memberId.toString()
      );
      if (!reg) return res.status(404).json({ success: false, message: 'Player not found in event' });

      const fromPoolId = reg.pool?.toString();
      if (fromPoolId === toPoolId) {
        return res.status(400).json({ success: false, message: 'Player is already in that pool' });
      }
      if (fromPoolId) {
        const fromPool = await Pool.findById(fromPoolId);
        if (fromPool?.poolPlayFinalizedAt) {
          return res.status(400).json({ success: false, message: 'Player\'s current pool is already finalized and cannot be modified' });
        }
        affectedPoolIds.add(fromPoolId);
      }

      reg.pool = toPoolId;
      await event.save();
    } else {
      const team = await Team.findById(memberId);
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

      const fromPoolId = team.pool?.toString();
      if (fromPoolId === toPoolId) {
        return res.status(400).json({ success: false, message: 'Team is already in that pool' });
      }
      if (fromPoolId) {
        const fromPool = await Pool.findById(fromPoolId);
        if (fromPool?.poolPlayFinalizedAt) {
          return res.status(400).json({ success: false, message: 'Team\'s current pool is already finalized and cannot be modified' });
        }
        affectedPoolIds.add(fromPoolId);
        await Pool.findByIdAndUpdate(fromPoolId, { $pull: { teams: team._id } });
      }

      team.pool = toPoolId;
      await team.save();

      if (!toPool.teams.map((t) => t.toString()).includes(memberId.toString())) {
        toPool.teams.push(memberId);
        await toPool.save();
      }
    }

    // Regenerate matches for all affected pools
    for (const poolId of affectedPoolIds) {
      const pool = await Pool.findById(poolId);
      if (!pool || pool.poolPlayFinalizedAt) continue;

      await Match.deleteMany({ pool: pool._id });

      if (isSingles) {
        const playerIds = event.registeredPlayers
          .filter((r) => r.paymentStatus === 'paid' && r.pool?.toString() === poolId)
          .map((r) => r.player);

        if (playerIds.length >= 2) {
          const playFormat = pool.playFormat || 'round-robin';
          const matches = generateMatches(playerIds, pool._id, event._id, playFormat);
          const created = await Match.insertMany(
            matches.map((m) => ({ ...m, team1Model: 'User', team2Model: 'User' }))
          );
          pool.matches = created.map((m) => m._id);
        } else {
          pool.matches = [];
        }
      } else {
        const teamIds = pool.teams.map((t) => t._id || t);
        if (teamIds.length >= 2) {
          const playFormat = pool.playFormat || 'round-robin';
          const matches = generateMatches(teamIds, pool._id, event._id, playFormat);
          const created = await Match.insertMany(matches);
          pool.matches = created.map((m) => m._id);
        } else {
          pool.matches = [];
        }
      }
      await pool.save();
    }

    res.status(200).json({ success: true, message: 'Member moved successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark pool play as complete (standings final; pool can contribute to event playoffs)
// @route   POST /api/events/:eventId/pools/:id/complete-pool-play
// @access  Private (Organizer/Admin)
export const completePoolPlay = async (req, res, next) => {
  try {
    const pool = await Pool.findById(req.params.id).populate('event').populate({ path: 'event', populate: 'tournament' });
    if (!pool) {
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }
    if (pool.poolPlayFinalizedAt) {
      return res.status(400).json({ success: false, message: 'Pool play is already complete for this pool' });
    }
    if (pool.event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const poolPlayMatches = await Match.find({
      pool: pool._id,
      $or: [
        { bracket: { $exists: false } },
        { bracket: null },
        { bracket: { $nin: ['semifinals', 'finals', 'winners', 'bronze'] } }
      ]
    });
    const incomplete = poolPlayMatches.filter((m) => m.status !== 'completed');
    if (incomplete.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${incomplete.length} pool play match(es) still need a score. Complete all matches before marking pool complete.`
      });
    }

    pool.poolPlayFinalizedAt = new Date();
    await pool.save();

    res.status(200).json({
      success: true,
      message: 'Pool play marked complete. This pool can now contribute to event playoffs.',
      data: { poolPlayFinalizedAt: pool.poolPlayFinalizedAt }
    });
  } catch (error) {
    next(error);
  }
};

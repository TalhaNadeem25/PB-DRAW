import Pool from '../models/Pool.js';
import Match from '../models/Match.js';
import Event from '../models/Event.js';
import { generateSingleEliminationBracket, generateSingleEliminationForEventTier, generateDoubleEliminationForEventTier, isPowerOf2 } from '../utils/bracketGenerator.js';
import { getMatchFormatConfig } from '../constants/matchFormatConfig.js';

/** Get top N entities (by standings) from one pool for event playoffs. Returns array of { _id, name }. */
async function getTopFromPool(pool, event, advanceCount, isSingles) {
  const poolIdStr = pool._id.toString();
  if (isSingles) {
    const playersInPool = event.registeredPlayers
      .filter(
        (reg) =>
          reg.pool && reg.pool.toString() === poolIdStr && reg.paymentStatus === 'paid' && reg.player
      )
      .map((reg) => reg.player);
    const poolPlayMatches = await Match.find({
      pool: pool._id,
      $or: [
        { bracket: { $exists: false } },
        { bracket: null },
        { bracket: { $nin: ['semifinals', 'finals', 'winners', 'bronze'] } }
      ]
    }).lean();
    const statsByPlayerId = new Map();
    playersInPool.forEach((p) => {
      statsByPlayerId.set(p._id.toString(), { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 });
    });
    poolPlayMatches.forEach((m) => {
      if (m.status !== 'completed') return;
      const id1 = m.team1 ? (typeof m.team1 === 'object' && m.team1.toString ? m.team1.toString() : String(m.team1)) : null;
      const id2 = m.team2 ? (typeof m.team2 === 'object' && m.team2.toString ? m.team2.toString() : String(m.team2)) : null;
      const s1 = id1 ? statsByPlayerId.get(id1) : null;
      const s2 = id2 ? statsByPlayerId.get(id2) : null;
      const t1 = m.score?.team1Score ?? 0;
      const t2 = m.score?.team2Score ?? 0;
      if (s1) {
        s1.pointsFor += t1;
        s1.pointsAgainst += t2;
        if (t1 > t2) s1.wins += 1;
        else if (t2 > t1) s1.losses += 1;
      }
      if (s2) {
        s2.pointsFor += t2;
        s2.pointsAgainst += t1;
        if (t2 > t1) s2.wins += 1;
        else if (t1 > t2) s2.losses += 1;
      }
    });
    statsByPlayerId.forEach((s) => { s.pointDifferential = s.pointsFor - s.pointsAgainst; });
    const sorted = [...playersInPool].sort((a, b) => {
      const sa = statsByPlayerId.get(a._id.toString()) || {};
      const sb = statsByPlayerId.get(b._id.toString()) || {};
      if ((sb.wins ?? 0) !== (sa.wins ?? 0)) return (sb.wins ?? 0) - (sa.wins ?? 0);
      if ((sb.pointDifferential ?? 0) !== (sa.pointDifferential ?? 0)) return (sb.pointDifferential ?? 0) - (sa.pointDifferential ?? 0);
      return (sb.pointsFor ?? 0) - (sa.pointsFor ?? 0);
    });
    return sorted.slice(0, advanceCount).map((p) => ({ _id: p._id, name: p.name || 'Player', stats: statsByPlayerId.get(p._id.toString()) ?? {} }));
  }
  const teamIds = (pool.teams || []).map((t) => t._id ?? t);
  if (teamIds.length === 0) return [];
  const poolPlayMatches = await Match.find({
    pool: pool._id,
    $or: [
      { bracket: { $exists: false } },
      { bracket: null },
      { bracket: { $nin: ['semifinals', 'finals', 'winners', 'bronze'] } }
    ]
  }).lean();
  const statsByTeamId = new Map();
  teamIds.forEach((id) => {
    statsByTeamId.set(id.toString(), { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 });
  });
  poolPlayMatches.forEach((m) => {
    if (m.status !== 'completed') return;
    const id1 = m.team1 ? (typeof m.team1 === 'object' && m.team1.toString ? m.team1.toString() : String(m.team1)) : null;
    const id2 = m.team2 ? (typeof m.team2 === 'object' && m.team2.toString ? m.team2.toString() : String(m.team2)) : null;
    const s1 = id1 ? statsByTeamId.get(id1) : null;
    const s2 = id2 ? statsByTeamId.get(id2) : null;
    const t1 = m.score?.team1Score ?? 0;
    const t2 = m.score?.team2Score ?? 0;
    if (s1) {
      s1.pointsFor += t1;
      s1.pointsAgainst += t2;
      if (t1 > t2) s1.wins += 1;
      else if (t2 > t1) s1.losses += 1;
    }
    if (s2) {
      s2.pointsFor += t2;
      s2.pointsAgainst += t1;
      if (t2 > t1) s2.wins += 1;
      else if (t1 > t2) s2.losses += 1;
    }
  });
  statsByTeamId.forEach((s) => { s.pointDifferential = s.pointsFor - s.pointsAgainst; });
  const teamDocs = (pool.teams || []).map((t) => ({ _id: t._id, name: t.name || 'Team', stats: statsByTeamId.get((t._id ?? t).toString()) }));
  const sorted = teamDocs.sort((a, b) => {
    const sa = a.stats || {};
    const sb = b.stats || {};
    if ((sb.wins ?? 0) !== (sa.wins ?? 0)) return (sb.wins ?? 0) - (sa.wins ?? 0);
    if ((sb.pointDifferential ?? 0) !== (sa.pointDifferential ?? 0)) return (sb.pointDifferential ?? 0) - (sa.pointDifferential ?? 0);
    return (sb.pointsFor ?? 0) - (sa.pointsFor ?? 0);
  });
  return sorted.slice(0, advanceCount).map((t) => ({ _id: t._id, name: t.name || 'Team', stats: t.stats }));
}

// @desc    Generate playoff bracket from pool standings
// @route   POST /api/events/:eventId/playoffs/:poolId/generate
// @body    { advanceCount: number, matchFormats?: { semifinals?, finals?, bronze? } } - match format labels per round
// @access  Private (Organizer/Admin)
export const generatePlayoffs = async (req, res, next) => {
  try {
    const advanceCount = Math.min(8, Math.max(2, parseInt(req.body?.advanceCount, 10) || 3));
    if (Number.isNaN(advanceCount) || advanceCount < 2 || advanceCount > 8) {
      return res.status(400).json({
        success: false,
        message: 'advanceCount must be between 2 and 8'
      });
    }

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

    const event = await Event.findById(pool.event._id)
      .populate('tournament')
      .populate({ path: 'registeredPlayers.player', select: 'name email' });

    // Check authorization
    if (event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate playoffs for this pool'
      });
    }

    if (event.playFormat === 'round-robin') {
      return res.status(400).json({
        success: false,
        message: 'Round-robin events do not have playoffs. Final standings are determined by pool play.'
      });
    }

    const isSingles = event.format === 'singles';
    const teamModel = isSingles ? 'User' : 'Team';
    let topEntities;
    const poolIdStr = pool._id.toString();

    if (isSingles) {
      // Singles: players are in event.registeredPlayers[].pool, not pool.teams
      const playersInPool = event.registeredPlayers
        .filter(
          (reg) =>
            reg.pool && reg.pool.toString() === poolIdStr && reg.paymentStatus === 'paid' && reg.player
        )
        .map((reg) => reg.player);

      if (playersInPool.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Pool must have at least 2 players to generate playoffs'
        });
      }

      // Pool-play matches only (exclude bracket rounds)
      const poolPlayMatches = await Match.find({
        pool: pool._id,
        $or: [
          { bracket: { $exists: false } },
          { bracket: null },
          { bracket: { $nin: ['semifinals', 'finals', 'winners', 'bronze'] } }
        ]
      }).lean();

      const statsByPlayerId = new Map();
      playersInPool.forEach((p) => {
        const id = p._id.toString();
        statsByPlayerId.set(id, { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 });
      });

      poolPlayMatches.forEach((m) => {
        if (m.status !== 'completed') return;
        const id1 = m.team1 ? (typeof m.team1 === 'object' && m.team1.toString ? m.team1.toString() : String(m.team1)) : null;
        const id2 = m.team2 ? (typeof m.team2 === 'object' && m.team2.toString ? m.team2.toString() : String(m.team2)) : null;
        const s1 = id1 ? statsByPlayerId.get(id1) : null;
        const s2 = id2 ? statsByPlayerId.get(id2) : null;
        const t1Score = m.score?.team1Score ?? 0;
        const t2Score = m.score?.team2Score ?? 0;
        if (s1) {
          s1.pointsFor += t1Score;
          s1.pointsAgainst += t2Score;
          if (t1Score > t2Score) s1.wins += 1;
          else if (t2Score > t1Score) s1.losses += 1;
        }
        if (s2) {
          s2.pointsFor += t2Score;
          s2.pointsAgainst += t1Score;
          if (t2Score > t1Score) s2.wins += 1;
          else if (t1Score > t2Score) s2.losses += 1;
        }
      });

      statsByPlayerId.forEach((s) => {
        s.pointDifferential = s.pointsFor - s.pointsAgainst;
      });

      const sortedPlayers = [...playersInPool].sort((a, b) => {
        const sa = statsByPlayerId.get(a._id.toString()) || {};
        const sb = statsByPlayerId.get(b._id.toString()) || {};
        if ((sb.wins ?? 0) !== (sa.wins ?? 0)) return (sb.wins ?? 0) - (sa.wins ?? 0);
        if ((sb.pointDifferential ?? 0) !== (sa.pointDifferential ?? 0)) return (sb.pointDifferential ?? 0) - (sa.pointDifferential ?? 0);
        return (sb.pointsFor ?? 0) - (sa.pointsFor ?? 0);
      });

      topEntities = sortedPlayers.slice(0, advanceCount).map((p) => ({
        _id: p._id,
        name: p.name || 'Player'
      }));
    } else {
      // Teams: use pool.teams and their stats
      const sortedTeams = [...(pool.teams || [])].sort((a, b) => {
        const winsA = a.stats?.wins || 0;
        const winsB = b.stats?.wins || 0;
        if (winsB !== winsA) return winsB - winsA;
        const diffA = a.stats?.pointDifferential || 0;
        const diffB = b.stats?.pointDifferential || 0;
        if (diffB !== diffA) return diffB - diffA;
        const pfA = a.stats?.pointsFor || 0;
        const pfB = b.stats?.pointsFor || 0;
        return pfB - pfA;
      });
      topEntities = sortedTeams.slice(0, advanceCount);
    }

    if (topEntities.length < 2) {
      return res.status(400).json({
        success: false,
        message: isSingles
          ? 'Pool must have at least 2 players to generate playoffs'
          : 'Pool must have at least 2 teams to generate playoffs'
      });
    }

    // Delete existing playoff matches for this pool (all bracket types)
    await Match.deleteMany({
      pool: pool._id,
      bracket: { $in: ['semifinals', 'finals', 'winners', 'bronze'] }
    });

    const createdMatches = await generateSingleEliminationBracket(
      pool._id,
      event._id,
      topEntities.map((t) => ({ ...(t.toObject?.() || t), _id: t._id, name: t.name })),
      teamModel
    );

    // Apply per-round match formats (semifinals, championship, bronze)
    const poolFormat = pool.matchFormat || 'Game to 11 – Win by 2';
    const matchFormats = {
      semifinals: req.body?.matchFormats?.semifinals ?? poolFormat,
      finals: req.body?.matchFormats?.finals ?? poolFormat,
      bronze: req.body?.matchFormats?.bronze ?? poolFormat
    };
    for (const m of createdMatches) {
      const label = m.bracket === 'semifinals' || m.bracket === 'winners'
        ? matchFormats.semifinals
        : m.bracket === 'finals'
          ? matchFormats.finals
          : m.bracket === 'bronze'
            ? matchFormats.bronze
            : null;
      if (label) {
        const config = getMatchFormatConfig(label);
        if (config) {
          m.matchFormat = label;
          m.matchFormatConfig = {
            games_to_win: config.games_to_win,
            max_games: config.max_games,
            points_to_win: config.points_to_win,
            win_by: config.win_by,
            hard_cap: config.hard_cap ?? null
          };
          m.markModified('matchFormatConfig');
          await m.save();
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Playoff bracket generated successfully',
      data: {
        advancingTeams: topEntities.map((entity, index) => ({
          seed: index + 1,
          teamId: entity._id,
          teamName: entity.name,
          wins: entity.stats?.wins ?? 0,
          pointDifferential: entity.stats?.pointDifferential ?? 0
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
    const pool = await Pool.findById(req.params.poolId).select('event').populate('event', 'format');
    const isSingles = pool?.event?.format === 'singles';

    let query = Match.find({
      pool: req.params.poolId,
      bracket: { $in: ['semifinals', 'finals', 'winners', 'bronze'] }
    })
      .sort({ round: 1, matchNumber: 1 });

    // Singles: team1/team2 are User refs (no .players). Teams: Team refs with .players
    if (isSingles) {
      query = query
        .populate({ path: 'team1', select: 'name' })
        .populate({ path: 'team2', select: 'name' })
        .populate('winner', 'name');
    } else {
      query = query
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
        .populate('winner', 'name');
    }

    const matches = await query;

    res.status(200).json({
      success: true,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Finalize playoffs (complete pool) – cannot be undone. Computes final placements and saves to pool.
// @route   POST /api/events/:eventId/playoffs/:poolId/complete
// @access  Private (Organizer/Admin)
export const completePlayoffs = async (req, res, next) => {
  try {
    const pool = await Pool.findById(req.params.poolId).populate('event').populate({ path: 'event', populate: { path: 'tournament' } });
    if (!pool) {
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }
    if (pool.playoffsFinalizedAt) {
      return res.status(400).json({ success: false, message: 'Playoffs are already finalized for this pool' });
    }

    const event = pool.event;
    if (event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to finalize playoffs for this pool' });
    }

    const isSingles = event.format === 'singles';
    const select = 'name';
    const playoffMatches = await Match.find({
      pool: pool._id,
      bracket: { $in: ['semifinals', 'finals', 'winners', 'bronze'] }
    })
      .populate({ path: 'team1', select })
      .populate({ path: 'team2', select })
      .populate({ path: 'winner', select })
      .sort({ round: 1, matchNumber: 1 })
      .lean();

    if (playoffMatches.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No playoff matches found for this pool. Generate a playoff bracket first.'
      });
    }

    const incomplete = playoffMatches.filter((m) => m.status !== 'completed');
    if (incomplete.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${incomplete.length} playoff match(es) still need a score. Complete every match (semifinals, final, and bronze if present) before finalizing.`
      });
    }

    const finalsMatch = playoffMatches.find((m) => m.bracket === 'finals');
    const bronzeMatch = playoffMatches.find((m) => m.bracket === 'bronze');
    if (!finalsMatch) {
      return res.status(400).json({ success: false, message: 'Championship (final) match not found. Cannot finalize.' });
    }

    const score1 = finalsMatch.score?.team1Score ?? 0;
    const score2 = finalsMatch.score?.team2Score ?? 0;
    if (score1 === score2) {
      return res.status(400).json({
        success: false,
        message: 'Championship match cannot be a tie. Enter a final score with one winner.'
      });
    }

    // Derive winner from score if winner ref wasn't set (e.g. older data)
    const getEntity = (match, isWinner) => {
      const s1 = match.score?.team1Score ?? 0;
      const s2 = match.score?.team2Score ?? 0;
      let winnerId = match.winner?._id ?? match.winner;
      const team1Id = match.team1?._id ?? match.team1;
      const team2Id = match.team2?._id ?? match.team2;
      if (!winnerId && s1 !== s2) {
        winnerId = s1 > s2 ? team1Id : team2Id;
      }
      if (isWinner) {
        const id = winnerId;
        const name = (match.winner && (match.winner.name || match.winner.email)) || (id && (String(team1Id) === String(id) ? (match.team1?.name ?? match.team1?.email) : (match.team2?.name ?? match.team2?.email))) || '—';
        return { entityId: id, name: name || '—' };
      }
      const loserId = winnerId && (String(team1Id) === String(winnerId) ? team2Id : team1Id);
      const loserDoc = winnerId && String(team1Id) === String(winnerId) ? match.team2 : match.team1;
      const name = (loserDoc && (loserDoc.name || loserDoc.email)) || '—';
      return { entityId: loserId, name: name || '—' };
    };

    const placements = [];
    const finalWinner = getEntity(finalsMatch, true);
    const finalLoser = getEntity(finalsMatch, false);
    if (!finalWinner.entityId || !finalLoser.entityId) {
      return res.status(400).json({
        success: false,
        message: 'Championship match must have both teams and a completed score. Save the final score and try again.'
      });
    }
    placements.push({ place: 1, entityId: finalWinner.entityId, name: finalWinner.name });
    placements.push({ place: 2, entityId: finalLoser.entityId, name: finalLoser.name });

    if (bronzeMatch && bronzeMatch.status === 'completed') {
      const b1 = bronzeMatch.score?.team1Score ?? 0;
      const b2 = bronzeMatch.score?.team2Score ?? 0;
      if (b1 !== b2) {
        const bronzeWinner = getEntity(bronzeMatch, true);
        const bronzeLoser = getEntity(bronzeMatch, false);
        if (bronzeWinner.entityId && bronzeLoser.entityId) {
          placements.push({ place: 3, entityId: bronzeWinner.entityId, name: bronzeWinner.name });
          placements.push({ place: 4, entityId: bronzeLoser.entityId, name: bronzeLoser.name });
        }
      }
    }

    pool.playoffsFinalizedAt = new Date();
    pool.finalPlacements = placements;
    pool.markModified('finalPlacements');
    await pool.save();

    res.status(200).json({
      success: true,
      message: 'Pool finalized. Standings now show final placements with medals.',
      data: { finalPlacements: pool.finalPlacements }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Event-level playoffs (all pools combined: gold / silver / bronze tiers) ───

// @desc    Get event-level playoff bracket (matches with pool=null, bracketTier)
// @route   GET /api/events/:eventId/playoffs
// @access  Public
export const getEventPlayoffs = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const event = await Event.findById(eventId).select('format').lean();
    const isSingles = event?.format === 'singles';

    const query = Match.find({
      event: eventId,
      pool: null,
      bracketTier: { $in: ['gold', 'silver', 'bronze', 'event'] }
    }).sort({ bracketTier: 1, round: 1, matchNumber: 1 });

    if (isSingles) {
      query.populate({ path: 'team1', select: 'name' }).populate({ path: 'team2', select: 'name' }).populate('winner', 'name');
    } else {
      query
        .populate({ path: 'team1', select: 'name players', populate: { path: 'players', select: 'name' } })
        .populate({ path: 'team2', select: 'name players', populate: { path: 'players', select: 'name' } })
        .populate('winner', 'name');
    }
    const matches = await query;

    res.status(200).json({
      success: true,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate event-level playoffs: advance N per pool → qualifiers → semifinals → final + bronze
// @route   POST /api/events/:eventId/playoffs/generate
// @body    { advanceCountPerPool: number (how many players/teams advance from each pool), matchFormats?: { qualifiers?, semifinals?, finals?, bronze? } }
// @access  Private (Organizer/Admin)
export const generateEventPlayoffs = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const advanceCountPerPool = Math.min(8, Math.max(1, parseInt(req.body?.advanceCountPerPool, 10) || 2));
    const event = await Event.findById(eventId)
      .populate('tournament')
      .populate({ path: 'registeredPlayers.player', select: 'name email' });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (event.eventPlayoffsFinalizedAt) {
      return res.status(400).json({ success: false, message: 'Event playoffs are already finalized.' });
    }

    if (event.playFormat === 'round-robin') {
      return res.status(400).json({
        success: false,
        message: 'Round-robin events do not have playoffs. Final standings are determined by pool play.'
      });
    }

    const pools = await Pool.find({ event: eventId, poolPlayFinalizedAt: { $ne: null } })
      .sort({ name: 1 })
      .populate({ path: 'teams', populate: { path: 'players', select: 'name' } });
    if (pools.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 pools must be marked complete (Complete pool) before generating event playoffs.'
      });
    }
    const isSingles = event.format === 'singles';
    const teamModel = isSingles ? 'User' : 'Team';

    // Combine top N from each pool into one advancing list
    const allAdvancing = [];
    for (const pool of pools) {
      const top = await getTopFromPool(pool, event, advanceCountPerPool, isSingles);
      allAdvancing.push(...top);
    }

    // Cross-pool seeding: re-compute stats for every advancing team directly from
    // their pool-play matches, then sort globally so the best performer across ALL
    // pools becomes S1 (not just the pool-1 winner by alphabetical pool order).
    const advancingIds = allAdvancing.map((t) => (t._id ?? t).toString());
    const poolPlayMatchesAll = await Match.find({
      event: eventId,
      pool: { $ne: null },
      isByeMatch: { $ne: true },
      $or: [{ bracket: { $exists: false } }, { bracket: null }]
    }).lean();

    const globalStats = new Map();
    advancingIds.forEach((id) => {
      globalStats.set(id, { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 });
    });
    poolPlayMatchesAll.forEach((m) => {
      if (m.status !== 'completed') return;
      const id1 = m.team1 ? m.team1.toString() : null;
      const id2 = m.team2 ? m.team2.toString() : null;
      const s1 = id1 ? globalStats.get(id1) : null;
      const s2 = id2 ? globalStats.get(id2) : null;
      const t1 = m.score?.team1Score ?? 0;
      const t2 = m.score?.team2Score ?? 0;
      if (s1) { s1.pointsFor += t1; s1.pointsAgainst += t2; if (t1 > t2) s1.wins++; else if (t2 > t1) s1.losses++; }
      if (s2) { s2.pointsFor += t2; s2.pointsAgainst += t1; if (t2 > t1) s2.wins++; else if (t1 > t2) s2.losses++; }
    });
    globalStats.forEach((s) => { s.pointDifferential = s.pointsFor - s.pointsAgainst; });

    allAdvancing.sort((a, b) => {
      const sa = globalStats.get((a._id ?? a).toString()) || {};
      const sb = globalStats.get((b._id ?? b).toString()) || {};
      if ((sb.wins ?? 0) !== (sa.wins ?? 0)) return (sb.wins ?? 0) - (sa.wins ?? 0);
      if ((sb.pointDifferential ?? 0) !== (sa.pointDifferential ?? 0)) return (sb.pointDifferential ?? 0) - (sa.pointDifferential ?? 0);
      return (sb.pointsFor ?? 0) - (sa.pointsFor ?? 0);
    });

    if (allAdvancing.length < 4) {
      return res.status(400).json({
        success: false,
        message: `Need at least 4 ${isSingles ? 'players' : 'teams'} to generate playoffs. Only ${allAdvancing.length} advancing (${pools.length} pools × ${advanceCountPerPool} per pool). Increase "advance per pool" or add more ${isSingles ? 'players' : 'teams'} to pools.`
      });
    }

    await Match.deleteMany({
      event: eventId,
      pool: null,
      bracketTier: { $in: ['gold', 'silver', 'bronze', 'event'] }
    });

    const defaultFormat = pools[0]?.matchFormat || 'Game to 11 – Win by 2';
    const matchFormats = {
      qualifiers: req.body?.matchFormats?.qualifiers ?? req.body?.matchFormats?.semifinals ?? defaultFormat,
      semifinals: req.body?.matchFormats?.semifinals ?? defaultFormat,
      finals: req.body?.matchFormats?.finals ?? defaultFormat,
      bronze: req.body?.matchFormats?.bronze ?? defaultFormat,
      losers: req.body?.matchFormats?.losers ?? req.body?.matchFormats?.qualifiers ?? defaultFormat
    };

    // ── Double-elimination path ───────────────────────────────────────
    if (event.playFormat === 'double-elimination') {
      const N = allAdvancing.length;
      if (!isPowerOf2(N) || N < 4) {
        return res.status(400).json({
          success: false,
          message: `Double elimination requires exactly 4, 8, or 16 advancing teams. Currently ${N} teams would advance. Adjust advanceCountPerPool so the total is a power of 2 (e.g. 4, 8, or 16).`
        });
      }

      const allCreated = await generateDoubleEliminationForEventTier(
        eventId, allAdvancing, teamModel, 'event'
      );

      for (const m of allCreated) {
        const label =
          m.bracket === 'winners' ? matchFormats.qualifiers
            : m.bracket === 'losers' ? matchFormats.losers
              : m.bracket === 'finals' ? matchFormats.finals
                : null;
        if (label) {
          const config = getMatchFormatConfig(label);
          if (config) {
            m.matchFormat = label;
            m.matchFormatConfig = {
              games_to_win: config.games_to_win,
              max_games: config.max_games,
              points_to_win: config.points_to_win,
              win_by: config.win_by,
              hard_cap: config.hard_cap ?? null
            };
            m.markModified('matchFormatConfig');
            await m.save();
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Double elimination bracket generated.',
        data: { matches: allCreated }
      });
    }

    // ── Single-elimination path (existing) ───────────────────────────
    const allCreated = await generateSingleEliminationForEventTier(
      eventId,
      allAdvancing,
      teamModel,
      'event',
      1
    );

    for (const m of allCreated) {
      const label =
        m.bracket === 'winners' ? matchFormats.qualifiers
          : m.bracket === 'semifinals' ? matchFormats.semifinals
            : m.bracket === 'finals' ? matchFormats.finals
              : m.bracket === 'bronze' ? matchFormats.bronze
                : null;
      if (label) {
        const config = getMatchFormatConfig(label);
        if (config) {
          m.matchFormat = label;
          m.matchFormatConfig = {
            games_to_win: config.games_to_win,
            max_games: config.max_games,
            points_to_win: config.points_to_win,
            win_by: config.win_by,
            hard_cap: config.hard_cap ?? null
          };
          m.markModified('matchFormatConfig');
          await m.save();
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Event playoff bracket generated: qualifiers → semifinals → final (gold/silver) + bronze match.',
      data: { matches: allCreated }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Finalize event-level playoffs
// @route   POST /api/events/:eventId/playoffs/complete
// @access  Private (Organizer/Admin)
export const completeEventPlayoffs = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('tournament');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (event.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (event.eventPlayoffsFinalizedAt) {
      return res.status(400).json({ success: false, message: 'Event playoffs are already finalized.' });
    }

    const isSinglesFormat = event.format === 'singles';
    const playoffMatches = await Match.find({
      event: event._id,
      pool: null,
      bracketTier: { $in: ['gold', 'silver', 'bronze', 'event'] }
    })
      .populate('team1', isSinglesFormat ? 'name email' : 'name')
      .populate('team2', isSinglesFormat ? 'name email' : 'name')
      .lean();

    if (playoffMatches.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No event playoff matches found. Generate event playoffs first.'
      });
    }
    // For DE: the bracket-reset match starts empty (teams null) unless triggered — skip it in the incomplete check
    const incomplete = playoffMatches.filter(
      (m) => m.status !== 'completed' && !(m.isGrandFinalReset && !m.team1)
    );
    if (incomplete.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${incomplete.length} playoff match(es) still need a score. Complete every match before finalizing.`
      });
    }

    const entityName = (doc) => doc?.name || doc?.email || '—';
    const getEntity = (match, isWinner) => {
      const s1 = match.score?.team1Score ?? 0;
      const s2 = match.score?.team2Score ?? 0;
      let winnerId = match.winner?._id ?? match.winner;
      const team1Id = match.team1?._id ?? match.team1;
      const team2Id = match.team2?._id ?? match.team2;
      if (!winnerId && s1 !== s2) winnerId = s1 > s2 ? team1Id : team2Id;
      if (isWinner) {
        const doc = match.team1 && String(team1Id) === String(winnerId) ? match.team1 : match.team2;
        return { entityId: winnerId, name: entityName(doc) };
      }
      const loserId = winnerId && (String(team1Id) === String(winnerId) ? team2Id : team1Id);
      const doc = match.team1 && String(team1Id) === String(loserId) ? match.team1 : match.team2;
      return { entityId: loserId, name: entityName(doc) };
    };

    const placements = [];
    let place = 1;
    const isSingleBracket = playoffMatches.some((m) => m.bracketTier === 'event');
    if (isSingleBracket) {
      const isDE = playoffMatches.some((m) => m.bracket === 'losers');

      if (isDE) {
        // Double-elimination: champion comes from GF reset (if played) or GF
        const gfReset = playoffMatches.find((m) => m.bracket === 'finals' && m.isGrandFinalReset);
        const gfMatch = playoffMatches.find((m) => m.bracket === 'finals' && !m.isGrandFinalReset);

        const resetPlayed = gfReset?.team1 && gfReset?.status === 'completed';
        const championMatch = resetPlayed ? gfReset : gfMatch;

        if (!championMatch || (championMatch.score?.team1Score ?? 0) === (championMatch.score?.team2Score ?? 0)) {
          return res.status(400).json({
            success: false,
            message: 'Grand Final must have a completed score with a clear winner before finalizing.'
          });
        }

        const champion = getEntity(championMatch, true);
        const runnerUp = getEntity(championMatch, false);
        if (champion.entityId) placements.push({ place: place++, entityId: champion.entityId, name: champion.name, tier: 'gold' });
        if (runnerUp.entityId) placements.push({ place: place++, entityId: runnerUp.entityId, name: runnerUp.name, tier: 'silver' });

        // 3rd place = loser of Losers Final (eliminated just before GF)
        const lfMatch = playoffMatches
          .filter((m) => m.bracket === 'losers')
          .sort((a, b) => b.round - a.round)[0];
        if (lfMatch?.status === 'completed') {
          const lfLoser = getEntity(lfMatch, false);
          if (lfLoser.entityId) placements.push({ place: place++, entityId: lfLoser.entityId, name: lfLoser.name, tier: 'bronze' });
        }
      } else {
        // Single-elimination
        const finalsMatch = playoffMatches.find((m) => m.bracketTier === 'event' && m.bracket === 'finals');
        const bronzeMatch = playoffMatches.find((m) => m.bracketTier === 'event' && m.bracket === 'bronze');
        if (finalsMatch && (finalsMatch.score?.team1Score ?? 0) !== (finalsMatch.score?.team2Score ?? 0)) {
          const finalWinner = getEntity(finalsMatch, true);
          const finalLoser = getEntity(finalsMatch, false);
          if (finalWinner.entityId) placements.push({ place: place++, entityId: finalWinner.entityId, name: finalWinner.name, tier: 'gold' });
          if (finalLoser.entityId) placements.push({ place: place++, entityId: finalLoser.entityId, name: finalLoser.name, tier: 'silver' });
        }
        if (bronzeMatch && bronzeMatch.status === 'completed' && (bronzeMatch.score?.team1Score ?? 0) !== (bronzeMatch.score?.team2Score ?? 0)) {
          const bw = getEntity(bronzeMatch, true);
          const bl = getEntity(bronzeMatch, false);
          if (bw.entityId) placements.push({ place: place++, entityId: bw.entityId, name: bw.name, tier: 'bronze' });
          if (bl.entityId) placements.push({ place: place++, entityId: bl.entityId, name: bl.name, tier: '4th' });
        }
      }
    } else {
      for (const tier of ['gold', 'silver', 'bronze']) {
        const tierMatches = playoffMatches.filter((m) => m.bracketTier === tier);
        const finalsMatch = tierMatches.find((m) => m.bracket === 'finals');
        const bronzeMatch = tierMatches.find((m) => m.bracket === 'bronze');
        if (!finalsMatch || (finalsMatch.score?.team1Score ?? 0) === (finalsMatch.score?.team2Score ?? 0)) continue;
        const finalWinner = getEntity(finalsMatch, true);
        const finalLoser = getEntity(finalsMatch, false);
        if (finalWinner.entityId) placements.push({ place: place++, entityId: finalWinner.entityId, name: finalWinner.name, tier });
        if (finalLoser.entityId) placements.push({ place: place++, entityId: finalLoser.entityId, name: finalLoser.name, tier });
        if (bronzeMatch && bronzeMatch.status === 'completed' && (bronzeMatch.score?.team1Score ?? 0) !== (bronzeMatch.score?.team2Score ?? 0)) {
          const bw = getEntity(bronzeMatch, true);
          const bl = getEntity(bronzeMatch, false);
          if (bw.entityId) placements.push({ place: place++, entityId: bw.entityId, name: bw.name, tier });
          if (bl.entityId) placements.push({ place: place++, entityId: bl.entityId, name: bl.name, tier });
        }
      }
    }

    event.eventPlayoffsFinalizedAt = new Date();
    event.eventPlayoffPlacements = placements;
    event.markModified('eventPlayoffPlacements');
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event playoffs finalized.',
      data: { eventPlayoffPlacements: event.eventPlayoffPlacements }
    });
  } catch (error) {
    next(error);
  }
};

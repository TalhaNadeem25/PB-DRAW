import Pool from '../models/Pool.js';
import Match from '../models/Match.js';
import Event from '../models/Event.js';
import { generateSingleEliminationBracket } from '../utils/bracketGenerator.js';
import { getMatchFormatConfig } from '../constants/matchFormatConfig.js';

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

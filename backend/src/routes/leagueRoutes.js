import express from 'express';
import League from '../models/League.js';
import LeagueMatch from '../models/LeagueMatch.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Helper: check if user is organizer of the league
const isOrganizerOrAdmin = (league, user) => {
  return (
    league.organizer._id?.toString() === user._id.toString() ||
    league.organizer.toString() === user._id.toString() ||
    user.role === 'admin'
  );
};

// GET /api/leagues — get all public leagues
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      leagueType,
      playerGroup,
      status
    } = req.query;

    const query = { 'settings.isPublic': true };

    if (search) {
      query.$text = { $search: search };
    }
    if (leagueType) {
      query.leagueType = leagueType;
    }
    if (playerGroup) {
      query.playerGroup = playerGroup;
    }
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await League.countDocuments(query);
    const leagues = await League.find(query)
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: leagues,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leagues — create league
router.post('/', protect, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const league = await League.create({
      ...req.body,
      organizer: req.user._id
    });
    res.status(201).json({ success: true, data: league });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/leagues/:id — get league by id
router.get('/:id', async (req, res) => {
  try {
    const league = await League.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('players.player', 'name email skillLevel')
      .populate('standings.player', 'name email');

    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }

    res.json({ success: true, data: league });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/leagues/:id — update league
router.put('/:id', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }
    if (!isOrganizerOrAdmin(league, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await League.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/leagues/:id — delete league
router.delete('/:id', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }
    if (!isOrganizerOrAdmin(league, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await league.deleteOne();
    res.json({ success: true, message: 'League deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leagues/:id/register — register current user
router.post('/:id/register', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }

    const alreadyRegistered = league.players.some(
      (p) => p.player.toString() === req.user._id.toString()
    );
    if (alreadyRegistered) {
      return res.status(400).json({ success: false, message: 'Already registered' });
    }

    if (league.players.length >= league.maxPlayers) {
      return res.status(400).json({ success: false, message: 'League is full' });
    }

    league.players.push({ player: req.user._id, joinedAt: new Date() });
    await league.save();

    res.json({ success: true, message: 'Registered successfully', data: league });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/leagues/:id/register — unregister
router.delete('/:id/register', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }

    league.players = league.players.filter(
      (p) => p.player.toString() !== req.user._id.toString()
    );
    await league.save();

    res.json({ success: true, message: 'Unregistered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/leagues/:id/players — get all registered players (organizer only)
router.get('/:id/players', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id)
      .populate('players.player', 'name email skillLevel createdAt');

    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }
    if (!isOrganizerOrAdmin(league, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: league.players });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/leagues/:id/standings — update standings (organizer only)
router.put('/:id/standings', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }
    if (!isOrganizerOrAdmin(league, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { standings } = req.body;
    if (!Array.isArray(standings)) {
      return res.status(400).json({ success: false, message: 'standings must be an array' });
    }

    league.standings = standings.map((s) => ({
      player: s.playerId,
      rank: s.rank,
      wins: s.wins,
      losses: s.losses,
      points: s.points,
      gamesPlayed: s.gamesPlayed
    }));

    await league.save();
    const updated = await League.findById(req.params.id).populate('standings.player', 'name email');
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/leagues/:id/sessions — add a session (organizer only)
router.post('/:id/sessions', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }
    if (!isOrganizerOrAdmin(league, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const sessionNumber = league.sessions.length + 1;
    league.sessions.push({
      sessionNumber,
      date: req.body.date,
      notes: req.body.notes || '',
      status: 'upcoming'
    });
    await league.save();

    res.status(201).json({ success: true, data: league });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/leagues/:id/sessions/:sessionId — update session
router.put('/:id/sessions/:sessionId', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }
    if (!isOrganizerOrAdmin(league, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const session = league.sessions.id(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (req.body.status) session.status = req.body.status;
    if (req.body.notes !== undefined) session.notes = req.body.notes;
    if (req.body.date) session.date = req.body.date;

    await league.save();
    res.json({ success: true, data: league });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/leagues/:id/status — update league status (organizer only)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }
    if (!isOrganizerOrAdmin(league, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    league.status = req.body.status;
    await league.save();
    res.json({ success: true, data: league });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Round-robin generator using circle method
function generateRoundRobinPairings(players) {
  if (players.length < 2) return [];
  const list = players.length % 2 === 0 ? [...players] : [...players, null]; // null = bye
  const numRounds = list.length - 1;
  const allMatches = [];

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < list.length / 2; i++) {
      const p1 = list[i];
      const p2 = list[list.length - 1 - i];
      if (p1 !== null && p2 !== null) {
        allMatches.push({ player1: p1, player2: p2, round: round + 1 });
      }
    }
    // Rotate: keep index 0 fixed, rotate the rest
    const last = list.splice(list.length - 1, 1)[0];
    list.splice(1, 0, last);
  }
  return allMatches;
}

// Recalculate standings from all completed matches
async function recalculateStandings(league) {
  const matches = await LeagueMatch.find({ league: league._id, status: 'completed' });
  const stats = {};

  // Initialize stats for all registered players
  for (const entry of league.players) {
    const pid = entry.player.toString();
    stats[pid] = { wins: 0, losses: 0, gamesPlayed: 0, pointsEarned: 0, pointsPossible: 0 };
  }

  for (const match of matches) {
    const p1 = match.player1.toString();
    const p2 = match.player2.toString();
    if (!stats[p1]) stats[p1] = { wins: 0, losses: 0, gamesPlayed: 0, pointsEarned: 0, pointsPossible: 0 };
    if (!stats[p2]) stats[p2] = { wins: 0, losses: 0, gamesPlayed: 0, pointsEarned: 0, pointsPossible: 0 };

    stats[p1].gamesPlayed++;
    stats[p2].gamesPlayed++;
    stats[p1].pointsPossible++;
    stats[p2].pointsPossible++;

    if (match.winner) {
      const winnerId = match.winner.toString();
      const loserId = winnerId === p1 ? p2 : p1;
      stats[winnerId].wins++;
      stats[winnerId].pointsEarned++;
      stats[loserId].losses++;
    }
  }

  const rankingType = league.rankingType || 'pop';

  const standings = Object.entries(stats).map(([playerId, s]) => {
    let points;
    if (rankingType === 'pop') {
      points = s.pointsPossible > 0 ? Math.round((s.pointsEarned / s.pointsPossible) * 10000) / 100 : 0;
    } else if (rankingType === 'up-down') {
      points = s.wins * 2 - s.losses;
    } else if (rankingType === 'custom') {
      // Win=3pts, Loss=1pt, played=0.5pt
      points = s.wins * 3 + s.losses * 1 + s.gamesPlayed * 0.5;
    } else {
      // dupr or default: rank by wins
      points = s.wins;
    }
    return { player: playerId, wins: s.wins, losses: s.losses, points: Math.max(0, Math.round(points * 100) / 100), gamesPlayed: s.gamesPlayed, rank: 0 };
  });

  standings.sort((a, b) => b.points - a.points || b.wins - a.wins);
  standings.forEach((s, i) => { s.rank = i + 1; });

  league.standings = standings;
  await league.save();
  return standings;
}

// POST /api/leagues/:id/sessions/:sessionId/generate-matches — generate round-robin for a session
router.post('/:id/sessions/:sessionId/generate-matches', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id).populate('players.player', '_id name');
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });
    if (!isOrganizerOrAdmin(league, req.user)) return res.status(403).json({ success: false, message: 'Not authorized' });

    const session = league.sessions.id(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    // Delete any existing matches for this session
    await LeagueMatch.deleteMany({ league: league._id, sessionId: session._id });

    const playerIds = league.players.map(p => p.player._id || p.player);
    if (playerIds.length < 2) {
      return res.status(400).json({ success: false, message: 'Need at least 2 players to generate matches' });
    }

    const pairings = generateRoundRobinPairings(playerIds);
    const matchDocs = pairings.map(p => ({
      league: league._id,
      sessionId: session._id,
      sessionNumber: session.sessionNumber,
      player1: p.player1,
      player2: p.player2,
      round: p.round,
    }));

    const matches = await LeagueMatch.insertMany(matchDocs);

    res.status(201).json({ success: true, data: matches, total: matches.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/leagues/:id/sessions/:sessionId/matches — get all matches for a session
router.get('/:id/sessions/:sessionId/matches', protect, async (req, res) => {
  try {
    const matches = await LeagueMatch.find({
      league: req.params.id,
      sessionId: req.params.sessionId,
    })
      .populate('player1', 'name email')
      .populate('player2', 'name email')
      .populate('winner', 'name')
      .sort({ round: 1, createdAt: 1 });

    res.json({ success: true, data: matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/leagues/:id/matches/:matchId/score — enter/update score
router.put('/:id/matches/:matchId/score', protect, async (req, res) => {
  try {
    const league = await League.findById(req.params.id).populate('players.player', '_id');
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });
    if (!isOrganizerOrAdmin(league, req.user)) return res.status(403).json({ success: false, message: 'Not authorized' });

    const match = await LeagueMatch.findById(req.params.matchId);
    if (!match || match.league.toString() !== req.params.id) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const { score1, score2 } = req.body;
    if (score1 == null || score2 == null) {
      return res.status(400).json({ success: false, message: 'score1 and score2 are required' });
    }

    match.score1 = Number(score1);
    match.score2 = Number(score2);
    match.status = 'completed';
    match.winner = Number(score1) > Number(score2) ? match.player1 : match.player2;
    await match.save();

    // Recalculate standings
    const standings = await recalculateStandings(league);

    const populated = await LeagueMatch.findById(match._id)
      .populate('player1', 'name email')
      .populate('player2', 'name email')
      .populate('winner', 'name');

    res.json({ success: true, data: populated, standings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

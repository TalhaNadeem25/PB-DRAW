import express from 'express';
import League from '../models/League.js';
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

export default router;

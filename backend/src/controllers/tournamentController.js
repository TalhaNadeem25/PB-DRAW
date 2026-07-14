import Tournament from '../models/Tournament.js';
import Event from '../models/Event.js';
import Payment from '../models/Payment.js';
import Team from '../models/Team.js';
import Pool from '../models/Pool.js';
import Match from '../models/Match.js';
import Waitlist from '../models/Waitlist.js';
import cloudinary from '../config/cloudinary.js';
import { emitTournamentUpdate } from '../utils/socket.js';

// Location filter: state code -> regex for tournament location field
const LOCATION_REGEX = {
  ca: /CA|California/i,
  fl: /FL|Florida/i,
  tx: /TX|Texas/i,
};

// @desc    Get all tournaments (server-side filter, sort, pagination)
// @route   GET /api/tournaments
// @access  Public
export const getTournaments = async (req, res, next) => {
  try {
    const {
      status,
      search,
      limit = 12,
      page = 1,
      sort = 'soonest',
      location,
      skillLevel,
      entryFeeMax,
      format,
    } = req.query;

    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);

    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    if (location && location !== 'all' && location !== 'near') {
      const regex = LOCATION_REGEX[location.toLowerCase()];
      if (regex) query.location = regex;
    }

    if (skillLevel && skillLevel !== 'all') {
      const level = parseFloat(skillLevel);
      if (!Number.isNaN(level)) {
        query.$or = [
          { skillLevelRequirement: { $exists: false } },
          { $and: [{ 'skillLevelRequirement.min': { $lte: level } }, { 'skillLevelRequirement.max': { $gte: level } }] },
        ];
      }
    }

    if (entryFeeMax !== undefined && entryFeeMax !== '' && entryFeeMax !== 'all') {
      const max = parseFloat(entryFeeMax);
      if (!Number.isNaN(max)) {
        query.entryFee = max === 0 ? 0 : { $lte: max };
      }
    }

    if (format && format !== 'all') {
      const formatValue = format === 'mixed' ? 'mixed-doubles' : format;
      const tournamentIds = await Event.distinct('tournament', { format: formatValue });
      query._id = { $in: tournamentIds };
    }

    const sortOption = sort === 'popular' ? { currentPlayers: -1, startDate: 1 } : { startDate: 1 };

    const [tournaments, total] = await Promise.all([
      Tournament.find(query)
        .populate('organizer', 'name email')
        .populate('events')
        .sort(sortOption)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean(),
      Tournament.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: tournaments.length,
      total,
      page: pageNum,
      pages,
      data: tournaments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tournament
// @route   GET /api/tournaments/:id
// @access  Public
export const getTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', 'name email phone')
      .populate({
        path: 'events',
        populate: {
          path: 'teams pools',
          select: 'name players status'
        }
      })
      .populate('registeredPlayers', 'name email skillLevel');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create tournament
// @route   POST /api/tournaments
// @access  Private (Organizer/Admin)
export const createTournament = async (req, res, next) => {
  try {
    // Add organizer from logged in user
    req.body.organizer = req.user.id;

    const tournament = await Tournament.create(req.body);

    // Add tournament to user's createdTournaments
    req.user.createdTournaments.push(tournament._id);
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tournament
// @route   PUT /api/tournaments/:id
// @access  Private (Organizer/Admin)
export const updateTournament = async (req, res, next) => {
  try {
    let tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is tournament organizer or admin
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this tournament'
      });
    }

    tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    emitTournamentUpdate(req.app.get('io'), tournament._id.toString(), {
      tournamentId: tournament._id,
      status: tournament.status
    });

    res.status(200).json({
      success: true,
      message: 'Tournament updated successfully',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tournament
// @route   DELETE /api/tournaments/:id
// @access  Private (Organizer/Admin)
export const deleteTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is tournament organizer or admin
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this tournament'
      });
    }

    // Delete all related events and everything under them (teams, pools, matches,
    // waitlist entries) — otherwise those get orphaned and crash later whenever
    // something populates their deleted `event` reference.
    const events = await Event.find({ tournament: tournament._id }).select('_id');
    const eventIds = events.map(e => e._id);

    await Team.deleteMany({ event: { $in: eventIds } });
    await Pool.deleteMany({ event: { $in: eventIds } });
    await Match.deleteMany({ event: { $in: eventIds } });
    await Waitlist.deleteMany({ event: { $in: eventIds } });
    await Event.deleteMany({ tournament: tournament._id });

    await tournament.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Tournament deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start tournament (change status to in-progress)
// @route   PUT /api/tournaments/:id/start
// @access  Private (Organizer/Admin)
export const startTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is tournament organizer or admin
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this tournament'
      });
    }

    // Check if tournament is in a valid status to start
    if (tournament.status !== 'open' && tournament.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: `Cannot start tournament with status "${tournament.status}". Tournament must be "open" or "closed" to start.`
      });
    }

    // Update status to in-progress
    tournament.status = 'in-progress';
    await tournament.save();

    emitTournamentUpdate(req.app.get('io'), tournament._id.toString(), {
      tournamentId: tournament._id,
      status: tournament.status
    });

    res.status(200).json({
      success: true,
      message: 'Tournament started successfully! It is now live.',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete tournament (change status to completed)
// @route   PUT /api/tournaments/:id/complete
// @access  Private (Organizer/Admin)
export const completeTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is tournament organizer or admin
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this tournament'
      });
    }

    // Can only complete a tournament that is in-progress
    if (tournament.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete tournament with status "${tournament.status}". Tournament must be "in-progress" to complete.`
      });
    }

    tournament.status = 'completed';
    await tournament.save();

    emitTournamentUpdate(req.app.get('io'), tournament._id.toString(), {
      tournamentId: tournament._id,
      status: tournament.status
    });

    res.status(200).json({
      success: true,
      message: 'Tournament completed successfully!',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registrations for a tournament
// @route   GET /api/tournaments/:id/registrations
// @access  Private (Organizer/Admin)
export const getTournamentRegistrations = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is tournament organizer or admin
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view registrations for this tournament'
      });
    }

    // Get all events with their teams and registered players
    const events = await Event.find({ tournament: req.params.id })
      .populate({
        path: 'teams',
        populate: {
          path: 'players',
          select: 'name email skillLevel'
        }
      })
      .populate({
        path: 'registeredPlayers.player',
        select: 'name email skillLevel'
      })
      .select('name format skillLevel entryFee teams registeredPlayers');

    // Fetch all completed payments for this tournament in one query
    const payments = await Payment.find({
      tournament: req.params.id,
      status: 'completed'
    }).select('_id team user event events status amount');

    // Build lookup maps
    const paymentByTeam = {};
    const paymentByUserEvent = {};
    for (const p of payments) {
      if (p.team) paymentByTeam[p.team.toString()] = p._id.toString();
      if (p.user) {
        const evIds = p.events?.length ? p.events : (p.event ? [p.event] : []);
        for (const evId of evIds) {
          paymentByUserEvent[`${p.user.toString()}:${evId.toString()}`] = p._id.toString();
        }
      }
    }

    // Format the response data
    const registrations = events.map(event => ({
      eventId: event._id,
      eventName: event.name,
      format: event.format,
      skillLevel: event.skillLevel,
      entryFee: event.entryFee,
      teams: event.teams
        .filter(team => team.paymentStatus === 'paid')
        .map(team => ({
          teamId: team._id,
          teamName: team.name,
          players: team.players.map(player => ({
            playerId: player._id,
            name: player.name,
            email: player.email,
            skillLevel: player.skillLevel
          })),
          paymentStatus: team.paymentStatus,
          paymentId: paymentByTeam[team._id.toString()] || null,
          registeredAt: team.createdAt
        })),
      registeredPlayers: event.registeredPlayers.map(reg => ({
        playerId: reg.player._id,
        name: reg.player.name,
        email: reg.player.email,
        skillLevel: reg.player.skillLevel,
        paymentStatus: reg.paymentStatus,
        paymentId: paymentByUserEvent[`${reg.player._id.toString()}:${event._id.toString()}`] || null,
        registeredAt: reg.registeredAt
      }))
    }));

    res.status(200).json({
      success: true,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register for tournament
// @route   POST /api/tournaments/:id/register
// @access  Private
export const registerForTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if registration is open
    if (tournament.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Registration is not open for this tournament'
      });
    }

    // Check if already registered
    if (tournament.registeredPlayers.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this tournament'
      });
    }

    // Check if tournament is full
    if (tournament.currentPlayers >= tournament.maxPlayers) {
      return res.status(400).json({
        success: false,
        message: 'Tournament is full'
      });
    }

    // Add player to tournament
    tournament.registeredPlayers.push(req.user.id);
    tournament.currentPlayers += 1;
    await tournament.save();

    // Add tournament to user's tournaments
    req.user.tournaments.push(tournament._id);
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Successfully registered for tournament',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload tournament image
// @route   POST /api/tournaments/:id/upload-image
// @access  Private (Organizer/Admin)
export const uploadTournamentImage = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check ownership
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this tournament'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Delete old image from Cloudinary if exists
    if (tournament.image) {
      try {
        // Extract public_id from image URL
        const urlParts = tournament.image.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `pickle-rally/tournaments/${filename.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Continue even if deletion fails
      }
    }

    // Update tournament with new image URL from Cloudinary
    tournament.image = req.file.path;
    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Tournament image uploaded successfully',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

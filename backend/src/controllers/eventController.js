import Event from '../models/Event.js';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Pool from '../models/Pool.js';

// @desc    Get all events for a tournament
// @route   GET /api/tournaments/:tournamentId/events
// @access  Public
export const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ tournament: req.params.tournamentId })
      .populate('teams', 'name players')
      .populate('pools', 'name teams');

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
export const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('tournament', 'name location startDate')
      .populate({
        path: 'teams',
        populate: { path: 'players', select: 'name email skillLevel' }
      })
      .populate({
        path: 'pools',
        populate: { path: 'teams matches' }
      })
      .populate({
        path: 'registeredPlayers.player',
        select: 'name email skillLevel'
      });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create event
// @route   POST /api/tournaments/:tournamentId/events
// @access  Private (Organizer/Admin)
export const createEvent = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check authorization
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create events for this tournament'
      });
    }

    req.body.tournament = req.params.tournamentId;
    const event = await Event.create(req.body);

    // Add event to tournament
    tournament.events.push(event._id);
    await tournament.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Organizer/Admin)
export const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id).populate('tournament');

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
        message: 'Not authorized to update this event'
      });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Organizer/Admin)
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('tournament');

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
        message: 'Not authorized to delete this event'
      });
    }

    // Delete all related teams and pools
    await Team.deleteMany({ event: event._id });
    await Pool.deleteMany({ event: event._id });

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign singles player to pool
// @route   PUT /api/events/:eventId/assign-player/:playerId
// @access  Private (Organizer/Admin)
export const assignPlayerToPool = async (req, res, next) => {
  try {
    const { eventId, playerId } = req.params;
    const { poolId } = req.body;

    const event = await Event.findById(eventId).populate('tournament');

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
        message: 'Not authorized to assign players for this event'
      });
    }

    // Verify pool exists and belongs to this event
    const pool = await Pool.findById(poolId);
    if (!pool || pool.event.toString() !== eventId) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found or does not belong to this event'
      });
    }

    // Find the player in registeredPlayers
    const playerRegistration = event.registeredPlayers.find(
      reg => reg.player.toString() === playerId
    );

    if (!playerRegistration) {
      return res.status(404).json({
        success: false,
        message: 'Player not registered for this event'
      });
    }

    // Update player's pool assignment
    playerRegistration.pool = poolId;
    await event.save();

    // Note: For singles events, we don't add to pool.teams (that's for Team documents)
    // The player's pool assignment is stored in event.registeredPlayers[].pool

    res.status(200).json({
      success: true,
      message: 'Player assigned to pool successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove singles player from pool
// @route   PUT /api/events/:eventId/remove-player/:playerId
// @access  Private (Organizer/Admin)
export const removePlayerFromPool = async (req, res, next) => {
  try {
    const { eventId, playerId } = req.params;

    const event = await Event.findById(eventId).populate('tournament');

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
        message: 'Not authorized to modify players for this event'
      });
    }

    // Find the player in registeredPlayers
    const playerRegistration = event.registeredPlayers.find(
      reg => reg.player.toString() === playerId
    );

    if (!playerRegistration) {
      return res.status(404).json({
        success: false,
        message: 'Player not registered for this event'
      });
    }

    // Remove player's pool assignment
    playerRegistration.pool = null;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Player removed from pool successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

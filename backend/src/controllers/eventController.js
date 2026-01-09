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

// @desc    Move registered player to different event (for singles)
// @route   PUT /api/events/:eventId/move-player/:playerId
// @access  Private (Organizer/Admin)
export const movePlayerToEvent = async (req, res, next) => {
  try {
    const { eventId, playerId } = req.params;
    const { targetEventId } = req.body;

    if (!targetEventId) {
      return res.status(400).json({
        success: false,
        message: 'Target event ID is required'
      });
    }

    const sourceEvent = await Event.findById(eventId).populate('tournament');
    const targetEvent = await Event.findById(targetEventId).populate('tournament');

    if (!sourceEvent || !targetEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is tournament organizer or admin
    if (sourceEvent.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to move players'
      });
    }

    // Check if same tournament
    if (sourceEvent.tournament._id.toString() !== targetEvent.tournament._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot move player to event in different tournament'
      });
    }

    // Check if both events are singles format
    if (sourceEvent.format !== 'singles' || targetEvent.format !== 'singles') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is only for singles events. Use move team endpoint for doubles/mixed.'
      });
    }

    // Find player in source event
    const playerIndex = sourceEvent.registeredPlayers.findIndex(
      reg => reg.player.toString() === playerId
    );

    if (playerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Player not registered for this event'
      });
    }

    const playerRegistration = sourceEvent.registeredPlayers[playerIndex];

    // Check if target event has space
    if (targetEvent.currentTeams >= targetEvent.maxTeams) {
      return res.status(400).json({
        success: false,
        message: 'Target event is full'
      });
    }

    // Remove from source event
    sourceEvent.registeredPlayers.splice(playerIndex, 1);
    sourceEvent.currentTeams = Math.max(0, sourceEvent.currentTeams - 1);

    // Add to target event (preserve payment info)
    targetEvent.registeredPlayers.push({
      player: playerRegistration.player,
      registeredAt: playerRegistration.registeredAt,
      paymentStatus: playerRegistration.paymentStatus,
      payment: playerRegistration.payment,
      pool: null // Reset pool assignment
    });
    targetEvent.currentTeams += 1;

    // Save both events
    await sourceEvent.save();
    await targetEvent.save();

    res.status(200).json({
      success: true,
      message: `Player moved successfully from "${sourceEvent.name}" to "${targetEvent.name}"`,
      data: targetEvent
    });
  } catch (error) {
    next(error);
  }
};

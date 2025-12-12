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

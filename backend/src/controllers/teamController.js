import Team from '../models/Team.js';
import Event from '../models/Event.js';
import Tournament from '../models/Tournament.js';
import { joinWaitlist } from './waitlistController.js';

// @desc    Get all teams for an event OR for current user
// @route   GET /api/events/:eventId/teams OR GET /api/teams?userId=me
// @access  Public
export const getTeams = async (req, res, next) => {
  try {
    let query = {};

    // If eventId is provided in params, filter by event
    if (req.params.eventId) {
      query.event = req.params.eventId;
    }

    // If userId=me query param, filter by current user's teams
    if (req.query.userId === 'me' && req.user) {
      query.players = req.user.id;
    }

    const teams = await Team.find(query)
      .populate('players', 'name email skillLevel')
      .populate('pool', 'name')
      .populate({
        path: 'event',
        select: 'name format playFormat skillLevel tournament',
        populate: {
          path: 'tournament',
          select: 'name location startDate endDate'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Public
export const getTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('players', 'name email skillLevel phone')
      .populate('event', 'name format tournament')
      .populate('pool', 'name');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create team
// @route   POST /api/events/:eventId/teams
// @access  Private
export const createTeam = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('tournament');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is full
    if (event.currentTeams >= event.maxTeams) {
      // Check if tournament allows waitlist
      const tournament = await Tournament.findById(event.tournament._id || event.tournament);

      if (tournament && tournament.settings && tournament.settings.allowWaitlist) {
        // Create unpaid team first for waitlist tracking
        req.body.event = req.params.eventId;
        req.body.paymentStatus = 'pending'; // Mark as pending
        const team = await Team.create(req.body);

        // Join waitlist instead of failing
        req.body.teamId = team._id;
        req.body.teamName = team.name;
        req.body.partnerName = req.body.partnerName || '';
        req.body.partnerEmail = req.body.partnerEmail || '';

        return await joinWaitlist(req, res, next);
      }

      // No waitlist enabled - hard stop
      return res.status(400).json({
        success: false,
        message: 'Event is full and waitlist is not available'
      });
    }

    // Event has space - create team normally
    req.body.event = req.params.eventId;
    const team = await Team.create(req.body);

    // Add team to event
    event.teams.push(team._id);
    event.currentTeams += 1;
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private
export const updateTeam = async (req, res, next) => {
  try {
    let team = await Team.findById(req.params.id).populate('players');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is part of the team
    const isTeamMember = team.players.some(
      player => player._id.toString() === req.user.id
    );

    if (!isTeamMember && req.user.role !== 'organizer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this team'
      });
    }

    team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('players', 'name email skillLevel');

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: team
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private
export const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id).populate('players event');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is part of the team or organizer
    const isTeamMember = team.players.some(
      player => player._id.toString() === req.user.id
    );

    if (!isTeamMember && req.user.role !== 'organizer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this team'
      });
    }

    // Update event team count
    const event = await Event.findById(team.event._id);
    if (event) {
      event.currentTeams = Math.max(0, event.currentTeams - 1);
      await event.save();
    }

    await team.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

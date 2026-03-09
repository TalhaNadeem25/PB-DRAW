import Team from '../models/Team.js';
import Event from '../models/Event.js';
import Tournament from '../models/Tournament.js';
import Waitlist from '../models/Waitlist.js';
import Invitation from '../models/Invitation.js';
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
      // Exclude unpaid (abandoned checkout) teams from event rosters
      query.paymentStatus = { $ne: 'unpaid' };
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
          select: 'name location startDate endDate status'
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

    // Guard against duplicate registration — must run before the "event full" check
    const alreadyRegistered = await Team.findOne({
      event: req.params.eventId,
      players: req.user.id,
    });
    if (alreadyRegistered) {
      if (alreadyRegistered.paymentStatus === 'unpaid') {
        // Abandoned checkout — clean up the ghost team and let the user retry
        await Event.findByIdAndUpdate(req.params.eventId, {
          $pull: { teams: alreadyRegistered._id },
          $inc: { currentTeams: -1 }
        });
        await Invitation.deleteMany({ team: alreadyRegistered._id, status: 'pending' });
        await alreadyRegistered.deleteOne();
      } else {
        // Paid or partially paid — genuinely registered
        return res.status(409).json({
          success: false,
          message: 'You are already registered for this event'
        });
      }
    }

    // Check if event is full
    if (event.currentTeams >= event.maxTeams) {
      const tournament = await Tournament.findById(event.tournament._id || event.tournament);

      // If user was approved from waitlist (promoted), allow them to register
      const promotedEntry = await Waitlist.findOne({
        event: req.params.eventId,
        user: req.user.id,
        status: 'promoted',
        promotionExpiresAt: { $gt: new Date() }
      });
      if (promotedEntry) {
        req.body.event = req.params.eventId;
        const team = await Team.create(req.body);
        event.teams.push(team._id);
        event.currentTeams += 1;
        await event.save();
        promotedEntry.status = 'converted';
        promotedEntry.convertedAt = new Date();
        promotedEntry.teamId = team._id;
        await promotedEntry.save();
        return res.status(201).json({
          success: true,
          message: 'Team created successfully (from waitlist approval)',
          data: team
        });
      }

      // Not promoted — check if tournament allows waitlist and add to waitlist
      if (tournament && tournament.settings && tournament.settings.allowWaitlist) {
        req.body.event = req.params.eventId;
        req.body.paymentStatus = 'pending';
        const team = await Team.create(req.body);
        req.body.teamId = team._id;
        req.body.teamName = team.name;
        req.body.partnerName = req.body.partnerName || '';
        req.body.partnerEmail = req.body.partnerEmail || '';
        return await joinWaitlist(req, res, next);
      }

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

// @desc    Move team to different event
// @route   PUT /api/teams/:id/move-event
// @access  Private (Organizer/Admin)
export const moveTeamToEvent = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id).populate({
      path: 'event',
      populate: { path: 'tournament' }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const { targetEventId } = req.body;

    if (!targetEventId) {
      return res.status(400).json({
        success: false,
        message: 'Target event ID is required'
      });
    }

    const targetEvent = await Event.findById(targetEventId).populate('tournament');

    if (!targetEvent) {
      return res.status(404).json({
        success: false,
        message: 'Target event not found'
      });
    }

    // Check if user is tournament organizer or admin
    if (targetEvent.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to move teams'
      });
    }

    // Check if same tournament
    if (team.event.tournament._id.toString() !== targetEvent.tournament._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot move team to event in different tournament'
      });
    }

    // Check if target event has space
    if (targetEvent.currentTeams >= targetEvent.maxTeams) {
      return res.status(400).json({
        success: false,
        message: 'Target event is full'
      });
    }

    // Check if formats match
    if (team.event.format !== targetEvent.format) {
      return res.status(400).json({
        success: false,
        message: 'Cannot move team between different formats (singles/doubles)'
      });
    }

    const oldEvent = await Event.findById(team.event._id);

    // Remove team from old event
    oldEvent.teams = oldEvent.teams.filter(t => t.toString() !== team._id.toString());
    oldEvent.currentTeams = Math.max(0, oldEvent.currentTeams - 1);
    await oldEvent.save();

    // Add team to new event
    targetEvent.teams.push(team._id);
    targetEvent.currentTeams += 1;
    await targetEvent.save();

    // Update team's event reference
    team.event = targetEventId;
    await team.save();

    res.status(200).json({
      success: true,
      message: `Team moved successfully from "${oldEvent.name}" to "${targetEvent.name}"`,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

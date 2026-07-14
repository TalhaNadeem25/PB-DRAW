import Waitlist from '../models/Waitlist.js';
import Event from '../models/Event.js';
import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import { sendWaitlistJoinedEmail, sendWaitlistPromotionEmail, sendWaitlistExpiredEmail } from '../services/emailService.js';
import { createNotification } from './notificationController.js';

/**
 * Join waitlist for an event
 * @route   POST /api/events/:eventId/waitlist
 * @access  Private
 */
export const joinWaitlist = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { partnerEmail, partnerName, teamName } = req.body;

    // Get event and tournament
    const event = await Event.findById(eventId).populate('tournament');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const tournament = await Tournament.findById(event.tournament);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if waitlist is enabled
    if (!tournament.settings?.allowWaitlist) {
      return res.status(400).json({
        success: false,
        message: 'Waitlist is not enabled for this tournament'
      });
    }

    // Check if event is full
    if (event.currentTeams < event.maxTeams) {
      return res.status(400).json({
        success: false,
        message: 'Event is not full. Please register normally.'
      });
    }

    // Check if user already on waitlist
    const existingWaitlist = await Waitlist.findOne({
      event: eventId,
      user: req.user.id,
      status: 'waiting'
    });

    if (existingWaitlist) {
      return res.status(400).json({
        success: false,
        message: 'You are already on the waitlist for this event',
        data: { position: existingWaitlist.position }
      });
    }

    // Calculate position (last position + 1)
    const lastEntry = await Waitlist.findOne({
      event: eventId,
      status: 'waiting'
    }).sort({ position: -1 });

    const position = lastEntry ? lastEntry.position + 1 : 1;

    // Create waitlist entry
    const waitlistEntry = await Waitlist.create({
      event: eventId,
      user: req.user.id,
      position,
      status: 'waiting',
      metadata: {
        partnerEmail,
        partnerName,
        teamName
      }
    });

    // Get total waitlist count
    const totalWaiting = await Waitlist.countDocuments({
      event: eventId,
      status: 'waiting'
    });

    // Send confirmation email
    try {
      await sendWaitlistJoinedEmail({
        to: req.user.email,
        playerName: req.user.name,
        eventName: event.name,
        tournamentName: tournament.name,
        position,
        totalWaiting
      });
    } catch (emailError) {
      console.error('Failed to send waitlist joined email:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Successfully joined waitlist',
      data: {
        waitlistId: waitlistEntry._id,
        position,
        totalWaiting,
        estimatedWait: `${position} ${position === 1 ? 'person' : 'people'} ahead`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get waitlist position for current user
 * @route   GET /api/events/:eventId/waitlist/my-position
 * @access  Private
 */
export const getWaitlistPosition = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const waitlistEntry = await Waitlist.findOne({
      event: eventId,
      user: req.user.id,
      status: { $in: ['waiting', 'promoted'] }
    });

    if (!waitlistEntry) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    // Get total waitlist count
    const totalWaiting = await Waitlist.countDocuments({
      event: eventId,
      status: 'waiting'
    });

    // Get people ahead
    const peopleAhead = await Waitlist.countDocuments({
      event: eventId,
      status: 'waiting',
      position: { $lt: waitlistEntry.position }
    });

    res.status(200).json({
      success: true,
      data: {
        position: waitlistEntry.position,
        status: waitlistEntry.status,
        totalWaiting,
        peopleAhead,
        promotedAt: waitlistEntry.promotedAt,
        promotionExpiresAt: waitlistEntry.promotionExpiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Leave waitlist
 * @route   DELETE /api/events/:eventId/waitlist
 * @access  Private
 */
export const leaveWaitlist = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const waitlistEntry = await Waitlist.findOne({
      event: eventId,
      user: req.user.id,
      status: 'waiting'
    });

    if (!waitlistEntry) {
      return res.status(404).json({
        success: false,
        message: 'You are not on the waitlist for this event'
      });
    }

    const removedPosition = waitlistEntry.position;

    // Remove entry
    await waitlistEntry.deleteOne();

    // Reorder positions for entries after this one
    await Waitlist.updateMany(
      {
        event: eventId,
        status: 'waiting',
        position: { $gt: removedPosition }
      },
      {
        $inc: { position: -1 }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Successfully left waitlist'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Promote next person from waitlist (internal function)
 * @param {string} eventId - Event ID
 * @param {string} reason - Reason for promotion
 * @param {object} io - Socket.IO instance (optional, for in-app notifications)
 * @returns {object} - Promoted waitlist entry
 */
export const promoteNextWaitlist = async (eventId, reason = 'spot-available', io = null) => {
  try {
    // Only promote if a spot is actually available. currentTeams tracks registered
    // teams/players; entries already 'promoted' with an unexpired window have a spot
    // reserved for them (they just haven't finished registering yet), so those count
    // against capacity too. Without this check, promotion could be triggered by an
    // event that doesn't free a spot (e.g. a partner-invitation payment) and overbook
    // the event once the promoted user registers.
    const event = await Event.findById(eventId).populate('tournament');
    if (!event) {
      console.log(`Event ${eventId} not found; cannot promote waitlist`);
      return null;
    }

    const activePromotions = await Waitlist.countDocuments({
      event: eventId,
      status: 'promoted',
      promotionExpiresAt: { $gt: new Date() }
    });

    const availableSpots = event.maxTeams - event.currentTeams - activePromotions;
    if (availableSpots <= 0) {
      console.log(`No available spots to promote for event ${eventId}`);
      return null;
    }

    // Find next waiting entry
    const nextEntry = await Waitlist.findOne({
      event: eventId,
      status: 'waiting'
    }).sort({ position: 1 }).populate('user event');

    if (!nextEntry) {
      console.log('No waitlist entries to promote');
      return null;
    }

    // Update status to promoted
    nextEntry.status = 'promoted';
    nextEntry.promotedAt = new Date();
    nextEntry.promotionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await nextEntry.save();

    // Get tournament details
    const tournament = await Tournament.findById(event.tournament);
    const tournamentId = tournament._id?.toString?.() || tournament.toString();

    // Generate payment URL (event registration page with tournament context)
    const paymentUrl = `${process.env.CLIENT_URL}/tournaments/${tournamentId}/register/${eventId}`;

    // Send in-app notification
    if (io) {
      try {
        await createNotification(io, nextEntry.user._id, {
          type: 'waitlist-promoted',
          title: `Spot Available — ${event.name}`,
          message: `Your waitlist spot for ${event.name} at ${tournament.name} has been approved. You have 24 hours to complete your registration.`,
          data: {
            tournamentId,
            eventId: eventId.toString(),
            actionUrl: `/tournaments/${tournamentId}/register/${eventId}`
          }
        });
      } catch (notifError) {
        console.error('Failed to send in-app waitlist notification:', notifError);
      }
    }

    // Send promotion email
    try {
      await sendWaitlistPromotionEmail({
        to: nextEntry.user.email,
        playerName: nextEntry.user.name,
        tournamentName: tournament.name,
        eventName: event.name,
        paymentUrl,
        expiresAt: nextEntry.promotionExpiresAt,
        deadline: '24 hours'
      });
    } catch (emailError) {
      console.error('Failed to send promotion email:', emailError);
    }

    console.log(`Promoted waitlist entry ${nextEntry._id} for event ${eventId}`);

    return nextEntry;
  } catch (error) {
    console.error('Error promoting waitlist:', error);
    throw error;
  }
};

/**
 * Expire promotion and promote next (internal function)
 * @param {string} waitlistId - Waitlist entry ID
 */
export const expirePromotion = async (waitlistId) => {
  try {
    const entry = await Waitlist.findById(waitlistId).populate('user event');

    if (!entry) {
      console.log(`Waitlist entry ${waitlistId} not found`);
      return;
    }

    // Mark as expired
    entry.status = 'expired';
    await entry.save();

    // Send expiration email
    try {
      await sendWaitlistExpiredEmail({
        to: entry.user.email,
        playerName: entry.user.name,
        eventName: entry.event.name,
        rejoinUrl: `${process.env.CLIENT_URL}/events/${entry.event._id}`
      });
    } catch (emailError) {
      console.error('Failed to send expiration email:', emailError);
    }

    // Promote next person
    await promoteNextWaitlist(entry.event._id, 'previous-expired');

    console.log(`Expired waitlist entry ${waitlistId} and promoted next`);
  } catch (error) {
    console.error('Error expiring promotion:', error);
    throw error;
  }
};

/**
 * Convert waitlist entry to registration (internal function)
 * @param {string} waitlistId - Waitlist entry ID
 * @param {string} paymentId - Payment ID
 */
export const convertWaitlistToRegistration = async (waitlistId, paymentId) => {
  try {
    const entry = await Waitlist.findById(waitlistId);

    if (!entry) {
      console.log(`Waitlist entry ${waitlistId} not found`);
      return;
    }

    // Mark as converted
    entry.status = 'converted';
    entry.convertedAt = new Date();
    entry.paymentId = paymentId;
    await entry.save();

    console.log(`Converted waitlist entry ${waitlistId} to registration`);
  } catch (error) {
    console.error('Error converting waitlist entry:', error);
    throw error;
  }
};

/**
 * Get all waitlist entries for the current user (across all events)
 * @route   GET /api/waitlist/my-entries
 * @access  Private
 */
export const getMyWaitlistEntries = async (req, res, next) => {
  try {
    const entries = await Waitlist.find({
      user: req.user.id,
      status: { $in: ['waiting', 'promoted', 'expired'] }
    })
      .populate({ path: 'event', select: 'name maxTeams currentTeams' })
      .populate({ path: 'event', populate: { path: 'tournament', select: 'name startDate' } })
      .sort({ createdAt: -1 });

    // Reshape to include tournament at the top level for convenience.
    // entry.event can populate to null if the event was deleted (e.g. stale data
    // from before event/tournament deletion cascaded to Waitlist) — skip those
    // rather than crashing the whole request for every other entry.
    const data = entries
      .filter(entry => entry.event)
      .map(entry => ({
        _id: entry._id,
        event: {
          _id: entry.event._id,
          name: entry.event.name,
          maxTeams: entry.event.maxTeams,
        },
        tournament: entry.event.tournament,
        position: entry.position,
        status: entry.status,
        promotedAt: entry.promotedAt,
        promotionExpiresAt: entry.promotionExpiresAt,
        metadata: entry.metadata,
        createdAt: entry.createdAt,
      }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Get event waitlist (organizer/admin only)
 * @route   GET /api/events/:eventId/waitlist/all
 * @access  Private (Organizer/Admin)
 */
export const getEventWaitlist = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Get event to verify organizer
    const event = await Event.findById(eventId).populate('tournament');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const tournament = await Tournament.findById(event.tournament);

    // Check if user is organizer or admin
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view waitlist'
      });
    }

    // Get all waitlist entries
    const waitlistEntries = await Waitlist.find({
      event: eventId
    }).populate('user', 'name email').sort({ position: 1 });

    res.status(200).json({
      success: true,
      count: waitlistEntries.length,
      data: waitlistEntries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Organizer approves a waitlist entry — sends "pay and join" email to the user
 * @route   POST /api/events/:eventId/waitlist/:waitlistId/approve
 * @access  Private (Organizer/Admin)
 */
export const approveWaitlistEntry = async (req, res, next) => {
  try {
    const { eventId, waitlistId } = req.params;

    const entry = await Waitlist.findById(waitlistId)
      .populate('user', 'name email')
      .populate({ path: 'event', populate: { path: 'tournament' } });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Waitlist entry not found'
      });
    }

    if (entry.event._id.toString() !== eventId) {
      return res.status(400).json({
        success: false,
        message: 'Waitlist entry does not belong to this event'
      });
    }

    if (entry.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve: entry status is "${entry.status}". Only "waiting" entries can be approved.`
      });
    }

    const tournament = await Tournament.findById(entry.event.tournament._id || entry.event.tournament);
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve waitlist entries for this event'
      });
    }

    entry.status = 'promoted';
    entry.promotedAt = new Date();
    entry.promotionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await entry.save();

    const tournamentId = tournament._id.toString();
    const paymentUrl = `${process.env.CLIENT_URL}/tournaments/${tournamentId}/register/${eventId}`;

    // Send in-app notification
    try {
      const io = req.app.get('io');
      await createNotification(io, entry.user._id, {
        type: 'waitlist-promoted',
        title: `Spot Available — ${entry.event.name}`,
        message: `Your waitlist spot for ${entry.event.name} at ${tournament.name} has been approved. You have 24 hours to complete your registration.`,
        data: {
          tournamentId,
          eventId,
          actionUrl: `/tournaments/${tournamentId}/register/${eventId}`
        }
      });
    } catch (notifError) {
      console.error('Failed to send in-app waitlist notification:', notifError);
    }

    try {
      await sendWaitlistPromotionEmail({
        to: entry.user.email,
        playerName: entry.user.name,
        tournamentName: tournament.name,
        eventName: entry.event.name,
        paymentUrl,
        expiresAt: entry.promotionExpiresAt,
        deadline: '24 hours'
      });
    } catch (emailError) {
      console.error('Failed to send waitlist promotion email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Entry approved but failed to send email. User can still be notified manually.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Waitlist entry approved. User has been emailed to pay and complete registration.',
      data: {
        waitlistId: entry._id,
        position: entry.position,
        user: { name: entry.user.name, email: entry.user.email },
        promotionExpiresAt: entry.promotionExpiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

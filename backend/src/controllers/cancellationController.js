import Cancellation from '../models/Cancellation.js';
import Event from '../models/Event.js';
import Team from '../models/Team.js';
import Payment from '../models/Payment.js';
import Tournament from '../models/Tournament.js';
import Waitlist from '../models/Waitlist.js';
import stripe from '../config/stripe.js';
import { sendCancellationConfirmationEmail, sendPartnerNotificationEmail, sendPartnerRefundEmail, sendWaitlistPromotionEmail } from '../services/emailService.js';

/**
 * Calculate refund percentage based on days until tournament
 */
const calculateRefundPercentage = (tournamentStartDate) => {
  const now = new Date();
  const startDate = new Date(tournamentStartDate);
  const daysUntil = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));

  if (daysUntil >= 14) return 100;  // Full refund
  if (daysUntil >= 7) return 75;    // 75% refund
  if (daysUntil >= 2) return 50;    // 50% refund
  return 0;                          // No refund
};

/**
 * Request cancellation for a registration
 */
export const requestCancellation = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body;

    const event = await Event.findById(eventId).populate('tournament');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const tournament = event.tournament;

    // Check if tournament has already started
    if (new Date(tournament.startDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel after tournament has started'
      });
    }

    // Find user's registration
    let team = null;
    let payment = null;
    let cancellationType = 'singles';
    let partner = null;

    if (event.format === 'singles') {
      // Singles registration
      const registration = event.registeredPlayers.find(
        reg => reg.player.toString() === req.user.id
      );

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      payment = await Payment.findById(registration.payment);
    } else {
      // Doubles/Mixed registration
      team = await Team.findOne({
        event: eventId,
        players: req.user.id
      }).populate('players', 'name email');

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team registration not found'
        });
      }

      // Find partner
      partner = team.players.find(p => p._id.toString() !== req.user.id);

      // Determine if both players or just one is canceling
      cancellationType = team.players.length === 1 ? 'doubles-full-team' : 'doubles-one-player';

      // Find payment
      payment = await Payment.findOne({
        user: req.user.id,
        'eventRegistrations.teamId': team._id
      });
    }

    if (!payment || payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'No completed payment found for this registration'
      });
    }

    // Calculate refund
    const refundPercentage = calculateRefundPercentage(tournament.startDate);
    const amountPaid = payment.amount;

    // Stripe fees are non-refundable (2.9% + $0.30)
    const stripeFee = (amountPaid * 0.029) + 30; // in cents
    const refundableAmount = amountPaid - stripeFee;
    const refundAmount = Math.floor((refundableAmount * refundPercentage) / 100);

    // Create cancellation request
    const cancellation = await Cancellation.create({
      user: req.user.id,
      tournament: tournament._id,
      event: eventId,
      team: team?._id,
      payment: payment._id,
      cancellationType,
      requestedBy: req.user.id,
      partner: partner?._id,
      partnerDecision: cancellationType === 'doubles-one-player' ? 'pending' : null,
      partnerDecisionDeadline: cancellationType === 'doubles-one-player'
        ? new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours
        : null,
      refundAmount,
      refundPercentage,
      stripeFeeDeducted: amountPaid - refundableAmount,
      status: cancellationType === 'doubles-one-player' ? 'pending-partner-response' : 'approved',
      reason
    });

    // If singles or full team cancellation, process immediately
    if (cancellationType !== 'doubles-one-player') {
      await processCancellation(cancellation._id);
    } else {
      // Send email to partner asking for decision
      await sendPartnerNotificationEmail({
        partner,
        cancelingPlayer: req.user,
        tournament,
        event,
        cancellation,
        deadline: cancellation.partnerDecisionDeadline
      });
    }

    res.status(200).json({
      success: true,
      message: cancellationType === 'doubles-one-player'
        ? 'Cancellation request submitted. Your partner has been notified and has 72 hours to respond.'
        : 'Cancellation processed successfully. Refund will be issued within 5-10 business days.',
      data: {
        cancellation,
        refundAmount: refundAmount / 100, // Convert to dollars
        refundPercentage,
        requiresPartnerResponse: cancellationType === 'doubles-one-player'
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Partner responds to cancellation request
 */
export const respondToPartnerCancellation = async (req, res, next) => {
  try {
    const { cancellationId } = req.params;
    const { decision } = req.body; // 'refund' or 'find-partner'

    const cancellation = await Cancellation.findById(cancellationId)
      .populate('tournament')
      .populate('event')
      .populate('team')
      .populate('requestedBy', 'name email')
      .populate('partner', 'name email');

    if (!cancellation) {
      return res.status(404).json({
        success: false,
        message: 'Cancellation request not found'
      });
    }

    // Verify user is the partner
    if (cancellation.partner._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if deadline has passed
    if (new Date() > new Date(cancellation.partnerDecisionDeadline)) {
      cancellation.partnerDecision = 'expired';
      cancellation.status = 'expired';
      await cancellation.save();

      return res.status(400).json({
        success: false,
        message: 'Decision deadline has passed. Please contact the organizer.'
      });
    }

    cancellation.partnerDecision = decision;
    cancellation.status = 'approved';
    await cancellation.save();

    if (decision === 'refund') {
      // Both players get refund - process full team cancellation
      await processCancellation(cancellationId);

      res.status(200).json({
        success: false,
        message: 'Your refund request has been processed. You and your partner will both receive refunds within 5-10 business days.'
      });
    } else {
      // Partner wants to find new partner
      // Remove canceling player from team, send notification
      const team = await Team.findById(cancellation.team);
      team.players = team.players.filter(p => p.toString() !== cancellation.requestedBy._id.toString());
      team.needsPartner = true;
      await team.save();

      // Process refund for canceling player only
      await processIndividualRefund(cancellation);

      // Send email to partner confirming they can find new partner
      // TODO: Add to email service

      res.status(200).json({
        success: true,
        message: 'You can now find a new partner! The original player\'s refund has been processed.'
      });
    }

  } catch (error) {
    next(error);
  }
};

/**
 * Process cancellation and refund
 */
const processCancellation = async (cancellationId) => {
  const cancellation = await Cancellation.findById(cancellationId)
    .populate('user')
    .populate('tournament')
    .populate('event')
    .populate('team')
    .populate('payment');

  if (!cancellation || cancellation.refundProcessed) {
    return;
  }

  const { payment, event, team, refundAmount } = cancellation;

  try {
    // Process Stripe refund
    if (refundAmount > 0 && payment.paymentIntentId) {
      const refund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
        amount: refundAmount
      });

      cancellation.refundId = refund.id;
      cancellation.refundProcessed = true;
    }

    // Remove from event registration
    if (cancellation.cancellationType === 'singles') {
      event.registeredPlayers = event.registeredPlayers.filter(
        reg => reg.player.toString() !== cancellation.user._id.toString()
      );
      event.currentTeams = Math.max(0, event.currentTeams - 1);
    } else {
      // Remove team
      event.teams = event.teams.filter(t => t.toString() !== team._id.toString());
      event.currentTeams = Math.max(0, event.currentTeams - 1);

      // Delete team
      await Team.findByIdAndDelete(team._id);
    }

    await event.save();

    // Update payment status
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundAmount = refundAmount;
    await payment.save();

    // Update cancellation status
    cancellation.status = 'processed';
    cancellation.processedAt = new Date();
    await cancellation.save();

    // Send confirmation email
    await sendCancellationConfirmationEmail({
      user: cancellation.user,
      tournament: cancellation.tournament,
      event,
      refundAmount: refundAmount / 100
    });

    // Check and promote waitlist
    await promoteFromWaitlist(event._id);

  } catch (error) {
    console.error('Error processing cancellation:', error);
    cancellation.status = 'failed';
    cancellation.adminNotes = error.message;
    await cancellation.save();
    throw error;
  }
};

/**
 * Process refund for individual player (partner staying)
 */
const processIndividualRefund = async (cancellation) => {
  const payment = await Payment.findById(cancellation.payment);

  try {
    // Process Stripe refund for individual player
    if (cancellation.refundAmount > 0 && payment.paymentIntentId) {
      const refund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
        amount: cancellation.refundAmount
      });

      cancellation.refundId = refund.id;
      cancellation.refundProcessed = true;
    }

    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundAmount = cancellation.refundAmount;
    await payment.save();

    cancellation.status = 'processed';
    cancellation.processedAt = new Date();
    await cancellation.save();

    // Send confirmation email
    await sendCancellationConfirmationEmail({
      user: cancellation.user,
      tournament: cancellation.tournament,
      event: cancellation.event,
      refundAmount: cancellation.refundAmount / 100
    });

  } catch (error) {
    console.error('Error processing individual refund:', error);
    throw error;
  }
};

/**
 * Promote next person from waitlist
 */
const promoteFromWaitlist = async (eventId) => {
  try {
    const waitlistEntry = await Waitlist.findOne({
      event: eventId,
      status: 'waiting'
    }).sort({ position: 1 });

    if (waitlistEntry) {
      waitlistEntry.status = 'promoted';
      waitlistEntry.promotedAt = new Date();
      waitlistEntry.promotionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await waitlistEntry.save();

      // Send promotion email
      await sendWaitlistPromotionEmail(waitlistEntry);
    }
  } catch (error) {
    console.error('Error promoting from waitlist:', error);
  }
};

/**
 * Get user's cancellation requests
 */
export const getMyCancellations = async (req, res, next) => {
  try {
    const cancellations = await Cancellation.find({
      $or: [
        { user: req.user.id },
        { partner: req.user.id }
      ]
    })
      .populate('tournament', 'name')
      .populate('event', 'name')
      .populate('requestedBy', 'name email')
      .populate('partner', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: cancellations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate refund preview
 */
export const calculateRefundPreview = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate('tournament');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Find user's payment
    let payment;
    if (event.format === 'singles') {
      const registration = event.registeredPlayers.find(
        reg => reg.player.toString() === req.user.id
      );
      if (registration) {
        payment = await Payment.findById(registration.payment);
      }
    } else {
      const team = await Team.findOne({
        event: eventId,
        players: req.user.id
      });
      if (team) {
        payment = await Payment.findOne({
          user: req.user.id,
          'eventRegistrations.teamId': team._id
        });
      }
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const refundPercentage = calculateRefundPercentage(event.tournament.startDate);
    const amountPaid = payment.amount;
    const stripeFee = (amountPaid * 0.029) + 30;
    const refundableAmount = amountPaid - stripeFee;
    const refundAmount = Math.floor((refundableAmount * refundPercentage) / 100);

    const daysUntil = Math.ceil((new Date(event.tournament.startDate) - new Date()) / (1000 * 60 * 60 * 24));

    res.status(200).json({
      success: true,
      data: {
        amountPaid: amountPaid / 100,
        refundPercentage,
        refundAmount: refundAmount / 100,
        stripeFeeDeducted: stripeFee / 100,
        daysUntilTournament: daysUntil,
        policy: {
          '>14 days': '100% refund',
          '7-14 days': '75% refund',
          '2-7 days': '50% refund',
          '<2 days': 'No refund'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all cancellations for a tournament
 */
export const getTournamentCancellations = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId);
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
        message: 'Not authorized'
      });
    }

    const cancellations = await Cancellation.find({ tournament: tournamentId })
      .populate('user', 'name email')
      .populate('event', 'name')
      .populate('partner', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: cancellations
    });
  } catch (error) {
    next(error);
  }
};

export default {
  requestCancellation,
  respondToPartnerCancellation,
  getMyCancellations,
  calculateRefundPreview,
  getTournamentCancellations
};

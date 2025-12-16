import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';
import Tournament from '../models/Tournament.js';

// Initialize Stripe with lazy loading to ensure env vars are loaded
let stripe;
const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

// @desc    Create payment intent for tournament registration
// @route   POST /api/payments/create-intent
// @access  Private
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { teamId, eventId } = req.body;

    if (!teamId || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID and Event ID are required'
      });
    }

    // Get team and verify user is part of it
    const team = await Team.findById(teamId).populate('event');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Verify user is part of this team
    const isPlayerInTeam = team.players.some(
      (playerId) => playerId.toString() === req.user.id
    );

    if (!isPlayerInTeam) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    // Get event and tournament details
    const event = await Event.findById(eventId).populate('tournament');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const tournament = event.tournament;
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      user: req.user.id,
      team: teamId,
      status: { $in: ['completed', 'processing'] }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this team'
      });
    }

    const amount = tournament.entryFee || 0;

    if (amount === 0) {
      // Free tournament - no payment needed
      team.paymentStatus = 'paid';
      team.registrationConfirmed = true;
      await team.save();

      return res.status(200).json({
        success: true,
        message: 'No payment required for this tournament',
        data: {
          requiresPayment: false,
          team
        }
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        teamId: teamId.toString(),
        eventId: eventId.toString(),
        tournamentId: tournament._id.toString(),
        userId: req.user.id,
        teamName: team.name,
        tournamentName: tournament.name
      },
      description: `Entry fee for ${tournament.name} - ${event.name}`
    });

    // Create payment record
    const payment = await Payment.create({
      user: req.user.id,
      team: teamId,
      event: eventId,
      tournament: tournament._id,
      amount: amount,
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      metadata: {
        description: `Entry fee for ${tournament.name} - ${event.name}`,
        receiptEmail: req.user.email
      }
    });

    // Update team payment info
    team.paymentAmount = amount;
    team.payments.push(payment._id);
    await team.save();

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        paymentId: payment._id,
        requiresPayment: true
      }
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    next(error);
  }
};

// @desc    Confirm payment after successful Stripe payment
// @route   POST /api/payments/confirm
// @access  Private
export const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Find payment by Stripe payment intent ID
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId
    }).populate('team');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify user owns this payment
    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this payment'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update payment record
      payment.status = 'completed';
      payment.stripeChargeId = paymentIntent.latest_charge;
      payment.paymentMethod = paymentIntent.payment_method;
      await payment.save();

      // Update team payment status
      const team = payment.team;
      team.paidAmount = payment.amount;
      team.paymentStatus = 'paid';
      team.registrationConfirmed = true;
      await team.save();

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          payment,
          team
        }
      });
    } else if (paymentIntent.status === 'processing') {
      payment.status = 'processing';
      await payment.save();

      return res.status(200).json({
        success: true,
        message: 'Payment is being processed',
        data: { payment }
      });
    } else {
      payment.status = 'failed';
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Payment failed or was cancelled',
        data: { payment }
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    next(error);
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('team', 'name')
      .populate('event', 'name')
      .populate('tournament', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify user owns this payment or is admin
    if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's payment history
// @route   GET /api/payments/my-payments
// @access  Private
export const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('team', 'name')
      .populate('event', 'name')
      .populate('tournament', 'name location startDate')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refund payment (Admin/Organizer only)
// @route   POST /api/payments/:id/refund
// @access  Private (Admin/Organizer)
export const refundPayment = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'tournament',
        populate: { path: 'organizer' }
      })
      .populate('team');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization
    const isOrganizer = payment.tournament.organizer._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to refund this payment'
      });
    }

    // Check if payment can be refunded
    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    if (payment.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been refunded'
      });
    }

    // Create refund in Stripe
    const refund = await getStripe().refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      reason: 'requested_by_customer'
    });

    // Update payment record
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundReason = reason || 'Refund requested';
    await payment.save();

    // Update team payment status
    const team = payment.team;
    team.paidAmount = Math.max(0, team.paidAmount - payment.amount);
    team.paymentStatus = team.paidAmount === 0 ? 'unpaid' : 'partially_paid';
    team.registrationConfirmed = false;
    await team.save();

    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully',
      data: {
        payment,
        refund
      }
    });
  } catch (error) {
    console.error('Error refunding payment:', error);
    next(error);
  }
};

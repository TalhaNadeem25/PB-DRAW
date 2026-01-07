import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';
import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import { sendTicketPurchaseEmail } from '../services/emailService.js';
import { generateTicketCode, generateQRCode, generateTicketPDF } from '../utils/qrCodeGenerator.js';
import { promoteNextWaitlist } from './waitlistController.js';

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

    // Get event and tournament details with organizer
    const event = await Event.findById(eventId).populate({
      path: 'tournament',
      populate: {
        path: 'organizer',
        model: 'User'
      }
    });

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

    // Check if organizer has Stripe Connect onboarded
    const organizer = tournament.organizer;
    if (!organizer.stripeConnectAccountId || !organizer.stripeConnectOnboarded) {
      return res.status(400).json({
        success: false,
        message: 'Tournament organizer has not completed Stripe setup yet. Please contact the organizer.',
        requiresStripeOnboarding: true
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

    // Calculate platform fee
    const amountInCents = Math.round(amount * 100);
    const platformFeePercent = tournament.platformFeePercent || 10;
    const platformFeeAmount = Math.round(amountInCents * (platformFeePercent / 100));

    // Create Stripe payment intent using Platform model (direct charges)
    // Payment goes to organizer's account, platform takes application fee
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      application_fee_amount: platformFeeAmount, // Platform's cut
      on_behalf_of: organizer.stripeConnectAccountId, // Charge to organizer's account
      metadata: {
        teamId: teamId.toString(),
        eventId: eventId.toString(),
        tournamentId: tournament._id.toString(),
        userId: req.user.id,
        teamName: team.name,
        tournamentName: tournament.name,
        platformFee: platformFeeAmount.toString(),
        organizerId: organizer._id.toString()
      },
      description: `Entry fee for ${tournament.name} - ${event.name}`,
      transfer_data: {
        destination: organizer.stripeConnectAccountId,
      }
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

// @desc    Create payment intent for multiple events
// @route   POST /api/payments/create-multi-event-intent
// @access  Private
export const createMultiEventPaymentIntent = async (req, res, next) => {
  try {
    const { eventRegistrations } = req.body;

    if (!eventRegistrations || !Array.isArray(eventRegistrations) || eventRegistrations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one event registration is required'
      });
    }

    // Separate singles and team registrations
    const teamRegistrations = eventRegistrations.filter(reg => reg.teamId && !reg.isSingles);
    const singlesRegistrations = eventRegistrations.filter(reg => reg.isSingles);

    // Verify all teams belong to user (for doubles/mixed)
    const teams = [];
    if (teamRegistrations.length > 0) {
      const teamPromises = teamRegistrations.map(reg => Team.findById(reg.teamId));
      const fetchedTeams = await Promise.all(teamPromises);

      for (const team of fetchedTeams) {
        if (!team) {
          return res.status(404).json({ success: false, message: 'Team not found' });
        }

        const isPlayerInTeam = team.players.some(
          (playerId) => playerId.toString() === req.user.id
        );

        if (!isPlayerInTeam) {
          return res.status(403).json({
            success: false,
            message: 'You are not a member of all teams'
          });
        }

        teams.push(team);
      }
    }

    // Fetch all events and populate tournament + organizer
    const eventPromises = eventRegistrations.map(reg =>
      Event.findById(reg.eventId).populate({
        path: 'tournament',
        populate: { path: 'organizer', model: 'User' }
      })
    );
    const events = await Promise.all(eventPromises);

    if (events.some(e => !e)) {
      return res.status(404).json({
        success: false,
        message: 'One or more events not found'
      });
    }

    // Verify all events belong to same tournament
    const tournamentIds = [...new Set(events.map(e => e.tournament._id.toString()))];
    if (tournamentIds.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'All events must belong to the same tournament'
      });
    }

    // Check if user already has PAID teams OR singles registrations in any of these events
    // Unpaid registrations don't count - users can retry payment
    const eventIds = events.map(e => e._id);

    // Check for existing PAID team registrations
    const existingTeams = await Team.find({
      event: { $in: eventIds },
      players: req.user.id,
      paymentStatus: 'paid'  // Only check paid teams
    }).populate('event', 'name');

    // Check for existing PAID singles registrations
    const eventsWithPlayerRegistered = await Event.find({
      _id: { $in: eventIds },
      'registeredPlayers': {
        $elemMatch: {
          player: req.user.id,
          paymentStatus: 'paid'  // Only check paid registrations
        }
      }
    }, 'name');

    const alreadyRegisteredEvents = [
      ...existingTeams.map(t => t.event.name),
      ...eventsWithPlayerRegistered.map(e => e.name)
    ];

    if (alreadyRegisteredEvents.length > 0) {
      return res.status(400).json({
        success: false,
        message: `You are already registered for: ${alreadyRegisteredEvents.join(', ')}`,
        existingEventIds: [...existingTeams.map(t => t.event._id), ...eventsWithPlayerRegistered.map(e => e._id)]
      });
    }

    const tournament = events[0].tournament;
    const organizer = tournament.organizer;

    // Check Stripe Connect onboarding
    if (!organizer.stripeConnectAccountId || !organizer.stripeConnectOnboarded) {
      return res.status(400).json({
        success: false,
        message: 'Tournament organizer has not completed Stripe setup yet. Please contact the organizer.',
        requiresStripeOnboarding: true
      });
    }

    // Check for existing payments for these specific teams
    const existingPayment = await Payment.findOne({
      user: req.user.id,
      teams: { $in: teams.map(t => t._id) },
      status: { $in: ['completed', 'processing'] }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already in progress or completed for one or more teams'
      });
    }

    // Check if events are full
    for (const event of events) {
      if (event.currentTeams >= event.maxTeams) {
        return res.status(400).json({
          success: false,
          message: `Event "${event.name}" is now full. Please remove it and try again.`,
          fullEventId: event._id
        });
      }
    }

    // Calculate total amount and breakdown
    let totalAmount = 0;
    const eventBreakdown = [];

    // Add team-based events (doubles/mixed)
    for (let i = 0; i < teamRegistrations.length; i++) {
      const reg = teamRegistrations[i];
      const event = events.find(e => e._id.toString() === reg.eventId);
      const team = teams[i];
      const fee = event.entryFee || 0;

      totalAmount += fee;
      eventBreakdown.push({
        eventId: event._id,
        teamId: team._id,
        amount: fee,
        eventName: event.name,
        isSingles: false
      });
    }

    // Add singles events (no teams)
    for (const reg of singlesRegistrations) {
      const event = events.find(e => e._id.toString() === reg.eventId);
      const fee = event.entryFee || 0;

      totalAmount += fee;
      eventBreakdown.push({
        eventId: event._id,
        teamId: null,
        amount: fee,
        eventName: event.name,
        isSingles: true
      });
    }

    // Handle free events
    if (totalAmount === 0) {
      // Mark all teams as paid
      for (const team of teams) {
        team.paymentStatus = 'paid';
        team.registrationConfirmed = true;
        await team.save();
      }

      // Register singles players directly to events
      for (const reg of singlesRegistrations) {
        const event = await Event.findById(reg.eventId);
        event.registeredPlayers.push({
          player: req.user.id,
          paymentStatus: 'paid'
        });
        event.currentTeams = (event.teams?.length || 0) + event.registeredPlayers.length;
        await event.save();
      }

      return res.status(200).json({
        success: true,
        message: 'No payment required - all events are free',
        data: { requiresPayment: false, teams, singlesRegistered: singlesRegistrations.length }
      });
    }

    // Calculate platform fee
    const amountInCents = Math.round(totalAmount * 100);
    const platformFeePercent = tournament.platformFeePercent || 10;
    const platformFeeAmount = Math.round(amountInCents * (platformFeePercent / 100));

    // Create Stripe payment intent
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      application_fee_amount: platformFeeAmount,
      on_behalf_of: organizer.stripeConnectAccountId,
      metadata: {
        userId: req.user.id,
        tournamentId: tournament._id.toString(),
        organizerId: organizer._id.toString(),
        eventIds: events.map(e => e._id.toString()).join(','),
        teamIds: teams.map(t => t._id.toString()).join(','),
        eventCount: events.length.toString(),
        platformFee: platformFeeAmount.toString()
      },
      description: `Entry for ${events.length} events in ${tournament.name}`,
      transfer_data: {
        destination: organizer.stripeConnectAccountId,
      }
    });

    // Create payment record
    const payment = await Payment.create({
      user: req.user.id,
      teams: teams.length > 0 ? teams.map(t => t._id) : undefined,
      events: events.map(e => e._id),
      tournament: tournament._id,
      amount: totalAmount,
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      eventBreakdown: eventBreakdown,
      metadata: {
        description: `Entry for ${events.length} events in ${tournament.name}`,
        receiptEmail: req.user.email
      }
    });

    // Update all teams (for doubles/mixed)
    for (const team of teams) {
      team.payments.push(payment._id);
      await team.save();
    }

    // Register singles players to events (payment pending)
    for (const reg of singlesRegistrations) {
      const event = await Event.findById(reg.eventId);
      event.registeredPlayers.push({
        player: req.user.id,
        paymentStatus: 'unpaid',
        payment: payment._id
      });
      await event.save();
    }

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: totalAmount,
        eventBreakdown: eventBreakdown,
        paymentId: payment._id,
        requiresPayment: true
      }
    });
  } catch (error) {
    console.error('Error creating multi-event payment intent:', error);
    next(error);
  }
};

// @desc    Create payment intent for partner accepting invitation
// @route   POST /api/payments/create-partner-intent
// @access  Private
export const createPartnerPaymentIntent = async (req, res, next) => {
  try {
    const { invitationId } = req.body;

    if (!invitationId) {
      return res.status(400).json({
        success: false,
        message: 'Invitation ID is required'
      });
    }

    // Import Invitation model
    const Invitation = (await import('../models/Invitation.js')).default;

    // Get invitation and populate all required data
    const invitation = await Invitation.findById(invitationId)
      .populate({
        path: 'team',
        populate: {
          path: 'event',
          populate: {
            path: 'tournament',
            populate: { path: 'organizer', model: 'User' }
          }
        }
      });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Verify user is the invitee
    const isInvitee = invitation.inviteeEmail === req.user.email.toLowerCase() ||
                     (invitation.invitee && invitation.invitee.toString() === req.user.id);

    if (!isInvitee) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept this invitation'
      });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation has already been ${invitation.status}`
      });
    }

    // Re-fetch team and event to ensure we have all fields
    const team = await Team.findById(invitation.team._id);
    const event = await Event.findById(invitation.team.event._id);
    const tournament = await Tournament.findById(event.tournament).populate('organizer');
    const organizer = tournament.organizer;
    const entryFee = event.entryFee || 0;

    console.log('Partner payment - entryFee:', entryFee);
    console.log('Partner payment - event:', event.name);

    // Handle free events
    if (entryFee === 0) {
      // For free events, just accept the invitation immediately
      team.players.push(req.user.id);
      await team.save();

      invitation.status = 'accepted';
      invitation.invitee = req.user.id;
      await invitation.save();

      // Cancel other pending invitations for this team
      await Invitation.updateMany(
        {
          team: team._id,
          status: 'pending',
          _id: { $ne: invitation._id }
        },
        { status: 'cancelled' }
      );

      return res.status(200).json({
        success: true,
        message: 'Invitation accepted - no payment required',
        data: { requiresPayment: false, team }
      });
    }

    // Check Stripe Connect onboarding
    if (!organizer.stripeConnectAccountId || !organizer.stripeConnectOnboarded) {
      return res.status(400).json({
        success: false,
        message: 'Tournament organizer has not completed Stripe setup yet'
      });
    }

    // Calculate platform fee
    const amountInCents = Math.round(entryFee * 100);
    const platformFeePercent = tournament.platformFeePercent || 10;
    const platformFeeAmount = Math.round(amountInCents * (platformFeePercent / 100));

    // Create Stripe payment intent
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      application_fee_amount: platformFeeAmount,
      on_behalf_of: organizer.stripeConnectAccountId,
      metadata: {
        userId: req.user.id,
        tournamentId: tournament._id.toString(),
        organizerId: organizer._id.toString(),
        eventId: event._id.toString(),
        teamId: team._id.toString(),
        invitationId: invitation._id.toString(),
        platformFee: platformFeeAmount.toString(),
        paymentType: 'partner_invitation'
      },
      description: `Partner entry for ${event.name} in ${tournament.name}`,
      transfer_data: {
        destination: organizer.stripeConnectAccountId,
      }
    });

    // Create payment record
    const payment = await Payment.create({
      user: req.user.id,
      team: team._id,
      event: event._id,
      tournament: tournament._id,
      amount: entryFee,
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      metadata: {
        invitationId: invitation._id.toString(),
        paymentType: 'partner_invitation',
        description: `Partner entry for ${event.name}`,
        receiptEmail: req.user.email
      }
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: entryFee,
        paymentId: payment._id,
        requiresPayment: true
      }
    });
  } catch (error) {
    console.error('Error creating partner payment intent:', error);
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
    })
      .populate('team')
      .populate('teams')
      .populate('user', 'name email')
      .populate('event', 'name')
      .populate('events', 'name')
      .populate({
        path: 'tournament',
        populate: {
          path: 'organizer',
          model: 'User',
          select: 'name email'
        },
        select: 'name location startDate endDate organizer'
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify user owns this payment
    if (payment.user._id.toString() !== req.user.id) {
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

      // Handle both single-team (legacy) and multi-team (new) payments
      const teamsToUpdate = payment.teams && payment.teams.length > 0
        ? payment.teams  // Multi-event payment
        : (payment.team ? [payment.team] : []); // Legacy single-event payment or no teams (singles)

      // Update teams (for doubles/mixed)
      for (const teamId of teamsToUpdate) {
        const team = await Team.findById(teamId);
        if (team) {
          // Calculate this team's portion of payment
          const teamPortion = payment.eventBreakdown
            ? payment.eventBreakdown.find(eb => eb.teamId && eb.teamId.toString() === teamId._id.toString())?.amount || 0
            : payment.amount;

          team.paidAmount = teamPortion;
          team.paymentStatus = 'paid';
          team.registrationConfirmed = true;
          await team.save();

          // Update event's currentTeams count
          const event = await Event.findById(team.event);
          if (event) {
            // Add team to event.teams array if not already there
            if (!event.teams.includes(teamId)) {
              event.teams.push(teamId);
            }
            // Update the count
            event.currentTeams = event.teams.length;
            await event.save();
          }
        }
      }

      // Handle partner invitation payments (add partner to team after payment)
      if (payment.metadata && payment.metadata.paymentType === 'partner_invitation' && payment.metadata.invitationId) {
        try {
          const Invitation = (await import('../models/Invitation.js')).default;
          const invitation = await Invitation.findById(payment.metadata.invitationId);

          if (invitation && invitation.status === 'pending') {
            const team = await Team.findById(payment.team);

            if (team) {
              // Add partner to team
              if (!team.players.includes(req.user.id)) {
                team.players.push(req.user.id);
                await team.save();
                console.log(`Partner ${req.user.email} added to team ${team._id} after payment confirmation`);
              }

              // Accept invitation
              invitation.status = 'accepted';
              invitation.invitee = req.user.id;
              await invitation.save();

              // Cancel other pending invitations for this team
              await Invitation.updateMany(
                {
                  team: team._id,
                  status: 'pending',
                  _id: { $ne: invitation._id }
                },
                { status: 'cancelled' }
              );

              console.log(`Invitation ${invitation._id} accepted after partner payment`);
            }
          }
        } catch (invitationError) {
          console.error('Error handling partner invitation after payment:', invitationError);
          // Don't fail the payment confirmation if invitation handling fails
        }
      }

      // Update singles registrations (for singles events)
      if (payment.eventBreakdown) {
        const singlesBreakdown = payment.eventBreakdown.filter(eb => eb.isSingles);

        for (const breakdown of singlesBreakdown) {
          const event = await Event.findById(breakdown.eventId);
          if (event) {
            // Find and update the player's registration
            const playerReg = event.registeredPlayers.find(
              reg => reg.player.toString() === req.user.id && reg.payment && reg.payment.toString() === payment._id.toString()
            );

            if (playerReg) {
              playerReg.paymentStatus = 'paid';

              // Update currentTeams count (for singles, this tracks # of registered players)
              const paidPlayersCount = event.registeredPlayers.filter(
                reg => reg.paymentStatus === 'paid'
              ).length;
              event.currentTeams = paidPlayersCount;

              await event.save();
            }
          }
        }
      }

      // Promote next person on waitlist for each event (if applicable)
      try {
        const eventsToCheck = payment.events && payment.events.length > 0
          ? payment.events
          : payment.event
            ? [payment.event]
            : [];

        for (const event of eventsToCheck) {
          await promoteNextWaitlist(event._id, 'payment_completed');
        }
      } catch (waitlistError) {
        console.error('Error promoting waitlist after payment:', waitlistError);
        // Don't fail the payment if waitlist promotion fails
      }

      // Auto-register user to tournament if not already registered
      const tournament = await Tournament.findById(payment.tournament._id);
      if (tournament && !tournament.registeredPlayers.includes(req.user.id)) {
        tournament.registeredPlayers.push(req.user.id);
        tournament.currentPlayers = tournament.registeredPlayers.length;
        await tournament.save();
      }

      // Generate QR code and ticket PDF
      try {
        const ticketCode = generateTicketCode();

        // Generate QR code
        const qrCodeUrl = await generateQRCode(ticketCode, payment._id.toString());

        // Prepare event names for PDF
        const eventNamesForPDF = payment.events && payment.events.length > 0
          ? payment.events.map(e => e.name)
          : payment.event
            ? [payment.event.name]
            : [];

        // Generate ticket PDF
        const ticketPdfUrl = await generateTicketPDF({
          ticketCode,
          qrCodeUrl,
          playerName: payment.user.name,
          tournamentName: payment.tournament.name,
          eventNames: eventNamesForPDF,
          tournamentLocation: payment.tournament.location,
          eventDate: payment.tournament.startDate,
          paymentId: payment._id.toString()
        });

        // Update payment with ticket information
        payment.ticketCode = ticketCode;
        payment.qrCodeUrl = qrCodeUrl;
        payment.ticketPdfUrl = ticketPdfUrl;
        await payment.save();

        console.log(`✅ Ticket generated for payment ${payment._id}: ${ticketCode}`);
      } catch (ticketError) {
        console.error('❌ Failed to generate ticket:', ticketError);
        // Don't fail the payment if ticket generation fails
      }

      // Send ticket purchase confirmation email
      try {
        // Determine which event(s) to use for email
        const events = payment.events && payment.events.length > 0
          ? payment.events
          : payment.event
            ? [payment.event]
            : [];

        if (events.length === 0) {
          console.warn('No events found for payment confirmation email');
        } else {
          const eventNames = events.map(e => e.name).join(', ');
          const eventName = events.length === 1
            ? events[0].name
            : `${events.length} Events: ${eventNames}`;

          await sendTicketPurchaseEmail({
            to: payment.user.email,
            playerName: payment.user.name,
            tournamentName: payment.tournament.name,
            tournamentLocation: payment.tournament.location,
            eventName: eventName,
            eventDate: payment.tournament.startDate,
            entryFee: payment.amount,
            transactionId: payment.stripePaymentIntentId,
            organizerName: payment.tournament.organizer.name,
            organizerEmail: payment.tournament.organizer.email,
            ticketCode: payment.ticketCode,
            qrCodeUrl: payment.qrCodeUrl,
            ticketPdfUrl: payment.ticketPdfUrl
          });

          console.log(`Ticket confirmation email sent to ${payment.user.email}`);
        }
      } catch (emailError) {
        // Don't fail the payment if email fails
        console.error('Failed to send ticket purchase email:', emailError);
      }

      // Send partner invitation emails for teams that just became paid
      try {
        const Invitation = (await import('../models/Invitation.js')).default;
        const User = (await import('../models/User.js')).default;
        const { sendTeamInvitationEmail } = await import('../services/emailService.js');

        for (const teamId of teamsToUpdate) {
          // Find pending invitations for this team
          const invitations = await Invitation.find({
            team: teamId,
            status: 'pending'
          });

          console.log(`Found ${invitations.length} pending invitation(s) for team ${teamId}`);

          // Send email for each pending invitation
          for (const invitation of invitations) {
            try {
              // Get team with populated event and tournament
              const team = await Team.findById(teamId)
                .populate({
                  path: 'event',
                  populate: {
                    path: 'tournament',
                    select: 'name'
                  }
                });

              const inviter = await User.findById(invitation.inviter);

              if (team && team.event && team.event.tournament && inviter) {
                console.log(`Sending partner invitation email to ${invitation.inviteeEmail} for team ${team.name}`);

                await sendTeamInvitationEmail({
                  to: invitation.inviteeEmail,
                  inviteeName: invitation.inviteeName || 'Player',
                  inviterName: inviter.name,
                  teamName: team.name,
                  eventName: team.event.name,
                  tournamentName: team.event.tournament.name,
                  invitationId: invitation._id.toString()
                });

                console.log(`Partner invitation email sent successfully to ${invitation.inviteeEmail}`);
              } else {
                console.warn(`Missing data for invitation email: team=${!!team}, event=${!!team?.event}, tournament=${!!team?.event?.tournament}, inviter=${!!inviter}`);
              }
            } catch (invitationEmailError) {
              console.error(`Failed to send invitation email to ${invitation.inviteeEmail}:`, invitationEmailError);
              // Don't fail the entire payment if one invitation email fails
            }
          }
        }
      } catch (invitationError) {
        console.error('Failed to send partner invitation emails:', invitationError);
        // Don't fail the payment if invitation emails fail
      }

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          payment,
          teams: teamsToUpdate
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

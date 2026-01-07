import Payment from '../models/Payment.js';
import Tournament from '../models/Tournament.js';

/**
 * Scan QR code and check in player
 * @route   POST /api/check-in/scan
 * @access  Private (Organizer)
 */
export const scanQRCode = async (req, res, next) => {
  try {
    const { ticketCode } = req.body;

    if (!ticketCode) {
      return res.status(400).json({
        success: false,
        message: 'Ticket code is required'
      });
    }

    // Find payment by ticket code
    const payment = await Payment.findOne({ ticketCode })
      .populate('user', 'name email')
      .populate('tournament', 'name location startDate organizer')
      .populate('events', 'name')
      .populate('teams', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket code'
      });
    }

    // Check if payment is completed
    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed for this ticket'
      });
    }

    // Check if already checked in
    if (payment.checkedIn?.checkedInAt) {
      return res.status(400).json({
        success: false,
        message: 'Ticket already checked in',
        data: {
          checkedInAt: payment.checkedIn.checkedInAt,
          checkedInBy: payment.checkedIn.checkedInBy,
          method: payment.checkedIn.method
        }
      });
    }

    // Verify organizer owns this tournament
    if (payment.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check in for this tournament'
      });
    }

    // Check in
    payment.checkedIn = {
      checkedInAt: new Date(),
      checkedInBy: req.user.id,
      method: 'qr-code'
    };
    await payment.save();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament:${payment.tournament._id}`).emit('player-checked-in', {
        playerId: payment.user._id,
        playerName: payment.user.name,
        checkedInAt: payment.checkedIn.checkedInAt
      });
    }

    res.status(200).json({
      success: true,
      message: 'Check-in successful',
      data: {
        playerName: payment.user.name,
        playerEmail: payment.user.email,
        eventNames: payment.events.map(e => e.name),
        teamNames: payment.teams.map(t => t.name),
        checkedInAt: payment.checkedIn.checkedInAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ticket details by code
 * @route   GET /api/check-in/ticket/:ticketCode
 * @access  Private
 */
export const getTicketDetails = async (req, res, next) => {
  try {
    const { ticketCode } = req.params;

    const payment = await Payment.findOne({ ticketCode })
      .populate('user', 'name email')
      .populate('tournament', 'name location startDate organizer')
      .populate('events', 'name')
      .populate('teams', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Only return to ticket owner or organizer
    const isOwner = payment.user._id.toString() === req.user.id;
    const isOrganizer = payment.tournament.organizer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ticketCode: payment.ticketCode,
        qrCodeUrl: payment.qrCodeUrl,
        ticketPdfUrl: payment.ticketPdfUrl,
        playerName: payment.user.name,
        playerEmail: payment.user.email,
        tournamentName: payment.tournament.name,
        tournamentLocation: payment.tournament.location,
        tournamentDate: payment.tournament.startDate,
        eventNames: payment.events.map(e => e.name),
        teamNames: payment.teams.map(t => t.name),
        amount: payment.amount,
        status: payment.status,
        checkedIn: payment.checkedIn,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my tickets
 * @route   GET /api/check-in/my-tickets
 * @access  Private
 */
export const getMyTickets = async (req, res, next) => {
  try {
    const payments = await Payment.find({
      user: req.user.id,
      status: 'completed',
      ticketCode: { $ne: null }
    })
      .populate('tournament', 'name location startDate status')
      .populate('events', 'name')
      .populate('teams', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments.map(p => ({
        paymentId: p._id,
        ticketCode: p.ticketCode,
        qrCodeUrl: p.qrCodeUrl,
        ticketPdfUrl: p.ticketPdfUrl,
        tournament: {
          id: p.tournament._id,
          name: p.tournament.name,
          location: p.tournament.location,
          startDate: p.tournament.startDate,
          status: p.tournament.status
        },
        events: p.events.map(e => ({
          id: e._id,
          name: e.name
        })),
        teams: p.teams.map(t => ({
          id: t._id,
          name: t.name
        })),
        amount: p.amount,
        checkedIn: p.checkedIn,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manual check-in (organizer only)
 * @route   POST /api/check-in/manual
 * @access  Private (Organizer)
 */
export const manualCheckIn = async (req, res, next) => {
  try {
    const { paymentId, userEmail } = req.body;

    let payment;

    // Find payment by ID or user email + tournament
    if (paymentId) {
      payment = await Payment.findById(paymentId)
        .populate('user', 'name email')
        .populate('tournament', 'name organizer')
        .populate('events', 'name');
    } else if (userEmail && req.body.tournamentId) {
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      payment = await Payment.findOne({
        user: user._id,
        tournament: req.body.tournamentId,
        status: 'completed'
      })
        .populate('user', 'name email')
        .populate('tournament', 'name organizer')
        .populate('events', 'name');
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify organizer
    if (payment.tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if already checked in
    if (payment.checkedIn?.checkedInAt) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in',
        data: payment.checkedIn
      });
    }

    // Manual check-in
    payment.checkedIn = {
      checkedInAt: new Date(),
      checkedInBy: req.user.id,
      method: 'manual'
    };
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Manual check-in successful',
      data: {
        playerName: payment.user.name,
        eventNames: payment.events.map(e => e.name),
        checkedInAt: payment.checkedIn.checkedInAt
      }
    });
  } catch (error) {
    next(error);
  }
};

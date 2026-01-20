import Communication from '../models/Communication.js';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { sendBulkCommunicationEmail } from '../services/emailService.js';

/**
 * Get recipients based on type
 */
const getRecipients = async (tournamentId, recipientType, recipientEventId = null) => {
  const tournament = await Tournament.findById(tournamentId)
    .populate('registeredPlayers', 'name email')
    .populate('events');

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  let recipients = [];
  
  switch (recipientType) {
    case 'all':
      // Get all registered players
      const allTeams = await Team.find({ 
        event: { $in: tournament.events.map(e => e._id) } 
      }).populate('players', 'name email');
      
      const playerMap = new Map();
      allTeams.forEach(team => {
        team.players?.forEach(player => {
          if (player?.email) {
            playerMap.set(player._id.toString(), {
              user: player._id,
              email: player.email,
              name: player.name
            });
          }
        });
      });
      recipients = Array.from(playerMap.values());
      break;

    case 'event':
      // Get players from specific event
      if (!recipientEventId) {
        throw new Error('Event ID required for event-specific messages');
      }
      const eventTeams = await Team.find({ event: recipientEventId })
        .populate('players', 'name email');
      
      const eventPlayerMap = new Map();
      eventTeams.forEach(team => {
        team.players?.forEach(player => {
          if (player?.email) {
            eventPlayerMap.set(player._id.toString(), {
              user: player._id,
              email: player.email,
              name: player.name
            });
          }
        });
      });
      recipients = Array.from(eventPlayerMap.values());
      break;

    case 'waitlisted':
      // Get waitlisted players from all events
      const events = await Event.find({ tournament: tournamentId })
        .populate({
          path: 'waitlist',
          populate: { path: 'user', select: 'name email' }
        });
      
      const waitlistMap = new Map();
      events.forEach(event => {
        event.waitlist?.forEach(entry => {
          if (entry.user?.email) {
            waitlistMap.set(entry.user._id.toString(), {
              user: entry.user._id,
              email: entry.user.email,
              name: entry.user.name
            });
          }
        });
      });
      recipients = Array.from(waitlistMap.values());
      break;

    case 'checked-in':
      // Get checked-in teams/players
      const checkedInTeams = await Team.find({ 
        event: { $in: tournament.events.map(e => e._id) },
        checkedIn: true
      }).populate('players', 'name email');
      
      const checkedInMap = new Map();
      checkedInTeams.forEach(team => {
        team.players?.forEach(player => {
          if (player?.email) {
            checkedInMap.set(player._id.toString(), {
              user: player._id,
              email: player.email,
              name: player.name
            });
          }
        });
      });
      recipients = Array.from(checkedInMap.values());
      break;

    case 'not-checked-in':
      // Get teams/players not checked in
      const notCheckedInTeams = await Team.find({ 
        event: { $in: tournament.events.map(e => e._id) },
        $or: [{ checkedIn: false }, { checkedIn: { $exists: false } }]
      }).populate('players', 'name email');
      
      const notCheckedInMap = new Map();
      notCheckedInTeams.forEach(team => {
        team.players?.forEach(player => {
          if (player?.email) {
            notCheckedInMap.set(player._id.toString(), {
              user: player._id,
              email: player.email,
              name: player.name
            });
          }
        });
      });
      recipients = Array.from(notCheckedInMap.values());
      break;

    default:
      throw new Error('Invalid recipient type');
  }

  return recipients;
};

/**
 * @desc    Preview recipients before sending
 * @route   POST /api/communications/:tournamentId/preview
 * @access  Private (Organizer)
 */
export const previewRecipients = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { recipientType, recipientEventId } = req.body;

    // Verify tournament exists and user is organizer
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send communications for this tournament'
      });
    }

    const recipients = await getRecipients(tournamentId, recipientType, recipientEventId);

    res.status(200).json({
      success: true,
      data: {
        count: recipients.length,
        recipients: recipients.slice(0, 10), // Preview first 10
        hasMore: recipients.length > 10
      }
    });
  } catch (error) {
    console.error('Preview recipients error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to preview recipients'
    });
  }
};

/**
 * @desc    Send bulk communication
 * @route   POST /api/communications/:tournamentId/send
 * @access  Private (Organizer)
 */
export const sendBulkMessage = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { subject, message, recipientType, recipientEventId, template = 'custom' } = req.body;

    // Validate required fields
    if (!subject || !message || !recipientType) {
      return res.status(400).json({
        success: false,
        message: 'Subject, message, and recipient type are required'
      });
    }

    // Verify tournament exists and user is organizer
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send communications for this tournament'
      });
    }

    // Get recipients
    const recipients = await getRecipients(tournamentId, recipientType, recipientEventId);

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients found for the selected criteria'
      });
    }

    // Create communication record
    const communication = await Communication.create({
      tournament: tournamentId,
      sender: req.user._id,
      subject,
      message,
      recipientType,
      recipientEvent: recipientEventId || null,
      recipientCount: recipients.length,
      recipients: recipients.map(r => ({
        user: r.user,
        email: r.email,
        name: r.name,
        status: 'pending'
      })),
      template,
      status: 'sending'
    });

    // Send emails in background
    let successCount = 0;
    let failedCount = 0;

    // Process in batches of 10 for better performance
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (recipient, index) => {
        try {
          await sendBulkCommunicationEmail({
            to: recipient.email,
            recipientName: recipient.name,
            subject,
            message,
            tournamentName: tournament.name,
            organizerName: req.user.name,
            template
          });
          
          // Update recipient status
          communication.recipients[i + index].status = 'sent';
          communication.recipients[i + index].sentAt = new Date();
          successCount++;
        } catch (error) {
          console.error(`Failed to send to ${recipient.email}:`, error);
          communication.recipients[i + index].status = 'failed';
          communication.recipients[i + index].error = error.message;
          failedCount++;
        }
      }));
    }

    // Update communication status
    communication.status = failedCount === recipients.length ? 'failed' : 'sent';
    communication.sentAt = new Date();
    communication.metadata = { successCount, failedCount };
    await communication.save();

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament:${tournamentId}`).emit('communication-sent', {
        id: communication._id,
        subject,
        recipientCount: recipients.length,
        successCount,
        failedCount
      });
    }

    res.status(200).json({
      success: true,
      message: `Message sent to ${successCount} recipients`,
      data: {
        id: communication._id,
        recipientCount: recipients.length,
        successCount,
        failedCount
      }
    });
  } catch (error) {
    console.error('Send bulk message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
};

/**
 * @desc    Get communication history for tournament
 * @route   GET /api/communications/:tournamentId/history
 * @access  Private (Organizer)
 */
export const getCommunicationHistory = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify tournament exists and user is organizer
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view communications for this tournament'
      });
    }

    const communications = await Communication.find({ tournament: tournamentId })
      .populate('sender', 'name email')
      .populate('recipientEvent', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-recipients'); // Exclude full recipient list for performance

    const total = await Communication.countDocuments({ tournament: tournamentId });

    res.status(200).json({
      success: true,
      data: communications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get communication history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communication history'
    });
  }
};

/**
 * @desc    Get message templates
 * @route   GET /api/communications/templates
 * @access  Private (Organizer)
 */
export const getTemplates = async (req, res) => {
  try {
    const templates = [
      {
        id: 'schedule-update',
        name: 'Schedule Update',
        subject: 'Schedule Update for {{tournamentName}}',
        message: `Dear {{playerName}},

We wanted to inform you about an important schedule update for {{tournamentName}}.

**What's Changed:**
[Enter your schedule changes here]

**Important:**
Please review your updated match times and arrive at least 15 minutes before your scheduled match.

If you have any questions, please don't hesitate to reach out.

Best regards,
{{organizerName}}`
      },
      {
        id: 'reminder',
        name: 'Tournament Reminder',
        subject: 'Reminder: {{tournamentName}} is Coming Up!',
        message: `Dear {{playerName}},

This is a friendly reminder that {{tournamentName}} is coming up soon!

**Tournament Details:**
- Date: {{tournamentDate}}
- Location: {{tournamentLocation}}
- Check-in opens: [Enter check-in time]

**What to Bring:**
- Your paddle
- Appropriate footwear
- Water bottle
- Photo ID for check-in

We look forward to seeing you there!

Best regards,
{{organizerName}}`
      },
      {
        id: 'announcement',
        name: 'General Announcement',
        subject: 'Important Announcement - {{tournamentName}}',
        message: `Dear {{playerName}},

We have an important announcement regarding {{tournamentName}}.

[Enter your announcement here]

Thank you for your participation!

Best regards,
{{organizerName}}`
      },
      {
        id: 'cancellation',
        name: 'Event Cancellation',
        subject: 'Event Update - {{tournamentName}}',
        message: `Dear {{playerName}},

We regret to inform you about a change to {{tournamentName}}.

[Enter cancellation/postponement details here]

**Next Steps:**
[Enter refund information or rescheduling details]

We apologize for any inconvenience and appreciate your understanding.

Best regards,
{{organizerName}}`
      }
    ];

    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
};

/**
 * @desc    Get single communication details
 * @route   GET /api/communications/:id
 * @access  Private (Organizer)
 */
export const getCommunication = async (req, res) => {
  try {
    const communication = await Communication.findById(req.params.id)
      .populate('sender', 'name email')
      .populate('tournament', 'name organizer')
      .populate('recipientEvent', 'name');

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found'
      });
    }

    // Verify user is organizer
    if (communication.tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this communication'
      });
    }

    res.status(200).json({
      success: true,
      data: communication
    });
  } catch (error) {
    console.error('Get communication error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communication'
    });
  }
};

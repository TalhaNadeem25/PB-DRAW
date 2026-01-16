import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'match-scheduled',
      'match-starting',
      'match-completed',
      'partner-invitation',
      'partner-accepted',
      'partner-declined',
      'waitlist-promoted',
      'tournament-update',
      'registration-confirmed',
      'check-in-reminder',
      'score-update',
      'general'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament'
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match'
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invitation'
    },
    result: String,
    actionUrl: String
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

// Auto-delete old notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

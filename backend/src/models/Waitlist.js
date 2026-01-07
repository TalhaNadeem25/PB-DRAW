import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  position: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'promoted', 'expired', 'converted', 'cancelled'],
    default: 'waiting'
  },
  promotedAt: {
    type: Date,
    default: null
  },
  promotionExpiresAt: {
    type: Date,
    default: null
  },
  convertedAt: {
    type: Date,
    default: null
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  metadata: {
    partnerEmail: {
      type: String,
      default: null
    },
    partnerName: {
      type: String,
      default: null
    },
    teamName: {
      type: String,
      default: null
    }
  }
}, {
  timestamps: true
});

// Indexes for faster queries
waitlistSchema.index({ event: 1, position: 1 });
waitlistSchema.index({ status: 1, promotionExpiresAt: 1 });

// Prevent duplicate waitlist entries for same user+event (while waiting)
waitlistSchema.index({ user: 1, event: 1 }, { unique: true, partialFilterExpression: { status: 'waiting' } });

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

export default Waitlist;

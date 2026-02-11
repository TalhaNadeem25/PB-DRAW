import mongoose from 'mongoose';

const cancellationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  cancellationType: {
    type: String,
    enum: ['singles', 'doubles-full-team', 'doubles-one-player', 'organizer-initiated', 'tournament-cancelled'],
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  partnerDecision: {
    type: String,
    enum: ['pending', 'refund', 'find-partner', 'expired'],
    default: 'pending'
  },
  partnerDecisionDeadline: Date,
  refundAmount: {
    type: Number,
    required: true
  },
  refundPercentage: {
    type: Number,
    required: true
  },
  stripeFeeDeducted: {
    type: Number,
    default: 0
  },
  refundProcessed: {
    type: Boolean,
    default: false
  },
  refundId: String,
  status: {
    type: String,
    enum: ['pending-partner-response', 'approved', 'processed', 'cancelled', 'expired'],
    default: 'pending-partner-response'
  },
  reason: String,
  adminNotes: String,
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for quick lookups
cancellationSchema.index({ user: 1, tournament: 1, status: 1 });
cancellationSchema.index({ partner: 1, partnerDecision: 1 });
cancellationSchema.index({ partnerDecisionDeadline: 1, status: 1 });

const Cancellation = mongoose.model('Cancellation', cancellationSchema);

export default Cancellation;

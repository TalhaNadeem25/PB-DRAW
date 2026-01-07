import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Legacy single-event fields (optional for backward compatibility)
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: false
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: false
    },
    // New multi-event fields
    teams: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    }],
    events: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    }],
    eventBreakdown: [{
      eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
      },
      teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      // For singles events (no team)
      isSingles: {
        type: Boolean,
        default: false
      },
      amount: Number,
      eventName: String
    }],
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    stripePaymentIntentId: {
      type: String,
      default: null
    },
    stripeChargeId: {
      type: String,
      default: null
    },
    paymentMethod: {
      type: String,
      default: null
    },
    receiptUrl: {
      type: String,
      default: null
    },
    metadata: {
      description: {
        type: String,
        default: ''
      },
      receiptEmail: {
        type: String,
        default: ''
      }
    },
    refundedAt: {
      type: Date,
      default: null
    },
    refundReason: {
      type: String,
      default: null
    },
    // QR Code Check-in fields
    ticketCode: {
      type: String,
      unique: true,
      sparse: true,
      default: null
    },
    qrCodeUrl: {
      type: String,
      default: null
    },
    ticketPdfUrl: {
      type: String,
      default: null
    },
    checkedIn: {
      checkedInAt: {
        type: Date,
        default: null
      },
      checkedInBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      method: {
        type: String,
        enum: ['qr-code', 'manual', 'self-check-in'],
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
paymentSchema.index({ user: 1, tournament: 1 });
paymentSchema.index({ team: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;

import mongoose from 'mongoose';

const communicationSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: 10000
  },
  recipientType: {
    type: String,
    enum: ['all', 'event', 'waitlisted', 'checked-in', 'not-checked-in', 'custom'],
    required: true
  },
  recipientEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  recipients: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String,
    name: String,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    sentAt: Date,
    error: String
  }],
  template: {
    type: String,
    enum: ['custom', 'schedule-update', 'reminder', 'announcement', 'cancellation'],
    default: 'custom'
  },
  status: {
    type: String,
    enum: ['draft', 'sending', 'sent', 'failed'],
    default: 'draft'
  },
  sentAt: {
    type: Date
  },
  metadata: {
    successCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
communicationSchema.index({ tournament: 1, createdAt: -1 });
communicationSchema.index({ sender: 1 });

const Communication = mongoose.model('Communication', communicationSchema);

export default Communication;

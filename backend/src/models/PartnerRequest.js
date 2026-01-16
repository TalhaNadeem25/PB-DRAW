import mongoose from 'mongoose';

const partnerRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    default: null
  },
  message: {
    type: String,
    maxlength: 500,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending',
    index: true
  },
  respondedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
partnerRequestSchema.index({ sender: 1, receiver: 1, status: 1 });
partnerRequestSchema.index({ receiver: 1, status: 1 });

// Prevent duplicate pending requests
partnerRequestSchema.index(
  { sender: 1, receiver: 1, event: 1, status: 1 },
  { 
    unique: true, 
    partialFilterExpression: { status: 'pending' } 
  }
);

const PartnerRequest = mongoose.model('PartnerRequest', partnerRequestSchema);

export default PartnerRequest;

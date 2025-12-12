import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  inviter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inviteeEmail: {
    type: String,
    required: [true, 'Invitee email is required'],
    lowercase: true,
    trim: true
  },
  inviteeName: {
    type: String,
    trim: true
  },
  invitee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  }
}, {
  timestamps: true
});

// Index for faster queries
invitationSchema.index({ inviteeEmail: 1, status: 1 });
invitationSchema.index({ team: 1, status: 1 });
invitationSchema.index({ inviter: 1 });
invitationSchema.index({ invitee: 1 });

// Auto-populate inviter and team info
invitationSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'inviter',
    select: 'name email'
  }).populate({
    path: 'team',
    select: 'name event',
    populate: {
      path: 'event',
      select: 'name format tournament',
      populate: {
        path: 'tournament',
        select: 'name location startDate endDate'
      }
    }
  });
  next();
});

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;

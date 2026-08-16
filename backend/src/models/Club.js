import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Club name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinType: {
    type: String,
    enum: ['open', 'request', 'invite-only'],
    default: 'open'
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    status: {
      type: String,
      enum: ['pending', 'active'],
      default: 'active'
    },
    joinedAt: {
      type: Date
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  skillLevel: {
    min: {
      type: Number,
      min: 2.5,
      max: 5.0
    },
    max: {
      type: Number,
      min: 2.5,
      max: 5.0
    }
  }
}, {
  timestamps: true
});

clubSchema.index({ name: 'text', location: 'text', description: 'text' });
clubSchema.index({ 'members.user': 1 });
clubSchema.index({ creator: 1 });

const Club = mongoose.model('Club', clubSchema);

export default Club;

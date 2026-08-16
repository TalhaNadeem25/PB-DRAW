import mongoose from 'mongoose';

const clubGameSchema = new mongoose.Schema({
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Start date/time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End date/time is required']
  },
  location: {
    type: String,
    trim: true
  },
  maxPlayers: {
    type: Number,
    default: 8,
    min: 2
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled'
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  rsvps: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['going', 'maybe', 'not-going'],
      required: true
    },
    respondedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

clubGameSchema.index({ club: 1, date: 1 });
clubGameSchema.index({ club: 1, status: 1 });

const ClubGame = mongoose.model('ClubGame', clubGameSchema);

export default ClubGame;

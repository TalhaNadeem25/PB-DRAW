import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  format: {
    type: String,
    enum: ['singles', 'doubles', 'mixed-doubles'],
    required: [true, 'Format is required']
  },
  playFormat: {
    type: String,
    enum: ['round-robin', 'single-elimination', 'double-elimination', 'pool-play', 'swiss'],
    default: 'round-robin',
    required: [true, 'Play format is required']
  },
  /** When playFormat is round-robin: if true, show Playoffs tab and allow generating playoffs. */
  addPlayoffStage: {
    type: Boolean,
    default: false
  },
  skillLevel: {
    type: String,
    required: [true, 'Skill level is required'],
    trim: true
  },
  maxTeams: {
    type: Number,
    required: [true, 'Max teams is required'],
    min: 2
  },
  currentTeams: {
    type: Number,
    default: 0
  },
  entryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'registration-open', 'registration-closed', 'in-progress', 'completed'],
    default: 'upcoming'
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  // For singles events - direct player registrations
  registeredPlayers: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid'
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    pool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pool'
    }
  }],
  pools: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pool'
  }],
  schedule: [{
    courtNumber: Number,
    time: Date,
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match'
    }
  }],
  prizes: {
    first: String,
    second: String,
    third: String
  }
}, {
  timestamps: true
});

// Index for listing events by tournament (very common)
eventSchema.index({ tournament: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;

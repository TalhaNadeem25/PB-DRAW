import mongoose from 'mongoose';

const poolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Pool name is required'],
    trim: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  playFormat: {
    type: String,
    enum: ['round-robin', 'single-elimination', 'double-elimination', 'pool-play', 'swiss'],
    default: 'round-robin'
  },
  /** Pool match format label for display */
  matchFormat: {
    type: String,
    trim: true,
    default: null
  },
  /** Structured config for game/match end logic */
  matchFormatConfig: {
    games_to_win: { type: Number, default: null },
    max_games: { type: Number, default: null },
    points_to_win: { type: Number, default: null },
    win_by: { type: Number, default: null },
    hard_cap: { type: Number, default: null }
  },
  bracketGenerated: {
    type: Boolean,
    default: false
  },
  bracketGeneratedAt: {
    type: Date,
    default: null
  },
  advancementRules: {
    teamsToAdvance: {
      type: Number,
      default: 2
    },
    tiebreaker: {
      type: String,
      enum: ['point-differential', 'head-to-head', 'points-for'],
      default: 'point-differential'
    }
  },
  /** Set when organizer marks pool play complete (standings final; pool can contribute to event playoffs) */
  poolPlayFinalizedAt: {
    type: Date,
    default: null
  },
  /** Set when organizer finalizes playoffs (cannot be undone) – for per-pool playoffs only */
  playoffsFinalizedAt: {
    type: Date,
    default: null
  },
  /** Final placements from playoff bracket: 1=gold, 2=silver, 3=bronze, 4=4th. entityId refs Team or User. */
  finalPlacements: [{
    place: { type: Number, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, default: '' }
  }]
}, {
  timestamps: true
});

// Index for listing pools by event (very common in pool management)
poolSchema.index({ event: 1 });

const Pool = mongoose.model('Pool', poolSchema);

export default Pool;

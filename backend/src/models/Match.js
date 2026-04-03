import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  pool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pool',
    required: false,
    default: null
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  team1: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'team1Model',
    required: false,
    default: null
  },
  team1Model: {
    type: String,
    enum: ['Team', 'User'],
    default: 'Team'
  },
  team2: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'team2Model',
    required: false,
    default: null
  },
  team2Model: {
    type: String,
    enum: ['Team', 'User'],
    default: 'Team'
  },
  score: {
    team1Score: {
      type: Number,
      default: 0,
      min: 0
    },
    team2Score: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  /** Individual game scores for Best-of-N formats. Empty for single-game matches. */
  games: [{
    team1Score: { type: Number, default: 0, min: 0 },
    team2Score: { type: Number, default: 0, min: 0 }
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'disputed'],
    default: 'scheduled'
  },
  round: {
    type: Number,
    default: 1,
    min: 1
  },
  bracket: {
    type: String,
    enum: ['winners', 'losers', 'semifinals', 'finals', 'bronze', null],
    default: null
  },
  /** For event-level playoffs: which tier (gold/silver/bronze) this match belongs to */
  bracketTier: {
    type: String,
    enum: ['gold', 'silver', 'bronze', 'event', null],
    default: null
  },
  matchNumber: {
    type: Number,
    default: null
  },
  // Advanced bracket fields for bracket visualization
  bracketPosition: {
    type: Number,
    default: null
  },
  nextMatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    default: null
  },
  previousMatch1Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    default: null
  },
  previousMatch2Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    default: null
  },
  isByeMatch: {
    type: Boolean,
    default: false
  },
  losersDropdownFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    default: null
  },
  /** For semifinals: loser advances to this match (e.g. bronze medal match) */
  loserNextMatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    default: null
  },
  /** Double-elimination only: true for the bracket-reset match after Grand Final */
  isGrandFinalReset: {
    type: Boolean,
    default: false
  },
  scheduledTime: {
    type: Date,
    default: null
  },
  courtNumber: {
    type: Number,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true
  },
  /** Playoff match format label (e.g. "Game to 11 – Win by 2") – overrides pool format when set */
  matchFormat: {
    type: String,
    trim: true,
    default: null
  },
  /** Playoff match format config for score validation – used when matchFormat is set */
  matchFormatConfig: {
    games_to_win: { type: Number, default: null },
    max_games: { type: Number, default: null },
    points_to_win: { type: Number, default: null },
    win_by: { type: Number, default: null },
    hard_cap: { type: Number, default: null }
  },
  checkIn: {
    team1: {
      status: {
        type: String,
        enum: ['pending', 'checked-in', 'no-show'],
        default: 'pending'
      },
      checkedInAt: {
        type: Date,
        default: null
      },
      checkedInBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      }
    },
    team2: {
      status: {
        type: String,
        enum: ['pending', 'checked-in', 'no-show'],
        default: 'pending'
      },
      checkedInAt: {
        type: Date,
        default: null
      },
      checkedInBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      }
    },
    deadline: {
      type: Date,
      default: null
    },
    required: {
      type: Boolean,
      default: true
    }
  },
  scoreSubmission: {
    team1: {
      submitted: { type: Boolean, default: false },
      team1Score: { type: Number, default: null },
      team2Score: { type: Number, default: null },
      submittedAt: { type: Date, default: null },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    team2: {
      submitted: { type: Boolean, default: false },
      team1Score: { type: Number, default: null },
      team2Score: { type: Number, default: null },
      submittedAt: { type: Date, default: null },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    }
  }
}, {
  timestamps: true
});

// Determine winner when match is completed
matchSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.winner) {
    if (this.score.team1Score > this.score.team2Score) {
      this.winner = this.team1;
    } else if (this.score.team2Score > this.score.team1Score) {
      this.winner = this.team2;
    }
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    }
  }
  next();
});

// Indexes for common queries (pool management, playoffs)
matchSchema.index({ pool: 1 });
matchSchema.index({ event: 1 });
matchSchema.index({ pool: 1, bracket: 1 });
matchSchema.index({ pool: 1, round: 1 });

const Match = mongoose.model('Match', matchSchema);

export default Match;

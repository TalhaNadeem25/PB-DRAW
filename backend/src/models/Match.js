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
    ref: 'Team',
    required: true
  },
  team2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: false,
    default: null
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
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  round: {
    type: Number,
    default: 1,
    min: 1
  },
  bracket: {
    type: String,
    enum: ['winners', 'losers', 'semifinals', 'finals', null],
    default: null
  },
  matchNumber: {
    type: Number,
    default: null
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

const Match = mongoose.model('Match', matchSchema);

export default Match;

import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  pool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pool',
    default: null
  },
  seed: {
    type: Number,
    default: null
  },
  skillRating: {
    type: Number,
    default: 3.0
  },
  stats: {
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    pointsFor: {
      type: Number,
      default: 0
    },
    pointsAgainst: {
      type: Number,
      default: 0
    },
    pointDifferential: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Validate number of players based on event format
teamSchema.pre('save', async function(next) {
  if (this.isModified('players')) {
    const event = await mongoose.model('Event').findById(this.event);
    if (event) {
      const maxPlayers = event.format === 'singles' ? 1 : 2;

      // Require at least 1 player
      if (this.players.length < 1) {
        throw new Error('Team must have at least 1 player');
      }

      // For singles, must have exactly 1 player
      if (event.format === 'singles' && this.players.length !== 1) {
        throw new Error('Singles events require exactly 1 player');
      }

      // For doubles/mixed, allow 1-2 players (partial teams allowed until partner is added)
      if (event.format !== 'singles' && this.players.length > maxPlayers) {
        throw new Error(`${event.format} allows a maximum of ${maxPlayers} players`);
      }
    }
  }
  next();
});

const Team = mongoose.model('Team', teamSchema);

export default Team;

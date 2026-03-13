import mongoose from 'mongoose';

const leagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'League name is required'],
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
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leagueType: {
    type: String,
    enum: ['ladder', 'traditional', 'king-of-court', 'dupr-session'],
    required: [true, 'League type is required']
  },
  playerType: {
    type: String,
    enum: ['scramble', 'partner'],
    required: [true, 'Player type is required']
  },
  playerGroup: {
    type: String,
    enum: ['mens', 'womens', 'mixed', 'coed'],
    required: [true, 'Player group is required']
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'active', 'completed'],
    default: 'open'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  registrationDeadline: {
    type: Date
  },
  maxPlayers: {
    type: Number,
    default: 32
  },
  entryFee: {
    type: Number,
    default: 0,
    min: 0
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
  },
  players: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    paymentStatus: {
      type: String,
      default: 'unpaid'
    }
  }],
  sessions: [{
    sessionNumber: {
      type: Number
    },
    date: {
      type: Date
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming'
    },
    notes: {
      type: String
    }
  }],
  standings: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rank: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    points: {
      type: Number,
      default: 0
    },
    gamesPlayed: {
      type: Number,
      default: 0
    }
  }],
  rankingType: {
    type: String,
    enum: ['dupr', 'pop', 'up-down', 'custom'],
    default: 'pop'
  },
  signupType: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  flexPlay: {
    type: Boolean,
    default: false
  },
  duprIntegration: {
    type: Boolean,
    default: false
  },
  newPlayerPlacement: {
    type: String,
    enum: ['bottom', 'rating'],
    default: 'bottom'
  },
  minAge: {
    type: Number,
    default: 0
  },
  memberFee: {
    type: Number,
    default: 0,
    min: 0
  },
  nonMemberFee: {
    type: Number,
    default: 0,
    min: 0
  },
  settings: {
    allowWaitlist: {
      type: Boolean,
      default: false
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  venue: {
    courts: {
      type: Number
    },
    courtSurface: {
      type: String
    },
    facilities: [String]
  },
  prizePool: {
    total: {
      type: Number,
      default: 0
    },
    distribution: {
      first: String,
      second: String,
      third: String
    }
  },
  rules: {
    type: String
  },
  contactEmail: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

leagueSchema.index({ name: 'text', location: 'text', description: 'text' });
leagueSchema.index({ startDate: 1, status: 1 });
leagueSchema.index({ organizer: 1 });
leagueSchema.index({ leagueType: 1, playerGroup: 1, status: 1 });

const League = mongoose.model('League', leagueSchema);

export default League;

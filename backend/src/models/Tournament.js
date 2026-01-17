import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tournament name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  registrationDeadline: {
    type: Date,
    required: [true, 'Registration deadline is required']
  },
  maxPlayers: {
    type: Number,
    required: [true, 'Max players is required'],
    min: 4
  },
  currentPlayers: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'closed', 'in-progress', 'completed'],
    default: 'draft'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Stripe Connect - organizer's connected account ID
  stripeAccountId: {
    type: String,
    default: null
  },
  platformFeePercent: {
    type: Number,
    default: 10, // 10% platform fee
    min: 0,
    max: 100
  },
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  registeredPlayers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  image: {
    type: String,
    default: null
  },
  venue: {
    name: String,
    courts: Number,
    facilities: [String]
  },
  contactEmail: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  // DEPRECATED: Use event.entryFee instead - fees are now set per event, not per tournament
  entryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  maxTeams: {
    type: Number,
    min: 2
  },
  currentTeams: {
    type: Number,
    default: 0
  },
  skillLevelRequirement: {
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
  rules: {
    type: String,
    maxlength: 2000
  },
  prizePool: {
    total: {
      type: Number,
      default: 0
    },
    distribution: {
      first: String,
      second: String,
      third: String,
      other: String
    }
  },
  settings: {
    allowWaitlist: {
      type: Boolean,
      default: false
    },
    requirePartnerOnRegistration: {
      type: Boolean,
      default: false
    },
    autoConfirmRegistrations: {
      type: Boolean,
      default: true
    },
    publicBrackets: {
      type: Boolean,
      default: true
    },
    showPlayerStats: {
      type: Boolean,
      default: true
    }
  },
  categories: [{
    type: String,
    enum: ['Recreational', 'Competitive', 'Professional', 'Charity', 'Corporate', 'Youth', 'Senior']
  }],
  tags: [String],
  
  // Court management
  courts: [{
    number: { type: Number, required: true },
    name: { type: String, default: '' },
    type: { type: String, enum: ['indoor', 'outdoor'], default: 'indoor' },
    available: { type: Boolean, default: true }
  }],
  
  // Scheduling configuration
  scheduling: {
    startTime: { type: String, default: '08:00' },
    endTime: { type: String, default: '18:00' },
    slotDuration: { type: Number, default: 30 }, // minutes
    breakTimes: [{
      start: String,
      end: String,
      label: String
    }]
  }
}, {
  timestamps: true
});

// Index for searching tournaments
tournamentSchema.index({ name: 'text', location: 'text', description: 'text' });
tournamentSchema.index({ startDate: 1, status: 1 });

const Tournament = mongoose.model('Tournament', tournamentSchema);

export default Tournament;

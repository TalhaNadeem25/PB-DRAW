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
  }
}, {
  timestamps: true
});

// Index for searching tournaments
tournamentSchema.index({ name: 'text', location: 'text', description: 'text' });
tournamentSchema.index({ startDate: 1, status: 1 });

const Tournament = mongoose.model('Tournament', tournamentSchema);

export default Tournament;

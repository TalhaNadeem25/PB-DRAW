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
  }
}, {
  timestamps: true
});

const Pool = mongoose.model('Pool', poolSchema);

export default Pool;

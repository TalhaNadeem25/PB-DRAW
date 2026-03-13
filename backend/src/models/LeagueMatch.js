import mongoose from 'mongoose';

const leagueMatchSchema = new mongoose.Schema({
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sessionNumber: { type: Number, required: true },
  player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score1: { type: Number, default: null },
  score2: { type: Number, default: null },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  round: { type: Number, default: 1 },
  courtNumber: { type: Number, default: null },
}, { timestamps: true });

leagueMatchSchema.index({ league: 1, sessionId: 1 });
leagueMatchSchema.index({ league: 1, status: 1 });

const LeagueMatch = mongoose.model('LeagueMatch', leagueMatchSchema);
export default LeagueMatch;

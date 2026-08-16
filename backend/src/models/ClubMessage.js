import mongoose from 'mongoose';

const clubMessageSchema = new mongoose.Schema({
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

clubMessageSchema.index({ club: 1, createdAt: -1 });

const ClubMessage = mongoose.model('ClubMessage', clubMessageSchema);

export default ClubMessage;

import mongoose from 'mongoose';

const clubAnnouncementSchema = new mongoose.Schema({
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
    index: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

clubAnnouncementSchema.index({ club: 1, createdAt: -1 });

const ClubAnnouncement = mongoose.model('ClubAnnouncement', clubAnnouncementSchema);

export default ClubAnnouncement;

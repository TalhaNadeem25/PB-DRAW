import express from 'express';
import Club from '../models/Club.js';
import ClubGame from '../models/ClubGame.js';
import ClubAnnouncement from '../models/ClubAnnouncement.js';
import ClubMessage from '../models/ClubMessage.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { createNotification, createBatchNotifications } from '../controllers/notificationController.js';
import { emitClubMessage, emitClubMessageDeleted } from '../utils/socket.js';

const router = express.Router();

// Helper: get a member subdoc's user id as a string, whether or not `user` is populated
const memberUserId = (m) => (m.user._id ?? m.user).toString();

// Helper: is this user an active admin of this club?
const isClubAdmin = (club, user) =>
  club.members.some(
    (m) => m.status === 'active' && m.role === 'admin' && memberUserId(m) === user._id.toString()
  ) || user.role === 'admin';

// Helper: is this user an active member (admin or member) of this club?
const isActiveMember = (club, user) =>
  club.members.some((m) => m.status === 'active' && memberUserId(m) === user._id.toString());

// Helper: find a member subdoc by userId
const findMember = (club, userId) =>
  club.members.find((m) => memberUserId(m) === userId.toString());

// Helper: count active admins
const activeAdminCount = (club) =>
  club.members.filter((m) => m.status === 'active' && m.role === 'admin').length;

// GET /api/clubs — browse public clubs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, search, joinType } = req.query;

    const query = { 'settings.isPublic': true };
    if (search) {
      query.$text = { $search: search };
    }
    if (joinType) {
      query.joinType = joinType;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Club.countDocuments(query);
    const clubs = await Club.find(query)
      .populate('creator', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: clubs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/clubs — create club (any authenticated user)
router.post('/', protect, async (req, res) => {
  try {
    const club = await Club.create({
      ...req.body,
      creator: req.user._id,
      members: [{
        user: req.user._id,
        role: 'admin',
        status: 'active',
        joinedAt: new Date()
      }]
    });
    res.status(201).json({ success: true, data: club });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/clubs/:id — club detail
router.get('/:id', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('members.user', 'name email skillLevel');

    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    res.json({ success: true, data: club });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/clubs/:id — update club
router.put('/:id', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Never let a bulk update overwrite members/creator through this route
    const { members, creator, ...updates } = req.body;

    const updated = await Club.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/clubs/:id — delete club
router.delete('/:id', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await ClubGame.deleteMany({ club: club._id });
    await club.deleteOne();

    res.json({ success: true, message: 'Club deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/clubs/:id/join — join or request to join
router.post('/:id/join', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const existing = findMember(club, req.user._id);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.status === 'pending' ? 'Join request already pending' : 'Already a member'
      });
    }

    if (club.joinType === 'invite-only') {
      return res.status(403).json({ success: false, message: 'This club is invite-only' });
    }

    if (club.settings?.maxMembers > 0) {
      const activeCount = club.members.filter((m) => m.status === 'active').length;
      if (activeCount >= club.settings.maxMembers) {
        return res.status(400).json({ success: false, message: 'Club is full' });
      }
    }

    if (club.joinType === 'open') {
      club.members.push({
        user: req.user._id,
        role: 'member',
        status: 'active',
        joinedAt: new Date()
      });
      await club.save();
      return res.json({ success: true, message: 'Joined club', data: club });
    }

    // joinType === 'request'
    club.members.push({
      user: req.user._id,
      role: 'member',
      status: 'pending',
      requestedAt: new Date()
    });
    await club.save();

    const io = req.app.get('io');
    if (io) {
      try {
        const adminIds = club.members
          .filter((m) => m.status === 'active' && m.role === 'admin')
          .map((m) => m.user);
        await createBatchNotifications(io, adminIds, {
          type: 'club-join-request',
          title: `New join request — ${club.name}`,
          message: `${req.user.name} requested to join ${club.name}.`,
          data: { actionUrl: `/clubs/${club._id}/manage?tab=requests` }
        });
      } catch (notifError) {
        console.error('Failed to send club join-request notification:', notifError);
      }
    }

    res.json({ success: true, message: 'Join request submitted', data: club });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/clubs/:id/leave — leave a club
router.delete('/:id/leave', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const member = findMember(club, req.user._id);
    if (!member) {
      return res.status(400).json({ success: false, message: 'Not a member of this club' });
    }

    if (member.status === 'active' && member.role === 'admin' && activeAdminCount(club) <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave — you are the only admin. Promote another member first.'
      });
    }

    club.members = club.members.filter((m) => m.user.toString() !== req.user._id.toString());
    await club.save();

    res.json({ success: true, message: 'Left club' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/clubs/:id/members — full roster (active members only)
router.get('/:id/members', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id).populate('members.user', 'name email skillLevel');
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isActiveMember(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const members = club.members.filter((m) => m.status === 'active');
    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/clubs/:id/members — admin adds a member directly by email (primary path for invite-only clubs)
router.post('/:id/members', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'email is required' });
    }

    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    const existing = findMember(club, targetUser._id);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.status === 'pending' ? 'This user already has a pending request' : 'Already a member'
      });
    }

    if (club.settings?.maxMembers > 0) {
      const activeCount = club.members.filter((m) => m.status === 'active').length;
      if (activeCount >= club.settings.maxMembers) {
        return res.status(400).json({ success: false, message: 'Club is full' });
      }
    }

    club.members.push({
      user: targetUser._id,
      role: 'member',
      status: 'active',
      joinedAt: new Date()
    });
    await club.save();

    const io = req.app.get('io');
    if (io) {
      try {
        await createNotification(io, targetUser._id, {
          type: 'club-member-added',
          title: `You've been added to ${club.name}`,
          message: `${req.user.name} added you to ${club.name}.`,
          data: { actionUrl: `/clubs/${club._id}` }
        });
      } catch (notifError) {
        console.error('Failed to send club-member-added notification:', notifError);
      }
    }

    res.status(201).json({ success: true, data: club });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/clubs/:id/requests — pending join requests (admin only)
router.get('/:id/requests', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id).populate('members.user', 'name email skillLevel');
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const requests = club.members.filter((m) => m.status === 'pending');
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/clubs/:id/requests/:userId/approve
router.post('/:id/requests/:userId/approve', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const member = findMember(club, req.params.userId);
    if (!member || member.status !== 'pending') {
      return res.status(404).json({ success: false, message: 'Pending request not found' });
    }

    member.status = 'active';
    member.joinedAt = new Date();
    await club.save();

    const io = req.app.get('io');
    if (io) {
      try {
        await createNotification(io, member.user, {
          type: 'club-request-approved',
          title: `Request approved — ${club.name}`,
          message: `Your request to join ${club.name} was approved.`,
          data: { actionUrl: `/clubs/${club._id}` }
        });
      } catch (notifError) {
        console.error('Failed to send club-request-approved notification:', notifError);
      }
    }

    res.json({ success: true, data: club });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/clubs/:id/requests/:userId/reject
router.post('/:id/requests/:userId/reject', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const member = findMember(club, req.params.userId);
    if (!member || member.status !== 'pending') {
      return res.status(404).json({ success: false, message: 'Pending request not found' });
    }

    const rejectedUserId = member.user;
    club.members = club.members.filter((m) => m.user.toString() !== req.params.userId);
    await club.save();

    const io = req.app.get('io');
    if (io) {
      try {
        await createNotification(io, rejectedUserId, {
          type: 'club-request-rejected',
          title: `Request declined — ${club.name}`,
          message: `Your request to join ${club.name} was declined.`,
          data: { actionUrl: '/clubs' }
        });
      } catch (notifError) {
        console.error('Failed to send club-request-rejected notification:', notifError);
      }
    }

    res.json({ success: true, message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/clubs/:id/members/:userId/role — promote/demote a member
router.put('/:id/members/:userId/role', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'role must be admin or member' });
    }

    const member = findMember(club, req.params.userId);
    if (!member || member.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Active member not found' });
    }

    if (member.role === 'admin' && role === 'member' && activeAdminCount(club) <= 1) {
      return res.status(400).json({ success: false, message: 'Cannot demote the only remaining admin' });
    }

    member.role = role;
    await club.save();

    res.json({ success: true, data: club });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/clubs/:id/members/:userId — remove a member
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const member = findMember(club, req.params.userId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    club.members = club.members.filter((m) => m.user.toString() !== req.params.userId);
    await club.save();

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/clubs/:id/announcements — post an announcement (admin only)
router.post('/:id/announcements', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const announcement = await ClubAnnouncement.create({
      club: club._id,
      postedBy: req.user._id,
      message: message.trim()
    });
    await announcement.populate('postedBy', 'name email');

    const io = req.app.get('io');
    if (io) {
      try {
        const recipientIds = club.members
          .filter((m) => m.status === 'active' && m.user.toString() !== req.user._id.toString())
          .map((m) => m.user);
        if (recipientIds.length > 0) {
          await createBatchNotifications(io, recipientIds, {
            type: 'club-announcement',
            title: `Announcement — ${club.name}`,
            message: message.trim().length > 140 ? `${message.trim().slice(0, 137)}...` : message.trim(),
            data: { actionUrl: `/clubs/${club._id}` }
          });
        }
      } catch (notifError) {
        console.error('Failed to send club-announcement notification:', notifError);
      }
    }

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/clubs/:id/announcements — list announcements (active members only)
router.get('/:id/announcements', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isActiveMember(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const announcements = await ClubAnnouncement.find({ club: club._id })
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/clubs/:id/announcements/:announcementId — remove an announcement (admin only)
router.delete('/:id/announcements/:announcementId', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const announcement = await ClubAnnouncement.findOneAndDelete({
      _id: req.params.announcementId,
      club: club._id
    });
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/clubs/:id/messages — recent chat messages (active members only)
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isActiveMember(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { before } = req.query;
    const query = { club: club._id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ClubMessage.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    // Return oldest-first so the client can render top-to-bottom directly
    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/clubs/:id/messages — send a chat message (active members only)
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isActiveMember(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const clubMessage = await ClubMessage.create({
      club: club._id,
      user: req.user._id,
      message: message.trim()
    });
    await clubMessage.populate('user', 'name email');

    const io = req.app.get('io');
    emitClubMessage(io, club._id.toString(), clubMessage);

    res.status(201).json({ success: true, data: clubMessage });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/clubs/:id/messages/:messageId — delete a chat message (sender or admin)
router.delete('/:id/messages/:messageId', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const message = await ClubMessage.findOne({ _id: req.params.messageId, club: club._id });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const isSender = message.user.toString() === req.user._id.toString();
    if (!isSender && !isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await message.deleteOne();

    const io = req.app.get('io');
    emitClubMessageDeleted(io, club._id.toString(), message._id.toString());

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/clubs/:id/games — create a daily game
router.post('/:id/games', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Only club admins can schedule games' });
    }

    const { date, endTime, location, maxPlayers, notes } = req.body;
    if (!date || !endTime) {
      return res.status(400).json({ success: false, message: 'date and endTime are required' });
    }

    const game = await ClubGame.create({
      club: club._id,
      createdBy: req.user._id,
      date,
      endTime,
      location: location || club.location,
      maxPlayers,
      notes,
      rsvps: [{ user: req.user._id, status: 'going' }]
    });

    const io = req.app.get('io');
    if (io) {
      try {
        const otherMemberIds = club.members
          .filter((m) => m.status === 'active' && m.user.toString() !== req.user._id.toString())
          .map((m) => m.user);
        if (otherMemberIds.length > 0) {
          await createBatchNotifications(io, otherMemberIds, {
            type: 'club-game-created',
            title: `New game — ${club.name}`,
            message: `${req.user.name} scheduled a game for ${club.name}.`,
            data: { actionUrl: `/clubs/${club._id}?tab=games` }
          });
        }
      } catch (notifError) {
        console.error('Failed to send club-game-created notification:', notifError);
      }
    }

    res.status(201).json({ success: true, data: game });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/clubs/:id/games/batch — create several one-off games at once
router.post('/:id/games/batch', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Only club admins can schedule games' });
    }

    const { games } = req.body;
    if (!Array.isArray(games) || games.length === 0) {
      return res.status(400).json({ success: false, message: 'games must be a non-empty array' });
    }
    if (games.length > 20) {
      return res.status(400).json({ success: false, message: 'Cannot create more than 20 games at once' });
    }
    if (games.some((g) => !g.date || !g.endTime)) {
      return res.status(400).json({ success: false, message: 'Every game needs a date and endTime' });
    }

    const docs = games.map((g) => ({
      club: club._id,
      createdBy: req.user._id,
      date: g.date,
      endTime: g.endTime,
      location: g.location || club.location,
      maxPlayers: g.maxPlayers,
      notes: g.notes,
      rsvps: [{ user: req.user._id, status: 'going' }]
    }));

    const created = await ClubGame.insertMany(docs);

    const io = req.app.get('io');
    if (io) {
      try {
        const otherMemberIds = club.members
          .filter((m) => m.status === 'active' && m.user.toString() !== req.user._id.toString())
          .map((m) => m.user);
        if (otherMemberIds.length > 0) {
          await createBatchNotifications(io, otherMemberIds, {
            type: 'club-game-created',
            title: `${created.length} new games — ${club.name}`,
            message: `${req.user.name} scheduled ${created.length} new games for ${club.name}.`,
            data: { actionUrl: `/clubs/${club._id}?tab=games` }
          });
        }
      } catch (notifError) {
        console.error('Failed to send club-game-created batch notification:', notifError);
      }
    }

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/clubs/:id/games — list games for a club
router.get('/:id/games', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!club.settings?.isPublic && !isActiveMember(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status } = req.query;
    const query = { club: club._id };
    if (status) query.status = status;

    const games = await ClubGame.find(query)
      .populate('createdBy', 'name email')
      .populate('rsvps.user', 'name email')
      .sort({ date: 1 });

    res.json({ success: true, data: games });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/clubs/:id/games/:gameId — game detail
router.get('/:id/games/:gameId', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!club.settings?.isPublic && !isActiveMember(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const game = await ClubGame.findOne({ _id: req.params.gameId, club: club._id })
      .populate('createdBy', 'name email')
      .populate('rsvps.user', 'name email');

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/clubs/:id/games/:gameId — edit a game
router.put('/:id/games/:gameId', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const game = await ClubGame.findOne({ _id: req.params.gameId, club: club._id });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    const isCreator = game.createdBy.toString() === req.user._id.toString();
    if (!isCreator && !isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { date, endTime, location, maxPlayers, notes } = req.body;
    if (date !== undefined) game.date = date;
    if (endTime !== undefined) game.endTime = endTime;
    if (location !== undefined) game.location = location;
    if (maxPlayers !== undefined) game.maxPlayers = maxPlayers;
    if (notes !== undefined) game.notes = notes;

    await game.save();

    res.json({ success: true, data: game });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/clubs/:id/games/:gameId — cancel a game (soft delete)
router.delete('/:id/games/:gameId', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const game = await ClubGame.findOne({ _id: req.params.gameId, club: club._id });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    const isCreator = game.createdBy.toString() === req.user._id.toString();
    if (!isCreator && !isClubAdmin(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    game.status = 'cancelled';
    await game.save();

    const io = req.app.get('io');
    if (io) {
      try {
        const notifyIds = game.rsvps
          .filter((r) => r.status === 'going' || r.status === 'maybe')
          .map((r) => r.user)
          .filter((userId) => userId.toString() !== req.user._id.toString());
        if (notifyIds.length > 0) {
          await createBatchNotifications(io, notifyIds, {
            type: 'club-game-cancelled',
            title: `Game cancelled — ${club.name}`,
            message: `A game you RSVP'd to at ${club.name} was cancelled.`,
            data: { actionUrl: `/clubs/${club._id}?tab=games` }
          });
        }
      } catch (notifError) {
        console.error('Failed to send club-game-cancelled notification:', notifError);
      }
    }

    res.json({ success: true, message: 'Game cancelled', data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/clubs/:id/games/:gameId/rsvp — RSVP to a game
router.post('/:id/games/:gameId/rsvp', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    if (!isActiveMember(club, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const game = await ClubGame.findOne({ _id: req.params.gameId, club: club._id });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    if (game.status !== 'scheduled') {
      return res.status(400).json({ success: false, message: 'This game is no longer scheduled' });
    }

    const { status } = req.body;
    if (!['going', 'maybe', 'not-going'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be going, maybe, or not-going' });
    }

    const existingRsvp = game.rsvps.find((r) => r.user.toString() === req.user._id.toString());

    if (status === 'going' && (!existingRsvp || existingRsvp.status !== 'going')) {
      const goingCount = game.rsvps.filter((r) => r.status === 'going').length;
      if (goingCount >= game.maxPlayers) {
        return res.status(400).json({ success: false, message: 'This game is full' });
      }
    }

    if (existingRsvp) {
      existingRsvp.status = status;
      existingRsvp.respondedAt = new Date();
    } else {
      game.rsvps.push({ user: req.user._id, status, respondedAt: new Date() });
    }

    await game.save();

    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

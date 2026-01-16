import User from '../models/User.js';
import PartnerRequest from '../models/PartnerRequest.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';
import { createNotification } from './notificationController.js';

// Get players looking for partners
export const getAvailablePlayers = async (req, res) => {
  try {
    const { 
      skillMin = 2.5, 
      skillMax = 5.0, 
      city, 
      state,
      playingDays,
      page = 1, 
      limit = 20 
    } = req.query;

    const query = {
      _id: { $ne: req.user.id },
      isActive: true,
      role: 'player',
      'preferences.partnerPreference': { $in: ['looking', 'either'] }
    };

    // Skill level filter
    if (skillMin || skillMax) {
      query.skillLevel = {};
      if (skillMin) query.skillLevel.$gte = parseFloat(skillMin);
      if (skillMax) query.skillLevel.$lte = parseFloat(skillMax);
    }

    // Location filters
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (state) query['location.state'] = new RegExp(state, 'i');

    // Playing days filter
    if (playingDays) {
      const days = playingDays.split(',');
      query['preferences.playingDays'] = { $in: days };
    }

    const players = await User.find(query)
      .select('name email skillLevel avatar bio location preferences statistics createdAt')
      .sort({ skillLevel: -1, 'statistics.matchesPlayed': -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    // Get pending requests sent by current user
    const sentRequests = await PartnerRequest.find({
      sender: req.user.id,
      status: 'pending'
    }).select('receiver');
    
    const sentToIds = sentRequests.map(r => r.receiver.toString());

    // Add compatibility info
    const playersWithInfo = players.map(player => ({
      ...player,
      hasRequestPending: sentToIds.includes(player._id.toString()),
      compatibilityScore: calculateCompatibility(req.user, player)
    }));

    res.json({
      success: true,
      players: playersWithInfo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get available players error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch players' });
  }
};

// Calculate compatibility score between two users
function calculateCompatibility(currentUser, otherPlayer) {
  let score = 0;
  let factors = 0;

  // Skill level proximity (0-40 points)
  if (currentUser.skillLevel && otherPlayer.skillLevel) {
    const skillDiff = Math.abs(currentUser.skillLevel - otherPlayer.skillLevel);
    score += Math.max(0, 40 - (skillDiff * 20));
    factors++;
  }

  // Location match (0-30 points)
  if (currentUser.location?.city && otherPlayer.location?.city) {
    if (currentUser.location.city.toLowerCase() === otherPlayer.location.city.toLowerCase()) {
      score += 30;
    } else if (currentUser.location.state?.toLowerCase() === otherPlayer.location.state?.toLowerCase()) {
      score += 15;
    }
    factors++;
  }

  // Playing days overlap (0-30 points)
  if (currentUser.preferences?.playingDays?.length && otherPlayer.preferences?.playingDays?.length) {
    const overlap = currentUser.preferences.playingDays.filter(
      day => otherPlayer.preferences.playingDays.includes(day)
    ).length;
    const maxDays = Math.max(
      currentUser.preferences.playingDays.length,
      otherPlayer.preferences.playingDays.length
    );
    score += Math.round((overlap / maxDays) * 30);
    factors++;
  }

  return factors > 0 ? Math.round(score / factors * 100 / 100) : 50;
}

// Send partner request
export const sendPartnerRequest = async (req, res) => {
  try {
    const { receiverId, eventId, tournamentId, message } = req.body;

    if (receiverId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot send request to yourself' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    // Check for existing pending request
    const existingRequest = await PartnerRequest.findOne({
      sender: req.user.id,
      receiver: receiverId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Request already pending' });
    }

    const partnerRequest = await PartnerRequest.create({
      sender: req.user.id,
      receiver: receiverId,
      event: eventId || null,
      tournament: tournamentId || null,
      message: message || ''
    });

    // Populate for response
    await partnerRequest.populate('sender', 'name email skillLevel avatar');

    // Send notification
    const io = req.app.get('io');
    const sender = await User.findById(req.user.id).select('name skillLevel');
    
    await createNotification(io, receiverId, {
      type: 'partner-invitation',
      title: 'New Partner Request',
      message: `${sender.name} (${sender.skillLevel} skill) wants to be your partner!`,
      data: {
        actionUrl: '/find-partner?tab=requests'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Partner request sent',
      request: partnerRequest
    });
  } catch (error) {
    console.error('Send partner request error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Request already pending' });
    }
    res.status(500).json({ success: false, message: 'Failed to send request' });
  }
};

// Get received partner requests
export const getReceivedRequests = async (req, res) => {
  try {
    const requests = await PartnerRequest.find({
      receiver: req.user.id,
      status: 'pending'
    })
      .populate('sender', 'name email skillLevel avatar bio location preferences statistics')
      .populate('event', 'name gameType skillLevel')
      .populate('tournament', 'name startDate')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
};

// Get sent partner requests
export const getSentRequests = async (req, res) => {
  try {
    const requests = await PartnerRequest.find({
      sender: req.user.id
    })
      .populate('receiver', 'name email skillLevel avatar')
      .populate('event', 'name gameType skillLevel')
      .populate('tournament', 'name startDate')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
};

// Respond to partner request
export const respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    const request = await PartnerRequest.findOne({
      _id: id,
      receiver: req.user.id,
      status: 'pending'
    }).populate('sender', 'name email');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const io = req.app.get('io');

    if (action === 'accept') {
      request.status = 'accepted';
      request.respondedAt = new Date();
      await request.save();

      // Create a team if event is specified
      let team = null;
      if (request.event) {
        const event = await Event.findById(request.event);
        if (event && (event.gameType === 'Doubles' || event.gameType === 'Mixed Doubles')) {
          team = await Team.create({
            name: `${request.sender.name} & ${req.user.name}`,
            event: request.event,
            players: [request.sender._id, req.user.id],
            captain: request.sender._id,
            status: 'confirmed'
          });
        }
      }

      // Notify sender
      const receiver = await User.findById(req.user.id).select('name');
      await createNotification(io, request.sender._id, {
        type: 'partner-accepted',
        title: 'Partner Request Accepted!',
        message: `${receiver.name} accepted your partner request!`,
        data: {
          teamId: team?._id,
          actionUrl: team ? '/teams' : '/find-partner'
        }
      });

      res.json({
        success: true,
        message: 'Partner request accepted',
        team
      });
    } else if (action === 'decline') {
      request.status = 'declined';
      request.respondedAt = new Date();
      await request.save();

      // Notify sender
      const receiver = await User.findById(req.user.id).select('name');
      await createNotification(io, request.sender._id, {
        type: 'partner-declined',
        title: 'Partner Request Declined',
        message: `${receiver.name} declined your partner request.`,
        data: {}
      });

      res.json({ success: true, message: 'Partner request declined' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({ success: false, message: 'Failed to respond to request' });
  }
};

// Cancel sent request
export const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await PartnerRequest.findOneAndDelete({
      _id: id,
      sender: req.user.id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, message: 'Request cancelled' });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel request' });
  }
};

// Update partner preference
export const updatePartnerPreference = async (req, res) => {
  try {
    const { partnerPreference } = req.body;

    if (!['looking', 'have-partner', 'either'].includes(partnerPreference)) {
      return res.status(400).json({ success: false, message: 'Invalid preference' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      'preferences.partnerPreference': partnerPreference
    });

    res.json({ success: true, message: 'Preference updated' });
  } catch (error) {
    console.error('Update preference error:', error);
    res.status(500).json({ success: false, message: 'Failed to update preference' });
  }
};

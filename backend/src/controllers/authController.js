import User from '../models/User.js';
import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';
import { generateToken } from '../utils/jwt.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, skillLevel, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'player',
      skillLevel: skillLevel || 3.0,
      phone
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, skillLevel, avatar, bio, location, preferences } = req.body;

    const updateData = {
      name,
      phone,
      skillLevel,
      avatar,
      bio,
      location,
      preferences
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key =>
      updateData[key] === undefined && delete updateData[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics and history
// @route   GET /api/auth/stats
// @access  Private
export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all teams the user is part of (check both players.user and players directly)
    const teams = await Team.find({
      $or: [
        { 'players.user': userId },
        { 'players': userId }
      ]
    }).populate({
      path: 'event',
      populate: { path: 'tournament' }
    }).lean();

    // Get all tournaments the user has participated in
    const tournamentIds = [...new Set(teams.map(team => team.event?.tournament?._id || team.event?.tournament).filter(Boolean))];
    const tournaments = await Tournament.find({
      _id: { $in: tournamentIds }
    }).sort({ startDate: -1 }).lean();

    // Get user statistics from user model
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      data: {
        statistics: user.statistics,
        tournaments: tournaments.map(t => ({
          _id: t._id,
          name: t.name,
          startDate: t.startDate,
          endDate: t.endDate,
          status: t.status,
          location: t.location
        })),
        teams: teams.map(t => ({
          _id: t._id,
          name: t.name,
          event: t.event ? {
            _id: t.event._id,
            name: t.event.name,
            tournament: t.event.tournament
          } : null
        }))
      }
    });
  } catch (error) {
    console.error('Error in getUserStats:', error);
    next(error);
  }
};

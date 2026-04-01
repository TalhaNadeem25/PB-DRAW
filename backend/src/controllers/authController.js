import User from '../models/User.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';
import Tournament from '../models/Tournament.js';
import { generateToken } from '../utils/jwt.js';
import { sendPasswordResetEmail, sendEmailVerificationEmail } from '../services/emailService.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

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

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    await sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      verificationToken
    });

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email address
// @route   POST /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Hash the token from URL to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now access all features.'
    });
  } catch (error) {
    console.error('Error in verifyEmail:', error);
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const emailResult = await sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      verificationToken
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Error sending verification email. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Error in resendVerificationEmail:', error);
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

    // ALSO get events where user is registered as singles player
    const singlesEvents = await Event.find({
      'registeredPlayers.player': userId
    }).populate('tournament').lean();

    // Get all tournaments the user has participated in (from both teams AND singles)
    const teamTournamentIds = teams.map(team => team.event?.tournament?._id || team.event?.tournament).filter(Boolean);
    const singlesTournamentIds = singlesEvents.map(event => event.tournament?._id || event.tournament).filter(Boolean);
    const tournamentIds = [...new Set([...teamTournamentIds, ...singlesTournamentIds])];

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
        })),
        singlesEvents: singlesEvents.map(e => ({
          _id: e._id,
          name: e.name,
          format: e.format,
          tournament: e.tournament
        }))
      }
    });
  } catch (error) {
    console.error('Error in getUserStats:', error);
    next(error);
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();

    // Save user with reset token
    await user.save({ validateBeforeSave: false });

    // Send email
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetToken
    });

    if (!emailResult.success) {
      // Reset token fields if email fails
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Error sending password reset email. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    next(error);
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validate input
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash the token from URL to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    // Generate new JWT token
    const authToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: {
        user,
        token: authToken
      }
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    next(error);
  }
};

// @desc    Google OAuth Sign-In
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res, next) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ success: false, message: 'Google access token is required' });
    }

    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text();
      console.error('Google userinfo error:', errText);
      return res.status(401).json({ success: false, message: 'Invalid Google access token' });
    }

    const { sub: googleId, email, name, picture } = await googleRes.json();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        isEmailVerified: true,
        role: 'player',
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      await user.save({ validateBeforeSave: false });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ success: false, message: 'Google sign-in failed' });
  }
};

// @desc    Apple Sign-In
// @route   POST /api/auth/apple
// @access  Public
export const appleAuth = async (req, res, next) => {
  try {
    const { id_token, user } = req.body;

    if (!id_token) {
      return res.status(400).json({ success: false, message: 'Apple ID token is required' });
    }

    // Verify Apple ID token using Apple's public keys
    const appleKeysRes = await fetch('https://appleid.apple.com/auth/keys');
    const { keys } = await appleKeysRes.json();
    const decoded = jwt.decode(id_token, { complete: true });
    if (!decoded) throw new Error('Invalid token');
    const key = keys.find(k => k.kid === decoded.header.kid);
    if (!key) throw new Error('Key not found');
    const publicKey = require('crypto').createPublicKey({ key, format: 'jwk' });
    const payload = jwt.verify(id_token, publicKey, { algorithms: ['ES256'] });

    const appleId = payload.sub;
    const email = payload.email || (user?.email);
    const name = user?.name ? `${user.name.firstName} ${user.name.lastName}`.trim() : email?.split('@')[0] || 'Apple User';

    let dbUser = await User.findOne({ $or: [{ appleId }, ...(email ? [{ email }] : [])] });

    if (!dbUser) {
      dbUser = await User.create({
        name,
        email: email || `${appleId}@privaterelay.appleid.com`,
        appleId,
        isEmailVerified: true,
        role: 'player',
      });
    } else if (!dbUser.appleId) {
      dbUser.appleId = appleId;
      await dbUser.save({ validateBeforeSave: false });
    }

    const token = generateToken(dbUser._id);

    res.status(200).json({
      success: true,
      data: { user: dbUser, token },
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    res.status(401).json({ success: false, message: 'Apple sign-in failed' });
  }
};

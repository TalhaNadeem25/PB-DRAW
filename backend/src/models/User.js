import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  googleId: {
    type: String,
    default: null
  },
  appleId: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['player', 'organizer', 'admin'],
    default: 'player'
  },
  skillLevel: {
    type: Number,
    min: 2.5,
    max: 5.0,
    default: 3.0
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: {
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    }
  },
  preferences: {
    playingDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    partnerPreference: {
      type: String,
      enum: ['looking', 'have-partner', 'either'],
      default: 'either'
    },
    preferredSide: {
      type: String,
      enum: ['Left', 'Right', 'Both'],
      default: 'Left'
    },
    primaryPaddle: {
      type: String,
      trim: true,
      default: ''
    },
    availability: [{
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'weekends']
    }]
  },
  statistics: {
    matchesPlayed: {
      type: Number,
      default: 0
    },
    matchesWon: {
      type: Number,
      default: 0
    },
    tournamentsPlayed: {
      type: Number,
      default: 0
    },
    goldMedals: {
      type: Number,
      default: 0
    },
    silverMedals: {
      type: Number,
      default: 0
    },
    bronzeMedals: {
      type: Number,
      default: 0
    }
  },
  tournaments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  }],
  createdTournaments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  // Push notification device tokens (FCM registration tokens, shared format for iOS/Android)
  deviceTokens: [{
    token: { type: String, required: true },
    platform: { type: String, enum: ['ios', 'android'], required: true },
    addedAt: { type: Date, default: Date.now }
  }],
  // Stripe Connect fields
  stripeConnectAccountId: {
    type: String,
    default: null
  },
  stripeConnectOnboarded: {
    type: Boolean,
    default: false
  },
  stripeConnectOnboardingCompleted: {
    type: Date,
    default: null
  },
  // Password reset fields
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  // Email verification fields
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set expiry to 1 hour
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  return resetToken;
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  // Generate token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  // Set expiry to 24 hours
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;

// Vercel Serverless Function Handler
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import connectDB from '../backend/src/config/database.js';
import { errorHandler, notFound } from '../backend/src/middleware/errorHandler.js';
import { apiLimiter, authLimiter, paymentLimiter } from '../backend/src/middleware/rateLimiter.js';

// Import routes
import authRoutes from '../backend/src/routes/authRoutes.js';
import tournamentRoutes from '../backend/src/routes/tournamentRoutes.js';
import eventRoutes from '../backend/src/routes/eventRoutes.js';
import poolRoutes from '../backend/src/routes/poolRoutes.js';
import teamRoutes from '../backend/src/routes/teamRoutes.js';
import matchRoutes from '../backend/src/routes/matchRoutes.js';
import playoffRoutes from '../backend/src/routes/playoffRoutes.js';
import invitationRoutes from '../backend/src/routes/invitationRoutes.js';
import paymentRoutes from '../backend/src/routes/paymentRoutes.js';
import stripeConnectRoutes from '../backend/src/routes/stripeConnectRoutes.js';
import analyticsRoutes from '../backend/src/routes/analyticsRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy - Vercel runs behind a proxy
app.set('trust proxy', 1);

// Connect to MongoDB (connection pooling for serverless)
let isConnected = false;
const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }
  try {
    await connectDB();
    isConnected = true;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(mongoSanitize());
app.use(xss());

// Health check
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Pickle Rally API - Serverless',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api', apiLimiter); // Apply general rate limiting to all API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/stripe/connect', stripeConnectRoutes);
app.use('/api/analytics', analyticsRoutes);

// Nested routes (must come before standalone routes)
app.use('/api/tournaments/:tournamentId/events', eventRoutes);
app.use('/api/events/:eventId/pools', poolRoutes);
app.use('/api/events/:eventId/teams', teamRoutes);
app.use('/api/events/:eventId/playoffs', playoffRoutes);
app.use('/api/pools/:poolId/matches', matchRoutes);
app.use('/api/teams/:teamId/invitations', invitationRoutes);

// Standalone routes for direct access
app.use('/api/events', eventRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/invitations', invitationRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Vercel serverless function export
export default async (req, res) => {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
};

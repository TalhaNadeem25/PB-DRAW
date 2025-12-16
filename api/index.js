// Vercel Serverless Function Handler
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from '../backend/src/config/database.js';
import { errorHandler, notFound } from '../backend/src/middleware/errorHandler.js';

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

// Load environment variables
dotenv.config();

const app = express();

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

// Health check
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Pickle Rally API - Serverless',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/playoffs', playoffRoutes);
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

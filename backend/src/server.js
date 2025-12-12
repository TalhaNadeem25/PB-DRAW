import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import poolRoutes from './routes/poolRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import playoffRoutes from './routes/playoffRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // HTTP request logger

// API Routes
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Pickle Rally API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tournaments: '/api/tournaments',
      events: '/api/events',
      pools: '/api/pools',
      teams: '/api/teams',
      matches: '/api/matches'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);

// Nested routes
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

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🎾 Pickle Rally Backend is ready!\n`);
});

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter, paymentLimiter, createLimiter } from './middleware/rateLimiter.js';

// Load environment variables
dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required but not set');
}

// Import routes
import authRoutes from './routes/authRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import poolRoutes from './routes/poolRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import playoffRoutes from './routes/playoffRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import stripeConnectRoutes from './routes/stripeConnectRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import waitlistRoutes, { userWaitlistRouter } from './routes/waitlistRoutes.js';
import checkInRoutes from './routes/checkInRoutes.js';
import aiPlannerRoutes from './routes/aiPlannerRoutes.js';
import cancellationRoutes from './routes/cancellationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
// import partnerRoutes from './routes/partnerRoutes.js'; // disabled: Find Partner removed for now
import communicationRoutes from './routes/communicationRoutes.js';
import courtRoutes from './routes/courtRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import testDataRoutes from './routes/testDataRoutes.js';
import leagueRoutes from './routes/leagueRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { assignMatchToCourt } from './controllers/courtController.js';
import { handleStripeWebhook } from './controllers/webhookController.js';
import { startWaitlistExpirationJob } from './jobs/waitlistExpirationJob.js';
import { startClubGameReminderJob } from './jobs/clubGameReminderJob.js';

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Allowed origins: web frontend + Capacitor mobile apps
const allowedOrigins = [
  'https://www.pbdraw.com',
  'https://pbdraw.com',
  process.env.CLIENT_URL,
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
  'http://localhost:8080',
  'http://localhost:5173',
].filter(Boolean);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
// Stripe webhook needs the raw request body to verify its signature, so it's
// registered before the global JSON body parser (which would otherwise consume it).
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // HTTP request logger

// Security middleware
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

// Rate limiting - apply to all API routes
app.use('/api', apiLimiter);

// API Routes
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to PB Draw API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tournaments: '/api/tournaments',
      events: '/api/events',
      pools: '/api/pools',
      teams: '/api/teams',
      matches: '/api/matches',
      payments: '/api/payments',
      analytics: '/api/analytics',
      checkIn: '/api/check-in',
      waitlist: '/api/events/:eventId/waitlist'
    }
  });
});

// Apply specific rate limiters to sensitive routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/stripe/connect', stripeConnectRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/check-in', checkInRoutes);
app.use('/api/ai-planner', aiPlannerRoutes);
app.use('/api/cancellations', cancellationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/newsletter', newsletterRoutes);
// app.use('/api/partners', partnerRoutes); // disabled: Find Partner removed for now
app.use('/api/stats', statsRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/court-management', courtRoutes);
app.use('/api', testDataRoutes);

// Nested routes
app.use('/api/tournaments/:tournamentId/events', eventRoutes);
app.use('/api/events/:eventId/pools', poolRoutes);
app.use('/api/events/:eventId/teams', teamRoutes);
app.use('/api/events/:eventId/playoffs', playoffRoutes);
app.use('/api/events/:eventId/waitlist', waitlistRoutes);
app.use('/api/waitlist', userWaitlistRouter);
app.use('/api/pools/:poolId/matches', matchRoutes);
app.use('/api/teams/:teamId/invitations', invitationRoutes);

// Standalone routes for direct access
app.use('/api/events', eventRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/invitations', invitationRoutes);

// Match court assignment (needs special handling)
import { protect, authorize } from './middleware/auth.js';
app.put('/api/matches/:id/assign-court', protect, authorize('organizer', 'admin'), assignMatchToCourt);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Join tournament room
  socket.on('join-tournament', (tournamentId) => {
    socket.join(`tournament:${tournamentId}`);
    console.log(`📺 Socket ${socket.id} joined tournament:${tournamentId}`);
  });

  // Leave tournament room
  socket.on('leave-tournament', (tournamentId) => {
    socket.leave(`tournament:${tournamentId}`);
    console.log(`👋 Socket ${socket.id} left tournament:${tournamentId}`);
  });

  // Join match room
  socket.on('join-match', (matchId) => {
    socket.join(`match:${matchId}`);
    console.log(`🏓 Socket ${socket.id} joined match:${matchId}`);
  });

  // Leave match room
  socket.on('leave-match', (matchId) => {
    socket.leave(`match:${matchId}`);
    console.log(`👋 Socket ${socket.id} left match:${matchId}`);
  });

  // Join user room (for personal notifications)
  socket.on('join-user', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`👤 Socket ${socket.id} joined user:${userId}`);
  });

  // Join club room (for live chat)
  socket.on('join-club', (clubId) => {
    socket.join(`club:${clubId}`);
    console.log(`💬 Socket ${socket.id} joined club:${clubId}`);
  });

  // Leave club room
  socket.on('leave-club', (clubId) => {
    socket.leave(`club:${clubId}`);
    console.log(`👋 Socket ${socket.id} left club:${clubId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO ready for connections`);
  console.log(`🎾 PB Draw Backend is ready!\n`);

  // Start cron jobs
  startWaitlistExpirationJob();
  startClubGameReminderJob(io);
});

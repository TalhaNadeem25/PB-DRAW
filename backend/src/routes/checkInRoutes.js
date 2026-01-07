import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect, authorize } from '../middleware/auth.js';
import {
  scanQRCode,
  getTicketDetails,
  getMyTickets,
  manualCheckIn
} from '../controllers/checkInController.js';

const router = express.Router();

// Rate limiter for QR scanning (prevent brute force)
const scanRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    message: 'Too many scan attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// QR code scanning (organizer only)
router.post('/scan', protect, authorize('organizer', 'admin'), scanRateLimiter, scanQRCode);

// Manual check-in (organizer only)
router.post('/manual', protect, authorize('organizer', 'admin'), manualCheckIn);

// Get ticket details
router.get('/ticket/:ticketCode', protect, getTicketDetails);

// Get my tickets
router.get('/my-tickets', protect, getMyTickets);

export default router;

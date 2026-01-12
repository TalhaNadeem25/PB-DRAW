import express from 'express';
import {
  requestCancellation,
  respondToPartnerCancellation,
  getMyCancellations,
  calculateRefundPreview,
  getTournamentCancellations
} from '../controllers/cancellationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/events/:eventId/cancel', protect, requestCancellation);
router.get('/events/:eventId/refund-preview', protect, calculateRefundPreview);
router.get('/my-cancellations', protect, getMyCancellations);
router.post('/:cancellationId/partner-response', protect, respondToPartnerCancellation);

// Admin routes
router.get('/tournaments/:tournamentId', protect, authorize('organizer', 'admin'), getTournamentCancellations);

export default router;

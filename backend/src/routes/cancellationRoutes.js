import express from 'express';
import {
  requestCancellation,
  respondToPartnerCancellation,
  getMyCancellations,
  calculateRefundPreview,
  getTournamentCancellations,
  organizerRefundPayment,
  bulkRefundTournament,
} from '../controllers/cancellationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/events/:eventId/cancel', protect, requestCancellation);
router.get('/events/:eventId/refund-preview', protect, calculateRefundPreview);
router.get('/my-cancellations', protect, getMyCancellations);
router.post('/:cancellationId/partner-response', protect, respondToPartnerCancellation);

// Organizer/Admin routes
router.get('/tournaments/:tournamentId', protect, authorize('organizer', 'admin'), getTournamentCancellations);
router.post('/organizer-refund/:paymentId', protect, authorize('organizer', 'admin'), organizerRefundPayment);
router.post('/tournaments/:tournamentId/bulk-refund', protect, authorize('organizer', 'admin'), bulkRefundTournament);

export default router;

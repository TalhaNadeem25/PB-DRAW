import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPayment,
  getMyPayments,
  refundPayment
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes (none for payments)

// Protected routes
router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);
router.get('/my-payments', protect, getMyPayments);
router.get('/:id', protect, getPayment);

// Admin/Organizer routes
router.post('/:id/refund', protect, authorize('organizer', 'admin'), refundPayment);

export default router;

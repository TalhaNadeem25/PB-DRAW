import express from 'express';
import {
  createConnectAccountLink,
  getConnectAccountStatus,
  createDashboardLink,
  disconnectAccount
} from '../controllers/stripeConnectController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Onboard - only organizers and admins can onboard
router.post('/onboard', authorize('organizer', 'admin'), createConnectAccountLink);

// Status - any authenticated user can check status
router.get('/status', getConnectAccountStatus);

// Dashboard link - any user with connected account
router.get('/dashboard', createDashboardLink);

// Disconnect - any user can disconnect their account
router.delete('/disconnect', disconnectAccount);

export default router;

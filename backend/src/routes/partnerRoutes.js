import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAvailablePlayers,
  sendPartnerRequest,
  getReceivedRequests,
  getSentRequests,
  respondToRequest,
  cancelRequest,
  updatePartnerPreference
} from '../controllers/partnerController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get available players
router.get('/players', getAvailablePlayers);

// Partner requests
router.post('/requests', sendPartnerRequest);
router.get('/requests/received', getReceivedRequests);
router.get('/requests/sent', getSentRequests);
router.put('/requests/:id/respond', respondToRequest);
router.delete('/requests/:id', cancelRequest);

// Partner preference
router.put('/preference', updatePartnerPreference);

export default router;

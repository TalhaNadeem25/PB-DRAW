import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  joinWaitlist,
  getWaitlistPosition,
  leaveWaitlist,
  getEventWaitlist,
  approveWaitlistEntry
} from '../controllers/waitlistController.js';

const router = express.Router({ mergeParams: true }); // mergeParams to access :eventId

// Public waitlist routes (require authentication)
router.post('/', protect, joinWaitlist);
router.get('/my-position', protect, getWaitlistPosition);
router.delete('/', protect, leaveWaitlist);

// Admin/Organizer routes
router.get('/all', protect, authorize('organizer', 'admin'), getEventWaitlist);
router.post('/:waitlistId/approve', protect, authorize('organizer', 'admin'), approveWaitlistEntry);

export default router;

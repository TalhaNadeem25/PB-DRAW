import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  joinWaitlist,
  getWaitlistPosition,
  leaveWaitlist,
  getEventWaitlist,
  approveWaitlistEntry,
  getMyWaitlistEntries
} from '../controllers/waitlistController.js';

// Event-scoped router (mounted at /api/events/:eventId/waitlist)
const router = express.Router({ mergeParams: true });

router.post('/', protect, joinWaitlist);
router.get('/my-position', protect, getWaitlistPosition);
router.delete('/', protect, leaveWaitlist);

router.get('/all', protect, authorize('organizer', 'admin'), getEventWaitlist);
router.post('/:waitlistId/approve', protect, authorize('organizer', 'admin'), approveWaitlistEntry);

// Top-level user router (mounted at /api/waitlist)
export const userWaitlistRouter = express.Router();
userWaitlistRouter.get('/my-entries', protect, getMyWaitlistEntries);

export default router;

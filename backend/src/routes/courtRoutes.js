import express from 'express';
import {
  getCourtConfiguration,
  updateCourtConfiguration,
  getScheduleGrid,
  assignMatchToCourt,
  autoScheduleMatches,
  checkConflicts,
  clearSchedule
} from '../controllers/courtController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and organizer/admin role
router.use(protect);
router.use(authorize('organizer', 'admin'));

// Tournament court routes
router.get('/:id/courts', getCourtConfiguration);
router.put('/:id/courts', updateCourtConfiguration);
router.get('/:id/schedule-grid', getScheduleGrid);
router.post('/:id/auto-schedule', autoScheduleMatches);
router.post('/:id/check-conflicts', checkConflicts);
router.delete('/:id/clear-schedule', clearSchedule);

export default router;

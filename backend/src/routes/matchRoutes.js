import express from 'express';
import {
  getMatches,
  getMatch,
  updateMatchScore,
  updateMatch,
  checkInMatch,
  markNoShow
} from '../controllers/matchController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.get('/', getMatches);
router.get('/:id', getMatch);
router.put('/:id/score', protect, authorize('organizer', 'admin'), updateMatchScore);
router.put('/:id', protect, authorize('organizer', 'admin'), updateMatch);
router.post('/:id/check-in', protect, checkInMatch);
router.post('/:id/no-show', protect, authorize('organizer', 'admin'), markNoShow);

export default router;

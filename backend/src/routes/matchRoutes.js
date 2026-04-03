import express from 'express';
import {
  getMatches,
  getMatch,
  updateMatchScore,
  updateMatch,
  checkInMatch,
  markNoShow,
  submitPlayerScore,
  resolveDisputedScore
} from '../controllers/matchController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.get('/', getMatches);
router.get('/:id', getMatch);
router.put('/:id/score', protect, authorize('organizer', 'admin'), updateMatchScore);
router.put('/:id', protect, authorize('organizer', 'admin'), updateMatch);
router.post('/:id/check-in', protect, checkInMatch);
router.post('/:id/no-show', protect, authorize('organizer', 'admin'), markNoShow);
router.post('/:id/player-score', protect, submitPlayerScore);
router.post('/:id/resolve-dispute', protect, resolveDisputedScore);

export default router;

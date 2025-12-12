import express from 'express';
import {
  getMatches,
  getMatch,
  updateMatchScore,
  updateMatch
} from '../controllers/matchController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.get('/', getMatches);
router.get('/:id', getMatch);
router.put('/:id/score', protect, authorize('organizer', 'admin'), updateMatchScore);
router.put('/:id', protect, authorize('organizer', 'admin'), updateMatch);

export default router;

import express from 'express';
import {
  getAIPlannerSuggestions,
  applyAISuggestions
} from '../controllers/aiPlannerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.post('/:tournamentId/chat', protect, authorize('organizer', 'admin'), getAIPlannerSuggestions);
router.post('/:tournamentId/apply', protect, authorize('organizer', 'admin'), applyAISuggestions);

export default router;

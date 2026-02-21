import express from 'express';
import {
  generatePlayoffs,
  getPlayoffs,
  completePlayoffs,
  getEventPlayoffs,
  generateEventPlayoffs,
  completeEventPlayoffs
} from '../controllers/playoffController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Event-level playoffs (no poolId) – must be before /:poolId
router.get('/', getEventPlayoffs);
router.post('/generate', protect, authorize('organizer', 'admin'), generateEventPlayoffs);
router.post('/complete', protect, authorize('organizer', 'admin'), completeEventPlayoffs);

// Per-pool playoffs (legacy / single-pool)
router.post('/:poolId/generate', protect, authorize('organizer', 'admin'), generatePlayoffs);
router.post('/:poolId/complete', protect, authorize('organizer', 'admin'), completePlayoffs);
router.get('/:poolId', getPlayoffs);

export default router;

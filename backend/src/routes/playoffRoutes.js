import express from 'express';
import { generatePlayoffs, getPlayoffs } from '../controllers/playoffController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.post('/:poolId/generate', protect, authorize('organizer', 'admin'), generatePlayoffs);
router.get('/:poolId', getPlayoffs);

export default router;

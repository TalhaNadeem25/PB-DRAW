import express from 'express';
import {
  getPools,
  getPool,
  createPool,
  addTeamsToPool,
  updatePool,
  deletePool,
  generateSinglesMatches,
  completePoolPlay
} from '../controllers/poolController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.get('/', getPools);
router.get('/:id', getPool);
router.post('/', protect, authorize('organizer', 'admin'), createPool);
router.post('/:id/teams', protect, authorize('organizer', 'admin'), addTeamsToPool);
router.post('/:id/generate-singles-matches', protect, authorize('organizer', 'admin'), generateSinglesMatches);
router.post('/:id/complete-pool-play', protect, authorize('organizer', 'admin'), completePoolPlay);
router.put('/:id', protect, authorize('organizer', 'admin'), updatePool);
router.delete('/:id', protect, authorize('organizer', 'admin'), deletePool);

export default router;

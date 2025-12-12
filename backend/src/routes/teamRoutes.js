import express from 'express';
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.get('/', getTeams);
router.get('/:id', getTeam);
router.post('/', protect, createTeam);
router.put('/:id', protect, updateTeam);
router.delete('/:id', protect, deleteTeam);

export default router;

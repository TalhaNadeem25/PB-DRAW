import express from 'express';
import {
  getTournaments,
  getTournament,
  createTournament,
  updateTournament,
  deleteTournament,
  registerForTournament
} from '../controllers/tournamentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getTournaments);
router.get('/:id', getTournament);
router.post('/', protect, authorize('organizer', 'admin'), createTournament);
router.put('/:id', protect, authorize('organizer', 'admin'), updateTournament);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteTournament);
router.post('/:id/register', protect, registerForTournament);

export default router;

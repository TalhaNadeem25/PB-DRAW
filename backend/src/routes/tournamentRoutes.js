import express from 'express';
import {
  getTournaments,
  getTournament,
  createTournament,
  updateTournament,
  deleteTournament,
  registerForTournament,
  uploadTournamentImage
} from '../controllers/tournamentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.get('/', getTournaments);
router.get('/:id', getTournament);
router.post('/', protect, authorize('organizer', 'admin'), createTournament);
router.put('/:id', protect, authorize('organizer', 'admin'), updateTournament);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteTournament);
router.post('/:id/register', protect, registerForTournament);
router.post('/:id/upload-image', protect, authorize('organizer', 'admin'), upload.single('image'), uploadTournamentImage);

export default router;

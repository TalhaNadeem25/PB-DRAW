import express from 'express';
import {
  sendInvitation,
  getInvitations,
  getInvitation,
  acceptInvitation,
  declineInvitation,
  cancelInvitation
} from '../controllers/invitationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

// Main invitation routes
router.get('/', getInvitations);
router.get('/:id', getInvitation);
router.put('/:id/accept', acceptInvitation);
router.put('/:id/decline', declineInvitation);
router.delete('/:id', cancelInvitation);

// Team-specific invitation route (nested under teams)
router.post('/', sendInvitation);

export default router;

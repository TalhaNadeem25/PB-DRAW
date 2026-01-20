import express from 'express';
import {
  sendBulkMessage,
  previewRecipients,
  getCommunicationHistory,
  getTemplates,
  getCommunication
} from '../controllers/communicationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and organizer/admin role
router.use(protect);
router.use(authorize('organizer', 'admin'));

// Template routes (no tournamentId needed)
router.get('/templates', getTemplates);

// Tournament-specific communication routes
router.post('/:tournamentId/send', sendBulkMessage);
router.post('/:tournamentId/preview', previewRecipients);
router.get('/:tournamentId/history', getCommunicationHistory);

// Single communication details
router.get('/:id', getCommunication);

export default router;

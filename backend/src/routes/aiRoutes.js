import express from 'express';
import { picklixChat } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/chat', protect, authorize('organizer', 'admin'), picklixChat);

export default router;

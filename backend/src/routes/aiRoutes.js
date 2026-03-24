import express from 'express';
import { pbdrawChat } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/chat', protect, pbdrawChat);

export default router;

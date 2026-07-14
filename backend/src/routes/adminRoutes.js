import express from 'express';
import { protect, requireSuperAdmin } from '../middleware/auth.js';
import { searchUsers, sendPlatformNotification } from '../controllers/adminController.js';

const router = express.Router();

router.use(protect);
router.use(requireSuperAdmin);

router.get('/users/search', searchUsers);
router.post('/notifications/send', sendPlatformNotification);

export default router;

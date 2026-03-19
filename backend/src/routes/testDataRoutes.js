import express from 'express';
import { generateTestData, clearTestData } from '../controllers/testDataController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/tournaments/:tournamentId/test-data', protect, authorize('organizer', 'admin'), generateTestData);
router.delete('/tournaments/:tournamentId/test-data', protect, authorize('organizer', 'admin'), clearTestData);

export default router;

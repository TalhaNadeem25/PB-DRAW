import express from 'express';
import { generateTestData, clearTestData, generateLeagueTestData, clearLeagueTestData } from '../controllers/testDataController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/tournaments/:tournamentId/test-data', protect, authorize('organizer', 'admin'), generateTestData);
router.delete('/tournaments/:tournamentId/test-data', protect, authorize('organizer', 'admin'), clearTestData);

router.post('/leagues/:leagueId/test-data', protect, authorize('organizer', 'admin'), generateLeagueTestData);
router.delete('/leagues/:leagueId/test-data', protect, authorize('organizer', 'admin'), clearLeagueTestData);

export default router;

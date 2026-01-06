import express from 'express';
import {
  getOrganizationAnalytics,
  exportAnalyticsCSV,
  exportAnalyticsPDF
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and organizer/admin role
router.get(
  '/organization/:userId',
  protect,
  authorize('organizer', 'admin'),
  getOrganizationAnalytics
);

router.get(
  '/organization/:userId/export/csv',
  protect,
  authorize('organizer', 'admin'),
  exportAnalyticsCSV
);

router.get(
  '/organization/:userId/export/pdf',
  protect,
  authorize('organizer', 'admin'),
  exportAnalyticsPDF
);

export default router;

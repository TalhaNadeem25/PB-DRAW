import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  registerDeviceToken,
  unregisterDeviceToken
} from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all notifications for current user
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark single notification as read
router.patch('/:id/read', markAsRead);

// Mark all as read
router.patch('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

// Delete all read notifications
router.delete('/read', deleteReadNotifications);

// Register / unregister this device's push token
router.post('/device-token', registerDeviceToken);
router.delete('/device-token', unregisterDeviceToken);

export default router;

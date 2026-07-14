import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { notifyPlayer } from '../utils/socket.js';
import { sendPushToUser, sendPushToUsers } from '../utils/pushNotifications.js';

// Get notifications for current user
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { user: req.user.id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// Get unread count only
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user.id, read: false });
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

// Delete all read notifications
export const deleteReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ user: req.user.id, read: true });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Delete read notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notifications' });
  }
};

// Create and send notification (utility function for other controllers)
export const createNotification = async (io, userId, notificationData) => {
  try {
    const notification = await Notification.create({
      user: userId,
      ...notificationData
    });

    // Send real-time notification via socket
    notifyPlayer(io, userId.toString(), {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      createdAt: notification.createdAt
    });

    // Push to the user's registered devices. Best-effort — a push failure
    // shouldn't fail whatever action (refund, waitlist promotion, etc.) triggered this.
    sendPushToUser(userId, {
      title: notification.title,
      body: notification.message,
      data: notification.data
    }).catch((error) => console.error('Push notification error:', error));

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Batch create notifications for multiple users
export const createBatchNotifications = async (io, userIds, notificationData) => {
  try {
    const notifications = await Notification.insertMany(
      userIds.map(userId => ({
        user: userId,
        ...notificationData
      }))
    );

    // Send real-time notifications
    userIds.forEach(userId => {
      notifyPlayer(io, userId.toString(), {
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data
      });
    });

    sendPushToUsers(userIds, {
      title: notificationData.title,
      body: notificationData.message,
      data: notificationData.data
    }).catch((error) => console.error('Push notification error:', error));

    return notifications;
  } catch (error) {
    console.error('Batch create notifications error:', error);
    throw error;
  }
};

// Register (or refresh) a device's push token for the current user
export const registerDeviceToken = async (req, res) => {
  try {
    const { token, platform } = req.body;
    if (!token || !['ios', 'android'].includes(platform)) {
      return res.status(400).json({ success: false, message: 'token and platform (ios|android) are required' });
    }

    // A token can only belong to one account at a time — strip it from any
    // other user first (e.g. a shared device that logged into a new account).
    await User.updateMany(
      { _id: { $ne: req.user.id }, 'deviceTokens.token': token },
      { $pull: { deviceTokens: { token } } }
    );

    await User.updateOne({ _id: req.user.id }, { $pull: { deviceTokens: { token } } });
    await User.updateOne(
      { _id: req.user.id },
      { $push: { deviceTokens: { token, platform, addedAt: new Date() } } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Register device token error:', error);
    res.status(500).json({ success: false, message: 'Failed to register device token' });
  }
};

// Unregister a device's push token (e.g. on logout)
export const unregisterDeviceToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'token is required' });
    }

    await User.updateOne({ _id: req.user.id }, { $pull: { deviceTokens: { token } } });

    res.json({ success: true });
  } catch (error) {
    console.error('Unregister device token error:', error);
    res.status(500).json({ success: false, message: 'Failed to unregister device token' });
  }
};

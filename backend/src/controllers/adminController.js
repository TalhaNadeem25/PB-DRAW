import User from '../models/User.js';
import { createNotification, createBatchNotifications } from './notificationController.js';
import { sendAdminAnnouncementEmail } from '../services/emailService.js';

// Look up users by name/email for the "send to one person" target picker
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name email role')
      .limit(10)
      .lean();

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Admin search users error:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
};

// Send a platform-wide announcement to one user or every user, over email
// and/or push+in-app notification.
export const sendPlatformNotification = async (req, res) => {
  try {
    const { target, userId, title, message, channels = [] } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }
    if (!['single', 'all'].includes(target)) {
      return res.status(400).json({ success: false, message: 'target must be "single" or "all"' });
    }
    if (target === 'single' && !userId) {
      return res.status(400).json({ success: false, message: 'userId is required when target is "single"' });
    }
    const sendEmail = channels.includes('email');
    const sendPush = channels.includes('push');
    if (!sendEmail && !sendPush) {
      return res.status(400).json({ success: false, message: 'Select at least one channel (email or push)' });
    }

    const recipients = target === 'single'
      ? await User.find({ _id: userId }).select('_id name email').lean()
      : await User.find({ isActive: true }).select('_id name email').lean();

    if (recipients.length === 0) {
      return res.status(404).json({ success: false, message: 'No matching recipients found' });
    }

    const io = req.app.get('io');

    if (sendPush) {
      const notificationData = { type: 'general', title, message, data: { actionUrl: '/dashboard' } };
      if (recipients.length === 1) {
        await createNotification(io, recipients[0]._id, notificationData);
      } else {
        await createBatchNotifications(io, recipients.map(r => r._id), notificationData);
      }
    }

    let emailSuccessCount = 0;
    let emailFailedCount = 0;
    if (sendEmail) {
      const batchSize = 20;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        await Promise.all(batch.map(async (recipient) => {
          try {
            await sendAdminAnnouncementEmail({ to: recipient.email, name: recipient.name, subject: title, message });
            emailSuccessCount++;
          } catch (error) {
            console.error(`Failed to send admin announcement to ${recipient.email}:`, error);
            emailFailedCount++;
          }
        }));
      }
    }

    res.json({
      success: true,
      message: `Sent to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`,
      data: { recipientCount: recipients.length, emailSuccessCount, emailFailedCount, channels }
    });
  } catch (error) {
    console.error('Send platform notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
};

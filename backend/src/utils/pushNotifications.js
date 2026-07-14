import { getMessaging } from 'firebase-admin/messaging';
import { getFirebaseApp } from '../config/firebase.js';
import User from '../models/User.js';

// Registration tokens FCM reports as dead — strip them from the user's
// deviceTokens array so we stop retrying them on every future notification.
const isDeadTokenError = (code) =>
  code === 'messaging/registration-token-not-registered' ||
  code === 'messaging/invalid-registration-token';

// Sends a push notification to every device registered for a user. Silently
// no-ops if Firebase isn't configured or the user has no device tokens —
// callers (createNotification, createBatchNotifications) fire this
// alongside the in-app notification and shouldn't fail the request over it.
export const sendPushToUser = async (userId, { title, body, data }) => {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return;

  const user = await User.findById(userId).select('deviceTokens').lean();
  if (!user?.deviceTokens?.length) return;

  const messaging = getMessaging(firebaseApp);
  const deadTokens = [];

  await Promise.all(user.deviceTokens.map(async ({ token }) => {
    try {
      await messaging.send({
        token,
        notification: { title, body },
        // FCM data payloads must be flat string maps
        data: Object.fromEntries(
          Object.entries(data || {}).map(([k, v]) => [k, String(v ?? '')])
        ),
        apns: { payload: { aps: { sound: 'default' } } },
        android: { priority: 'high' }
      });
    } catch (error) {
      if (isDeadTokenError(error.code)) {
        deadTokens.push(token);
      } else {
        console.error('Push send error:', error.message);
      }
    }
  }));

  if (deadTokens.length) {
    await User.updateOne(
      { _id: userId },
      { $pull: { deviceTokens: { token: { $in: deadTokens } } } }
    );
  }
};

export const sendPushToUsers = async (userIds, payload) => {
  await Promise.all(userIds.map((userId) => sendPushToUser(userId, payload)));
};

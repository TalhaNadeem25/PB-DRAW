import { Capacitor } from '@capacitor/core';
import { PushNotifications, type Token, type PushNotificationSchema, type ActionPerformed } from '@capacitor/push-notifications';
import api from '@/services/api';

let listenersRegistered = false;

let onNotificationTapped: ((url: string) => void) | null = null;
export function setOnNotificationTapped(fn: ((url: string) => void) | null) {
  onNotificationTapped = fn;
}

const platform = () => (Capacitor.getPlatform() === 'ios' ? 'ios' : 'android');

const registerTokenWithBackend = async (token: string) => {
  try {
    await api.post('/notifications/device-token', { token, platform: platform() });
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
};

// Called once the user is authenticated (native platforms only). Requests
// permission, registers with APNs/FCM, and forwards the resulting token to
// the backend so it can be used to send pushes for this user's account.
export const initPushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return;

  if (!listenersRegistered) {
    listenersRegistered = true;

    PushNotifications.addListener('registration', (token: Token) => {
      registerTokenWithBackend(token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received in foreground:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      const actionUrl = action.notification.data?.actionUrl;
      if (actionUrl && typeof actionUrl === 'string' && onNotificationTapped) {
        onNotificationTapped(actionUrl);
      }
    });
  }

  try {
    const permStatus = await PushNotifications.checkPermissions();
    console.log('[push] checkPermissions:', permStatus.receive);
    let granted = permStatus.receive === 'granted';

    // 'prompt-with-rationale' (Android, after a prior soft-decline) also needs
    // a fresh request — only 'denied' and 'granted' are terminal states.
    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      const result = await PushNotifications.requestPermissions();
      console.log('[push] requestPermissions result:', result.receive);
      granted = result.receive === 'granted';
    }

    if (granted) {
      await PushNotifications.register();
      console.log('[push] register() called');
    } else {
      console.log('[push] permission not granted, skipping register()');
    }
  } catch (error) {
    // Without this, any native-side failure here (plugin not linked, a
    // thrown error from checkPermissions/requestPermissions/register) fails
    // completely silently — no prompt, no log, nothing visible to debug from.
    console.error('[push] initPushNotifications failed:', error);
  }
};

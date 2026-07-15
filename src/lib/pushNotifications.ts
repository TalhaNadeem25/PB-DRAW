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

  const permStatus = await PushNotifications.checkPermissions();
  let granted = permStatus.receive === 'granted';

  if (permStatus.receive === 'prompt') {
    const result = await PushNotifications.requestPermissions();
    granted = result.receive === 'granted';
  }

  if (granted) {
    await PushNotifications.register();
  }
};

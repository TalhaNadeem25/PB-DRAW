import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = () => Capacitor.isNativePlatform();

export const haptics = {
  // Light tap — buttons, nav items
  light: () => {
    if (!isNative()) return;
    Haptics.impact({ style: ImpactStyle.Light });
  },
  // Medium — confirming actions, selections
  medium: () => {
    if (!isNative()) return;
    Haptics.impact({ style: ImpactStyle.Medium });
  },
  // Heavy — destructive actions, errors
  heavy: () => {
    if (!isNative()) return;
    Haptics.impact({ style: ImpactStyle.Heavy });
  },
  // Success — registration complete, payment done
  success: () => {
    if (!isNative()) return;
    Haptics.notification({ type: NotificationType.Success });
  },
  // Error — failed login, network error
  error: () => {
    if (!isNative()) return;
    Haptics.notification({ type: NotificationType.Error });
  },
  // Warning
  warning: () => {
    if (!isNative()) return;
    Haptics.notification({ type: NotificationType.Warning });
  },
};

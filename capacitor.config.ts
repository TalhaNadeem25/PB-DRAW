import type { CapacitorConfig } from '@capacitor/cli';

// Set CAPACITOR_LIVE_RELOAD=true when you want to point the app at your local dev server
const useLiveReload = process.env.CAPACITOR_LIVE_RELOAD === 'true';
const devServerIP = '192.168.1.141'; // Your computer's IP
const devServerPort = '8080'; // Vite dev server port
const productionUrl = 'https://www.pbdraw.com';

const config: CapacitorConfig = {
  appId: 'com.pbdraw.app',
  appName: 'PB Draw',
  webDir: 'dist',
  server: useLiveReload
    ? {
        // Development: Connect to Vite dev server for live reload
        url: `http://${devServerIP}:${devServerPort}`,
        cleartext: true
      }
    : undefined,
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#1F4A2E',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1F4A2E'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  }
};

export default config;

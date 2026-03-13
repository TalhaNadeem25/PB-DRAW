import type { CapacitorConfig } from '@capacitor/cli';

// Set CAPACITOR_LIVE_RELOAD=true when you want to point the app at your local dev server
const useLiveReload = process.env.CAPACITOR_LIVE_RELOAD === 'true';
const devServerIP = '192.168.1.141'; // Your computer's IP
const devServerPort = '8080'; // Vite dev server port
const productionUrl = 'https://pickletournaments.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.picklerally.app',
  appName: 'Picklix',
  webDir: 'dist',
  server: useLiveReload
    ? {
        // Development: Connect to Vite dev server for live reload
        url: `http://${devServerIP}:${devServerPort}`,
        cleartext: true
      }
    : {
        // Production: Load from deployed app on Vercel
        url: productionUrl,
        cleartext: false
      },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#16a34a', // Green theme color
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#16a34a'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  }
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

// Set to true for live reload during development
const useLiveReload = true;
const devServerIP = '192.168.1.141'; // Your computer's IP
const devServerPort = '8080'; // Vite dev server port

const config: CapacitorConfig = {
  appId: 'com.picklerally.app',
  appName: 'Pickle Rally',
  webDir: 'dist',
  server: useLiveReload ? {
    // Development: Connect to Vite dev server for live reload
    url: `http://${devServerIP}:${devServerPort}`,
    cleartext: true
  } : {
    // Production: Use bundled assets
    androidScheme: 'https'
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

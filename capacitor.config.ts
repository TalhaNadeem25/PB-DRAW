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
    },
    GoogleAuth: {
      // Web OAuth client ID — used as the fallback/common clientId so the
      // returned token's audience matches what the backend already verifies
      // (see main.tsx's GoogleOAuthProvider clientId). The separate
      // Android-type OAuth client (package name + SHA-1 fingerprint) only
      // needs to exist in Google Cloud Console; it's never referenced here.
      clientId: '498337994484-ph3f3ps676q6jp3m3of8nh1jbcs8v6ep.apps.googleusercontent.com',
      // iOS-type OAuth client (bundle ID com.pbdraw.app-). iOS needs its own
      // client ID because the native SDK derives the OAuth redirect's custom
      // URL scheme (registered in Info.plist) from it.
      iosClientId: '498337994484-qupofvq6ldqho73htkq2urmjc6etppte.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
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

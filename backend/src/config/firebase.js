import { initializeApp, cert } from 'firebase-admin/app';

let app = null;
let initAttempted = false;

// Lazily initializes the Firebase Admin app from env vars. Returns null (and
// logs once) if the credentials aren't configured, so push sending can no-op
// gracefully instead of crashing the request that triggered a notification.
export const getFirebaseApp = () => {
  if (app) return app;
  if (initAttempted) return null;
  initAttempted = true;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('Firebase not configured (FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY missing) — push notifications disabled');
    return null;
  }

  try {
    app = initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // Env vars store literal "\n" sequences instead of real newlines
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    return app;
  } catch (error) {
    console.error('Firebase init error:', error);
    return null;
  }
};

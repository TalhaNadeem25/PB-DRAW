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
    let privateKey = FIREBASE_PRIVATE_KEY.trim();
    // Dashboard env var UIs (e.g. Vercel) don't strip surrounding quotes the
    // way a .env file parser does — if the value was pasted with them, they
    // end up as literal characters and break PEM parsing.
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    // Env vars store literal "\n" sequences instead of real newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    app = initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey
      })
    });
    return app;
  } catch (error) {
    console.error('Firebase init error:', error);
    return null;
  }
};

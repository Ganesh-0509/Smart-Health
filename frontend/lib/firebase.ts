// Firebase initialisation with graceful demo-mode fallback.
//
// If the NEXT_PUBLIC_FIREBASE_* env vars are NOT set, we DO NOT initialise
// Firebase: `firebaseEnabled` is false and `auth` is null, so the app runs
// fine with zero Firebase config (demo mode). This module never throws at
// import time.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// We only consider Firebase "configured" when the minimum required vars exist.
export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let analytics: Analytics | null = null;

if (firebaseEnabled) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();

    // Analytics is browser-only and free. Init lazily and defensively so it
    // never runs during SSR / static export and never breaks the app.
    if (typeof window !== "undefined" && firebaseConfig.measurementId) {
      import("firebase/analytics")
        .then(({ getAnalytics, isSupported }) =>
          isSupported().then((ok) => {
            if (ok && app) analytics = getAnalytics(app);
          }),
        )
        .catch(() => {
          /* analytics is best-effort; ignore failures */
        });
    }
  } catch (err) {
    // Never break the app if Firebase init fails — fall back to demo mode.
    if (typeof console !== "undefined") {
      // eslint-disable-next-line no-console
      console.warn("[firebase] init failed, running in demo mode", err);
    }
    app = null;
    auth = null;
    googleProvider = null;
    analytics = null;
  }
}

export { app, auth, googleProvider, analytics };

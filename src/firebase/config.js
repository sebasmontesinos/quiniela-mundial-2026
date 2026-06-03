import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'local-dev-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fixture-mundial-2026.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fixture-mundial-2026',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fixture-mundial-2026.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:localdev',
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

/** En local usamos emuladores; el login debe ir por redirect (no popup). */
export const usingAuthEmulator = isLocalhost;

if (isLocalhost && !globalThis.__FIREBASE_EMULATORS_CONNECTED__) {
  // Mismo host que la app (localhost) para evitar "No matching frame" en el emulador.
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  globalThis.__FIREBASE_EMULATORS_CONNECTED__ = true;
}

export { app, auth, db };

// src/firebase.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  connectAuthEmulator
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator
} from 'firebase/firestore';
import {
  getStorage,
  connectStorageEmulator
} from 'firebase/storage';

const firebaseConfig = {
  apiKey:             import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain:         import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId:          import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
  storageBucket:      import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:  import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:              import.meta.env.VITE_APP_FIREBASE_APP_ID,
  measurementId:      import.meta.env.VITE_APP_FIREBASE_MEASUREMENT_ID,
}

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const storage = getStorage(app);

// Conecta ao Auth + Firestore emulador em dev local
if (window.location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

// Exponha no console para debug e testes manuais
if (typeof window !== 'undefined') {
  window._auth   = auth;
  window._storage = storage;
  window._signIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);
}

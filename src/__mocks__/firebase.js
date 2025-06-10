// src/__mocks__/firebase.js
import { vi } from 'vitest'

// Funções de auth mockadas
export const auth = {
  currentUser: { uid: 'test-user-id', email: 'test@example.com' },
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
};

// Firestore mockado
export const db = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      set: vi.fn(),
      get: vi.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
      update: vi.fn(),
      delete: vi.fn(),
    })),
    add: vi.fn(),
    get: vi.fn(),
    where: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ docs: [] })),
    })),
  })),
};

// Storage mockado
export const storage = {
  ref: vi.fn(() => ({
    put: vi.fn(() => Promise.resolve({})),
    getDownloadURL: vi.fn(() => Promise.resolve('https://mock.storage/url')),
  })),
};

// FirebaseApp mockado
export const app = {};

// Funções de inicialização mockadas
export const initializeApp = vi.fn();
export const getAuth = vi.fn(() => auth);
export const getFirestore = vi.fn(() => db);
export const getStorage = vi.fn(() => storage);

// Para imports do SDK modular
export default {
  auth,
  db,
  storage,
  app,
  initializeApp,
  getAuth,
  getFirestore,
  getStorage,
};

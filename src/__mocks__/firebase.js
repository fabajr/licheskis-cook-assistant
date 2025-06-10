// src/__mocks__/firebase.js

// Funções de auth mockadas
export const auth = {
  currentUser: { uid: 'test-user-id', email: 'test@example.com' },
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  onAuthStateChanged: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
};

// Firestore mockado
export const db = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    add: jest.fn(),
    get: jest.fn(),
    where: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ docs: [] })),
    })),
  })),
};

// Storage mockado
export const storage = {
  ref: jest.fn(() => ({
    put: jest.fn(() => Promise.resolve({})),
    getDownloadURL: jest.fn(() => Promise.resolve('https://mock.storage/url')),
  })),
};

// FirebaseApp mockado
export const app = {};

// Funções de inicialização mockadas
export const initializeApp = jest.fn();
export const getAuth = jest.fn(() => auth);
export const getFirestore = jest.fn(() => db);
export const getStorage = jest.fn(() => storage);

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
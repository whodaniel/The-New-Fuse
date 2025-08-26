// Mock Firebase app for build compatibility
// The actual Firebase functionality is bypassed in fallback mode

const app = {
  name: '[DEFAULT]',
  options: {},
  automaticDataCollectionEnabled: false
};

// Mock auth object for build compatibility
export const auth = {
  currentUser: null,
  signInWithEmailAndPassword: () => Promise.resolve({ user: null }),
  signOut: () => Promise.resolve(),
  onAuthStateChanged: () => () => {},
  createUserWithEmailAndPassword: () => Promise.resolve({ user: null })
};

export default app;
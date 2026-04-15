export const STANDARD_PORTS = {
  FRONTEND: 3000,
  API_GATEWAY: 8080,
  BACKEND_API: 3004,
  WEBSOCKET: 3004,
  DATABASE_UI: 5555,
  REDIS: 6379,
  POSTGRES: 5432,
  PREVIEW: 4173,
} as const;

export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Production fallback
  if (typeof window !== 'undefined' && window.location.hostname.includes('ai-arcade.xyz')) {
    return 'https://api.thenewfuse.com/api';
  }

  return `http://localhost:${STANDARD_PORTS.API_GATEWAY}`;
};

export const getWebSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  // Production fallback
  if (typeof window !== 'undefined' && window.location.hostname.includes('ai-arcade.xyz')) {
    return 'wss://api.thenewfuse.com';
  }

  return `ws://localhost:${STANDARD_PORTS.WEBSOCKET}`;
};

export const getRelayUrl = () => {
  if (import.meta.env.VITE_RELAY_URL) {
    return import.meta.env.VITE_RELAY_URL;
  }

  // Production fallback
  if (typeof window !== 'undefined' && window.location.hostname.includes('ai-arcade.xyz')) {
    return 'https://relay.thenewfuse.com';
  }

  return 'http://localhost:3006';
};

// Firebase configuration
export const getFirebaseConfig = () => {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
};

export const config = {
  apiUrl: getApiUrl(),
  webSocketUrl: getWebSocketUrl(),
  relayUrl: getRelayUrl(),
  firebase: getFirebaseConfig(),
};

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
  return !!import.meta.env.VITE_FIREBASE_API_KEY;
};

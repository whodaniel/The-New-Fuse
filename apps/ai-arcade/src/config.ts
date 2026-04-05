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
    return 'https://api-gateway-241337102384.us-central1.run.app/api';
  }

  return `http://localhost:${STANDARD_PORTS.API_GATEWAY}`;
};

export const getWebSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  // Production fallback
  if (typeof window !== 'undefined' && window.location.hostname.includes('ai-arcade.xyz')) {
    return 'wss://api-gateway-241337102384.us-central1.run.app';
  }

  return `ws://localhost:${STANDARD_PORTS.WEBSOCKET}`;
};

export const getRelayUrl = () => {
  if (import.meta.env.VITE_RELAY_URL) {
    return import.meta.env.VITE_RELAY_URL;
  }

  // Production fallback
  if (typeof window !== 'undefined' && window.location.hostname.includes('ai-arcade.xyz')) {
    return 'https://relay-server-241337102384.us-central1.run.app';
  }

  return 'http://localhost:3006';
};

// Supabase configuration
export const getSupabaseConfig = () => {
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
};

export const config = {
  apiUrl: getApiUrl(),
  webSocketUrl: getWebSocketUrl(),
  relayUrl: getRelayUrl(),
  supabase: getSupabaseConfig(),
};

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
};

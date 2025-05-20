declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      DATABASE_URL: string;
      REDIS_URL?: string;
      AUTH_SECRET: string;
      API_KEY?: string;
      VITE_API_URL?: string;
      VITE_WS_URL?: string;
    }
  }
}
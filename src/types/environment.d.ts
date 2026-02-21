// filepath: src/types/environment.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PORT: string;
    DATABASE_URL?: string;
    REDIS_URL?: string;
    OPENAI_API_KEY?: string;
    JWT_SECRET?: string;
    [key: string]: string | undefined;
  }
}
export {};

// Ambient declarations for all external modules

// Auth modules
declare module "@nestjs/passport" {
  export const PassportModule: unknown;
}

declare module "passport-jwt" {
  export const Strategy: unknown;
  export const ExtractJwt: unknown;
}

// Database modules
declare module "@the-new-fuse/database/client" {
  export class PrismaClient {}
}

declare module "@prisma/extension-accelerate" {
  export function withAccelerate(): unknown;
}

// LLM / AI modules
declare module "langchain" {
  export const LLMChain: unknown;
  export const OpenAI: unknown;
  export const PromptTemplate: unknown;
}

// Utility modules
declare module "cron-parser" {
  export function parseExpression(
    expression: string,
    options?: unknown,
  ): unknown;
}

declare module "deep-object-diff" {
  export function diff(a: unknown, b: unknown): unknown;
}

// All other modules with any typing
declare module "*";

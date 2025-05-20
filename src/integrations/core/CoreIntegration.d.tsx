import type { CoreModuleConfig } from "@/types/core";
import { EventEmitter } from "@/utils/EventEmitter";
export declare class CoreIntegration extends EventEmitter {
  private config;
  private initialized;
  constructor(config: CoreModuleConfig);
  initialize(): Promise<void>;
  private initializeSecurity;
  private initializeCaptcha;
  private initializeLogging;
  private setupSecurityMiddleware;
  private setupCaptchaService;
  private setupLogging;
  isInitialized(): boolean;
}

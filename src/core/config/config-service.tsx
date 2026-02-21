// filepath: src/core/config/config-service.ts
import { injectable } from "inversify";
import dotenv from "dotenv";

@injectable()
export class ConfigService {
  private config: Record<string, any> = {};

  constructor() {
    // Load environment variables from .env file
    dotenv.config();
    this.config = { ...process.env };
  }

  get<T>(key: string, defaultValue?: T): T {
    const value = this.config[key];
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new Error(
          `Configuration key ${key} not found and no default value provided`,
        );
      }
      return defaultValue;
    }
    return value as T;
  }

  set(key: string, value: unknown): void {
    this.config[key] = value;
  }

  has(key: string): boolean {
    return key in this.config;
  }

  getAll(): Record<string, any> {
    return { ...this.config };
  }
}

export default ConfigService;
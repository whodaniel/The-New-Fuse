import { Injectable, Logger } from '@nestjs/common';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EnvironmentConfig {
  nodeVersion: string;
  npmVersion: string;
  requiredPorts: number[];
  requiredEnvVars: string[];
}

@Injectable()
export class EnvironmentValidationService {
  private readonly logger = new Logger(EnvironmentValidationService.name);

  async validateEnvironment(config: EnvironmentConfig): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Validate Node.js version
      await this.validateNodeVersion(config.nodeVersion, result);
      
      // Validate npm version
      await this.validateNpmVersion(config.npmVersion, result);
      
      // Validate required ports
      await this.validatePorts(config.requiredPorts, result);
      
      // Validate environment variables
      this.validateEnvironmentVariables(config.requiredEnvVars, result);

      result.isValid = result.errors.length === 0;
      
    } catch (error) {
      this.logger.error('Environment validation failed', error);
      result.errors.push(`Validation error: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  private async validateNodeVersion(requiredVersion: string, result: ValidationResult): Promise<void> {
    const currentVersion = process.version;
    if (currentVersion !== requiredVersion) {
      result.warnings.push(`Node.js version mismatch. Required: ${requiredVersion}, Current: ${currentVersion}`);
    }
  }

  private async validateNpmVersion(requiredVersion: string, result: ValidationResult): Promise<void> {
    // Simulate npm version check
    const currentVersion = '8.0.0'; // Mock version
    if (currentVersion !== requiredVersion) {
      result.warnings.push(`npm version mismatch. Required: ${requiredVersion}, Current: ${currentVersion}`);
    }
  }

  private async validatePorts(ports: number[], result: ValidationResult): Promise<void> {
    for (const port of ports) {
      if (port < 1024 || port > 65535) {
        result.errors.push(`Invalid port number: ${port}`);
      }
    }
  }

  private validateEnvironmentVariables(requiredVars: string[], result: ValidationResult): void {
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        result.errors.push(`Missing required environment variable: ${varName}`);
      }
    }
  }
}
import { Injectable } from "@nestjs/common";
import type {
  ILogger,
  IConfigService,
  IEventBus,
  ICacheService,
} from '../core/di/types.js';
import * as speakeasy from "speakeasy";
import * as qrcode from "qrcode";
import { TimeService } from '../utils/time.service.js';

export interface MFAConfiguration {
  enabled: boolean;
  secret: string;
  backupCodes: string[];
  verifiedAt?: Date;
}

export interface VerificationResult {
  success: boolean;
  message: string;
}

@Injectable()
export class MFAService {
  private readonly verificationTTL: number;
  private readonly serviceName: string;

  constructor(
    private readonly logger: ILogger,
    private readonly config: IConfigService,
    private readonly eventBus: IEventBus,
    private readonly cache: ICacheService,
    private readonly time: TimeService,
  ) {
    this.verificationTTL = this.config.get<number>(
      "mfa.verificationTTL",
      300,
    ); // 5 minutes
    this.serviceName = this.config.get<string>(
      "app.name",
      "The New Fuse",
    );
  }

  async generateSetupToken(userId: string): Promise<{
    secret: string;
    otpAuthUrl: string;
    qrCode: string;
    expiresAt: Date;
  }> {
    // Generate a secret key for the user
    const secret = speakeasy.generateSecret({
      name: `${this.serviceName}:${userId}`,
      length: 32,
    });

    // Generate QR code
    const qrCode = await qrcode.toDataURL(
      secret.otpauth_url || "",
    );

    // Store the verification code with expiration
    const verificationKey = `mfa:setup:${userId}`;
    await this.cache.set(
      verificationKey,
      secret.base32,
      this.verificationTTL,
    );

    // Return setup information
    return {
      secret: secret.base32,
      otpAuthUrl: secret.otpauth_url || "",
      qrCode,
      expiresAt: this.time.addToDate(
        new Date(),
        { seconds: this.verificationTTL }
      ),
    };
  }

  async verifySetupToken(
    userId: string,
    token: string,
  ): Promise<VerificationResult> {
    // Get the stored secret
    const verificationKey = `mfa:setup:${userId}`;
    const secret = await this.cache.get<string>(verificationKey);

    if (!secret) {
      return {
        success: false,
        message: "Setup session expired. Please restart the MFA setup process.",
      };
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1, // Allow 30 seconds of window
    });

    if (!verified) {
      return {
        success: false,
        message: "Invalid verification code. Please try again.",
      };
    }

    // Clear the verification token
    await this.cache.delete(verificationKey);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Return success
    return {
      success: true,
      message: "MFA setup verified successfully.",
    };
  }

  async verifyToken(
    userId: string,
    token: string,
    secret: string,
  ): Promise<VerificationResult> {
    try {
      // Verify the token
      const verified = speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token,
        window: 1, // Allow 30 seconds of window
      });

      if (!verified) {
        // Log failed attempt
        this.logger.info("Failed MFA verification", {
          context: { userId, reason: "Invalid token" },
        });

        return {
          success: false,
          message: "Invalid verification code. Please try again.",
        };
      }

      // Log successful verification
      this.logger.info("Successful MFA verification", {
        context: { userId },
      });

      return {
        success: true,
        message: "MFA verification successful.",
      };
    } catch (error: unknown) {
      // Log error
      this.logger.error("MFA verification error", {
        context: {
          userId,
          error:
            error instanceof Error ? error.message : String(error),
        },
      });

      return {
        success: false,
        message: "An error occurred during verification. Please try again.",
      };
    }
  }

  private generateBackupCodes(count = 8, length = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      let code = "";
      for (let j = 0; j < length; j++) {
        code += Math.floor(Math.random() * 10);
      }
      // Format as XXXX-XXXX-XX
      code = `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 10)}`;
      codes.push(code);
    }

    return codes;
  }
}

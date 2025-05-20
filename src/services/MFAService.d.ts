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
export declare class MFAService {
  private readonly logger;
  private readonly config;
  private readonly eventBus;
  private readonly cache;
  private readonly time;
  private readonly verificationTTL;
  private readonly serviceName;
  constructor(
    logger: ILogger,
    config: IConfigService,
    eventBus: IEventBus,
    cache: ICacheService,
    time: TimeService,
  );
  generateSetupToken(userId: string): Promise<{
    secret: string;
    otpAuthUrl: string;
    qrCode: string;
    expiresAt: Date;
  }>;
  verifySetupToken(userId: string, token: string): Promise<VerificationResult>;
  verifyToken(
    userId: string,
    token: string,
    secret: string,
  ): Promise<VerificationResult>;
  private generateBackupCodes;
}

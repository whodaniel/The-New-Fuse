import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

export interface BlockDetails {
  reason: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class IpBlockingService implements OnModuleInit {
  private readonly logger = new Logger(IpBlockingService.name);
  private blockedIps = new Map<string, BlockDetails>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.loadBlockedIpsFromDb();
  }

  async blockIp(ip: string, details: BlockDetails) {
    this.blockedIps.set(ip, details);
    await this.prisma.blockedIp.create({
      data: {
        ip,
        reason: details.reason,
        expiresAt: details.expiresAt,
        metadata: details.metadata as any,
      },
    });
    this.eventEmitter.emit('ip.blocked', { ip, details });
    this.logger.warn(`IP blocked: ${ip} for reason: ${details.reason}`);
  }

  async unblockIp(ip: string) {
    this.blockedIps.delete(ip);
    await this.prisma.blockedIp.delete({ where: { ip } });
    this.eventEmitter.emit('ip.unblocked', { ip });
    this.logger.log(`IP unblocked: ${ip}`);
  }

  isIpBlocked(ip: string): boolean {
    const details = this.blockedIps.get(ip);
    if (!details) return false;
    if (details.expiresAt && details.expiresAt < new Date()) {
      this.unblockIp(ip);
      return false;
    }
    return true;
  }

  private async loadBlockedIpsFromDb() {
    const blockedIps = await this.prisma.blockedIp.findMany();
    blockedIps.forEach((item) => {
      this.blockedIps.set(item.ip, {
        reason: item.reason,
        expiresAt: item.expiresAt,
        metadata: item.metadata as any,
      });
    });
    this.logger.log(`Loaded ${this.blockedIps.size} blocked IPs from the database.`);
  }

  @OnEvent('rate.limit.exceeded')
  handleRateLimitExceeded(payload: { key: string }) {
    // Implement logic to block IPs after a certain number of rate limit exceedances
  }
}

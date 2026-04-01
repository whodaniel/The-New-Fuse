import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// @ts-ignore
// @ts-ignore
import { GooseCliBridgeService } from '@the-new-fuse/relay-core/dist/services/GooseCliBridgeService.js';
// @ts-ignore
// @ts-ignore
import { LogLevel, Logger as RelayLogger } from '@the-new-fuse/relay-core/dist/utils/Logger.js';
import * as path from 'path';

import { hasAuthorizationLevel } from '../../../auth/auth-policy';
import { PayPalService } from '../../billing/paypal.service';
import { GooseDispatchDto } from './goose.dto';

type GoosePrincipal = {
  id?: string;
  email?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
};

type GooseAccess = {
  allowed: boolean;
  reason: string;
  isAdmin: boolean;
  membershipActive: boolean;
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
};

@Injectable()
export class GooseService {
  private readonly logger = new Logger(GooseService.name);
  private readonly gooseBridge: GooseCliBridgeService;
  private readonly allowedRoot: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly payPalService: PayPalService
  ) {
    const configuredRoot = this.configService.get<string>('GOOSE_ALLOWED_ROOT') || process.cwd();
    this.allowedRoot = path.resolve(configuredRoot);
    const relayLogLevel = this.resolveRelayLogLevel(
      this.configService.get<string>('GOOSE_BRIDGE_LOG_LEVEL')
    );
    const relayLogDir =
      this.configService.get<string>('GOOSE_BRIDGE_LOG_DIR') ||
      path.resolve(process.cwd(), 'logs', 'goose-bridge');

    const relayLogger = new RelayLogger(relayLogLevel, relayLogDir);
    this.gooseBridge = new GooseCliBridgeService(
      relayLogger,
      this.configService.get<string>('GOOSE_BINARY') || 'goose'
    );
  }

  async getAccess(principal: GoosePrincipal): Promise<GooseAccess> {
    return this.resolveAccess(principal);
  }

  async dispatch(input: GooseDispatchDto, principal: GoosePrincipal) {
    const access = await this.resolveAccess(principal);
    if (!access.allowed) {
      throw new ForbiddenException(
        'Goose dispatch requires admin/system role or an active paid membership'
      );
    }

    const resolvedCwd = this.resolveCwd(input.cwd);
    const timeoutMs = input.timeoutMs || 120000;
    const extraArgs = input.extraArgs || [];
    const correlationId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const result = await this.gooseBridge.run({
      prompt: input.prompt,
      cwd: resolvedCwd,
      extraArgs,
      timeoutMs,
    });

    return {
      ok: result.ok,
      correlationId,
      subAgentPath: input.subAgentPath || 'goose://coding/default',
      access,
      run: {
        command: result.command,
        exitCode: result.exitCode,
        durationMs: result.durationMs,
        cwd: resolvedCwd,
      },
      output: {
        stdout: this.trimOutput(result.stdout),
        stderr: this.trimOutput(result.stderr),
      },
      truncated: {
        stdout: result.stdout.length > this.maxOutputLength(),
        stderr: result.stderr.length > this.maxOutputLength(),
      },
      dispatchedAt: new Date().toISOString(),
    };
  }

  private resolveRelayLogLevel(value: string | undefined): LogLevel {
    const normalized = String(value || 'info').toLowerCase();
    if (normalized === 'debug' || normalized === 'warn' || normalized === 'error') {
      return normalized;
    }
    return 'info';
  }

  private async resolveAccess(principal: GoosePrincipal): Promise<GooseAccess> {
    if (!principal?.id) {
      return {
        allowed: false,
        reason: 'missing-user',
        isAdmin: false,
        membershipActive: false,
        tier: 'STARTER',
      };
    }

    const isAdmin = hasAuthorizationLevel(principal, 'admin');

    let membershipActive = false;
    let tier: 'STARTER' | 'PRO' | 'ENTERPRISE' = 'STARTER';
    try {
      const membership = await this.payPalService.getMembershipForUser(principal.id);
      membershipActive = membership.active;
      tier = membership.tier;
    } catch (error) {
      this.logger.warn(`Unable to resolve membership for Goose dispatch: ${String(error)}`);
    }

    if (isAdmin) {
      return {
        allowed: true,
        reason: 'admin',
        isAdmin: true,
        membershipActive,
        tier,
      };
    }

    if (membershipActive) {
      return {
        allowed: true,
        reason: 'active-membership',
        isAdmin: false,
        membershipActive: true,
        tier,
      };
    }

    return {
      allowed: false,
      reason: 'membership-required',
      isAdmin: false,
      membershipActive: false,
      tier,
    };
  }

  private resolveCwd(requestedCwd?: string): string {
    const base = this.allowedRoot;
    if (!requestedCwd) {
      return base;
    }

    const resolved = path.resolve(base, requestedCwd);
    const withinAllowedRoot = resolved === base || resolved.startsWith(`${base}${path.sep}`);
    if (!withinAllowedRoot) {
      throw new BadRequestException('cwd must resolve under the configured Goose allowed root');
    }

    return resolved;
  }

  private maxOutputLength(): number {
    const configured = Number(this.configService.get<string>('GOOSE_MAX_OUTPUT_CHARS') || 40000);
    if (!Number.isFinite(configured) || configured < 5000) {
      return 40000;
    }
    return Math.floor(configured);
  }

  private trimOutput(value: string): string {
    const max = this.maxOutputLength();
    if (value.length <= max) {
      return value;
    }
    return `${value.slice(0, max)}\n...[truncated ${value.length - max} chars]`;
  }
}

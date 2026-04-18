import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@the-new-fuse/database';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import {
  CreateManagedAccountGrantDto,
  ProvisionManagedAccountDto,
  RedeemManagedAccountGrantDto,
} from '../../../dto/email-custodian.dto';

const execFile = promisify(execFileCallback);

type HostingTransport = 'cpanel_api' | 'ssh_command';

@Injectable()
export class EmailCustodianService {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService
  ) {}

  async listAccountsForOwner(ownerUserId: string) {
    return this.db.agentManagedAccounts.listByOwner(ownerUserId);
  }

  async provisionAccountForOwner(ownerUserId: string, dto: ProvisionManagedAccountDto) {
    const hostingTransport =
      dto.accountType === 'hosted_email' ? this.resolveHostingTransport(dto.provider) : null;
    const provider = this.resolveProvider(
      dto.accountType,
      dto.provider,
      hostingTransport || undefined
    );
    const metadata = {
      ...(dto.metadata || {}),
      managedBy: 'email-custodian-agent',
      provisionedAt: new Date().toISOString(),
    } as Record<string, unknown>;
    let status = 'active';

    if (dto.accountType === 'hosted_email' && dto.createOnHosting !== false) {
      const hostingResult = await this.createHostedEmailAccount(dto, hostingTransport || undefined);
      metadata.hostingProvision = {
        success: true,
        transport: hostingResult.transport,
        response: hostingResult.response,
      };
    }

    if (dto.accountType === 'chatgpt') {
      const automation = await this.attemptChatgptAutomation(dto);
      metadata.chatgptAutomation = automation;
      if (!automation.success) {
        status = 'pending_external_automation';
      }
    }

    return this.db.agentManagedAccounts.createAccount(ownerUserId, {
      accountType: dto.accountType,
      provider,
      loginIdentifier: dto.loginIdentifier,
      secret: dto.secret,
      metadata,
      status,
      createdByAgent: dto.createdByAgent,
    });
  }

  async createGrantForAccount(
    ownerUserId: string,
    accountId: string,
    dto: CreateManagedAccountGrantDto
  ) {
    const account = await this.db.agentManagedAccounts.findByIdForOwner(ownerUserId, accountId);
    if (!account) {
      throw new NotFoundException('Managed account not found');
    }

    const expiresAt = new Date(dto.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('expiresAt must be a future ISO timestamp');
    }

    const scopes =
      dto.scopes && dto.scopes.length > 0
        ? [...new Set(dto.scopes.map((scope) => scope.trim()).filter(Boolean))]
        : ['login:read'];

    const { grant, grantToken } = await this.db.agentManagedAccounts.createGrant({
      ownerUserId,
      accountId,
      granteeAgentId: dto.granteeAgentId,
      scopes,
      expiresAt,
    });

    return {
      grant,
      grantToken,
      account: {
        id: account.id,
        accountType: account.accountType,
        provider: account.provider,
        loginIdentifier: account.loginIdentifier,
      },
    };
  }

  async listAccountGrants(ownerUserId: string, accountId: string) {
    const account = await this.db.agentManagedAccounts.findByIdForOwner(ownerUserId, accountId);
    if (!account) {
      throw new NotFoundException('Managed account not found');
    }
    return this.db.agentManagedAccounts.listGrantsForAccount(ownerUserId, accountId);
  }

  async revokeGrant(ownerUserId: string, grantId: string) {
    const grant = await this.db.agentManagedAccounts.revokeGrant(ownerUserId, grantId);
    if (!grant) {
      throw new NotFoundException('Grant not found');
    }
    return grant;
  }

  async redeemGrant(dto: RedeemManagedAccountGrantDto) {
    const redeemed = await this.db.agentManagedAccounts.redeemGrant({
      grantToken: dto.grantToken,
      granteeAgentId: dto.granteeAgentId,
    });
    if (!redeemed) {
      throw new UnauthorizedException('Invalid, revoked, expired, or mismatched grant token');
    }

    return {
      account: {
        id: redeemed.account.id,
        accountType: redeemed.account.accountType,
        provider: redeemed.account.provider,
        loginIdentifier: redeemed.account.loginIdentifier,
        secret: redeemed.account.secret,
        metadata: redeemed.account.metadata,
      },
      grant: {
        id: redeemed.grant.id,
        scopes: redeemed.grant.scopes,
        expiresAt: redeemed.grant.expiresAt,
        granteeAgentId: redeemed.grant.granteeAgentId,
      },
    };
  }

  private resolveProvider(
    accountType: string,
    provider?: string,
    transport?: HostingTransport
  ): string {
    if (provider && provider.trim().length > 0) {
      return provider.trim().toLowerCase();
    }
    if (accountType === 'hosted_email') {
      return transport === 'ssh_command' ? 'stackcp_ssh' : 'cpanel';
    }
    if (accountType === 'chatgpt') return 'openai_chatgpt';
    return 'external';
  }

  private resolveHostingTransport(provider?: string): HostingTransport {
    const explicitProvider = provider?.trim().toLowerCase();
    if (explicitProvider === 'ssh' || explicitProvider === 'stackcp_ssh') {
      return 'ssh_command';
    }

    const envTransport = this.configService
      .get<string>('HOSTING_PROVISION_TRANSPORT')
      ?.trim()
      .toLowerCase();
    if (envTransport === 'ssh' || envTransport === 'ssh_command') {
      return 'ssh_command';
    }

    return 'cpanel_api';
  }

  private async createHostedEmailAccount(
    dto: ProvisionManagedAccountDto,
    transport?: HostingTransport
  ): Promise<{ transport: HostingTransport; response: unknown }> {
    const effectiveTransport = transport || this.resolveHostingTransport(dto.provider);
    if (effectiveTransport === 'ssh_command') {
      const response = await this.createHostedEmailAccountViaSsh(dto);
      return { transport: 'ssh_command', response };
    }

    const response = await this.createHostedEmailAccountViaCpanelApi(dto);
    return { transport: 'cpanel_api', response };
  }

  private async createHostedEmailAccountViaCpanelApi(
    dto: ProvisionManagedAccountDto
  ): Promise<unknown> {
    const baseUrl = this.configService.get<string>('HOSTING_CPANEL_BASE_URL');
    const username = this.configService.get<string>('HOSTING_CPANEL_USERNAME');
    const apiToken = this.configService.get<string>('HOSTING_CPANEL_API_TOKEN');

    if (!baseUrl || !username || !apiToken) {
      throw new BadRequestException(
        'Missing hosting config. Set HOSTING_CPANEL_BASE_URL, HOSTING_CPANEL_USERNAME, HOSTING_CPANEL_API_TOKEN.'
      );
    }

    const { mailbox, domain } = this.resolveMailboxAndDomain(dto);
    const quotaMb = dto.hostingQuotaMb || 1024;

    const url = new URL('/execute/Email/add_pop', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
    url.searchParams.set('email', mailbox);
    url.searchParams.set('domain', domain);
    url.searchParams.set('password', dto.secret);
    url.searchParams.set('quota', String(quotaMb));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `cpanel ${username}:${apiToken}`,
        Accept: 'application/json',
      },
    });
    const text = await response.text();
    const parsed = this.tryParseJson(text);
    if (!response.ok) {
      throw new BadGatewayException(
        `Hosting API call failed (${response.status}): ${typeof parsed === 'object' ? JSON.stringify(parsed) : text}`
      );
    }

    const status = this.readStatus(parsed);
    if (status === false) {
      throw new BadGatewayException(
        `Hosting API rejected mailbox creation: ${typeof parsed === 'object' ? JSON.stringify(parsed) : text}`
      );
    }

    return parsed;
  }

  private async createHostedEmailAccountViaSsh(dto: ProvisionManagedAccountDto): Promise<unknown> {
    const sshHost = this.configService.get<string>('HOSTING_SSH_HOST');
    const sshUser = this.configService.get<string>('HOSTING_SSH_USERNAME');
    const sshPrivateKeyPath = this.configService.get<string>('HOSTING_SSH_PRIVATE_KEY_PATH');
    const sshKnownHostsPath = this.configService.get<string>('HOSTING_SSH_KNOWN_HOSTS_PATH');
    const sshPort = this.resolveInteger(this.configService.get<string>('HOSTING_SSH_PORT'), 22);
    const timeoutMs = this.resolveInteger(
      this.configService.get<string>('HOSTING_SSH_CONNECT_TIMEOUT_MS'),
      15000
    );

    if (!sshHost || !sshUser || !sshPrivateKeyPath) {
      throw new BadRequestException(
        'Missing SSH hosting config. Set HOSTING_SSH_HOST, HOSTING_SSH_USERNAME, HOSTING_SSH_PRIVATE_KEY_PATH.'
      );
    }

    const { mailbox, domain } = this.resolveMailboxAndDomain(dto);
    const quotaMb = dto.hostingQuotaMb || 1024;
    const emailAddress = `${mailbox}@${domain}`;
    const template =
      this.configService.get<string>('HOSTING_SSH_CREATE_MAILBOX_COMMAND_TEMPLATE') ||
      'uapi --output=json Email add_pop email={{MAILBOX}} domain={{DOMAIN}} password={{PASSWORD}} quota={{QUOTA}}';

    const command = this.renderSshCommand(template, {
      MAILBOX: mailbox,
      DOMAIN: domain,
      PASSWORD: dto.secret,
      QUOTA: String(quotaMb),
      EMAIL: emailAddress,
    });

    const args = [
      '-i',
      sshPrivateKeyPath,
      '-o',
      'BatchMode=yes',
      '-o',
      'IdentitiesOnly=yes',
      '-o',
      'StrictHostKeyChecking=yes',
      '-o',
      `ConnectTimeout=${Math.max(5, Math.ceil(timeoutMs / 1000))}`,
    ];
    if (sshKnownHostsPath) {
      args.push('-o', `UserKnownHostsFile=${sshKnownHostsPath}`);
    }
    args.push('-p', String(sshPort), `${sshUser}@${sshHost}`, command);

    const result = await this.executeSshCommand(args, timeoutMs);
    const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
    const sanitizedOutput = this.redactSecret(combinedOutput, dto.secret);
    const parsed = this.tryParseJson(result.stdout || sanitizedOutput);

    const status = this.readStatus(parsed);
    if (status === false) {
      throw new BadGatewayException(
        `Hosting SSH command rejected mailbox creation: ${
          typeof parsed === 'object' ? JSON.stringify(parsed) : sanitizedOutput
        }`
      );
    }

    return {
      raw: parsed,
      diagnostics: result.stderr ? this.redactSecret(result.stderr, dto.secret) : '',
      commandTemplate:
        this.configService.get<string>('HOSTING_SSH_CREATE_MAILBOX_COMMAND_TEMPLATE') ||
        'default:uapi',
      mailbox: emailAddress,
    };
  }

  private async executeSshCommand(
    args: string[],
    timeoutMs: number
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      const { stdout, stderr } = await execFile('ssh', args, {
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024,
      });
      return {
        stdout: typeof stdout === 'string' ? stdout : String(stdout),
        stderr: typeof stderr === 'string' ? stderr : String(stderr),
        exitCode: 0,
      };
    } catch (error) {
      const err = error as {
        code?: number;
        signal?: string;
        stdout?: string | Buffer;
        stderr?: string | Buffer;
        message?: string;
      };
      const stderr = typeof err.stderr === 'string' ? err.stderr : err.stderr?.toString() || '';
      const stdout = typeof err.stdout === 'string' ? err.stdout : err.stdout?.toString() || '';
      throw new BadGatewayException(
        `Hosting SSH command failed (${err.code ?? err.signal ?? 'unknown'}): ${(stderr || stdout || err.message || 'no output').trim()}`
      );
    }
  }

  private renderSshCommand(
    template: string,
    values: Record<'MAILBOX' | 'DOMAIN' | 'PASSWORD' | 'QUOTA' | 'EMAIL', string>
  ): string {
    let rendered = template;
    for (const [key, value] of Object.entries(values)) {
      rendered = rendered.split(`{{${key}}}`).join(this.shellQuote(value));
      rendered = rendered.split(`{{${key}_RAW}}`).join(value);
    }

    if (rendered.includes('{{')) {
      throw new BadRequestException(
        'HOSTING_SSH_CREATE_MAILBOX_COMMAND_TEMPLATE has unresolved placeholders'
      );
    }
    return rendered;
  }

  private shellQuote(value: string): string {
    return `'${value.replace(/'/g, `'\"'\"'`)}'`;
  }

  private redactSecret(text: string, secret: string): string {
    if (!text) return text;
    if (!secret) return text;
    return text.split(secret).join('[REDACTED]');
  }

  private resolveInteger(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.floor(parsed);
  }

  private async attemptChatgptAutomation(dto: ProvisionManagedAccountDto): Promise<{
    success: boolean;
    mode: 'webhook' | 'deferred';
    reason?: string;
    response?: unknown;
  }> {
    if (!dto.allowChatgptAutomation) {
      return {
        success: false,
        mode: 'deferred',
        reason: 'allowChatgptAutomation=false',
      };
    }

    const webhookUrl = this.configService.get<string>('CHATGPT_SIGNUP_WEBHOOK_URL');
    if (!webhookUrl) {
      return {
        success: false,
        mode: 'deferred',
        reason: 'CHATGPT_SIGNUP_WEBHOOK_URL is not configured',
      };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: dto.loginIdentifier,
        password: dto.secret,
        metadata: dto.metadata || {},
      }),
    });

    const text = await response.text();
    const parsed = this.tryParseJson(text);
    if (!response.ok) {
      throw new BadGatewayException(
        `ChatGPT signup webhook failed (${response.status}): ${typeof parsed === 'object' ? JSON.stringify(parsed) : text}`
      );
    }

    return {
      success: true,
      mode: 'webhook',
      response: parsed,
    };
  }

  private resolveMailboxAndDomain(dto: ProvisionManagedAccountDto): {
    mailbox: string;
    domain: string;
  } {
    if (dto.hostingMailbox && dto.hostingDomain) {
      return {
        mailbox: dto.hostingMailbox.trim(),
        domain: dto.hostingDomain.trim(),
      };
    }

    const email = dto.loginIdentifier.trim().toLowerCase();
    const [mailbox, domain] = email.split('@');
    if (!mailbox || !domain) {
      throw new BadRequestException(
        'loginIdentifier must be a valid email or provide hostingMailbox + hostingDomain'
      );
    }
    return { mailbox, domain };
  }

  private readStatus(parsed: unknown): boolean {
    if (!parsed || typeof parsed !== 'object') return true;
    const p = parsed as Record<string, unknown>;
    if (typeof p.status === 'number') {
      return p.status !== 0;
    }
    if (typeof p.status === 'boolean') {
      return p.status;
    }
    const data = p.data;
    if (data && typeof data === 'object' && 'status' in (data as Record<string, unknown>)) {
      const inner = (data as Record<string, unknown>).status;
      if (typeof inner === 'number') return inner !== 0;
      if (typeof inner === 'boolean') return inner;
    }
    if (Array.isArray(p.errors) && p.errors.length > 0) {
      return false;
    }
    return true;
  }

  private tryParseJson(input: string): unknown {
    try {
      return JSON.parse(input);
    } catch {
      return input;
    }
  }
}

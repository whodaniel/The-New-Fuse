"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailCustodianService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_1 = require("@the-new-fuse/database");
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const execFile = (0, node_util_1.promisify)(node_child_process_1.execFile);
let EmailCustodianService = class EmailCustodianService {
    constructor(db, configService) {
        this.db = db;
        this.configService = configService;
    }
    async listAccountsForOwner(ownerUserId) {
        return this.db.agentManagedAccounts.listByOwner(ownerUserId);
    }
    async provisionAccountForOwner(ownerUserId, dto) {
        const hostingTransport = dto.accountType === 'hosted_email' ? this.resolveHostingTransport(dto.provider) : null;
        const provider = this.resolveProvider(dto.accountType, dto.provider, hostingTransport || undefined);
        const metadata = {
            ...(dto.metadata || {}),
            managedBy: 'email-custodian-agent',
            provisionedAt: new Date().toISOString(),
        };
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
    async createGrantForAccount(ownerUserId, accountId, dto) {
        const account = await this.db.agentManagedAccounts.findByIdForOwner(ownerUserId, accountId);
        if (!account) {
            throw new common_1.NotFoundException('Managed account not found');
        }
        const expiresAt = new Date(dto.expiresAt);
        if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
            throw new common_1.BadRequestException('expiresAt must be a future ISO timestamp');
        }
        const scopes = dto.scopes && dto.scopes.length > 0
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
    async listAccountGrants(ownerUserId, accountId) {
        const account = await this.db.agentManagedAccounts.findByIdForOwner(ownerUserId, accountId);
        if (!account) {
            throw new common_1.NotFoundException('Managed account not found');
        }
        return this.db.agentManagedAccounts.listGrantsForAccount(ownerUserId, accountId);
    }
    async revokeGrant(ownerUserId, grantId) {
        const grant = await this.db.agentManagedAccounts.revokeGrant(ownerUserId, grantId);
        if (!grant) {
            throw new common_1.NotFoundException('Grant not found');
        }
        return grant;
    }
    async redeemGrant(dto) {
        const redeemed = await this.db.agentManagedAccounts.redeemGrant({
            grantToken: dto.grantToken,
            granteeAgentId: dto.granteeAgentId,
        });
        if (!redeemed) {
            throw new common_1.UnauthorizedException('Invalid, revoked, expired, or mismatched grant token');
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
    resolveProvider(accountType, provider, transport) {
        if (provider && provider.trim().length > 0) {
            return provider.trim().toLowerCase();
        }
        if (accountType === 'hosted_email') {
            return transport === 'ssh_command' ? 'stackcp_ssh' : 'cpanel';
        }
        if (accountType === 'chatgpt')
            return 'openai_chatgpt';
        return 'external';
    }
    resolveHostingTransport(provider) {
        const explicitProvider = provider?.trim().toLowerCase();
        if (explicitProvider === 'ssh' || explicitProvider === 'stackcp_ssh') {
            return 'ssh_command';
        }
        const envTransport = this.configService
            .get('HOSTING_PROVISION_TRANSPORT')
            ?.trim()
            .toLowerCase();
        if (envTransport === 'ssh' || envTransport === 'ssh_command') {
            return 'ssh_command';
        }
        return 'cpanel_api';
    }
    async createHostedEmailAccount(dto, transport) {
        const effectiveTransport = transport || this.resolveHostingTransport(dto.provider);
        if (effectiveTransport === 'ssh_command') {
            const response = await this.createHostedEmailAccountViaSsh(dto);
            return { transport: 'ssh_command', response };
        }
        const response = await this.createHostedEmailAccountViaCpanelApi(dto);
        return { transport: 'cpanel_api', response };
    }
    async createHostedEmailAccountViaCpanelApi(dto) {
        const baseUrl = this.configService.get('HOSTING_CPANEL_BASE_URL');
        const username = this.configService.get('HOSTING_CPANEL_USERNAME');
        const apiToken = this.configService.get('HOSTING_CPANEL_API_TOKEN');
        if (!baseUrl || !username || !apiToken) {
            throw new common_1.BadRequestException('Missing hosting config. Set HOSTING_CPANEL_BASE_URL, HOSTING_CPANEL_USERNAME, HOSTING_CPANEL_API_TOKEN.');
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
            throw new common_1.BadGatewayException(`Hosting API call failed (${response.status}): ${typeof parsed === 'object' ? JSON.stringify(parsed) : text}`);
        }
        const status = this.readStatus(parsed);
        if (status === false) {
            throw new common_1.BadGatewayException(`Hosting API rejected mailbox creation: ${typeof parsed === 'object' ? JSON.stringify(parsed) : text}`);
        }
        return parsed;
    }
    async createHostedEmailAccountViaSsh(dto) {
        const sshHost = this.configService.get('HOSTING_SSH_HOST');
        const sshUser = this.configService.get('HOSTING_SSH_USERNAME');
        const sshPrivateKeyPath = this.configService.get('HOSTING_SSH_PRIVATE_KEY_PATH');
        const sshKnownHostsPath = this.configService.get('HOSTING_SSH_KNOWN_HOSTS_PATH');
        const sshPort = this.resolveInteger(this.configService.get('HOSTING_SSH_PORT'), 22);
        const timeoutMs = this.resolveInteger(this.configService.get('HOSTING_SSH_CONNECT_TIMEOUT_MS'), 15000);
        if (!sshHost || !sshUser || !sshPrivateKeyPath) {
            throw new common_1.BadRequestException('Missing SSH hosting config. Set HOSTING_SSH_HOST, HOSTING_SSH_USERNAME, HOSTING_SSH_PRIVATE_KEY_PATH.');
        }
        const { mailbox, domain } = this.resolveMailboxAndDomain(dto);
        const quotaMb = dto.hostingQuotaMb || 1024;
        const emailAddress = `${mailbox}@${domain}`;
        const template = this.configService.get('HOSTING_SSH_CREATE_MAILBOX_COMMAND_TEMPLATE') ||
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
            throw new common_1.BadGatewayException(`Hosting SSH command rejected mailbox creation: ${typeof parsed === 'object' ? JSON.stringify(parsed) : sanitizedOutput}`);
        }
        return {
            raw: parsed,
            diagnostics: result.stderr ? this.redactSecret(result.stderr, dto.secret) : '',
            commandTemplate: this.configService.get('HOSTING_SSH_CREATE_MAILBOX_COMMAND_TEMPLATE') ||
                'default:uapi',
            mailbox: emailAddress,
        };
    }
    async executeSshCommand(args, timeoutMs) {
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
        }
        catch (error) {
            const err = error;
            const stderr = typeof err.stderr === 'string' ? err.stderr : err.stderr?.toString() || '';
            const stdout = typeof err.stdout === 'string' ? err.stdout : err.stdout?.toString() || '';
            throw new common_1.BadGatewayException(`Hosting SSH command failed (${err.code ?? err.signal ?? 'unknown'}): ${(stderr || stdout || err.message || 'no output').trim()}`);
        }
    }
    renderSshCommand(template, values) {
        let rendered = template;
        for (const [key, value] of Object.entries(values)) {
            rendered = rendered.split(`{{${key}}}`).join(this.shellQuote(value));
            rendered = rendered.split(`{{${key}_RAW}}`).join(value);
        }
        if (rendered.includes('{{')) {
            throw new common_1.BadRequestException('HOSTING_SSH_CREATE_MAILBOX_COMMAND_TEMPLATE has unresolved placeholders');
        }
        return rendered;
    }
    shellQuote(value) {
        return `'${value.replace(/'/g, `'\"'\"'`)}'`;
    }
    redactSecret(text, secret) {
        if (!text)
            return text;
        if (!secret)
            return text;
        return text.split(secret).join('[REDACTED]');
    }
    resolveInteger(value, fallback) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0)
            return fallback;
        return Math.floor(parsed);
    }
    async attemptChatgptAutomation(dto) {
        if (!dto.allowChatgptAutomation) {
            return {
                success: false,
                mode: 'deferred',
                reason: 'allowChatgptAutomation=false',
            };
        }
        const webhookUrl = this.configService.get('CHATGPT_SIGNUP_WEBHOOK_URL');
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
            throw new common_1.BadGatewayException(`ChatGPT signup webhook failed (${response.status}): ${typeof parsed === 'object' ? JSON.stringify(parsed) : text}`);
        }
        return {
            success: true,
            mode: 'webhook',
            response: parsed,
        };
    }
    resolveMailboxAndDomain(dto) {
        if (dto.hostingMailbox && dto.hostingDomain) {
            return {
                mailbox: dto.hostingMailbox.trim(),
                domain: dto.hostingDomain.trim(),
            };
        }
        const email = dto.loginIdentifier.trim().toLowerCase();
        const [mailbox, domain] = email.split('@');
        if (!mailbox || !domain) {
            throw new common_1.BadRequestException('loginIdentifier must be a valid email or provide hostingMailbox + hostingDomain');
        }
        return { mailbox, domain };
    }
    readStatus(parsed) {
        if (!parsed || typeof parsed !== 'object')
            return true;
        const p = parsed;
        if (typeof p.status === 'number') {
            return p.status !== 0;
        }
        if (typeof p.status === 'boolean') {
            return p.status;
        }
        const data = p.data;
        if (data && typeof data === 'object' && 'status' in data) {
            const inner = data.status;
            if (typeof inner === 'number')
                return inner !== 0;
            if (typeof inner === 'boolean')
                return inner;
        }
        if (Array.isArray(p.errors) && p.errors.length > 0) {
            return false;
        }
        return true;
    }
    tryParseJson(input) {
        try {
            return JSON.parse(input);
        }
        catch {
            return input;
        }
    }
};
exports.EmailCustodianService = EmailCustodianService;
exports.EmailCustodianService = EmailCustodianService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService,
        config_1.ConfigService])
], EmailCustodianService);
//# sourceMappingURL=email-custodian.service.js.map
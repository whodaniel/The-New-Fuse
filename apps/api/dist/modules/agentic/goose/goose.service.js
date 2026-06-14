"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GooseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GooseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const relay_core_1 = require("@the-new-fuse/relay-core");
const path = __importStar(require("path"));
const auth_policy_1 = require("../../../auth/auth-policy");
const paypal_service_1 = require("../../billing/paypal.service");
let GooseService = GooseService_1 = class GooseService {
    constructor(configService, payPalService) {
        this.configService = configService;
        this.payPalService = payPalService;
        this.logger = new common_1.Logger(GooseService_1.name);
        const configuredRoot = this.configService.get('GOOSE_ALLOWED_ROOT') || process.cwd();
        this.allowedRoot = path.resolve(configuredRoot);
        const relayLogLevel = this.resolveRelayLogLevel(this.configService.get('GOOSE_BRIDGE_LOG_LEVEL'));
        const relayLogDir = this.configService.get('GOOSE_BRIDGE_LOG_DIR') ||
            path.resolve(process.cwd(), 'logs', 'goose-bridge');
        const relayLogger = new relay_core_1.Logger(relayLogLevel, relayLogDir);
        this.gooseBridge = new relay_core_1.GooseCliBridgeService(relayLogger, this.configService.get('GOOSE_BINARY') || 'goose');
    }
    async getAccess(principal) {
        return this.resolveAccess(principal);
    }
    async dispatch(input, principal) {
        const access = await this.resolveAccess(principal);
        if (!access.allowed) {
            throw new common_1.ForbiddenException('Goose dispatch requires admin/system role or an active paid membership');
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
    resolveRelayLogLevel(value) {
        const normalized = String(value || 'info').toLowerCase();
        if (normalized === 'debug' || normalized === 'warn' || normalized === 'error') {
            return normalized;
        }
        return 'info';
    }
    async resolveAccess(principal) {
        if (!principal?.id) {
            return {
                allowed: false,
                reason: 'missing-user',
                isAdmin: false,
                membershipActive: false,
                tier: 'STARTER',
            };
        }
        const isAdmin = (0, auth_policy_1.hasAuthorizationLevel)(principal, 'admin');
        let membershipActive = false;
        let tier = 'STARTER';
        try {
            const membership = await this.payPalService.getMembershipForUser(principal.id);
            membershipActive = membership.active;
            tier = membership.tier;
        }
        catch (error) {
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
    resolveCwd(requestedCwd) {
        const base = this.allowedRoot;
        if (!requestedCwd) {
            return base;
        }
        const resolved = path.resolve(base, requestedCwd);
        const withinAllowedRoot = resolved === base || resolved.startsWith(`${base}${path.sep}`);
        if (!withinAllowedRoot) {
            throw new common_1.BadRequestException('cwd must resolve under the configured Goose allowed root');
        }
        return resolved;
    }
    maxOutputLength() {
        const configured = Number(this.configService.get('GOOSE_MAX_OUTPUT_CHARS') || 40000);
        if (!Number.isFinite(configured) || configured < 5000) {
            return 40000;
        }
        return Math.floor(configured);
    }
    trimOutput(value) {
        const max = this.maxOutputLength();
        if (value.length <= max) {
            return value;
        }
        return `${value.slice(0, max)}\n...[truncated ${value.length - max} chars]`;
    }
};
exports.GooseService = GooseService;
exports.GooseService = GooseService = GooseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        paypal_service_1.PayPalService])
], GooseService);
//# sourceMappingURL=goose.service.js.map
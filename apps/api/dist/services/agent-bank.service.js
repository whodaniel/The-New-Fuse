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
var AgentBankService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentBankService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const paypal_service_1 = require("../modules/billing/paypal.service");
let AgentBankService = AgentBankService_1 = class AgentBankService {
    constructor(paypalService) {
        this.paypalService = paypalService;
        this.logger = new common_1.Logger(AgentBankService_1.name);
    }
    /**
     * Resolve the workspace root directory
     */
    getWorkspaceRoot() {
        if (process.env.TNF_WORKSPACE)
            return process.env.TNF_WORKSPACE;
        // Default to current directory and look for .agent
        let current = process.cwd();
        // Safety limit of 10 levels
        for (let i = 0; i < 10; i++) {
            if (fs.existsSync(path.join(current, '.agent'))) {
                return current;
            }
            const parent = path.dirname(current);
            if (parent === current)
                break;
            current = parent;
        }
        return process.cwd();
    }
    /**
     * List all templates in the agent banks
     */
    async listTemplates(bank = 'all', userId, userRole) {
        const root = this.getWorkspaceRoot();
        const templates = [];
        // Gating logic
        let allowedBanks = ['tnf', 'claude'];
        if (userId && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            const tier = await this.paypalService.getUserTier(userId);
            if (tier === 'STARTER') {
                allowedBanks = ['tnf']; // Starter tier can only access TNF bank
            }
        }
        const scan = (dir, bankType) => {
            try {
                if (!fs.existsSync(dir)) {
                    this.logger.debug(`Bank directory not found: ${dir}`);
                    return;
                }
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat.isFile() && (file.endsWith('.md') || file.endsWith('.json'))) {
                        // Basic parsing for name/description if it's a markdown file
                        let name = file.replace(/\.md$/, '').replace(/\.json$/, '');
                        let description = '';
                        // Optional: Read first few lines for name/description if it's small
                        if (stat.size < 1024 * 5) {
                            // Only read small files for metadata
                            const content = fs.readFileSync(fullPath, 'utf-8');
                            const lines = content.split('\n');
                            const titleLine = lines.find((l) => l.startsWith('# '));
                            if (titleLine)
                                name = titleLine.replace('# ', '').trim();
                        }
                        templates.push({
                            id: `${bankType}:${file}`,
                            name,
                            bank: bankType,
                            filename: file,
                            size: stat.size,
                            lastModified: stat.mtime,
                            description,
                        });
                    }
                }
            }
            catch (err) {
                this.logger.error(`Failed to scan bank ${bankType}: ${err}`);
            }
        };
        if ((bank === 'tnf' || bank === 'all') && allowedBanks.includes('tnf')) {
            scan(path.join(root, '.agent', 'agents'), 'tnf');
        }
        if ((bank === 'claude' || bank === 'all') && allowedBanks.includes('claude')) {
            scan(path.join(root, '.claude', 'agents'), 'claude');
        }
        return templates;
    }
    /**
     * Get the full content of a template file
     */
    async getTemplateContent(bank, filename, userId, userRole) {
        // Gating check
        if (userId && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            const tier = await this.paypalService.getUserTier(userId);
            if (tier === 'STARTER' && bank === 'claude') {
                throw new common_1.ForbiddenException('Access to Claude agent bank requires a PRO or ENTERPRISE membership.');
            }
        }
        const root = this.getWorkspaceRoot();
        const bankDir = bank === 'tnf' ? '.agent/agents' : '.claude/agents';
        const fullPath = path.join(root, bankDir, filename);
        // Security check: ensure path is within the bank directory
        const resolvedBankDir = path.resolve(path.join(root, bankDir));
        const resolvedFilePath = path.resolve(fullPath);
        if (!resolvedFilePath.startsWith(resolvedBankDir)) {
            throw new common_1.BadRequestException('Invalid file path');
        }
        if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
            throw new common_1.NotFoundException(`Template ${filename} not found in ${bank} bank`);
        }
        return fs.readFileSync(fullPath, 'utf-8');
    }
};
exports.AgentBankService = AgentBankService;
exports.AgentBankService = AgentBankService = AgentBankService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [paypal_service_1.PayPalService])
], AgentBankService);
//# sourceMappingURL=agent-bank.service.js.map
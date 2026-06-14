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
var AccessBootstrapService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessBootstrapService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const drizzle_1 = require("@the-new-fuse/database/drizzle");
let AccessBootstrapService = AccessBootstrapService_1 = class AccessBootstrapService {
    constructor(db, configService) {
        this.db = db;
        this.configService = configService;
        this.logger = new common_1.Logger(AccessBootstrapService_1.name);
    }
    async onModuleInit() {
        await this.seedDefaultPokerRules();
    }
    async seedDefaultPokerRules() {
        const nftContract = this.clean(this.configService.get('AI_ARCADE_ACCESS_NFT_CONTRACT'));
        const nftChainIdRaw = this.clean(this.configService.get('AI_ARCADE_ACCESS_NFT_CHAIN_ID'));
        const nftTokenId = this.clean(this.configService.get('AI_ARCADE_ACCESS_NFT_TOKEN_ID'));
        const nftChainId = nftChainIdRaw && Number.isFinite(Number(nftChainIdRaw)) ? Number(nftChainIdRaw) : null;
        const rules = [
            {
                gameId: 'ai-arcade-poker',
                label: 'AI Arcade Poker',
                description: 'Primary poker access policy. Paid TNF membership is required, with optional NFT gating layered on top.',
                requiredTier: 'PRO',
                requiresMembership: true,
                config: { experience: 'poker', scope: 'all' },
            },
            {
                gameId: 'ai-arcade-poker-cash',
                label: 'AI Arcade Cash Games',
                description: 'Cash-table access for ring games, live table syncing, and bot-filled fallback tables.',
                requiredTier: 'PRO',
                requiresMembership: true,
                config: { experience: 'poker', mode: 'cash' },
            },
            {
                gameId: 'ai-arcade-poker-sng',
                label: 'AI Arcade Sit & Go',
                description: 'Single-table tournament creation and registration surface for Sit & Go events.',
                requiredTier: 'PRO',
                requiresMembership: true,
                config: { experience: 'poker', mode: 'sng' },
            },
            {
                gameId: 'ai-arcade-poker-mtt',
                label: 'AI Arcade Multi-Table Tournaments',
                description: 'Multi-table tournament creation and registration surface for scheduled and ad hoc MTT events.',
                requiredTier: 'PRO',
                requiresMembership: true,
                config: { experience: 'poker', mode: 'mtt' },
            },
            {
                gameId: 'ai-arcade-poker-agents',
                label: 'AI Arcade Poker Agents',
                description: 'Agent and custom-bot registration surface. A member-owned or admin-approved account is required.',
                requiredTier: 'PRO',
                requiresMembership: true,
                config: { experience: 'poker', mode: 'agents' },
            },
        ];
        for (const rule of rules) {
            try {
                await this.db.executeRaw(`INSERT INTO game_access_rules (
             game_id, label, description, required_tier, requires_membership,
             required_nft_contract, required_nft_chain_id, required_nft_token_id,
             required_nft_traits, config, is_active, created_at, updated_at
           ) VALUES (
             '${this.escape(rule.gameId)}',
             '${this.escape(rule.label)}',
             '${this.escape(rule.description)}',
             '${rule.requiredTier}',
             ${rule.requiresMembership ? 'true' : 'false'},
             ${nftContract ? `'${this.escape(nftContract)}'` : 'NULL'},
             ${typeof nftChainId === 'number' ? String(nftChainId) : 'NULL'},
             ${nftTokenId ? `'${this.escape(nftTokenId)}'` : 'NULL'},
             NULL,
             '${this.escape(JSON.stringify(rule.config))}'::jsonb,
             true,
             now(),
             now()
           )
           ON CONFLICT (game_id)
           DO UPDATE SET
             label = EXCLUDED.label,
             description = EXCLUDED.description,
             required_tier = EXCLUDED.required_tier,
             requires_membership = EXCLUDED.requires_membership,
             required_nft_contract = EXCLUDED.required_nft_contract,
             required_nft_chain_id = EXCLUDED.required_nft_chain_id,
             required_nft_token_id = EXCLUDED.required_nft_token_id,
             config = EXCLUDED.config,
             is_active = true,
             updated_at = now()`);
            }
            catch (error) {
                this.logger.warn(`Unable to seed access rule ${rule.gameId}: ${String(error)}`);
            }
        }
    }
    clean(value) {
        const normalized = String(value || '').trim();
        return normalized || null;
    }
    escape(value) {
        return value.replace(/'/g, "''");
    }
};
exports.AccessBootstrapService = AccessBootstrapService;
exports.AccessBootstrapService = AccessBootstrapService = AccessBootstrapService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_1.DatabaseService,
        config_1.ConfigService])
], AccessBootstrapService);
//# sourceMappingURL=access-bootstrap.service.js.map
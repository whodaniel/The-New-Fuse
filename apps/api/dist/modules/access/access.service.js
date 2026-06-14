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
exports.AccessService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const drizzle_1 = require("@the-new-fuse/database/drizzle");
const auth_policy_1 = require("../../auth/auth-policy");
const auth_service_1 = require("../../services/auth.service");
const paypal_service_1 = require("../billing/paypal.service");
const DEFAULT_GAME_ID = 'ai-arcade-poker';
const TIER_RANK = {
    STARTER: 0,
    PRO: 1,
    ENTERPRISE: 2,
};
let AccessService = class AccessService {
    constructor(db, configService, authService, payPalService) {
        this.db = db;
        this.configService = configService;
        this.authService = authService;
        this.payPalService = payPalService;
    }
    async resolve(input) {
        const normalized = this.normalizeInput(input);
        const agent = normalized.agentId ? await this.getAgent(normalized.agentId) : null;
        const user = (agent?.userId ? await this.db.users.findById(agent.userId) : null) ||
            (normalized.userId ? await this.db.users.findById(normalized.userId) : null) ||
            (normalized.email ? await this.findUserByEmail(normalized.email) : null) ||
            (normalized.username ? await this.db.users.findByUsername(normalized.username) : null) ||
            (normalized.walletAddress
                ? await this.db.users.findByWalletAddress(normalized.walletAddress)
                : null) ||
            null;
        const inviteOnly = this.isTruthy(this.configService.get('AUTH_INVITE_ONLY'));
        const inviteValidation = await this.validateInvite(normalized.inviteCode);
        const inviteRequired = inviteOnly && !user;
        const inviteSatisfied = !inviteRequired || inviteValidation.valid;
        const membership = user
            ? await this.payPalService.getMembershipForUser(user.id)
            : {
                found: false,
                active: false,
                tier: 'STARTER',
                userId: '',
            };
        const activeOverride = user ? await this.getActiveMembershipOverride(user.id) : null;
        const roleClaims = (0, auth_policy_1.resolveRoleClaims)({
            role: user?.role || undefined,
            roles: (Array.isArray(user?.roles) ? user?.roles : undefined),
        });
        const isSuperAdmin = !!user && (0, auth_policy_1.isMasterSuperAdminEmail)(user.email);
        const isAdmin = isSuperAdmin || roleClaims.some((role) => ['admin', 'super_admin', 'system'].includes(role));
        const isProgrammaticAgent = !!agent;
        const walletAddress = normalized.walletAddress || user?.walletAddress || null;
        const rule = await this.getGameRule(normalized.gameId);
        const entitlement = user ? await this.getActiveEntitlement(user.id, normalized.gameId) : null;
        const requiredTier = rule.requiredTier;
        const hasRequiredTier = this.tierMeets(membership.tier, requiredTier);
        const hasEntitlementTier = entitlement
            ? this.tierMeets(entitlement.tierGranted, requiredTier)
            : false;
        const nftRequired = !!rule.requiredNftContract;
        const nftSatisfied = isAdmin || (!!entitlement && entitlement.source === 'nft');
        const membershipSatisfied = !rule.requiresMembership || membership.active || hasEntitlementTier || isAdmin;
        const canRegister = isAdmin || (!!user && membership.active && inviteSatisfied);
        const canPlay = inviteSatisfied &&
            (isAdmin ||
                (!!user &&
                    (membershipSatisfied || hasRequiredTier || hasEntitlementTier) &&
                    (!nftRequired || nftSatisfied)));
        const nextActions = this.buildNextActions({
            userFound: !!user,
            inviteRequired,
            inviteSatisfied,
            membershipActive: membership.active,
            walletLinked: !!walletAddress,
            nftRequired,
            nftSatisfied,
            gameId: normalized.gameId,
        });
        return {
            ok: true,
            gameId: normalized.gameId,
            actor: {
                kind: agent ? 'agent' : user ? 'user' : 'anonymous',
                agentId: agent?.id || null,
                isProgrammaticAgent,
                isAdmin,
                isSuperAdmin,
                primaryRole: this.primaryRole({
                    isAdmin,
                    isSuperAdmin,
                    isProgrammaticAgent,
                    membershipActive: membership.active,
                }),
            },
            subject: {
                userId: user?.id || null,
                username: user?.username || normalized.username || null,
                email: user?.email || normalized.email || null,
                walletAddress,
            },
            invite: {
                enabled: inviteOnly,
                required: inviteRequired,
                satisfied: inviteSatisfied,
                source: inviteValidation.source,
            },
            membership: {
                found: membership.found,
                active: membership.active,
                tier: membership.tier,
                overrideActive: !!activeOverride,
                overrideTier: activeOverride?.tier || null,
            },
            wallet: {
                linked: !!walletAddress,
                address: walletAddress,
            },
            game: {
                id: normalized.gameId,
                label: rule.label,
                description: rule.description,
                requiresMembership: rule.requiresMembership,
                requiredTier,
                nftRequired,
                nft: nftRequired
                    ? {
                        contractAddress: rule.requiredNftContract,
                        chainId: rule.requiredNftChainId,
                        tokenId: rule.requiredNftTokenId,
                        traits: rule.requiredNftTraits,
                        ownershipVerified: nftSatisfied,
                    }
                    : null,
                entitlement: entitlement
                    ? {
                        source: entitlement.source,
                        tierGranted: entitlement.tierGranted,
                        expiresAt: entitlement.expiresAt,
                    }
                    : null,
            },
            access: {
                canRegister,
                canPlay,
            },
            nextActions,
            pathSummary: this.buildPathSummary({
                canRegister,
                canPlay,
                inviteRequired,
                inviteSatisfied,
                membershipActive: membership.active,
                nftRequired,
                nftSatisfied,
            }),
        };
    }
    normalizeInput(input) {
        return {
            gameId: String(input.gameId || DEFAULT_GAME_ID).trim() || DEFAULT_GAME_ID,
            userId: this.clean(input.userId),
            email: this.clean(input.email)?.toLowerCase(),
            username: this.clean(input.username),
            walletAddress: this.clean(input.walletAddress),
            inviteCode: this.clean(input.inviteCode),
            agentId: this.clean(input.agentId),
        };
    }
    async findUserByEmail(email) {
        const lowered = email.toLowerCase().replace(/'/g, "''");
        const rows = await this.db.executeRaw(`SELECT id FROM users WHERE lower(email) = '${lowered}' LIMIT 1`);
        return rows[0]?.id ? this.db.users.findById(rows[0].id) : null;
    }
    async getAgent(agentId) {
        const safeAgentId = agentId.replace(/'/g, "''");
        const rows = await this.db.executeRaw(`SELECT id, user_id
       FROM agents
       WHERE id = '${safeAgentId}'
       LIMIT 1`);
        const agent = rows[0];
        return agent ? { id: agent.id, userId: agent.user_id } : null;
    }
    async validateInvite(inviteCode) {
        if (!inviteCode) {
            return { valid: false, source: null };
        }
        try {
            const validation = await this.authService.validateInviteCode(inviteCode);
            return { valid: true, source: validation.source };
        }
        catch {
            return { valid: false, source: null };
        }
    }
    async getActiveMembershipOverride(userId) {
        const safeUserId = userId.replace(/'/g, "''");
        const rows = await this.db.executeRaw(`SELECT id, tier, expires_at
       FROM membership_overrides
       WHERE user_id = '${safeUserId}'
         AND status = 'ACTIVE'
       ORDER BY created_at DESC
       LIMIT 1`);
        const override = rows[0];
        if (!override)
            return null;
        if (override.expires_at && new Date(override.expires_at).getTime() <= Date.now()) {
            return null;
        }
        return {
            id: override.id,
            tier: override.tier,
            expiresAt: override.expires_at,
        };
    }
    async getActiveEntitlement(userId, gameId) {
        const safeUserId = userId.replace(/'/g, "''");
        const safeGameId = gameId.replace(/'/g, "''");
        const rows = await this.db.executeRaw(`SELECT source, tier_granted, expires_at
       FROM game_entitlements
       WHERE user_id = '${safeUserId}'
         AND game_id = '${safeGameId}'
       ORDER BY created_at DESC
       LIMIT 1`);
        const entitlement = rows[0];
        if (!entitlement)
            return null;
        if (entitlement.expires_at && new Date(entitlement.expires_at).getTime() <= Date.now()) {
            return null;
        }
        return {
            source: entitlement.source,
            tierGranted: entitlement.tier_granted,
            expiresAt: entitlement.expires_at,
        };
    }
    async getGameRule(gameId) {
        const safeGameId = gameId.replace(/'/g, "''");
        const rows = await this.db.executeRaw(`SELECT id, game_id, label, description, required_tier, requires_membership,
              required_nft_contract, required_nft_chain_id, required_nft_token_id, required_nft_traits
       FROM game_access_rules
       WHERE game_id = '${safeGameId}'
         AND is_active = true
       LIMIT 1`);
        const persistedRule = rows[0];
        const rule = persistedRule
            ? {
                id: persistedRule.id,
                gameId: persistedRule.game_id,
                label: persistedRule.label,
                description: persistedRule.description,
                requiredTier: persistedRule.required_tier,
                requiresMembership: persistedRule.requires_membership,
                requiredNftContract: persistedRule.required_nft_contract,
                requiredNftChainId: persistedRule.required_nft_chain_id,
                requiredNftTokenId: persistedRule.required_nft_token_id,
                requiredNftTraits: persistedRule.required_nft_traits,
                config: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            : null;
        if (rule)
            return rule;
        if (gameId.includes('poker')) {
            return {
                gameId,
                label: 'AI Arcade Poker',
                description: 'Paid TNF membership is required for poker play. NFT access can be layered on top.',
                requiredTier: 'PRO',
                requiresMembership: true,
                requiredNftContract: null,
                requiredNftChainId: null,
                requiredNftTokenId: null,
                requiredNftTraits: null,
                config: null,
                isActive: true,
                id: 'fallback-poker',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
        return {
            gameId,
            label: gameId,
            description: 'No explicit game rule configured yet.',
            requiredTier: 'STARTER',
            requiresMembership: false,
            requiredNftContract: null,
            requiredNftChainId: null,
            requiredNftTokenId: null,
            requiredNftTraits: null,
            config: null,
            isActive: true,
            id: 'fallback-public',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    buildNextActions(input) {
        const actions = [];
        if (!input.userFound) {
            actions.push({
                code: 'connect_thenewfuse',
                label: 'Connect thenewfuse.com',
                description: 'Sign in or create your TNF account before entering AI Arcade.',
                href: 'https://thenewfuse.com/auth/login',
            });
        }
        if (input.inviteRequired && !input.inviteSatisfied) {
            actions.push({
                code: 'get_invite_code',
                label: 'Get an invite code',
                description: 'Registration is invite-only right now. Use a founder invite or a super-admin override.',
            });
        }
        if (!input.membershipActive) {
            actions.push({
                code: 'activate_membership',
                label: 'Activate paid membership',
                description: 'Poker access is reserved for paid TNF members or admin-approved overrides.',
                href: 'https://thenewfuse.com',
            });
        }
        if (input.nftRequired && !input.walletLinked) {
            actions.push({
                code: 'connect_wallet',
                label: 'Connect your wallet',
                description: 'This game requires an NFT. Link your wallet or provision a TNF smart wallet first.',
            });
        }
        if (input.nftRequired && input.walletLinked && !input.nftSatisfied) {
            actions.push({
                code: 'acquire_required_nft',
                label: 'Acquire the required NFT',
                description: `Hold the required access NFT for ${input.gameId}. This can come from membership issuance or the secondary market.`,
            });
        }
        if (actions.length === 0) {
            actions.push({
                code: 'enter_game',
                label: 'Enter AI Arcade',
                description: 'Your account satisfies the current access policy.',
            });
        }
        return actions;
    }
    buildPathSummary(input) {
        if (input.canPlay) {
            return 'Access approved. You can enter play immediately.';
        }
        if (input.inviteRequired && !input.inviteSatisfied) {
            return 'Invite-only registration is active. Secure an invite code before continuing.';
        }
        if (!input.membershipActive) {
            return 'Paid TNF membership or a server-side membership override is required before registration and play.';
        }
        if (input.nftRequired && !input.nftSatisfied) {
            return 'Your account is eligible, but this game also requires the configured access NFT.';
        }
        if (!input.canRegister) {
            return 'Your account is not yet eligible for AI Arcade registration.';
        }
        return 'Your account is registered, but the current game access rule is still blocking entry.';
    }
    tierMeets(actual, required) {
        return TIER_RANK[actual] >= TIER_RANK[required];
    }
    primaryRole(input) {
        if (input.isSuperAdmin)
            return 'super_admin';
        if (input.isAdmin)
            return 'admin';
        if (input.isProgrammaticAgent)
            return 'ai_agent';
        if (input.membershipActive)
            return 'member';
        return 'unknown';
    }
    clean(value) {
        const normalized = String(value || '').trim();
        return normalized || undefined;
    }
    isTruthy(value) {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'number')
            return value > 0;
        if (typeof value !== 'string')
            return false;
        return ['1', 'true', 'yes', 'on', 'enabled'].includes(value.trim().toLowerCase());
    }
};
exports.AccessService = AccessService;
exports.AccessService = AccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_1.DatabaseService,
        config_1.ConfigService,
        auth_service_1.AuthService,
        paypal_service_1.PayPalService])
], AccessService);
//# sourceMappingURL=access.service.js.map
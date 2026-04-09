import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@the-new-fuse/database/drizzle';

type SeedRule = {
  gameId: string;
  label: string;
  description: string;
  requiredTier: 'STARTER' | 'PRO' | 'ENTERPRISE';
  requiresMembership: boolean;
  config: Record<string, unknown>;
};

@Injectable()
export class AccessBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AccessBootstrapService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    await this.seedDefaultPokerRules();
  }

  private async seedDefaultPokerRules() {
    const nftContract = this.clean(this.configService.get<string>('AI_ARCADE_ACCESS_NFT_CONTRACT'));
    const nftChainIdRaw = this.clean(
      this.configService.get<string>('AI_ARCADE_ACCESS_NFT_CHAIN_ID')
    );
    const nftTokenId = this.clean(this.configService.get<string>('AI_ARCADE_ACCESS_NFT_TOKEN_ID'));
    const nftChainId =
      nftChainIdRaw && Number.isFinite(Number(nftChainIdRaw)) ? Number(nftChainIdRaw) : null;

    const rules: SeedRule[] = [
      {
        gameId: 'ai-arcade-poker',
        label: 'AI Arcade Poker',
        description:
          'Primary poker access policy. Paid TNF membership is required, with optional NFT gating layered on top.',
        requiredTier: 'PRO',
        requiresMembership: true,
        config: { experience: 'poker', scope: 'all' },
      },
      {
        gameId: 'ai-arcade-poker-cash',
        label: 'AI Arcade Cash Games',
        description:
          'Cash-table access for ring games, live table syncing, and bot-filled fallback tables.',
        requiredTier: 'PRO',
        requiresMembership: true,
        config: { experience: 'poker', mode: 'cash' },
      },
      {
        gameId: 'ai-arcade-poker-sng',
        label: 'AI Arcade Sit & Go',
        description:
          'Single-table tournament creation and registration surface for Sit & Go events.',
        requiredTier: 'PRO',
        requiresMembership: true,
        config: { experience: 'poker', mode: 'sng' },
      },
      {
        gameId: 'ai-arcade-poker-mtt',
        label: 'AI Arcade Multi-Table Tournaments',
        description:
          'Multi-table tournament creation and registration surface for scheduled and ad hoc MTT events.',
        requiredTier: 'PRO',
        requiresMembership: true,
        config: { experience: 'poker', mode: 'mtt' },
      },
      {
        gameId: 'ai-arcade-poker-agents',
        label: 'AI Arcade Poker Agents',
        description:
          'Agent and custom-bot registration surface. A member-owned or admin-approved account is required.',
        requiredTier: 'PRO',
        requiresMembership: true,
        config: { experience: 'poker', mode: 'agents' },
      },
    ];

    for (const rule of rules) {
      try {
        await this.db.executeRaw(
          `INSERT INTO game_access_rules (
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
             updated_at = now()`
        );
      } catch (error) {
        this.logger.warn(`Unable to seed access rule ${rule.gameId}: ${String(error)}`);
      }
    }
  }

  private clean(value?: string | null) {
    const normalized = String(value || '').trim();
    return normalized || null;
  }

  private escape(value: string) {
    return value.replace(/'/g, "''");
  }
}

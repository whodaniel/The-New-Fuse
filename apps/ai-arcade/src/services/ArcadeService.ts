const DEFAULT_MUSIC_APP_URL =
  import.meta.env.VITE_MUSIC_APP_URL || 'https://open-audio-deck-production.up.railway.app';

const DEFAULT_MERKABA_LAB_URL =
  import.meta.env.VITE_MERKABA_LAB_URL || 'https://ai-arcade.xyz/#merkaba-lab';

const DEFAULT_POOL_VARIATIONS_URL =
  import.meta.env.VITE_POOL_VARIATIONS_URL || 'https://ai-arcade.xyz/#pool-variations';

const DEFAULT_CASIN8_POKER_URL =
  import.meta.env.VITE_CASIN8_POKER_URL || 'https://poker.ai-arcade.xyz';
const DEFAULT_CASIN8_BLACKJACK_URL =
  import.meta.env.VITE_CASIN8_BLACKJACK_URL || 'https://blackjack.ai-arcade.xyz';
const DEFAULT_CASIN8_ROULETTE_URL =
  import.meta.env.VITE_CASIN8_ROULETTE_URL || 'https://roulette.ai-arcade.xyz';
const DEFAULT_CASIN8_SLOTS_URL =
  import.meta.env.VITE_CASIN8_SLOTS_URL || 'https://slots.ai-arcade.xyz';

type CatalogKind =
  | 'experience'
  | 'workflow'
  | 'mcp_server'
  | 'skill'
  | 'prompt'
  | 'agent_template'
  | 'agent'
  | 'model'
  | 'unknown';

type PublicationStatus = 'draft' | 'review' | 'published' | 'archived';

type ExperienceCategory =
  | 'games'
  | 'music'
  | 'content'
  | 'social'
  | 'social-toys'
  | 'pooltogether'
  | 'community'
  | 'lab';

export interface AgentListing {
  id: string;
  name: string;
  description: string;
  type: 'CODER' | 'ANALYZER' | 'STRATEGIST' | 'GENERIC' | 'GAME' | 'SOCIAL' | 'CONTENT';
  pricePerRun: number;
  payPalPlanId?: string;
  avatarUrl: string;
  rating: number;
  capabilities: string[];
  category: ExperienceCategory;
  tags: string[];
  status: 'online' | 'busy' | 'offline';
  totalRuns: number;
  successRate: number;
  experienceKind?: 'chat' | 'music' | 'app';
  launchUrl?: string;
  kind: 'experience';
  publicationStatus: 'published';
}

const EXPERIENCE_CATEGORIES = new Set<ExperienceCategory>([
  'games',
  'music',
  'content',
  'social',
  'social-toys',
  'pooltogether',
  'community',
  'lab',
]);

const PRIMITIVE_MARKERS = [
  'mcp',
  'server',
  'skill',
  'prompt',
  'template',
  'model',
  'coder',
  'code',
  'analyz',
  'strateg',
  'reasoning',
  'orchestrat',
  'director',
  'workflow',
];

const BLOCKED_PRIMITIVE_NAMES = [
  'qwen3 coder next',
  'deepseek r1',
  'tnf director',
  'data wizard',
  'content creator pro',
  'code review sentinel',
];

function sanitizeText(value: unknown, max = 400): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export class ArcadeService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl || 'https://mcp-drs-api-production.up.railway.app/api';
  }

  async getFeaturedAgents(): Promise<AgentListing[]> {
    const candidates = await this.fetchCatalogCandidates();

    for (const rawItems of candidates) {
      const experiences = rawItems
        .filter((item) => this.isPublishedExperience(item))
        .map((item) => this.transformServerToAgent(item));

      if (experiences.length > 0) {
        return this.mergePinnedExperiences(experiences);
      }
    }

    return this.mergePinnedExperiences(this.getMockAgents());
  }

  async getAgentById(id: string): Promise<AgentListing | null> {
    const featured = await this.getFeaturedAgents();
    return featured.find((item) => item.id === id) || null;
  }

  async searchAgents(
    query: string,
    filters?: {
      type?: string;
      category?: string;
      minRating?: number;
      maxPrice?: number;
    }
  ): Promise<AgentListing[]> {
    const experiences = await this.getFeaturedAgents();

    return experiences.filter((agent) => {
      const matchesQuery =
        !query ||
        agent.name.toLowerCase().includes(query.toLowerCase()) ||
        agent.description.toLowerCase().includes(query.toLowerCase());
      const matchesType = !filters?.type || filters.type === 'all' || agent.type === filters.type;
      const matchesCategory =
        !filters?.category ||
        filters.category === 'all' ||
        agent.category === filters.category ||
        agent.capabilities.some((c) => c.toLowerCase().includes(filters.category!.toLowerCase()));
      const matchesRating = !filters?.minRating || agent.rating >= filters.minRating;
      const matchesPrice = !filters?.maxPrice || agent.pricePerRun <= filters.maxPrice;

      return matchesQuery && matchesType && matchesCategory && matchesRating && matchesPrice;
    });
  }

  private async fetchCatalogCandidates(): Promise<any[][]> {
    const endpoints = [
      `${this.apiUrl}/marketplace/catalog?kind=experience&status=published`,
      `${this.apiUrl}/marketplace/experiences`,
      `${this.apiUrl}/servers`,
    ];

    const collections: any[][] = [];

    for (const endpoint of endpoints) {
      const data = await this.fetchJson(endpoint);
      const items = this.extractCollection(data);
      if (items.length > 0) {
        collections.push(items);
      }
    }

    return collections;
  }

  private async fetchJson(url: string): Promise<any | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch arcade catalog from ${url}:`, error);
      return null;
    }
  }

  private extractCollection(data: any): any[] {
    if (!data) {
      return [];
    }

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.data)) {
      return data.data;
    }

    if (Array.isArray(data.items)) {
      return data.items;
    }

    if (Array.isArray(data.results)) {
      return data.results;
    }

    return [];
  }

  private isPublishedExperience(item: any): boolean {
    const kind = this.inferCatalogKind(item);
    const publicationStatus = this.inferPublicationStatus(item);

    if (kind !== 'experience' || publicationStatus !== 'published') {
      return false;
    }

    const category = this.normalizeCategory(item?.category);
    if (!EXPERIENCE_CATEGORIES.has(category)) {
      return false;
    }

    if (this.looksLikePrimitive(item)) {
      return false;
    }

    return true;
  }

  private looksLikePrimitive(item: any): boolean {
    const name = sanitizeText(item?.name, 200).toLowerCase();
    const description = sanitizeText(item?.description, 5000).toLowerCase();
    const type = sanitizeText(item?.type, 40).toUpperCase();
    const tokens = Array.from(this.getTokenSet(item));

    if (BLOCKED_PRIMITIVE_NAMES.some((blocked) => name === blocked)) {
      return true;
    }

    if (type === 'CODER' || type === 'ANALYZER' || type === 'STRATEGIST' || type === 'GENERIC') {
      return true;
    }

    const haystack = `${name} ${description} ${tokens.join(' ')}`;
    return PRIMITIVE_MARKERS.some((marker) => haystack.includes(marker));
  }

  private inferCatalogKind(item: any): CatalogKind {
    const explicitKind = String(item?.kind || item?.resourceKind || '').toLowerCase();
    if (explicitKind) {
      if (explicitKind === 'experience') {
        return 'experience';
      }
      if (
        explicitKind === 'workflow' ||
        explicitKind === 'mcp_server' ||
        explicitKind === 'skill' ||
        explicitKind === 'prompt' ||
        explicitKind === 'agent_template' ||
        explicitKind === 'agent' ||
        explicitKind === 'model'
      ) {
        return explicitKind;
      }
      return 'unknown';
    }

    const tokens = this.getTokenSet(item);

    // If no explicit kind, infer experience unless primitive markers dominate.
    const hasPrimitiveSignal = PRIMITIVE_MARKERS.some((marker) =>
      Array.from(tokens).some((token) => token.includes(marker))
    );

    if (hasPrimitiveSignal) {
      return 'unknown';
    }

    return 'experience';
  }

  private inferPublicationStatus(item: any): PublicationStatus {
    const raw = String(item?.publicationStatus || item?.status || 'published').toLowerCase();
    if (raw === 'draft' || raw === 'review' || raw === 'published' || raw === 'archived') {
      return raw;
    }

    // Preserve old online/busy/offline runtime statuses as published visibility.
    if (raw === 'online' || raw === 'busy' || raw === 'offline') {
      return 'published';
    }

    return 'published';
  }

  private getTokenSet(item: any): Set<string> {
    const tags = Array.isArray(item?.tags)
      ? item.tags.map((tag: string) => String(tag).toLowerCase())
      : [];
    const category = String(item?.category || '').toLowerCase();
    const capabilities = Array.isArray(item?.capabilities)
      ? item.capabilities.map((cap: string) => String(cap).toLowerCase())
      : [];

    return new Set([...tags, category, ...capabilities]);
  }

  private normalizeCategory(rawCategory: unknown): ExperienceCategory {
    const category = String(rawCategory || '').toLowerCase();

    if (category === 'game' || category === 'games') return 'games';
    if (category === 'music' || category === 'audio') return 'music';
    if (category === 'content' || category === 'creator') return 'content';
    if (category === 'social' || category === 'chat') return 'social';
    if (category === 'social-toys' || category === 'social_toys') return 'social-toys';
    if (category === 'pool' || category === 'pooltogether') return 'pooltogether';
    if (category === 'community' || category === 'ugc') return 'community';
    if (category === 'lab' || category === 'labs') return 'lab';

    return 'games';
  }

  private transformServerToAgent(server: any): AgentListing {
    const tags = Array.isArray(server?.tags) ? server.tags : [];
    const category = this.normalizeCategory(server?.category);
    const isMusic = category === 'music';
    const isAppExperience =
      category === 'music' || category === 'pooltogether' || category === 'lab';

    return {
      id: server.id || server.slug || server.name,
      name: server.name,
      description: server.description || 'No description available.',
      type: this.inferAgentType(tags, category),
      pricePerRun: Number(server.price ?? server.pricePerRun ?? 0),
      payPalPlanId: server.payPalPlanId || 'P-3WD251534W148423SNFXJQVI',
      avatarUrl:
        server.avatar_url || server.avatarUrl || `/assets/agents/unique/${server.name}.png`,
      rating: Number(server.rating ?? 4.8),
      capabilities: Array.isArray(server.capabilities) ? server.capabilities : [],
      category,
      tags,
      status: (server.status === 'busy' || server.status === 'offline'
        ? server.status
        : 'online') as 'online' | 'busy' | 'offline',
      totalRuns: Number(server.total_runs ?? server.totalRuns ?? Math.floor(Math.random() * 10000)),
      successRate: Number(server.success_rate ?? server.successRate ?? 95 + Math.random() * 5),
      experienceKind: isMusic ? 'music' : isAppExperience ? 'app' : 'chat',
      launchUrl: server.launchUrl || server.launch_url || undefined,
      kind: 'experience',
      publicationStatus: 'published',
    };
  }

  private inferAgentType(tags: string[] = [], category: ExperienceCategory): AgentListing['type'] {
    const tagLower = tags.map((t) => String(t).toLowerCase());

    if (category === 'games' || tagLower.some((t) => t.includes('game') || t.includes('play'))) {
      return 'GAME';
    }

    if (
      category === 'social' ||
      category === 'social-toys' ||
      category === 'community' ||
      tagLower.some((t) => t.includes('social') || t.includes('companion') || t.includes('chat'))
    ) {
      return 'SOCIAL';
    }

    if (category === 'content' || category === 'music') {
      return 'CONTENT';
    }

    return 'GAME';
  }

  private getPinnedExperiences(): AgentListing[] {
    return [
      {
        id: 'casin8-poker',
        name: 'Casin8 Poker',
        description: 'Direct launch into Casin8 poker tables.',
        type: 'GAME',
        pricePerRun: 0,
        avatarUrl: '/assets/agents/unique/Casin8.png',
        rating: 4.8,
        capabilities: ['poker', 'tournaments', 'table-play'],
        category: 'games',
        tags: ['casin8', 'poker', 'casino'],
        status: 'online',
        totalRuns: 0,
        successRate: 98.0,
        experienceKind: 'app',
        launchUrl: DEFAULT_CASIN8_POKER_URL,
        kind: 'experience',
        publicationStatus: 'published',
      },
      {
        id: 'casin8-blackjack',
        name: 'Casin8 Blackjack',
        description: 'Direct launch into Casin8 blackjack action.',
        type: 'GAME',
        pricePerRun: 0,
        avatarUrl: '/assets/agents/unique/Casin8.png',
        rating: 4.8,
        capabilities: ['blackjack', 'house-rules', 'streaks'],
        category: 'games',
        tags: ['casin8', 'blackjack', 'casino'],
        status: 'online',
        totalRuns: 0,
        successRate: 98.0,
        experienceKind: 'app',
        launchUrl: DEFAULT_CASIN8_BLACKJACK_URL,
        kind: 'experience',
        publicationStatus: 'published',
      },
      {
        id: 'casin8-roulette',
        name: 'Casin8 Roulette',
        description: 'Direct launch into Casin8 roulette wheel games.',
        type: 'GAME',
        pricePerRun: 0,
        avatarUrl: '/assets/agents/unique/Casin8.png',
        rating: 4.8,
        capabilities: ['roulette', 'wheel-spin', 'number-bets'],
        category: 'games',
        tags: ['casin8', 'roulette', 'casino'],
        status: 'online',
        totalRuns: 0,
        successRate: 98.0,
        experienceKind: 'app',
        launchUrl: DEFAULT_CASIN8_ROULETTE_URL,
        kind: 'experience',
        publicationStatus: 'published',
      },
      {
        id: 'casin8-slots',
        name: 'Casin8 Slots',
        description: 'Direct launch into Casin8 slots machines.',
        type: 'GAME',
        pricePerRun: 0,
        avatarUrl: '/assets/agents/unique/Casin8.png',
        rating: 4.8,
        capabilities: ['slots', 'reels', 'jackpots'],
        category: 'games',
        tags: ['casin8', 'slots', 'casino'],
        status: 'online',
        totalRuns: 0,
        successRate: 98.0,
        experienceKind: 'app',
        launchUrl: DEFAULT_CASIN8_SLOTS_URL,
        kind: 'experience',
        publicationStatus: 'published',
      },
    ];
  }

  private mergePinnedExperiences(items: AgentListing[]): AgentListing[] {
    const pinned = this.getPinnedExperiences();
    const seen = new Set<string>();
    const merged: AgentListing[] = [];

    for (const item of [...pinned, ...items]) {
      if (seen.has(item.id)) {
        continue;
      }
      seen.add(item.id);
      merged.push(item);
    }

    return merged;
  }

  private getMockAgents(): AgentListing[] {
    return [
      {
        id: 'open-audio-deck',
        name: 'Open Audio Deck',
        description:
          'Spotify-style Audius client for streaming trending tracks and searching the Open Audio catalog.',
        type: 'CONTENT',
        pricePerRun: 0,
        avatarUrl: '/assets/agents/unique/Open-Audio-Deck.png',
        rating: 4.9,
        capabilities: ['music_streaming', 'audius_search', 'playlist_discovery'],
        category: 'music',
        tags: ['music', 'audius', 'streaming'],
        status: 'online',
        totalRuns: 4200,
        successRate: 99.2,
        experienceKind: 'music',
        launchUrl: DEFAULT_MUSIC_APP_URL,
        kind: 'experience',
        publicationStatus: 'published',
      },
      {
        id: 'merkaba-lab-pool',
        name: 'Merkaba Lab',
        description:
          'PoolTogether-inspired experimental arcade where players spin through dynamic yield pool strategies.',
        type: 'GAME',
        pricePerRun: 0,
        avatarUrl: '/assets/agents/unique/Merkaba-Lab.png',
        rating: 4.8,
        capabilities: ['pool_variations', 'jackpot_cycles', 'strategy_simulation'],
        category: 'pooltogether',
        tags: ['pooltogether', 'merkaba', 'yield-game'],
        status: 'online',
        totalRuns: 13370,
        successRate: 98.4,
        experienceKind: 'app',
        launchUrl: DEFAULT_MERKABA_LAB_URL,
        kind: 'experience',
        publicationStatus: 'published',
      },
      {
        id: 'sidepot-sprint',
        name: 'Sidepot Sprint',
        description:
          'Fast-play tournament variant where players race sidepot events and compete for rotating prize hooks.',
        type: 'GAME',
        pricePerRun: 0.01,
        avatarUrl: '/assets/agents/unique/Sidepot-Sprint.png',
        rating: 4.7,
        capabilities: ['multiplayer', 'pool_strategy', 'micro_challenges'],
        category: 'pooltogether',
        tags: ['pooltogether', 'sidepot', 'multiplayer'],
        status: 'online',
        totalRuns: 8090,
        successRate: 97.8,
        experienceKind: 'app',
        launchUrl: DEFAULT_POOL_VARIATIONS_URL,
        kind: 'experience',
        publicationStatus: 'published',
      },
      {
        id: 'arcade-game-master',
        name: 'Arcade Game Master',
        description:
          'Interactive game host for trivia, adventures, and multiplayer party experiences.',
        type: 'GAME',
        pricePerRun: 0.02,
        avatarUrl: '/assets/agents/unique/Game-Master.png',
        rating: 4.9,
        capabilities: ['trivia', 'storytelling', 'multiplayer'],
        category: 'games',
        tags: ['game', 'party', 'interactive'],
        status: 'online',
        totalRuns: 45000,
        successRate: 99.5,
        experienceKind: 'chat',
        kind: 'experience',
        publicationStatus: 'published',
      },
      {
        id: 'content-creator-live',
        name: 'Content Creator Live',
        description:
          'Collaborative content jam booth for blog ideas, memes, social snippets, and creator prompts.',
        type: 'CONTENT',
        pricePerRun: 0.03,
        avatarUrl: '/assets/agents/unique/Content-Creator.png',
        rating: 4.6,
        capabilities: ['content_jam', 'prompt_remix', 'social_snippets'],
        category: 'content',
        tags: ['content', 'creator', 'remix'],
        status: 'online',
        totalRuns: 28500,
        successRate: 95.2,
        experienceKind: 'chat',
        kind: 'experience',
        publicationStatus: 'published',
      },
      {
        id: 'social-butterfly',
        name: 'Social Butterfly',
        description: 'AI companion booth for playful conversations and social toy interactions.',
        type: 'SOCIAL',
        pricePerRun: 0.01,
        avatarUrl: '/assets/agents/unique/Social-Butterfly.png',
        rating: 4.8,
        capabilities: ['conversation', 'social_toys', 'companionship'],
        category: 'social-toys',
        tags: ['social', 'toys', 'chat'],
        status: 'online',
        totalRuns: 62000,
        successRate: 98.9,
        experienceKind: 'chat',
        kind: 'experience',
        publicationStatus: 'published',
      },
      {
        id: 'community-neon-kart',
        name: 'Community Neon Kart',
        description:
          'Community-created mini-game spotlight. User-generated tracks rotate daily in a retro neon race mode.',
        type: 'GAME',
        pricePerRun: 0,
        avatarUrl: '/assets/agents/unique/Community-Neon-Kart.png',
        rating: 4.5,
        capabilities: ['ugc_game', 'daily_rotations', 'leaderboards'],
        category: 'community',
        tags: ['community', 'ugc', 'arcade'],
        status: 'online',
        totalRuns: 7310,
        successRate: 96.9,
        experienceKind: 'app',
        launchUrl: 'https://ai-arcade.xyz/#community-neon-kart',
        kind: 'experience',
        publicationStatus: 'published',
      },
    ];
  }
}

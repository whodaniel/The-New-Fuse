const DEFAULT_MUSIC_APP_URL =
  import.meta.env.VITE_MUSIC_APP_URL || 'https://open-audio-deck-production.up.railway.app';

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
  category: string;
  tags: string[];
  status: 'online' | 'busy' | 'offline';
  totalRuns: number;
  successRate: number;
  experienceKind?: 'chat' | 'music' | 'app';
  launchUrl?: string;
}

export class ArcadeService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl || 'https://mcp-drs-api-production.up.railway.app/api';
  }

  async getFeaturedAgents(): Promise<AgentListing[]> {
    try {
      const response = await fetch(`${this.apiUrl}/servers`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data.map((server: any) => this.transformServerToAgent(server));
        }
      }

      // Fallback to mock data if API fails
      return this.getMockAgents();
    } catch (error) {
      console.error('Failed to fetch arcade agents:', error);
      return this.getMockAgents();
    }
  }

  async getAgentById(id: string): Promise<AgentListing | null> {
    try {
      const response = await fetch(`${this.apiUrl}/servers/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return this.transformServerToAgent(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch agent:', error);
    }
    return null;
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
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.minRating) params.append('minRating', filters.minRating.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());

      const response = await fetch(`${this.apiUrl}/servers/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data.map((server: any) => this.transformServerToAgent(server));
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    }

    // Fallback to local search on mock data
    const agents = this.getMockAgents();
    return agents.filter((agent) => {
      const matchesQuery =
        !query ||
        agent.name.toLowerCase().includes(query.toLowerCase()) ||
        agent.description.toLowerCase().includes(query.toLowerCase());
      const matchesType = !filters?.type || filters.type === 'all' || agent.type === filters.type;
      const matchesCategory =
        !filters?.category ||
        filters.category === 'all' ||
        agent.category === filters.category ||
        agent.capabilities.some((c) => c.toLowerCase().includes(filters.category.toLowerCase()));
      const matchesRating = !filters?.minRating || agent.rating >= filters.minRating;
      const matchesPrice = !filters?.maxPrice || agent.pricePerRun <= filters.maxPrice;

      return matchesQuery && matchesType && matchesCategory && matchesRating && matchesPrice;
    });
  }

  private transformServerToAgent(server: any): AgentListing {
    return {
      id: server.id || server.name,
      name: server.name,
      description: server.description || 'No description available.',
      type: this.inferAgentType(server.tags),
      pricePerRun: server.price || 0.05,
      payPalPlanId: server.payPalPlanId || 'P-3WD251534W148423SNFXJQVI',
      avatarUrl: server.avatar_url || `/assets/agents/unique/${server.name}.png`,
      rating: server.rating || 4.8,
      capabilities: server.capabilities || [],
      category: server.category || 'general',
      tags: server.tags || [],
      status: server.status || 'online',
      totalRuns: server.total_runs || Math.floor(Math.random() * 10000),
      successRate: server.success_rate || 95 + Math.random() * 5,
      experienceKind: 'chat',
    };
  }

  private inferAgentType(tags: string[] = []): AgentListing['type'] {
    const tagLower = tags.map((t) => t.toLowerCase());
    if (tagLower.some((t) => t.includes('coder') || t.includes('code'))) return 'CODER';
    if (tagLower.some((t) => t.includes('analyz') || t.includes('data'))) return 'ANALYZER';
    if (tagLower.some((t) => t.includes('strateg') || t.includes('plan'))) return 'STRATEGIST';
    if (tagLower.some((t) => t.includes('game') || t.includes('play'))) return 'GAME';
    if (tagLower.some((t) => t.includes('social') || t.includes('chat'))) return 'SOCIAL';
    if (tagLower.some((t) => t.includes('content') || t.includes('write'))) return 'CONTENT';
    return 'GENERIC';
  }

  private getMockAgents(): AgentListing[] {
    return [
      {
        id: 'open-audio-spotify',
        name: 'Open Audio Deck',
        description:
          'Spotify-style Audius client for streaming trending tracks and searching the Open Audio catalog.',
        type: 'CONTENT',
        pricePerRun: 0,
        avatarUrl: '/assets/agents/unique/Open-Audio-Deck.png',
        rating: 4.9,
        capabilities: [
          'music_streaming',
          'audius_search',
          'open_audio_protocol',
          'playlist_discovery',
        ],
        category: 'music',
        tags: ['music', 'audius', 'streaming', 'open-audio-protocol'],
        status: 'online',
        totalRuns: 4200,
        successRate: 99.2,
        experienceKind: 'music',
        launchUrl: DEFAULT_MUSIC_APP_URL,
      },
      {
        id: 'qwen-coder-next',
        name: 'Qwen3 Coder Next',
        description: 'Optimized for high-speed agentic coding and complex repository analysis.',
        type: 'CODER',
        pricePerRun: 0.05,
        payPalPlanId: 'P-3WD251534W148423SNFXJQVI',
        avatarUrl: '/assets/agents/unique/Qwen3-Coder-Next.png',
        rating: 4.9,
        capabilities: ['code_generation', 'repository_analysis', 'bug_hunting', 'refactoring'],
        category: 'code',
        tags: ['coder', 'development', 'ai'],
        status: 'online',
        totalRuns: 15420,
        successRate: 98.2,
        experienceKind: 'chat',
      },
      {
        id: 'deepseek-r1',
        name: 'DeepSeek R1',
        description: 'Thinking-class model for complex reasoning and mathematical proofing.',
        type: 'STRATEGIST',
        pricePerRun: 0.1,
        payPalPlanId: 'P-3WD251534W148423SNFXJQVI',
        avatarUrl: '/assets/agents/unique/DeepSeek-R1.png',
        rating: 4.8,
        capabilities: ['reasoning', 'complex_planning', 'mathematics', 'proof_verification'],
        category: 'analytics',
        tags: ['strategist', 'reasoning', 'math'],
        status: 'online',
        totalRuns: 8750,
        successRate: 97.5,
        experienceKind: 'chat',
      },
      {
        id: 'tnf-director',
        name: 'TNF Director',
        description: 'Master orchestrator for multi-agent swarms and complex workflow delegation.',
        type: 'GENERIC',
        pricePerRun: 0.25,
        payPalPlanId: 'P-3WD251534W148423SNFXJQVI',
        avatarUrl: '/assets/agents/unique/TNF-Director.png',
        rating: 5.0,
        capabilities: ['orchestration', 'delegation', 'swarm_management', 'workflow_design'],
        category: 'code',
        tags: ['orchestrator', 'workflow', 'multi-agent'],
        status: 'online',
        totalRuns: 3200,
        successRate: 99.1,
        experienceKind: 'chat',
      },
      {
        id: 'data-wizard',
        name: 'Data Wizard',
        description: 'Transform and analyze your data with powerful visualization capabilities.',
        type: 'ANALYZER',
        pricePerRun: 0.08,
        avatarUrl: '/assets/agents/unique/Data-Wizard.png',
        rating: 4.7,
        capabilities: ['data_analysis', 'visualization', 'statistics', 'reporting'],
        category: 'analytics',
        tags: ['analytics', 'data', 'visualization'],
        status: 'online',
        totalRuns: 12100,
        successRate: 96.8,
        experienceKind: 'chat',
      },
      {
        id: 'content-creator',
        name: 'Content Creator Pro',
        description: 'Generate engaging content for blogs, social media, and marketing materials.',
        type: 'CONTENT',
        pricePerRun: 0.03,
        avatarUrl: '/assets/agents/unique/Content-Creator.png',
        rating: 4.6,
        capabilities: ['content_writing', 'copywriting', 'seo_optimization', 'editing'],
        category: 'content',
        tags: ['content', 'writing', 'marketing'],
        status: 'online',
        totalRuns: 28500,
        successRate: 95.2,
        experienceKind: 'chat',
      },
      {
        id: 'game-master',
        name: 'Arcade Game Master',
        description: 'Interactive game host for trivia, adventures, and multiplayer experiences.',
        type: 'GAME',
        pricePerRun: 0.02,
        avatarUrl: '/assets/agents/unique/Game-Master.png',
        rating: 4.9,
        capabilities: ['game_hosting', 'trivia', 'storytelling', 'multiplayer'],
        category: 'games',
        tags: ['game', 'entertainment', 'interactive'],
        status: 'online',
        totalRuns: 45000,
        successRate: 99.5,
        experienceKind: 'chat',
      },
      {
        id: 'social-butterfly',
        name: 'Social Butterfly',
        description: 'Your AI companion for engaging conversations and social interactions.',
        type: 'SOCIAL',
        pricePerRun: 0.01,
        avatarUrl: '/assets/agents/unique/Social-Butterfly.png',
        rating: 4.8,
        capabilities: ['conversation', 'emotional_support', 'entertainment', 'companionship'],
        category: 'social',
        tags: ['social', 'chat', 'companion'],
        status: 'online',
        totalRuns: 62000,
        successRate: 98.9,
        experienceKind: 'chat',
      },
      {
        id: 'code-reviewer',
        name: 'Code Review Sentinel',
        description: 'Automated code review with security analysis and best practices enforcement.',
        type: 'CODER',
        pricePerRun: 0.06,
        avatarUrl: '/assets/agents/unique/Code-Reviewer.png',
        rating: 4.7,
        capabilities: ['code_review', 'security_analysis', 'best_practices', 'documentation'],
        category: 'code',
        tags: ['coder', 'review', 'security'],
        status: 'online',
        totalRuns: 9800,
        successRate: 97.3,
        experienceKind: 'chat',
      },
    ];
  }
}

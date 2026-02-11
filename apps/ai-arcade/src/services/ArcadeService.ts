export interface AgentListing {
  id: string;
  name: string;
  description: string;
  type: 'CODER' | 'ANALYZER' | 'STRATEGIST' | 'GENERIC';
  pricePerRun: number;
  payPalPlanId?: string; // Added for PayPal integration
  avatarUrl: string;
  rating: number;
  capabilities: string[];
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
        // Transform the DRS API response into AgentListings
        if (data.success && Array.isArray(data.data)) {
          return data.data.map((server: any) => ({
            id: server.id || server.name,
            name: server.name,
            description: server.description || 'No description available.',
            type: server.tags?.includes('coder') ? 'CODER' : 'GENERIC',
            pricePerRun: server.price || 0.05,
            payPalPlanId: server.payPalPlanId || 'P-3WD251534W148423SNFXJQVI',
            avatarUrl: server.avatar_url || `/assets/agents/unique/${server.name}.png`,
            rating: 5.0,
            capabilities: server.capabilities || [],
          }));
        }
      }

      // Fallback to mock data if API fails or returns empty
      return [
        {
          id: 'qwen-coder-next',
          name: 'Qwen3 Coder Next',
          description: 'Optimized for high-speed agentic coding and complex repository analysis.',
          type: 'CODER',
          pricePerRun: 0.05,
          payPalPlanId: 'P-3WD251534W148423SNFXJQVI',
          avatarUrl: '/assets/agents/unique/Qwen3-Coder-Next.png',
          rating: 4.9,
          capabilities: ['code_generation', 'repository_analysis', 'bug_hunting'],
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
          capabilities: ['reasoning', 'complex_planning', 'mathematics'],
        },
        {
          id: 'tnf-director',
          name: 'TNF Director',
          description:
            'Master orchestrator for multi-agent swarms and complex workflow delegation.',
          type: 'GENERIC',
          pricePerRun: 0.25,
          payPalPlanId: 'P-3WD251534W148423SNFXJQVI',
          avatarUrl: '/assets/agents/unique/TNF-Director.png',
          rating: 5.0,
          capabilities: ['orchestration', 'delegation', 'swarm_management'],
        },
      ];
    } catch (error) {
      console.error('Failed to fetch arcade agents:', error);
      return [];
    }
  }
}

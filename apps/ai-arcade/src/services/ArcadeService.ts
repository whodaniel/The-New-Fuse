export interface AgentListing {
  id: string;
  name: string;
  description: string;
  type: 'CODER' | 'ANALYZER' | 'STRATEGIST' | 'GENERIC';
  pricePerRun: number;
  avatarUrl: string;
  rating: number;
  capabilities: string[];
}

export class ArcadeService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async getFeaturedAgents(): Promise<AgentListing[]> {
    try {
      // For now, return mock data that matches the TNF ecosystem
      // Later, this will fetch from the TNF Marketplace API
      return [
        {
          id: 'qwen-coder-next',
          name: 'Qwen3 Coder Next',
          description: 'Optimized for high-speed agentic coding and complex repository analysis.',
          type: 'CODER',
          pricePerRun: 0.05,
          avatarUrl: '/assets/agents/unique/Qwen3-Coder-Next.png',
          rating: 4.9,
          capabilities: ['code_generation', 'repository_analysis', 'bug_hunting']
        },
        {
          id: 'deepseek-r1',
          name: 'DeepSeek R1',
          description: 'Thinking-class model for complex reasoning and mathematical proofing.',
          type: 'STRATEGIST',
          pricePerRun: 0.10,
          avatarUrl: '/assets/agents/unique/DeepSeek-R1.png',
          rating: 4.8,
          capabilities: ['reasoning', 'complex_planning', 'mathematics']
        },
        {
          id: 'tnf-director',
          name: 'TNF Director',
          description: 'Master orchestrator for multi-agent swarms and complex workflow delegation.',
          type: 'GENERIC',
          pricePerRun: 0.25,
          avatarUrl: '/assets/agents/unique/TNF-Director.png',
          rating: 5.0,
          capabilities: ['orchestration', 'delegation', 'swarm_management']
        }
      ];
    } catch (error) {
      console.error('Failed to fetch arcade agents:', error);
      return [];
    }
  }
}

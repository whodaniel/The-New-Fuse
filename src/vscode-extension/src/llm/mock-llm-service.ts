/**
 * Mock LLM Service for testing
 */

/**
 * Mock LLM Service implementation
 */
export class MockLLMService {
  /**
   * Generate a completion using the specified model and messages
   */
  async generateCompletion(params: {
    model: string;
    messages: Array<{role: string, content: string}>;
    temperature?: number;
    max_tokens?: number;
    response_format?: {type: string};
  }): Promise<any> {
    // Extract the claim from the messages
    const userMessage = params.messages.find(m => m.role === 'user')?.content || '';
    const claimMatch = userMessage.match(/"([^"]+)"/);
    const claim = claimMatch ? claimMatch[1] : 'Unknown claim';
    
    // Determine verification result based on the claim content
    let status: 'verified' | 'refuted' | 'unverified' | 'insufficient_data';
    let confidenceScore: number;
    
    if (claim.toLowerCase().includes('verified')) {
      status = 'verified';
      confidenceScore = 0.9;
    } else if (claim.toLowerCase().includes('refuted')) {
      status = 'refuted';
      confidenceScore = 0.8;
    } else if (claim.toLowerCase().includes('insufficient')) {
      status = 'insufficient_data';
      confidenceScore = 0.3;
    } else {
      status = 'unverified';
      confidenceScore = 0.5;
    }
    
    // Generate mock sources
    const sources = [
      {
        name: 'Mock Source 1',
        url: 'https://example.com/source1',
        type: 'official',
        reliability: 0.9,
        excerpt: `This source ${status === 'verified' ? 'confirms' : status === 'refuted' ? 'refutes' : 'partially addresses'} the claim.`
      }
    ];
    
    // Add a second source for verified claims
    if (status === 'verified') {
      sources.push({
        name: 'Mock Source 2',
        url: 'https://example.com/source2',
        type: 'academic',
        reliability: 0.95,
        excerpt: 'This academic source provides additional confirmation of the claim.'
      });
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock response
    return {
      status,
      confidenceScore,
      explanation: `This claim is ${status} based on the available sources.`,
      sources
    };
  }
}

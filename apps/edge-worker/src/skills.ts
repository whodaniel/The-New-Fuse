import { z } from 'zod';

// Input Schemas
export const ResearchTopicSchema = z.object({
  topic: z.string().describe("The topic to research"),
  depth: z.number().optional().default(1).describe("Depth of research (1-3)"),
});

export const MemorySchema = z.object({
  content: z.string().describe("The text content to remember"),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const RecallSchema = z.object({
  query: z.string().describe("The query to search memory for"),
  limit: z.number().optional().default(3),
});

export const GenerateReportSchema = z.object({
  topic: z.string(),
  filename: z.string().optional(),
});

// Skill Implementations
export class EdgeSkills {
  constructor(private env: any) {}

  /**
   * Research Skill: AI + Browser (Simulated)
   * In a full version, this would use Puppeteer to visit search engines.
   */
  async researchTopic(params: z.infer<typeof ResearchTopicSchema>) {
    const { topic, depth } = params;
    
    // 1. Plan Research with AI
    const planResponse = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt: `Plan a research strategy for: "${topic}". Return 3 search queries as a JSON array.`,
    });
    
    // (Mocking the search results for reliability in this demo)
    const mockSearchResults = [
      `Result for ${topic} - Source A`,
      `Result for ${topic} - Source B`,
      `Result for ${topic} - Source C`
    ];

    // 2. Synthesize Findings
    const synthesis = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt: `Synthesize these findings into a concise summary about "${topic}":
${mockSearchResults.join('
')}`,
      max_tokens: 512
    });

    return {
      topic,
      depth,
      plan: planResponse.response,
      summary: synthesis.response
    };
  }

  /**
   * Memory Skill: Vectorize + AI Embeddings
   */
  async saveMemory(params: z.infer<typeof MemorySchema>) {
    const { content, metadata } = params;
    const id = crypto.randomUUID();

    // 1. Generate Embedding
    const embedding = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [content]
    });

    // 2. Save to Vectorize
    await this.env.VECTOR_INDEX.insert([
      {
        id,
        values: embedding.data[0],
        metadata: { ...metadata, content }
      }
    ]);

    return { success: true, id, content_preview: content.substring(0, 50) };
  }

  async recallMemory(params: z.infer<typeof RecallSchema>) {
    const { query, limit } = params;

    // 1. Generate Query Embedding
    const embedding = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [query]
    });

    // 2. Search Vectorize
    const matches = await this.env.VECTOR_INDEX.query(embedding.data[0], {
      topK: limit,
      returnValues: false,
      returnMetadata: true
    });

    return {
      query,
      matches: matches.matches.map((m: any) => ({
        score: m.score,
        content: m.metadata?.content,
        metadata: m.metadata
      }))
    };
  }

  /**
   * Content Creation Skill: AI + R2 Storage
   */
  async generateReport(params: z.infer<typeof GenerateReportSchema>) {
    const { topic } = params;
    const filename = params.filename || `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;

    // 1. Generate Report Content
    const report = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt: `Write a detailed markdown report about: ${topic}. Include a title, introduction, key points, and conclusion.`,
      max_tokens: 1024
    });

    // 2. Save to R2
    await this.env.ARTIFACTS.put(filename, report.response);

    return {
      success: true,
      filename,
      url: `/storage/${filename}`, // Relative URL handled by worker
      preview: report.response.substring(0, 100) + '...'
    };
  }
}

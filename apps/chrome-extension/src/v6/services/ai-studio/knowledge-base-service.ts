interface ConceptSource {
  videoId: string;
  videoTitle: string;
  timestamp: string;
  index: number;
}

interface Concept {
  title: string;
  content: string;
  category: string;
  keywords: string[];
  sources: ConceptSource[];
  firstSeen: string;
  lastUpdated: string;
}

interface ConceptWithScore extends Concept {
  relevanceScore: number;
}

interface KnowledgeBaseStats {
  totalConcepts: number;
  categories: number;
  conceptsByCategory: Record<string, number>;
  totalSources: number;
  averageSourcesPerConcept: string;
}

interface AddReportResult {
  conceptsAdded: number;
  totalConcepts: number;
}

interface ConsolidateResult {
  totalAdded: number;
  totalConcepts: number;
}

class KnowledgeBaseService {
  private knowledgeBase: Map<string, { content: string; timestamp: string; source: string }>;
  private categories: Set<string>;
  private concepts: Map<string, Concept>;

  constructor() {
    this.knowledgeBase = new Map();
    this.categories = new Set();
    this.concepts = new Map();
  }

  async addReport(reportContent: string, metadata: { videoId: string; videoTitle: string; timestamp: string; index: number }): Promise<AddReportResult> {
    const concepts = this.extractConcepts(reportContent);

    for (const concept of concepts) {
      await this.addOrUpdateConcept(concept, metadata);
    }

    return { conceptsAdded: concepts.length, totalConcepts: this.concepts.size };
  }

  extractConcepts(reportContent: string): Array<{ title: string; content: string; category: string; keywords: string[] }> {
    const concepts: Array<{ title: string; content: string; category: string; keywords: string[] }> = [];
    const sections = reportContent.split(/^#{2,3}\s+/m);

    for (const section of sections) {
      if (!section.trim()) continue;

      const lines = section.split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();

      if (this.isAIRelated(title + ' ' + content)) {
        concepts.push({
          title,
          content,
          category: this.categorize(title),
          keywords: this.extractKeywords(content),
        });
      }
    }

    return concepts;
  }

  isAIRelated(text: string): boolean {
    const aiKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
      'neural network', 'transformer', 'llm', 'large language model', 'gpt',
      'bert', 'diffusion', 'reinforcement learning', 'computer vision', 'nlp',
      'natural language processing', 'generative', 'model', 'training', 'inference',
      'embedding', 'attention', 'gradient', 'backpropagation', 'optimization',
      'loss', 'dataset', 'fine-tuning', 'prompt', 'token', 'vector',
    ];

    const lowerText = text.toLowerCase();
    return aiKeywords.some((keyword) => lowerText.includes(keyword));
  }

  categorize(title: string): string {
    const categories: Record<string, string[]> = {
      Architecture: ['architecture', 'model', 'network', 'layer', 'transformer'],
      Training: ['training', 'optimization', 'gradient', 'loss', 'backprop'],
      Techniques: ['technique', 'method', 'approach', 'strategy', 'algorithm'],
      Applications: ['application', 'use case', 'implementation', 'deployment'],
      Tools: ['tool', 'framework', 'library', 'platform', 'api'],
      Concepts: ['concept', 'theory', 'principle', 'idea', 'definition'],
      Research: ['research', 'paper', 'study', 'experiment', 'findings'],
      Performance: ['performance', 'benchmark', 'metric', 'evaluation', 'accuracy'],
    };

    const lowerTitle = title.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((kw) => lowerTitle.includes(kw))) return category;
    }
    return 'General';
  }

  extractKeywords(content: string): string[] {
    const words = content.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
    const freq: Record<string, number> = {};
    words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word]) => word);
  }

  async addOrUpdateConcept(concept: { title: string; content: string; category: string; keywords: string[] }, metadata: ConceptSource): Promise<void> {
    const key = this.generateKey(concept.title);
    const existing = this.concepts.get(key);

    if (!existing) {
      this.concepts.set(key, {
        ...concept,
        sources: [metadata],
        firstSeen: metadata.timestamp,
        lastUpdated: metadata.timestamp,
      });
      this.categories.add(concept.category);
    } else {
      if (metadata.index < existing.sources[0].index) {
        existing.content = concept.content;
        existing.lastUpdated = metadata.timestamp;
        existing.sources.unshift(metadata);
      } else {
        existing.sources.push(metadata);
      }
    }
  }

  generateKey(title: string): string {
    return title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
  }

  exportAsMarkdown(): string {
    let markdown = '# AI Knowledge Base\n\n';
    markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
    markdown += `**Total Concepts:** ${this.concepts.size}\n`;
    markdown += `**Categories:** ${Array.from(this.categories).join(', ')}\n\n`;
    markdown += '---\n\n';

    const byCategory = new Map<string, Concept[]>();
    for (const [, concept] of this.concepts) {
      if (!byCategory.has(concept.category)) byCategory.set(concept.category, []);
      byCategory.get(concept.category)!.push(concept);
    }

    for (const category of Array.from(byCategory.keys()).sort()) {
      markdown += `## ${category}\n\n`;
      const concepts = byCategory.get(category)!.sort((a, b) => a.title.localeCompare(b.title));

      for (const concept of concepts) {
        markdown += `### ${concept.title}\n\n${concept.content}\n\n`;
        markdown += `**Sources:** ${concept.sources.length} video(s)\n`;
        markdown += `**First Seen:** ${new Date(concept.firstSeen).toLocaleDateString()}\n`;
        markdown += `**Last Updated:** ${new Date(concept.lastUpdated).toLocaleDateString()}\n`;
        if (concept.keywords.length > 0) markdown += `**Keywords:** ${concept.keywords.join(', ')}\n`;
        markdown += '\n---\n\n';
      }
    }

    return markdown;
  }

  exportAsJSON(): string {
    return JSON.stringify({
      generated: new Date().toISOString(),
      totalConcepts: this.concepts.size,
      categories: Array.from(this.categories),
      concepts: Array.from(this.concepts.entries()).map(([key, concept]) => ({ key, ...concept })),
    }, null, 2);
  }

  search(query: string): ConceptWithScore[] {
    const lowerQuery = query.toLowerCase();
    const results: ConceptWithScore[] = [];

    for (const [, concept] of this.concepts) {
      const score = this.calculateRelevance(concept, lowerQuery);
      if (score > 0) results.push({ ...concept, relevanceScore: score });
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  calculateRelevance(concept: Concept, query: string): number {
    let score = 0;
    if (concept.title.toLowerCase().includes(query)) score += 10;
    if (concept.content.toLowerCase().includes(query)) score += 5;
    if (concept.keywords.some((kw) => kw.includes(query))) score += 3;
    if (concept.category.toLowerCase().includes(query)) score += 2;
    return score;
  }

  getStatistics(): KnowledgeBaseStats {
    const stats: KnowledgeBaseStats = {
      totalConcepts: this.concepts.size,
      categories: Array.from(this.categories).length,
      conceptsByCategory: {},
      totalSources: 0,
      averageSourcesPerConcept: '0',
    };

    for (const category of this.categories) stats.conceptsByCategory[category] = 0;
    for (const [, concept] of this.concepts) {
      stats.conceptsByCategory[concept.category]++;
      stats.totalSources += concept.sources.length;
    }
    stats.averageSourcesPerConcept = (stats.totalSources / stats.totalConcepts || 0).toFixed(2);

    return stats;
  }

  clear(): void {
    this.knowledgeBase.clear();
    this.categories.clear();
    this.concepts.clear();
  }

  async save(): Promise<boolean> {
    const data = {
      concepts: Array.from(this.concepts.entries()),
      categories: Array.from(this.categories),
      lastSaved: Date.now(),
    };
    await chrome.storage.local.set({ knowledgeBase: data });
    return true;
  }

  async load(): Promise<boolean> {
    const { knowledgeBase } = (await chrome.storage.local.get('knowledgeBase')) as { knowledgeBase?: any };
    if (knowledgeBase) {
      this.concepts = new Map(knowledgeBase.concepts);
      this.categories = new Set(knowledgeBase.categories);
      return true;
    }
    return false;
  }

  async consolidateAll(reports: Array<{ content: string; metadata: any }>): Promise<ConsolidateResult> {
    let totalAdded = 0;
    for (const report of reports) {
      if (report.content && report.metadata) {
        const result = await this.addReport(report.content, report.metadata);
        totalAdded += result.conceptsAdded;
      }
    }
    await this.save();
    return { totalAdded, totalConcepts: this.concepts.size };
  }
}

const knowledgeBaseService = new KnowledgeBaseService();
export default knowledgeBaseService;

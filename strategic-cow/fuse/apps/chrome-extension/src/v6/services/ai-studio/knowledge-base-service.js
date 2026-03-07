// Knowledge Base Consolidation Service
// Merges multiple AI Studio reports into a single, deduplicated knowledge base
// Keeps newest information, removes outdated concepts

class KnowledgeBaseService {
  constructor() {
    this.knowledgeBase = new Map(); // concept -> { content, timestamp, source }
    this.categories = new Set();
    this.concepts = new Map();
  }

  // Add a report to the knowledge base
  async addReport(reportContent, metadata) {
    const { videoId, videoTitle, timestamp, index } = metadata;

    // Parse the report into concepts
    const concepts = this.extractConcepts(reportContent);

    // Add or update each concept
    for (const concept of concepts) {
      await this.addOrUpdateConcept(concept, {
        videoId,
        videoTitle,
        timestamp,
        index,
      });
    }

    return {
      conceptsAdded: concepts.length,
      totalConcepts: this.concepts.size,
    };
  }

  // Extract concepts from a report
  extractConcepts(reportContent) {
    const concepts = [];

    // Split by headers (## or ###)
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

  // Check if content is AI-related
  isAIRelated(text) {
    const aiKeywords = [
      'ai',
      'artificial intelligence',
      'machine learning',
      'ml',
      'deep learning',
      'neural network',
      'transformer',
      'llm',
      'large language model',
      'gpt',
      'bert',
      'diffusion',
      'reinforcement learning',
      'computer vision',
      'nlp',
      'natural language processing',
      'generative',
      'model',
      'training',
      'inference',
      'embedding',
      'attention',
      'gradient',
      'backpropagation',
      'optimization',
      'loss',
      'dataset',
      'fine-tuning',
      'prompt',
      'token',
      'vector',
    ];

    const lowerText = text.toLowerCase();
    return aiKeywords.some((keyword) => lowerText.includes(keyword));
  }

  // Categorize a concept
  categorize(title) {
    const categories = {
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
      if (keywords.some((kw) => lowerTitle.includes(kw))) {
        return category;
      }
    }

    return 'General';
  }

  // Extract keywords from content
  extractKeywords(content) {
    // Simple keyword extraction (can be enhanced with NLP)
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);

    // Count frequency
    const freq = {};
    words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));

    // Get top keywords
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  // Add or update a concept
  async addOrUpdateConcept(concept, metadata) {
    const key = this.generateKey(concept.title);
    const existing = this.concepts.get(key);

    if (!existing) {
      // New concept
      this.concepts.set(key, {
        ...concept,
        sources: [metadata],
        firstSeen: metadata.timestamp,
        lastUpdated: metadata.timestamp,
      });
      this.categories.add(concept.category);
    } else {
      // Update existing concept if newer
      if (metadata.index < existing.sources[0].index) {
        // Newer video (lower index = newer in reverse chronological order)
        existing.content = concept.content;
        existing.lastUpdated = metadata.timestamp;
        existing.sources.unshift(metadata);
      } else {
        // Older video, just add as source
        existing.sources.push(metadata);
      }
    }
  }

  // Generate a unique key for a concept
  generateKey(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_');
  }

  // Export knowledge base as markdown
  exportAsMarkdown() {
    let markdown = '# AI Knowledge Base\n\n';
    markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
    markdown += `**Total Concepts:** ${this.concepts.size}\n`;
    markdown += `**Categories:** ${Array.from(this.categories).join(', ')}\n\n`;
    markdown += '---\n\n';

    // Group by category
    const byCategory = new Map();
    for (const [key, concept] of this.concepts) {
      if (!byCategory.has(concept.category)) {
        byCategory.set(concept.category, []);
      }
      byCategory.get(concept.category).push(concept);
    }

    // Sort categories
    const sortedCategories = Array.from(byCategory.keys()).sort();

    // Generate markdown for each category
    for (const category of sortedCategories) {
      markdown += `## ${category}\n\n`;

      const concepts = byCategory.get(category);
      concepts.sort((a, b) => a.title.localeCompare(b.title));

      for (const concept of concepts) {
        markdown += `### ${concept.title}\n\n`;
        markdown += `${concept.content}\n\n`;

        // Add metadata
        markdown += `**Sources:** ${concept.sources.length} video(s)\n`;
        markdown += `**First Seen:** ${new Date(concept.firstSeen).toLocaleDateString()}\n`;
        markdown += `**Last Updated:** ${new Date(concept.lastUpdated).toLocaleDateString()}\n`;

        if (concept.keywords.length > 0) {
          markdown += `**Keywords:** ${concept.keywords.join(', ')}\n`;
        }

        markdown += '\n---\n\n';
      }
    }

    return markdown;
  }

  // Export as JSON
  exportAsJSON() {
    const data = {
      generated: new Date().toISOString(),
      totalConcepts: this.concepts.size,
      categories: Array.from(this.categories),
      concepts: Array.from(this.concepts.entries()).map(([key, concept]) => ({
        key,
        ...concept,
      })),
    };

    return JSON.stringify(data, null, 2);
  }

  // Search knowledge base
  search(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const [key, concept] of this.concepts) {
      const score = this.calculateRelevance(concept, lowerQuery);
      if (score > 0) {
        results.push({ ...concept, relevanceScore: score });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Calculate relevance score
  calculateRelevance(concept, query) {
    let score = 0;

    // Title match (highest weight)
    if (concept.title.toLowerCase().includes(query)) {
      score += 10;
    }

    // Content match
    if (concept.content.toLowerCase().includes(query)) {
      score += 5;
    }

    // Keyword match
    if (concept.keywords.some((kw) => kw.includes(query))) {
      score += 3;
    }

    // Category match
    if (concept.category.toLowerCase().includes(query)) {
      score += 2;
    }

    return score;
  }

  // Get statistics
  getStatistics() {
    const stats = {
      totalConcepts: this.concepts.size,
      categories: Array.from(this.categories).length,
      conceptsByCategory: {},
      totalSources: 0,
      averageSourcesPerConcept: 0,
    };

    for (const category of this.categories) {
      stats.conceptsByCategory[category] = 0;
    }

    for (const [key, concept] of this.concepts) {
      stats.conceptsByCategory[concept.category]++;
      stats.totalSources += concept.sources.length;
    }

    stats.averageSourcesPerConcept = (stats.totalSources / stats.totalConcepts).toFixed(2);

    return stats;
  }

  // Clear knowledge base
  clear() {
    this.knowledgeBase.clear();
    this.categories.clear();
    this.concepts.clear();
  }

  // Save to storage
  async save() {
    const data = {
      concepts: Array.from(this.concepts.entries()),
      categories: Array.from(this.categories),
      lastSaved: Date.now(),
    };

    await chrome.storage.local.set({ knowledgeBase: data });
    return true;
  }

  // Load from storage
  async load() {
    const { knowledgeBase } = await chrome.storage.local.get('knowledgeBase');

    if (knowledgeBase) {
      this.concepts = new Map(knowledgeBase.concepts);
      this.categories = new Set(knowledgeBase.categories);
      return true;
    }

    return false;
  }
  // Consolidate multiple reports at once
  async consolidateAll(reports) {
    let totalAdded = 0;
    for (const report of reports) {
      if (report.content && report.metadata) {
        const result = await this.addReport(report.content, report.metadata);
        totalAdded += result.conceptsAdded;
      }
    }
    await this.save();
    return {
      totalAdded,
      totalConcepts: this.concepts.size,
    };
  }
}

// Export singleton
const knowledgeBaseService = new KnowledgeBaseService();
export default knowledgeBaseService;

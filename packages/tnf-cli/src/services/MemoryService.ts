import fs from 'fs/promises';
import path from 'path';
import { LLMClient } from '../utils/llm-client.js';

export class MemoryService {
  private readonly memoryTreePath: string;
  private readonly llm: LLMClient;

  constructor(projectRoot: string) {
    this.memoryTreePath = path.join(projectRoot, '.tnf', 'memory-tree');
    this.llm = new LLMClient();
  }

  async ensureTree() {
    await fs.mkdir(this.memoryTreePath, { recursive: true });
    const categories = ['architecture', 'decisions', 'patterns', 'fixes', 'sessions', 'user'];
    for (const cat of categories) {
      await fs.mkdir(path.join(this.memoryTreePath, cat), { recursive: true });
    }
  }

  async curate(prompt: string, filePaths: string[] = [], categoryOverride?: string) {
    await this.ensureTree();

    let context = '';
    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        context += `\n--- File: ${filePath} ---\n${content}\n`;
      } catch (e) {
        console.warn(`Could not read file: ${filePath}`);
      }
    }

    const systemPrompt = `
      You are the Project Memory Curator. Your task is to analyze the provided input and code files to extract long-term "wisdom", "decisions", "session summaries", or "user preferences".
      
      Instructions:
      1. Identify the core knowledge or pattern.
      2. Categorize it as: architecture, decisions, patterns, or fixes, sessions, or user.
      3. Create a structured Markdown memory file.
      4. Suggest a short, URL-friendly slug for the filename.
      
      Return your response in JSON format (ensure all newlines in the "content" field are escaped as \\n):
      {
        "category": "architecture | decisions | patterns | fixes | sessions | user",
        "slug": "short-slug",
        "content": "Full Markdown content here"
      }
    `;

    const userMessage = `Prompt: ${prompt}\n${categoryOverride ? `Requested Category: ${categoryOverride}\n` : ''}\nContext Files:${context}`;
    
    const response = await this.llm.chatComplete([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]);

    try {
      // Find JSON block in response (handle optional \`\`\`json markers)
      let jsonStr = response.trim();
      if (jsonStr.includes('```')) {
        const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) jsonStr = match[1];
      }
      
      const parsed = JSON.parse(jsonStr);
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${timestamp}-${parsed.slug}.md`;
      const category = categoryOverride || parsed.category;
      const fullPath = path.join(this.memoryTreePath, category, fileName);

      await fs.writeFile(fullPath, parsed.content.trim());
      return { path: fullPath, category };
    } catch (e) {
      throw new Error(`Failed to parse LLM curation: ${(e as Error).message}\nRaw: ${response}`);
    }
  }

  async query(query: string, categoryFilter?: string) {
    await this.ensureTree();

    let allMemories = await this.getAllMemories();
    
    if (categoryFilter) {
      allMemories = allMemories.filter(m => m.category === categoryFilter);
    }

    if (allMemories.length === 0) {
      return `No memories found ${categoryFilter ? `in category '${categoryFilter}' ` : ''}in the project knowledge base. Try curating some first!`;
    }

    const context = allMemories.map(m => `\n--- Memory (${m.category}): ${m.name} ---\n${m.content}\n`).join('\n');

    const systemPrompt = `
      You are the Project Memory Query Engine. You have access to the project's long-term memory tree.
      Synthesize an answer to the user's query using ONLY the provided memory context.
      If the information is not in the context, say you don't know.
      Always cite the memory files you use.
    `;

    return await this.llm.chatComplete([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Context:\n${context}\n\nQuery: ${query}` }
    ]);
  }

  async getTree() {
    await this.ensureTree();
    const categories = await fs.readdir(this.memoryTreePath);
    const tree: Record<string, string[]> = {};
    
    for (const cat of categories) {
      const catPath = path.join(this.memoryTreePath, cat);
      try {
        const stats = await fs.stat(catPath);
        if (stats.isDirectory()) {
          tree[cat] = await fs.readdir(catPath);
        }
      } catch (e) {
        // Skip files that are not directories
      }
    }
    return tree;
  }

  private async getAllMemories() {
    const tree = await this.getTree();
    const memories: Array<{ category: string, name: string, content: string }> = [];

    for (const [category, files] of Object.entries(tree)) {
      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fs.readFile(path.join(this.memoryTreePath, category, file), 'utf8');
          memories.push({ category, name: file, content });
        }
      }
    }
    return memories;
  }
}

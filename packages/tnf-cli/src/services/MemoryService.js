"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const llm_client_js_1 = require("../utils/llm-client.js");
class MemoryService {
    constructor(projectRoot) {
        this.memoryTreePath = path_1.default.join(projectRoot, '.tnf', 'memory-tree');
        this.llm = new llm_client_js_1.LLMClient();
    }
    async ensureTree() {
        await promises_1.default.mkdir(this.memoryTreePath, { recursive: true });
        const categories = ['architecture', 'decisions', 'patterns', 'fixes', 'sessions', 'user'];
        for (const cat of categories) {
            await promises_1.default.mkdir(path_1.default.join(this.memoryTreePath, cat), { recursive: true });
        }
    }
    async curate(prompt, filePaths = [], categoryOverride) {
        await this.ensureTree();
        let context = '';
        for (const filePath of filePaths) {
            try {
                const content = await promises_1.default.readFile(filePath, 'utf8');
                context += `\n--- File: ${filePath} ---\n${content}\n`;
            }
            catch (e) {
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
            { role: 'user', content: userMessage },
        ]);
        try {
            // Find JSON block in response (handle optional \`\`\`json markers)
            let jsonStr = response.trim();
            if (jsonStr.includes('```')) {
                const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (match)
                    jsonStr = match[1];
            }
            const parsed = JSON.parse(jsonStr);
            const timestamp = new Date().toISOString().split('T')[0];
            const fileName = `${timestamp}-${parsed.slug}.md`;
            const category = categoryOverride || parsed.category;
            const fullPath = path_1.default.join(this.memoryTreePath, category, fileName);
            await promises_1.default.writeFile(fullPath, parsed.content.trim());
            return { path: fullPath, category };
        }
        catch (e) {
            throw new Error(`Failed to parse LLM curation: ${e.message}\nRaw: ${response}`);
        }
    }
    async query(query, categoryFilter) {
        await this.ensureTree();
        let allMemories = await this.getAllMemoryMetadata();
        if (categoryFilter) {
            allMemories = allMemories.filter((m) => m.category === categoryFilter);
        }
        if (allMemories.length === 0) {
            return `No memories found ${categoryFilter ? `in category '${categoryFilter}' ` : ''}in the project knowledge base. Try curating some first!`;
        }
        // OOM PROTECTION: Only select the most recent 10 memories to prevent context overflow
        // In a full RAG implementation, this would use the Core Vector DB service
        const topMemories = allMemories.slice(-10);
        const loadedMemories = await Promise.all(topMemories.map(async (m) => {
            const content = await promises_1.default.readFile(path_1.default.join(this.memoryTreePath, m.category, m.name), 'utf8');
            return { ...m, content };
        }));
        const context = loadedMemories
            .map((m) => `\n--- Memory (${m.category}): ${m.name} ---\n${m.content}\n`)
            .join('\n');
        const systemPrompt = `
      You are the Project Memory Query Engine. You have access to the project's long-term memory tree.
      Synthesize an answer to the user's query using ONLY the provided memory context.
      If the information is not in the context, say you don't know.
      Always cite the memory files you use.
    `;
        return await this.llm.chatComplete([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Context:\n${context}\n\nQuery: ${query}` },
        ]);
    }
    async getTree() {
        await this.ensureTree();
        const categories = await promises_1.default.readdir(this.memoryTreePath);
        const tree = {};
        for (const cat of categories) {
            const catPath = path_1.default.join(this.memoryTreePath, cat);
            try {
                const stats = await promises_1.default.stat(catPath);
                if (stats.isDirectory()) {
                    tree[cat] = await promises_1.default.readdir(catPath);
                }
            }
            catch (e) {
                // Skip files that are not directories
            }
        }
        return tree;
    }
    async getAllMemoryMetadata() {
        const tree = await this.getTree();
        const memories = [];
        for (const [category, files] of Object.entries(tree)) {
            for (const file of files) {
                if (file.endsWith('.md')) {
                    memories.push({ category, name: file });
                }
            }
        }
        // Sort by name (which starts with timestamp) to get newest first
        return memories.sort((a, b) => a.name.localeCompare(b.name));
    }
}
exports.MemoryService = MemoryService;
//# sourceMappingURL=MemoryService.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const llm_client_js_1 = require("../utils/llm-client.js");
class SkillsService {
    constructor(projectRoot) {
        this.skillBankPath = path_1.default.join(projectRoot, 'packages', 'agent', 'src', 'skill-bank', 'compiled');
        this.llm = new llm_client_js_1.LLMClient();
    }
    async ensureBank() {
        await promises_1.default.mkdir(this.skillBankPath, { recursive: true });
    }
    async compile(prompt, filePaths = []) {
        await this.ensureBank();
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
      You are the Project Skill Compiler. Your task is to analyze a workflow description and context files to "compile" them into a reusable AI Agent Skill.
      
      Instructions:
      1. Identify the core logic and steps of the workflow.
      2. Define a clean, reusable skill name and description.
      3. Generate a Markdown-based skill descriptor that includes:
         - Purpose
         - Prerequisites
         - Implementation steps
         - Success criteria
      4. Suggest a short, URL-friendly slug for the filename.
      
      Return your response in JSON format (ensure all newlines in the "content" field are escaped as \\n):
      {
        "name": "Human-readable Skill Name",
        "description": "Short description of what the skill does",
        "slug": "skill-slug",
        "content": "Full Markdown skill definition here"
      }
    `;
        const userMessage = `Workflow Prompt: ${prompt}\n\nContext Files:${context}`;
        const response = await this.llm.chatComplete([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ]);
        try {
            let jsonStr = response.trim();
            if (jsonStr.includes('```')) {
                const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (match)
                    jsonStr = match[1];
            }
            const parsed = JSON.parse(jsonStr);
            const fileName = `${parsed.slug}.md`;
            const fullPath = path_1.default.join(this.skillBankPath, fileName);
            await promises_1.default.writeFile(fullPath, parsed.content.trim());
            return { path: fullPath, name: parsed.name };
        }
        catch (e) {
            throw new Error(`Failed to parse Skill Compilation: ${e.message}\nRaw: ${response}`);
        }
    }
    async listCompiled() {
        await this.ensureBank();
        try {
            return await promises_1.default.readdir(this.skillBankPath);
        }
        catch (e) {
            return [];
        }
    }
}
exports.SkillsService = SkillsService;
//# sourceMappingURL=SkillsService.js.map
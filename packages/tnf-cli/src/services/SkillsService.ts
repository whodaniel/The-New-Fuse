import fs from 'fs/promises';
import path from 'path';
import { LLMClient } from '../utils/llm-client.js';

export class SkillsService {
  private readonly skillBankPath: string;
  private llm: LLMClient | null = null;

  constructor(projectRoot: string) {
    this.skillBankPath = path.join(projectRoot, 'packages', 'agent', 'src', 'skill-bank', 'compiled');
  }

  private async getLlm(): Promise<LLMClient> {
    if (!this.llm) {
      this.llm = await LLMClient.create();
    }
    return this.llm;
  }

  async ensureBank() {
    await fs.mkdir(this.skillBankPath, { recursive: true });
  }

  async compile(prompt: string, filePaths: string[] = []) {
    await this.ensureBank();

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
    
    const llm = await this.getLlm();
    const response = await llm.chatComplete([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]);

    try {
      let jsonStr = response.trim();
      if (jsonStr.includes('```')) {
        const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) jsonStr = match[1];
      }
      
      const parsed = JSON.parse(jsonStr);
      const fileName = `${parsed.slug}.md`;
      const fullPath = path.join(this.skillBankPath, fileName);

      await fs.writeFile(fullPath, parsed.content.trim());
      return { path: fullPath, name: parsed.name };
    } catch (e) {
      throw new Error(`Failed to parse Skill Compilation: ${(e as Error).message}\nRaw: ${response}`);
    }
  }

  async listCompiled() {
    await this.ensureBank();
    try {
      return await fs.readdir(this.skillBankPath);
    } catch (e) {
      return [];
    }
  }
}

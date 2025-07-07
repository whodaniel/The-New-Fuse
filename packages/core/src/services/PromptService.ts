import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptService {
  constructor() {}

  async generatePrompt(template: string, variables: Record<string, any>): Promise<string> {
    if (!template || template.trim() === '') {
      throw new Error('Template cannot be empty');
    }
    
    let prompt = template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return prompt;
  }

  async validatePrompt(prompt: string): Promise<boolean> {
    if (!prompt || typeof prompt !== 'string') {
      return false;
    }
    return prompt.length > 0 && prompt.length < 10000;
  }

  async createSystemPrompt(context: string): Promise<string> {
    const systemTemplate = `You are a helpful AI assistant. Context: {{context}}`;
    return this.generatePrompt(systemTemplate, { context });
  }

  async createUserPrompt(message: string): Promise<string> {
    if (!message || message.trim() === '') {
      throw new Error('Message cannot be empty');
    }
    return message.trim();
  }
}
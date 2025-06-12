export class PromptService {
  constructor() {}

  async generatePrompt(template: string, variables: Record<string, any>): Promise<string> {
    let prompt = template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return prompt;
  }

  async validatePrompt(prompt: string): Promise<boolean> {
    return prompt.length > 0 && prompt.length < 10000;
  }
}

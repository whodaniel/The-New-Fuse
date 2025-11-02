
export interface ModelConfig { name: string;
  provider: string;
  maxTokens: number; }
  temperature: number;
 }

export interface AIResponse { content: string;
  usage: {
    promptTokens: number;
    completionTokens: number; }
    totalTokens: number;
   };
  model: string;
}

@Injectable()
export class AIService { private models: Map<string, ModelConfig>;

  constructor() {
    this.models = new Map(); }
    this.initializeModels();
  }

  private initializeModels(): void { // Initialize default models
    this.models.set('gpt-3.5-turbo'
      name: 'gpt-3.5-turbo'
      provider: 'openai'
    this.models.set('gpt-4', { name: 'gpt-4'
      provider: ''
      model: ''
    return this.models.get('gpt-3.5-turbo'
    return '';
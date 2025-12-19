import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider } from '../LLMProvider';
import {
  AnthropicModel,
  PromptCachingService,
  PromptParts,
} from '../prompt-caching.service';

// Prices are per 1 million tokens
const MODEL_PRICING: Record<
  AnthropicModel,
  { input: number; output: number }
> = {
  'claude-3-opus-20240229': {
    input: 15,
    output: 75,
  },
  'claude-3-5-sonnet-20240620': {
    input: 3,
    output: 15,
  },
};

interface UsageWithCache extends Anthropic.Usage {
  cache_read_input_tokens?: number;
}

@Injectable()
export class AnthropicProvider extends LLMProvider {
  private readonly client: Anthropic;

  constructor(
    private readonly promptCachingService: PromptCachingService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async generate(prompt: string): Promise<string> {
    const parts: PromptParts = JSON.parse(prompt);
    const messages = this.promptCachingService.buildCacheablePrompt(parts);

    const response = await this.client.messages.create({
      model: parts.model,
      messages,
      max_tokens: 4096,
    });

    if (response.usage) {
      this.trackCost(response.usage as UsageWithCache, parts.model);
    }

    return response.content.map(block => block.text).join('');
  }

  private trackCost(usage: UsageWithCache, model: AnthropicModel) {
    const { input_tokens, output_tokens, cache_read_input_tokens = 0 } = usage;
    const { input: inputPrice, output: outputPrice } = MODEL_PRICING[model];

    const billedCost =
      (input_tokens / 1_000_000) * inputPrice +
      (output_tokens / 1_000_000) * outputPrice;

    const totalTokensWithoutCache = input_tokens + cache_read_input_tokens;
    const potentialCost =
      (totalTokensWithoutCache / 1_000_000) * inputPrice +
      (output_tokens / 1_000_000) * outputPrice;

    const savings = potentialCost - billedCost;
    const savingsPercentage =
      potentialCost > 0 ? (savings / potentialCost) * 100 : 0;

    this.logger.log(`Billed cost: $${billedCost.toFixed(6)}`);
    this.logger.log(`Potential cost without cache: $${potentialCost.toFixed(6)}`);
    this.logger.log(
      `Cache savings: $${savings.toFixed(6)} (${savingsPercentage.toFixed(2)}%)`,
    );
  }
}

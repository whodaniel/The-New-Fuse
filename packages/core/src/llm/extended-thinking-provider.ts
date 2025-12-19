import Anthropic from '@anthropic-ai/sdk';
import { VectorMemorySystem, MemoryType } from '../../memory/vector-memory-system';

/**
 * @interface ExtendedThinkingConfig
 * Configuration for the extended thinking process.
 * @property {boolean} enabled - Whether to enable the thinking process.
 * @property {number} budget - The maximum number of thinking tokens to use.
 * @property {boolean} showToUser - Whether to show the thinking process to the user.
 */
export interface ExtendedThinkingConfig {
  enabled: boolean;
  budget: number;
  showToUser: boolean;
}

/**
 * The supported Anthropic models for extended thinking.
 */
export type SupportedThinkingModel = 'claude-opus-4-5' | 'claude-sonnet-4-5';

/**
 * @interface ThinkingResponse
 * The structured response from the invokeWithThinking method.
 * @property {string} response - The final, user-facing text response from the model.
 * @property {string[]} thinking - An array of strings, each representing a 'thinking' step from the model.
 */
export interface ThinkingResponse {
  response: string;
  thinking: string[];
}

/**
 * @class ExtendedThinkingProvider
 * A service to invoke Anthropic's models with the 'thinking' feature.
 * It can parse and separate 'thinking' blocks from the response
 * and store them in a vector memory system.
 *
 * @example
 * ```typescript
 * const vectorMemorySystem = new VectorMemorySystem(...);
 * const provider = new ExtendedThinkingProvider('your-anthropic-api-key', vectorMemorySystem);
 *
 * async function run() {
 *   const config: ExtendedThinkingConfig = {
 *     enabled: true,
 *     budget: 2000,
 *     showToUser: false,
 *   };
 *   const prompt = "Explain the theory of relativity in simple terms.";
 *   const result = await provider.invokeWithThinking(prompt, config, 'claude-sonnet-4-5');
 *
 *   console.log('--- Model Response ---');
 *   console.log(result.response);
 *
 *   if (result.thinking.length > 0) {
 *     console.log('\n--- Model Thinking Process ---');
 *     result.thinking.forEach((thought, i) => {
 *       console.log(`Step ${i + 1}: ${thought}`);
 *     });
 *   }
 * }
 *
 * run();
 * ```
 */
export class ExtendedThinkingProvider {
  private readonly anthropic: Anthropic;
  private readonly vectorMemorySystem: VectorMemorySystem;

  constructor(anthropicApiKey: string, vectorMemorySystem: VectorMemorySystem) {
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key is required.');
    }
    this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
    this.vectorMemorySystem = vectorMemorySystem;
  }

  /**
   * Invokes an Anthropic model with the extended thinking feature.
   *
   * This method sends a prompt to a supported Anthropic model and, if enabled,
   * requests the model's intermediate 'thinking' process. It then parses the
   * response to separate the final text from the thinking steps and stores
   * the thinking process in the VectorMemorySystem.
   *
   * @param {string} prompt - The user's prompt to the model.
   * @param {ExtendedThinkingConfig} config - Configuration for the thinking process.
   * @param {SupportedThinkingModel} model - The specific model to use.
   * @returns {Promise<ThinkingResponse>} A promise that resolves to an object
   *   containing the model's final response and an array of its thinking steps.
   * @throws {Error} If the API call to Anthropic fails.
   */
  public async invokeWithThinking(
    prompt: string,
    config: ExtendedThinkingConfig,
    model: SupportedThinkingModel,
  ): Promise<ThinkingResponse> {
    try {
      const params: Anthropic.Messages.MessageCreateParams = {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
      };

      if (config.enabled) {
        (params as any).thinking = {
          type: 'enabled',
          budget: config.budget,
        };
      }

      const message = await this.anthropic.messages.create(params);

      const thinking: string[] = [];
      let responseText = '';

      if (message.content) {
        for (const block of message.content) {
          if (block.type === 'thinking' && 'text' in block) {
            thinking.push(block.text);
          } else if (block.type === 'text') {
            responseText += block.text;
          }
        }
      }

      // Store the thinking process in the background.
      if (thinking.length > 0) {
        try {
          const memoryPromises = thinking.map((thought) =>
            this.vectorMemorySystem.addMemory(thought, { type: 'REASONING' as MemoryType }),
          );
          await Promise.all(memoryPromises);
        } catch (error) {
          // Log the error but don't fail the entire operation.
          console.error('Failed to store thinking process in VectorMemorySystem:', error);
        }
      }

      return {
        response: responseText.trim(),
        thinking,
      };
    } catch (error) {
      console.error('Error invoking Anthropic API with thinking:', error);
      throw new Error(
        `Anthropic API request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

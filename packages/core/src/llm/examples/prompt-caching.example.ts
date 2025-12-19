import { ConfigService } from '@nestjs/config';
import { AnthropicProvider } from '../providers/AnthropicProvider';
import { PromptCachingService } from '../prompt-caching.service';

// This is a simplified example and does not represent a real test case.
// In a real-world scenario, you would use a testing framework like Jest
// and mock the dependencies.
async function runExample() {
  // Mock ConfigService
  const configService = {
    get: (key: string) => {
      if (key === 'ANTHROPIC_API_KEY') {
        return 'test-key';
      }
      return undefined;
    },
  } as ConfigService;

  const promptCachingService = new PromptCachingService();
  const anthropicProvider = new AnthropicProvider(promptCachingService, configService);

  // Mock the Anthropic client to avoid making real API calls
  (anthropicProvider as any).client = {
    messages: {
      create: jest.fn().mockImplementation(async (request: any) => {
        const isCached = request.messages.some((m: any) => m.cache_control);
        return {
          content: [{ text: 'Mocked response' }],
          usage: {
            input_tokens: isCached ? 10 : 1000,
            output_tokens: 50,
            cache_read_input_tokens: isCached ? 990 : 0,
          },
        };
      }),
    },
  };

  const systemContext = 'You are a helpful assistant.';
  const documentation = 'This is some documentation.';

  console.log('--- First call (populating cache) ---');
  await anthropicProvider.generate(
    JSON.stringify({
      systemContext,
      documentation,
      actualQuery: 'What is the capital of France?',
      model: 'claude-3-5-sonnet-20240620',
    }),
  );

  console.log('\\n--- Second call (with cache) ---');
  await anthropicProvider.generate(
    JSON.stringify({
      systemContext,
      documentation,
      actualQuery: 'What is the capital of Germany?',
      model: 'claude-3-5-sonnet-20240620',
    }),
  );
}

// You would typically use a mocking library like 'jest' in a real test file.
// Here we'll just create a dummy jest object for the example to run.
const jest = {
  fn: () => ({
    mockImplementation: (fn: any) => fn,
  }),
};

runExample();

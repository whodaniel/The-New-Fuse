"use strict";
/**
 * Comprehensive Test Suite for Generative Media
 *
 * Tests all providers, media types, and functionality
 *
 * @module GenerativeMediaTest
 * @since 2025-10-06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerativeMediaTester = void 0;
const GenerativeMediaProviderRegistry_1 = require("../services/GenerativeMediaProviderRegistry");
class GenerativeMediaTester {
    registry;
    pipeline;
    results = [];
    constructor(registry, pipeline) {
        this.registry = registry;
        this.pipeline = pipeline;
    }
    /**
     * Run comprehensive test suite
     */
    async runFullTestSuite() {
        console.log('🧪 Starting Comprehensive Generative Media Test Suite...\n');
        const testSuites = this.getTestSuites();
        this.results = [];
        for (const suite of testSuites) {
            console.log(`📋 Running ${suite.name}...);
      await this.runTestSuite(suite);
      console.log('');
    }

    return this.generateReport();
  }

  /**
   * Test specific provider
   */
  async testProvider(providerId: string): Promise<TestResult[]> {`, console.log(`🔍 Testing provider: ${providerId}`));
            const provider = this.registry.getProviders().find(p => p.id === providerId);
            if (!provider) {
                throw new Error(Provider, $, { providerId }, not, found);
            }
            const results = [];
            for (const mediaType of provider.mediaTypes) {
                const testCase = this.createBasicTestCase(mediaType);
                const result = await this.runSingleTest(testCase, providerId);
                results.push(result);
            }
            return results;
        }
        /**
         * Test specific media type across all providers
         */
        async;
        testMediaType(mediaType, GenerativeMediaProviderRegistry_1.MediaType);
        Promise < TestResult[] > {} `
    console.log(🎨 Testing media type: ${mediaType}`;
        ;
        const providers = this.registry.getProviders(mediaType);
        const results = [];
        for (const provider of providers) {
            if (provider.status !== 'available') {
                console.log(Skipping, $, { provider, : .id }(status, $, { provider, : .status }) `);
        continue;
      }

      const testCase = this.createBasicTestCase(mediaType);
      const result = await this.runSingleTest(testCase, provider.id);
      results.push(result);
    }

    return results;
  }

  /**
   * Run performance benchmarks
   */
  async runPerformanceBenchmarks(): Promise<{
    speedTest: TestResult[];
    qualityTest: TestResult[];
    costEfficiency: TestResult[];
  }> {
    console.log('⚡ Running Performance Benchmarks...\n');

    const speedTest = await this.runSpeedTest();
    const qualityTest = await this.runQualityTest();
    const costEfficiency = await this.runCostEfficiencyTest();

    return {
      speedTest,
      qualityTest,
      costEfficiency
    };
  }

  private getTestSuites(): TestSuite[] {
    return [
      {
        name: 'Basic Functionality Tests',
        tests: [
          {
            name: 'Simple Image Generation',
            mediaType: MediaType.IMAGE,
            request: {
              prompt: 'A cute robot reading a book',
              mediaType: MediaType.IMAGE,
              parameters: { width: 512, height: 512 }
            },
            expectedOutputs: 1,
            timeout: 60000
          },
          {
            name: 'Simple Video Generation',
            mediaType: MediaType.VIDEO,
            request: {
              prompt: 'A flower blooming in time-lapse',
              mediaType: MediaType.VIDEO,
              parameters: { duration: 3 }
            },
            expectedOutputs: 1,
            timeout: 180000
          },
          {
            name: 'Simple Music Generation',
            mediaType: MediaType.MUSIC,
            request: {
              prompt: 'Upbeat electronic music',
              mediaType: MediaType.MUSIC,
              parameters: { duration: 10 }
            },
            expectedOutputs: 1,
            timeout: 120000
          },
          {
            name: 'Simple Voice Generation',
            mediaType: MediaType.VOICE,
            request: {
              prompt: 'Hello, welcome to our platform',
              mediaType: MediaType.VOICE
            },
            expectedOutputs: 1,
            timeout: 30000
          }
        ]
      },
      {
        name: 'Advanced Parameter Tests',
        tests: [
          {
            name: 'High Resolution Image',
            mediaType: MediaType.IMAGE,
            request: {
              prompt: 'Detailed landscape photography',
              mediaType: MediaType.IMAGE,
              parameters: { width: 2048, height: 2048, steps: 50 }
            },
            expectedOutputs: 1,
            timeout: 120000
          },
          {
            name: 'Long Video Generation',
            mediaType: MediaType.VIDEO,
            request: {
              prompt: 'Ocean waves on a beach',
              mediaType: MediaType.VIDEO,
              parameters: { duration: 10, fps: 30 }
            },
            expectedOutputs: 1,
            timeout: 300000
          },
          {
            name: 'Extended Music Composition',
            mediaType: MediaType.MUSIC,
            request: {
              prompt: 'Epic orchestral theme',
              mediaType: MediaType.MUSIC,
              parameters: { duration: 60, genre: 'orchestral',
            expectedOutputs: 1,
            timeout: 240000
          }
        ]
      },
      {
        name: 'Error Handling Tests',
        tests: [
          {
            name: 'Invalid Parameters',
            mediaType: MediaType.IMAGE,
            request: {
              prompt: 'Test image',
              mediaType: MediaType.IMAGE,
              parameters: { width: 10000, height: 10000 } // Invalid size
            },
            expectedOutputs: 0,
            timeout: 30000
          },
          {
            name: 'Empty Prompt',
            mediaType: MediaType.IMAGE,
            request: {
              prompt: '',
              mediaType: MediaType.IMAGE
            },
            expectedOutputs: 0,
            timeout: 30000
          }
        ]
      }
    ];
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    for (const testCase of suite.tests) {
      console.log(  🧪 ${testCase.name}...);
      
      if (testCase.provider) {
        // Test specific provider
        const result = await this.runSingleTest(testCase, testCase.provider);
        this.results.push(result);
      } else {
        // Test with best available provider
        const result = await this.runSingleTest(testCase);
        this.results.push(result);
      }
    }
  }

  private async runSingleTest(testCase: TestCase, providerId?: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Check if we should skip due to missing API key
      if (testCase.skipIfNoApiKey && providerId) {
        const hasApiKey = this.checkApiKey(providerId);
        if (!hasApiKey) {
          return {
            provider: providerId,
            mediaType: testCase.mediaType,
            success: false,
            duration: 0,
            error: 'Skipped - No API key'
          };
        }
      }

      // Execute generation
      const result = providerId
        ? await this.registry.generateWithProvider(providerId, testCase.request)
        : await this.registry.generateMedia(testCase.request);

      const duration = Date.now() - startTime;
`);
                if (result.success && result.outputs.length >= testCase.expectedOutputs) {
                    `
        console.log(`;
                    Passed($, { duration }, ms);
                    ;
                    return {
                        provider: result.providerId,
                        mediaType: testCase.mediaType,
                        success: true,
                        duration,
                        cost: result.metadata.cost,
                        outputUrl: result.outputs[0]?.url,
                        metadata: result.metadata
                    };
                }
                else {
                    console.log(Failed - Insufficient, outputs);
                    return {
                        provider: result.providerId,
                        mediaType: testCase.mediaType,
                        success: false,
                        duration,
                        error: 'Insufficient outputs'
                    };
                }
            }
            try { }
            catch (error) {
                const duration = Date.now() - startTime;
                `
      console.log(    ❌ Failed - ${error.message}`;
                ;
                return {
                    provider: providerId || 'auto',
                    mediaType: testCase.mediaType,
                    success: false,
                    duration,
                    error: error.message
                };
            }
        }
    }
    async runSpeedTest() {
        console.log('⚡ Speed Test - Measuring generation times...');
        const speedTests = [
            { mediaType: GenerativeMediaProviderRegistry_1.MediaType.IMAGE, prompt: 'Quick test image', timeout: 30000 },
            { mediaType: GenerativeMediaProviderRegistry_1.MediaType.VIDEO, prompt: 'Quick test video', timeout: 60000 },
            { mediaType: GenerativeMediaProviderRegistry_1.MediaType.VOICE, prompt: 'Quick test voice', timeout: 15000 }
        ];
        const results = [];
        for (const test of speedTests) {
            const providers = this.registry.getProviders(test.mediaType)
                .filter(p => p.status === 'available')
                .slice(0, 3); // Test top 3 providers
            for (const provider of providers) {
                const testCase = {
                    name: Speed, test
                } - $, { provider, id };
                `,
          mediaType: test.mediaType,
          request: {
            prompt: test.prompt,
            mediaType: test.mediaType,
            parameters: { width: 512, height: 512, duration: 3 }
          },
          expectedOutputs: 1,
          timeout: test.timeout
        };

        const result = await this.runSingleTest(testCase, provider.id);
        results.push(result);
      }
    }

    return results;
  }

  private async runQualityTest(): Promise<TestResult[]> {
    // Placeholder for quality assessment
    // Would involve human evaluation or automated quality metrics
    return [];
  }

  private async runCostEfficiencyTest(): Promise<TestResult[]> {
    console.log('💰 Cost Efficiency Test...');
    
    const results: TestResult[] = [];
    const testPrompt = 'Cost efficiency test';

    for (const mediaType of [MediaType.IMAGE, MediaType.VIDEO, MediaType.MUSIC]) {
      const providers = this.registry.getProviders(mediaType)
        .filter(p => p.status === 'available');

      for (const provider of providers) {
        const testCase: TestCase = {
          name: Cost test - ${provider.id},
          mediaType,
          request: {
            prompt: testPrompt,
            mediaType,
            parameters: { width: 512, height: 512, duration: 5 }
          },
          expectedOutputs: 1,
          timeout: 120000
        };

        const result = await this.runSingleTest(testCase, provider.id);
        results.push(result);
      }
    }

    return results;
  }

  private createBasicTestCase(mediaType: MediaType): TestCase {
    const prompts = {
      [MediaType.IMAGE]: 'A simple test image',
      [MediaType.VIDEO]: 'A simple test video',
      [MediaType.MUSIC]: 'Simple test music',
      [MediaType.VOICE]: 'Simple test voice',
      [MediaType.AUDIO]: 'Simple test audio'
    };

    return {`;
                name: `Basic ${mediaType} test`,
                    mediaType,
                    request;
                {
                    prompt: prompts[mediaType],
                        mediaType,
                        parameters;
                    {
                        width: 512, height;
                        512, duration;
                        3;
                    }
                }
                expectedOutputs: 1,
                    timeout;
                60000;
            }
            ;
        }
    }
    checkApiKey(providerId) {
        const keyMappings = {
            'recraft-v3': 'RECRAFT_API_KEY',
            'dall-e-3': 'OPENAI_API_KEY',
            'flux-1-1-pro': 'REPLICATE_API_TOKEN',
            'suno-v4': 'SUNO_API_KEY',
            'elevenlabs-v3': 'ELEVENLABS_API_KEY'
        };
        const envVar = keyMappings[providerId];
        return envVar ? !!process.env[envVar] : false;
    }
    generateReport() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.success).length;
        const failed = this.results.filter(r => !r.success).length;
        const skipped = this.results.filter(r => r.error === 'Skipped - No API key').length;
        const totalCost = this.results.reduce((sum, r) => sum + (r.cost || 0), 0);
        const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
        const byProvider = {};
        const byMediaType = {};
        this.results.forEach(result => {
            if (!byProvider[result.provider])
                byProvider[result.provider] = [];
            if (!byMediaType[result.mediaType])
                byMediaType[result.mediaType] = [];
            byProvider[result.provider].push(result);
            byMediaType[result.mediaType].push(result);
        });
        return {
            summary: {
                total,
                passed,
                failed,
                skipped,
                totalCost,
                averageDuration
            },
            results: this.results,
            byProvider,
            byMediaType
        };
    }
}
exports.GenerativeMediaTester = GenerativeMediaTester;
//# sourceMappingURL=GenerativeMediaTest.js.map
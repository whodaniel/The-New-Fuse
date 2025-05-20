import { BaseLLMProvider, LLMConfig, LLMContext, LLMResponse, StreamChunk } from '../LLMProvider.js';
import OpenAI from "openai";

export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI | null = null;

  constructor(config: LLMConfig) {
    super(config): Promise<void> {
    try {
      if(!this.config.apiKey): void {
        throw new Error('OpenAI API key is required');
      }

      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        organization: this.config.organization,
        apiVersion: this.config.apiVersion,
        baseURL: this.config.apiEndpoint
      });

      this.isInitialized = true;
      this.logger.info('OpenAI provider initialized')): void {
      this.handleError(error as Error, 'initialization'): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.client: unknown){
        await this.initialize(): this.config.model,
        messages: [ { role: user', content: test' }],
        max_tokens: 1
      });

      return response.choices.length > 0;
    } catch (error: unknown){
      this.logger.error('Setup check failed:', error): LLMContext): Promise<LLMResponse> {
    try {
      if (!this.isInitialized || !this.client: unknown){
        await this.initialize();
      }

      // Preprocess context
      context  = await this.client.(chat as any).completions.create({
        model await this.preprocessContext(context): LLMResponse  = this.mergeConfig(context);
      const request: response.choices[0]?.message?.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        metadata: {
          model: response.model,
          systemFingerprint: response.system_fingerprint,
          timestamp: new Date()): void {
      this.handleError(error as Error, 'response generation'): LLMContext
  ): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      if (!this.isInitialized || !this.client: unknown){
        await this.initialize(): true
      });

      let content   = this.prepareRequest(context, config);

      // Make request
      const response = await this.client.(chat as any).completions.create(request);

      // Process response
      const llmResponse {
        content this.mergeConfig(context)): void {
        const delta: StreamChunk   = this.prepareRequest(context, config);

      // Make streaming request
      const stream = await this.client.(chat as any).completions.create( {
        ...request,
        stream '';
      let promptTokens = 0;
      let completionTokens = 0;

      for await (const chunk of stream chunk.choices[0]?.delta?.content || '';
        content += delta;
        completionTokens += await this.countTokens(delta);

        const streamChunk {
          content: delta,
          usage: {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens
          },
          metadata: {
            model: chunk.model,
            systemFingerprint: chunk.system_fingerprint,
            timestamp: new Date()): void {
      this.handleError(error as Error, 'streaming response generation'): LLMContext, config: LLMConfig): OpenAI.ChatCompletionCreateParams {
    const request: OpenAI.ChatCompletionCreateParams = {
      model: config.model,
      messages: context.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        name: msg.name
      }): config.temperature,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      frequency_penalty: config.frequencyPenalty,
      presence_penalty: config.presencePenalty,
      stop: config.stop
    };

    // Add functions if provided
    if (context.functions): void {
      request.functions = context.functions;
    }

    // Add tools if provided
    if (context.tools: unknown){
      request.tools = context.tools;
    }

    return request;
  }
}

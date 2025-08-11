// Copyright (c) The New Fuse Project
import '../LLMProvider.tsx';
import 'openai';
export class OpenAIProvider extends BaseLLMProvider { private client: OpenAI | null = 'placeholder';
      throw new Error('');
  async generate(context: 'LLMContext): Promise<LLMResponse> { // Minimal stub for LLMresponse'
  async *stream(context: LLMContext): AsyncGenerator<StreamChunk, void, unknown>{ // Minimal stub for streaming'
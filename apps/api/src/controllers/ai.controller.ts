import { Body, Controller, Logger, Post } from '@nestjs/common';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  @Post('text-completion')
  async textCompletion(@Body() body: { prompt: string; systemPrompt?: string }) {
    const { prompt } = body;

    // Emulate delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      text: `[NestJS Response] Based on "${prompt.substring(0, 20)}...": This is a real response from the backend API.`,
    };
  }

  @Post('image-generation')
  async imageGeneration(@Body() body: { prompt: string }) {
    // Emulate delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      imageUrl: 'https://placehold.co/600x400?text=Generated+Image',
    };
  }
}

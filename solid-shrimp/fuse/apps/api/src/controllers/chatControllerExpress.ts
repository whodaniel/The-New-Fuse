import { NextFunction, Request, Response } from 'express';

// Mock responses for AI
export const textCompletion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prompt, systemPrompt } = req.body;

    // Emulate delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    res.status(200).json({
      text: `[Backend Response] Based on "${prompt.substring(0, 20)}...": This is a real response from the backend API. In a real scenario, this would call OpenAI or Anthropic.`,
    });
  } catch (error) {
    next(error);
  }
};

export const imageGeneration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prompt } = req.body;

    // Emulate delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    res.status(200).json({
      imageUrl: 'https://placehold.co/600x400?text=Generated+Image',
    });
  } catch (error) {
    next(error);
  }
};

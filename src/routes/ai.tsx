import express, { Request, Response } from "express";
import { PrismaClient } from "@the-new-fuse/database/client";
import OpenAI from "openai";

const router = express.Router();
const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateRequest {
  chatId: string;
  prompt: string;
}

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

// Generate AI response
router.post(
  "/generate",
  async (
    req: AuthenticatedRequest & Request<{}, {}, GenerateRequest>,
    res: Response,
  ) => {
    try {
      const { chatId, prompt } = req.body;
      const userId = req.user.userId;

      // Verify chat ownership
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!chat || chat.userId !== userId) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // Format previous messages for OpenAI
      const messages = chat.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the new user message
      messages.push({ role: "user", content: prompt });

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL as string,
        messages: messages,
      });

      const aiResponse = completion.choices[0].message.content;

      // Save user prompt to database
      await prisma.message.create({
        data: {
          content: prompt,
          role: "user",
          chatId,
        },
      });

      // Save AI response to database
      const aiMessage = await prisma.message.create({
        data: {
          content: aiResponse,
          role: "assistant",
          chatId,
        },
      });

      // Update chat's updatedAt timestamp
      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });

      res.json({ message: aiMessage });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500)
          .json({ message: "AI error", error: error.message });
      } else {
        res.status(500)
          .json({ message: "AI error", error: "An unknown error occurred" });
      }
    }
  },
);

export default router;

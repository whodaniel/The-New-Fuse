import express, { Request, Response } from "express";
import { PrismaClient } from "@the-new-fuse/database/client";

interface UserRequest extends Request {
  user: {
    userId: string;
    [key: string]: unknown;
  };
}

interface ChatMessage {
  content: string;
  role: string;
}

interface CreateChatRequest {
  title: string;
}

const router = express.Router();
const prisma = new PrismaClient();

// Get all chats for a user
router.get("/", async (req: UserRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    res.json(chats);
  } catch (error) {
    if(error instanceof Error) {
      res.status(500)
        .json({ message: "Server error", error: error.message });
    } else {
      res.status(500)
        .json({ message: "Server error", error: "Unknown error" });
    }
  }
});

// Get a single chat with messages
router.get("/:id", async (req: UserRequest, res: Response) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.userId;
    
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if(!chat || chat.userId !== userId) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json(chat);
  } catch (error) {
    if(error instanceof Error) {
      res.status(500)
        .json({ message: "Server error", error: error.message });
    } else {
      res.status(500)
        .json({ message: "Server error", error: "Unknown error" });
    }
  }
});

// Create a new chat
router.post(
  "/",
  async (req: UserRequest & { body: CreateChatRequest }, res: Response) => {
    try {
      const { title } = req.body;
      const userId = req.user.userId;
      
      const chat = await prisma.chat.create({
        data: {
          title,
          userId,
        },
      });

      res.status(201).json(chat);
    } catch (error) {
      if(error instanceof Error) {
        res.status(500)
          .json({ message: "Server error", error: error.message });
      } else {
        res.status(500)
          .json({ message: "Server error", error: "Unknown error" });
      }
    }
  },
);

// Add a message to a chat
router.post(
  "/:id/messages",
  async (req: UserRequest & { body: ChatMessage }, res: Response) => {
    try {
      const chatId = req.params.id;
      const { content, role } = req.body;
      const userId = req.user.userId;

      // Verify chat ownership
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
      });

      if(!chat || chat.userId !== userId) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      const message = await prisma.message.create({
        data: {
          content,
          role,
          chatId,
        },
      });

      // Update chat's updatedAt timestamp
      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });

      res.status(201).json(message);
    } catch (error) {
      if(error instanceof Error) {
        res.status(500)
          .json({ message: "Server error", error: error.message });
      } else {
        res.status(500)
          .json({ message: "Server error", error: "Unknown error" });
      }
    }
  },
);

// Delete a chat
router.delete("/:id", async (req: UserRequest, res: Response) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.userId;

    // Verify chat ownership
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if(!chat || chat.userId !== userId) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Delete all messages in the chat
    await prisma.message.deleteMany({
      where: { chatId },
    });

    // Delete the chat
    await prisma.chat.delete({
      where: { id: chatId },
    });

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    if(error instanceof Error) {
      res.status(500)
        .json({ message: "Server error", error: error.message });
    } else {
      res.status(500)
        .json({ message: "Server error", error: "Unknown error" });
    }
  }
});

export default router;

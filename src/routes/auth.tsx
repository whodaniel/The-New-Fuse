import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@the-new-fuse/database/client";

const router = express.Router();
const prisma = new PrismaClient();

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
}

// Register new user
router.post(
  "/register",
  async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
    try {
      const { name, email, password } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return res.status(400)
          .json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: process.env.JWT_EXPIRATION },
      );

      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500)
          .json({ message: "Server error", error: error.message });
      } else {
        res.status(500).json({
          message: "Server error",
          error: "An unknown error occurred",
        });
      }
    }
  },
);

// Login
router.post(
  "/login",
  async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        return res.status(400)
          .json({ message: "Invalid credentials" });
      }

      // Check password
      const validPassword = await bcrypt.compare(
        password,
        user.password,
      );
      
      if (!validPassword) {
        return res.status(400)
          .json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: process.env.JWT_EXPIRATION },
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500)
          .json({ message: "Server error", error: error.message });
      } else {
        res.status(500).json({
          message: "Server error",
          error: "An unknown error occurred",
        });
      }
    }
  },
);

export default router;

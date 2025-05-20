import { Request, Response } from 'express';
import { userService } from '../services/userService';

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, username } = req.body;

      // Basic validation
      if (!email || !password || !username) {
        res.status(400).json({ success: false, message: 'Email, password, and username are required' });
        return;
      }

      // TODO: Add more robust validation (e.g., email format, password strength)

      const existingUserByEmail = await userService.findUserByEmail(email);
      if (existingUserByEmail) {
        res.status(409).json({ success: false, message: 'User with this email already exists' });
        return;
      }

      const existingUserByUsername = await userService.findUserByUsername(username);
      if (existingUserByUsername) {
        res.status(409).json({ success: false, message: 'Username is already taken' });
        return;
      }

      const user = await userService.createUser(email, password, username);

      if (!user) {
        // This case should ideally be caught by the checks above, but as a fallback
        res.status(500).json({ success: false, message: 'Failed to create user' });
        return;
      }
      
      // Placeholder for password hashing - actual hashing should be done in userService.createUser
      // For now, the service stores the password as is.

      res.status(201).json({ success: true, message: 'User registered successfully', userId: user.id });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

export const authController = new AuthController();

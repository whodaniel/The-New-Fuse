import { AppDataSource } from '../data-source.js';
import { User } from '../entities/User.js';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const userRepository = AppDataSource.getRepository(User);

export const authService = {
  async register({ name, email, password }: { name: string; email: string; password: string }) {
    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = userRepository.create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    await userRepository.save(user);

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-jwt-secret-key',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key',
      { expiresIn: '7d' }
    );

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await userRepository.save(user);

    return {
      user,
      accessToken,
      refreshToken
    };
  },

  async login({ email, password }: { email: string; password: string }) {
    // Find user
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-jwt-secret-key',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key',
      { expiresIn: '7d' }
    );

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await userRepository.save(user);

    return {
      user,
      accessToken,
      refreshToken
    };
  },

  async getCurrentUser(userId: string) {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    return { user };
  },

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key'
      ) as { userId: string };

      // Find user
      const user = await userRepository.findOne({ 
        where: { 
          id: decoded.userId,
          refreshToken 
        } 
      });

      if (!user) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your-jwt-secret-key',
        { expiresIn: '15m' }
      );

      const newRefreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key',
        { expiresIn: '7d' }
      );

      // Save new refresh token to user
      user.refreshToken = newRefreshToken;
      await userRepository.save(user);

      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
};

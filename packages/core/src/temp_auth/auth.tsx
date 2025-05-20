import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { User } from '../models/User.js';

interface JWTPayload {
  sub: string;
  exp: number;
  iat: number;
}

export class AuthManagerImpl {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly secretKey: string,
    private readonly tokenExpireMinutes: number = 60
  ) {}

  async registerUser(
    email: string,
    username: string,
    password: string
  ): Promise<{ userId: string; email: string; accessToken: string; tokenType: string }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new Error('Email or username already registered');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = await this.userRepository.save({
      email,
      username,
      hashedPassword,
      isActive: true,
      emailVerified: false,
    });

    // Generate access token
    const accessToken = this._createAccessToken(user.id);

    return {
      userId: user.id,
      email: user.email,
      accessToken,
      tokenType: 'bearer',
    };
  }

  async authenticateUser(
    username: string,
    password: string
  ): Promise<{ userId: string; email: string; accessToken: string; tokenType: string }> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.hashedPassword || '');

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const accessToken = this._createAccessToken(user.id);

    return {
      userId: user.id,
      email: user.email,
      accessToken,
      tokenType: 'bearer',
    };
  }

  async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const payload = jwt.verify(token, this.secretKey, { algorithms: ['HS256'] }) as JWTPayload;

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        return null;
      }

      return payload;
    } catch (e) {
      return null;
    }
  }

  private _createAccessToken(userId: string): string {
    const expire = new Date(Date.now() + this.tokenExpireMinutes * 60 * 1000);

    const payload = {
      sub: userId,
      exp: Math.floor(expire.getTime() / 1000),
    };
    return jwt.sign(payload, this.secretKey, { algorithm: 'HS256' });
  }
}

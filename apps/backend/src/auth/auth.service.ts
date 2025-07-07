import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoggingService } from '../services/logging.service';
import { comparePasswords } from '../utils/auth.utils';
import { EventBus } from '../events/event-bus.service';
import { UserLoginEvent } from './events/auth.events';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private logger: LoggingService,
    private eventBus: EventBus
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && await comparePasswords(password, user.password)) {
      await this.eventBus.publish(new UserLoginEvent(user));
      return user;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
  }

  async register(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user (password will be hashed in UsersService)
    const user = await this.usersService.create({
      email,
      password,
      name,
    });

    // Generate JWT token
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
  }

  async authenticate(firebaseToken: string) {
    // Firebase authentication logic - simplified for now
    // In production, verify the Firebase token
    return { message: 'Firebase authentication not implemented yet' };
  }

  async logout(token: string) {
    // Token invalidation logic
    return { message: 'Logged out successfully' };
  }
}

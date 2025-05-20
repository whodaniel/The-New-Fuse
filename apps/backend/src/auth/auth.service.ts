import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import { LoggingService } from '../services/logging.service.js';
import { comparePasswords } from '../utils/auth.utils.js';
import { EventBus } from '../events/event-bus.service.js';
import { UserLoginEvent } from './events/auth.events.js';

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
    };
  }
}

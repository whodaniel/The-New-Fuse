import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  register() {
    return { ok: true };
  }
  login() {
    return { token: 'fake-jwt' };
  }
  refresh() {
    return { token: 'fake-jwt-refresh' };
  }
  me() {
    return { userId: 'fake-user-id', email: 'fake@email.com' };
  }
  verifyEmail() {
    return { verified: true };
  }
  forgotPassword() {
    return { sent: true };
  }
  resetPassword() {
    return { reset: true };
  }
  logout() {
    return { loggedOut: true };
  }
  validate() {
    return { valid: true };
  }
  status() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

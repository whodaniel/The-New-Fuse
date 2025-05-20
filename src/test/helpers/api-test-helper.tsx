import { Application } from "express";
import request from "supertest";
import { container } from '../setup.js';
import { TYPES } from '../../core/di/types.js';
import { AuthService } from '../../core/auth/auth.service.js';
import { UserFactory } from '../factories/test-factory.js';

export class ApiTestHelper {
  private static authService = container.get<AuthService>(TYPES.AuthService);

  static async getAuthToken(roles: string[] = ["user"]): Promise<string> {
    const user = await UserFactory.create({ roles });
    const { token } = await this.authService.login({
      email: user.email,
      password: user.password,
    });
    return token;
  }

  static createAuthenticatedRequest(app: Application, token?: string) {
    const req = request(app);
    if (token) {
      req.set("Authorization", `Bearer ${token}`);
    }
    return req;
  }

  static async createAuthenticatedAdminRequest(app: Application) {
    const token = await this.getAuthToken(["admin"]);
    return this.createAuthenticatedRequest(app, token);
  }

  static async createAuthenticatedUserRequest(app: Application) {
    const token = await this.getAuthToken(["user"]);
    return this.createAuthenticatedRequest(app, token);
  }
}

export class TestResponse<T = any> {
  constructor(
    public statusCode: number,
    public body: T,
    public headers: Record<string, string>,
  ) {}

  static fromSupertest(response: any): TestResponse {
    return new TestResponse(response.status, response.body, response.headers);
  }

  expectSuccess(expectedStatus = 200): void {
    expect(this.statusCode).toBe(expectedStatus);
  }

  expectBadRequest(): void {
    expect(this.statusCode).toBe(400);
    expect(this.body).toHaveProperty("error");
    expect(this.body.error.code).toBe("BAD_REQUEST");
  }

  expectUnauthorized(): void {
    expect(this.statusCode).toBe(401);
    expect(this.body).toHaveProperty("error");
    expect(this.body.error.code).toBe("UNAUTHORIZED");
  }

  expectForbidden(): void {
    expect(this.statusCode).toBe(403);
    expect(this.body).toHaveProperty("error");
    expect(this.body.error.code).toBe("FORBIDDEN");
  }
}

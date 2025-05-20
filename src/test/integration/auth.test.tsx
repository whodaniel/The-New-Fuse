import { container } from '../setup.js';
import type { TYPES } from '../../core/di/types.js';
import { AuthService } from '../../core/auth/auth-service.js';
import { UserFactory } from '../factories/test-factory.js';
import {
  ApiTestHelper,
  expectSuccess,
  expectUnauthorized,
} from '../helpers/api-test-helper.js';
import { Application } from "express";
import { createApp } from '../../app.js'; // Assuming you have an app creation function

describe("Authentication Integration Tests", () => {
  let app: Application;
  let authService: AuthService;

  beforeAll(async () => {
    app = await createApp(container);
    authService = container.get<AuthService>(
      TYPES.AuthService,
    );
  });

  describe("POST /auth/login", () => {
    it("should successfully login with valid credentials", async () => {
      // Arrange
      const user = await UserFactory.create();
      const password = "testPassword123!";
      await authService.updatePassword(user.id, password);

      // Act
      const response = await ApiTestHelper.createRequest(app)
        .post("/auth/login")
        .send({
          email: user.email,
          password: password,
        });

      // Assert
      expectSuccess(response);
      expect(response.body).toHaveProperty("token");
      expect(response.body.token).toBeTruthy();
    });

    it("should fail with invalid credentials", async () => {
      // Arrange
      const user = await UserFactory.create();
      
      // Act
      const response = await ApiTestHelper.createRequest(app)
        .post("/auth/login")
        .send({
          email: user.email,
          password: "wrongpassword",
        });

      // Assert
      expectUnauthorized(response);
    });

    it("should return user profile when authenticated", async () => {
      // Arrange
      const user = await UserFactory.create();
      const authenticatedRequest = await (
        ApiTestHelper as any
      ).createAuthenticatedUser(app, user);

      // Act
      const response = await authenticatedRequest.get("/auth/me");

      // Assert
      expectSuccess(response);
      expect(response.body).toHaveProperty("id", user.id);
      expect(response.body).toHaveProperty(
        "email",
        user.email,
      );
    });

    it("should fail when not authenticated", async () => {
      // Act
      const response = await (ApiTestHelper as any)
        .createRequest(app)
        .get("/auth/me");

      // Assert
      expectUnauthorized(response);
    });
  });

  describe("POST /auth/refresh", () => {
    it("should refresh token successfully", async () => {
      // Arrange
      const user = await UserFactory.create();
      const { token } = await authService.login({
        email: user.email,
        password: user.password,
      });
      
      // Act
      const response = await ApiTestHelper.createRequest(app)
        .post("/auth/refresh")
        .set("Authorization", `Bearer ${token}`);

      // Assert
      expectSuccess(response);
      expect(response.body).toHaveProperty("token");
      expect(response.body.token).not.toBe(token);
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout successfully", async () => {
      // Arrange
      const user = await UserFactory.create();
      const authenticatedRequest = await (
        ApiTestHelper as any
      ).createAuthenticatedUser(app, user);

      // Act
      const response = await authenticatedRequest.post("/auth/logout");

      // Assert
      expectSuccess(response);

      // Verify token is invalidated
      const meResponse = await authenticatedRequest.get("/auth/me");
      expectUnauthorized(meResponse);
    });
  });
});

export {};

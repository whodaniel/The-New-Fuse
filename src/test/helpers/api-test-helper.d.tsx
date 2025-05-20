import { Application } from "express";
export declare class ApiTestHelper {
  private static authService;
  static getAuthToken(roles?: string[]): Promise<string>;
  static createAuthenticatedRequest(app: Application, token?: string): unknown;
  static createAuthenticatedAdmin(app: Application): Promise<any>;
  static createAuthenticatedUser(app: Application): Promise<any>;
}
export declare class TestResponse<T = any> {
  statusCode: number;
  body: T;
  headers: Record<string, string>;
  constructor(statusCode: number, body: T, headers: Record<string, string>);
  static fromSupertest(response: unknown): TestResponse;
}
export declare const expectSuccess: (response: TestResponse) => void;
export declare const expectError: (
  response: TestResponse,
  expectedStatus?: number,
) => void;
export declare const expectValidationError: (response: TestResponse) => void;
export declare const expectNotFound: (response: TestResponse) => void;
export declare const expectUnauthorized: (response: TestResponse) => void;
export declare const expectForbidden: (response: TestResponse) => void;

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { authenticate } from '../src/middleware/auth';
import { ApiError } from '../src/middleware/errorHandler';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

// Explicitly import describe, it, expect from @jest/globals to fix the issue
import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';

describe('Authentication Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  const originalEnv = process.env;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should call next() if valid test-token is provided in development', () => {
    process.env.NODE_ENV = 'development';
    req.headers = { authorization: 'Bearer test-token' };

    authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect((req as any).user).toEqual({
      id: 'test-user-id',
      email: 'test@example.com',
      roles: ['user'],
    });
  });

  it('should return 401 if no token is provided', () => {
    authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const error = (next as jest.Mock).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized: No token provided');
  });

  it('should return 401 if token is invalid', () => {
    req.headers = { authorization: 'Bearer invalid-token' };
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const error = (next as jest.Mock).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized: Invalid token');
  });

  it('should call next() and attach user if token is valid', () => {
    req.headers = { authorization: 'Bearer valid-token' };
    const mockUser = { id: 'user-1', email: 'user@example.com' };
    (jwt.verify as jest.Mock).mockReturnValue(mockUser);

    authenticate(req as Request, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect((req as any).user).toEqual(mockUser);
  });
});

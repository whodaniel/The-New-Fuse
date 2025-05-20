import { toMatchAPIContract, APIContract } from '../toMatchAPIContract.js';
import { z } from 'zod';

describe('toMatchAPIContract', () => {
  const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email()
  });

  const testContract: APIContract = {
    status: 200,
    headers: {
      'content-type': 'application/json'
    },
    schema: userSchema
  };

  const validResponse = {
    status: 200,
    headers: {
      'content-type': 'application/json'
    },
    data: {
      id: '123',
      name: 'Test User',
      email: 'test@example.com'
    }
  };

  it('should pass for valid response', async () => {
    const result = await toMatchAPIContract.call({} as any, validResponse, testContract);
    expect(result.pass).toBe(true);
  });

  it('should fail for mismatched status code', async () => {
    const invalidResponse = {
      ...validResponse,
      status: 404
    };
    const result = await toMatchAPIContract.call({} as any, invalidResponse, testContract);
    expect(result.pass).toBe(false);
  });

  it('should fail for missing required header', async () => {
    const invalidResponse = {
      ...validResponse,
      headers: {}
    };
    const result = await toMatchAPIContract.call({} as any, invalidResponse, testContract);
    expect(result.pass).toBe(false);
  });

  it('should fail for invalid data schema', async () => {
    const invalidResponse = {
      ...validResponse,
      data: {
        id: '123',
        name: 'Test User',
        email: 'invalid-email' // Invalid email format
      }
    };
    const result = await toMatchAPIContract.call({} as any, invalidResponse, testContract);
    expect(result.pass).toBe(false);
  });

  it('should handle response without headers requirement', async () => {
    const contractWithoutHeaders: APIContract = {
      status: 200,
      schema: userSchema
    };
    const result = await toMatchAPIContract.call({} as any, validResponse, contractWithoutHeaders);
    expect(result.pass).toBe(true);
  });
});
import { toCompleteWithinTime } from '../toCompleteWithinTime.js';

describe('toCompleteWithinTime', () => {
  const delay = (ms: number): any => new Promise(resolve => setTimeout(resolve, ms));

  it('should pass for operation completing within time limit', async () => {
    const operation = delay(50);
    const result = await toCompleteWithinTime.call({} as any, operation, 100);
    expect(result.pass).toBe(true);
  });

  it('should fail for operation exceeding time limit', async () => {
    const operation = delay(200);
    const result = await toCompleteWithinTime.call({} as any, operation, 100);
    expect(result.pass).toBe(false);
  });

  it('should handle errors in the operation', async () => {
    const operation = Promise.reject(new Error('Operation failed'));
    await expect(toCompleteWithinTime.call({} as any, operation, 100))
      .rejects
      .toThrow('Operation failed');
  });

  it('should handle immediate resolution', async () => {
    const operation = Promise.resolve();
    const result = await toCompleteWithinTime.call({} as any, operation, 100);
    expect(result.pass).toBe(true);
  });

  it('should handle zero timeout', async () => {
    const operation = Promise.resolve();
    const result = await toCompleteWithinTime.call({} as any, operation, 0);
    expect(result.pass).toBe(false);
  });

  it('should provide accurate failure message', async () => {
    const operation = delay(200);
    const result = await toCompleteWithinTime.call({} as any, operation, 100);
    expect(result.message()).toContain('100ms');
  });
});
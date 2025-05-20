import { CodeSandbox } from '../code-sandbox.js';

describe('CodeSandbox', () => {
  let sandbox: CodeSandbox;

  beforeEach(() => {
    sandbox = new CodeSandbox();
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('Code Execution', () => {
    it('should execute basic JavaScript code', async () => {
      const result = await sandbox.execute('2 + 2');
      expect(result.success).toBe(true);
      expect(result.result).toBe(4);
    });

    it('should capture console output', async () => {
      const result = await sandbox.execute(`
        console.log('test log');
        console.error('test error');
        console.warn('test warning');
      `);
      
      expect(result.success).toBe(true);
      expect(result.output).toHaveLength(3);
      expect(result.output[0]).toContain('test log');
      expect(result.output[1]).toContain('test error');
      expect(result.output[2]).toContain('test warning');
    });

    it('should handle syntax errors', async () => {
      const result = await sandbox.execute('invalid syntax{');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle runtime errors', async () => {
      const result = await sandbox.execute('throw new Error("test error")');
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('test error');
    });
  });

  describe('Resource Limits', () => {
    it('should enforce timeout limits', async () => {
      const sandbox = new CodeSandbox({ timeout: 100 });
      const result = await sandbox.execute(`
        while(true) {}
      `);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timeout');
    });

    it('should enforce memory limits', async () => {
      const sandbox = new CodeSandbox({ memoryLimit: 1024 * 1024 }); // 1MB
      const result = await sandbox.execute(`
        const arr = new Array(1000000).fill('x'.repeat(1000));
      `);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Memory limit exceeded');
    });

    it('should track memory usage', async () => {
      const result = await sandbox.execute(`
        const arr = new Array(1000).fill('test');
      `);
      
      expect(result.memoryUsage).toBeDefined();
      expect(typeof result.memoryUsage).toBe('number');
      expect(result.memoryUsage).toBeGreaterThan(0);
    });

    it('should track execution time', async () => {
      const result = await sandbox.execute(`
        let x = 0;
        for(let i = 0; i < 1000000; i++) x++;
      `);
      
      expect(result.executionTime).toBeDefined();
      expect(typeof result.executionTime).toBe('number');
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  describe('Security', () => {
    it('should prevent access to node process object', async () => {
      const result = await sandbox.execute('process.exit(1)');
      expect(result.success).toBe(false);
    });

    it('should prevent access to require function', async () => {
      const result = await sandbox.execute('require("fs")');
      expect(result.success).toBe(false);
    });

    it('should allow specified modules only', async () => {
      const sandbox = new CodeSandbox({
        allowedModules: ['path']
      });

      const result = await sandbox.execute(`
        const path = require('path');
        path.join('/test', 'file.txt');
      `);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Context Management', () => {
    it('should allow custom context variables', async () => {
      const sandbox = new CodeSandbox({
        context: {
          customVar: 123,
          customFunc: (x: number) => x * 2
        }
      });

      const result = await sandbox.execute(`
        customFunc(customVar)
      `);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(246);
    });

    it('should reset context between executions', async () => {
      await sandbox.execute('let x = 10');
      const result = await sandbox.execute('typeof x');
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('undefined');
    });
  });
});
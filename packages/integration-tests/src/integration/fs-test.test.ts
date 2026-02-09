/**
 * Simple filesystem test to verify fs operations work correctly
 * @jest-environment node
 */

import * as fs from 'fs-extra';
import * as path from 'path';

describe('Filesystem Operations Test', () => {
  const testDir = path.join(__dirname, '../../test-fs-debug');
  const testFile = path.join(testDir, 'test.json');

  beforeAll(async () => {
    await fs.ensureDir(testDir);
  });

  afterAll(async () => {
    await fs.remove(testDir);
  });

  test('should write and read files correctly', async () => {
    const testData = { message: 'Hello World', timestamp: Date.now() };
    
    // Write file
    await fs.writeJson(testFile, testData, { spaces: 2 });
    // File written to: testFile
    
    // Test file existence check
    const exists = await fs.pathExists(testFile);
    // File exists (fs.pathExists): exists
    expect(exists).toBe(true);
    
    // Read file content
    const content = await fs.readFile(testFile, 'utf8');
    // File content type, length, and preview logged for debugging
    
    expect(content).toBeDefined();
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
    
    // Parse and verify JSON
    const parsedData = JSON.parse(content);
    expect(parsedData.message).toBe('Hello World');
    expect(parsedData.timestamp).toBe(testData.timestamp);
  });
});
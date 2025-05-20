/**
 * Tests for the artifact generation utilities
 */

import fs from 'fs';
import path from 'path';
import { ArtifactManager } from '../artifact-manager.js';

// Create a test-specific artifact manager
const testRunId = `test-run-${Date.now()}`;
const testDir = path.join(process.cwd(), 'test-artifacts', testRunId);
const artifactManager = new ArtifactManager({ runId: testRunId });

describe('ArtifactManager', () => {
  // Clean up test artifacts after tests
  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  it('should create the artifact directory', () => {
    expect(fs.existsSync(testDir)).toBe(true);
  });
  
  it('should create a JSON artifact', () => {
    const testData = { foo: 'bar', baz: 123 };
    const artifactPath = artifactManager.createArtifact({
      name: 'test-artifact',
      content: testData
    });
    
    expect(fs.existsSync(artifactPath)).toBe(true);
    
    const content = fs.readFileSync(artifactPath, 'utf8');
    const parsed = JSON.parse(content);
    
    expect(parsed.content).toEqual(testData);
    expect(parsed.metadata.runId).toBe(testRunId);
  });
  
  it('should create a snapshot artifact', () => {
    const testData = { user: { name: 'Test User', id: 123 }, permissions: ['read', 'write'] };
    const artifactPath = artifactManager.createSnapshot('user', testData, {
      testName: 'should create a snapshot artifact',
      tags: ['user', 'permissions']
    });
    
    expect(fs.existsSync(artifactPath)).toBe(true);
    
    const content = fs.readFileSync(artifactPath, 'utf8');
    const parsed = JSON.parse(content);
    
    expect(parsed.content).toEqual(testData);
    expect(parsed.metadata.category).toBe('snapshot');
    expect(parsed.metadata.tags).toContain('user');
  });
  
  it('should create a log artifact', () => {
    const logEntries = [
      { level: 'info', message: 'Test started', timestamp: '2023-01-01T00:00:00Z' },
      { level: 'error', message: 'Something went wrong', timestamp: '2023-01-01T00:00:01Z' },
      { level: 'info', message: 'Test completed', timestamp: '2023-01-01T00:00:02Z' }
    ];
    
    const artifactPath = artifactManager.createLog('test-log', logEntries);
    
    expect(fs.existsSync(artifactPath)).toBe(true);
    
    const content = fs.readFileSync(artifactPath, 'utf8');
    const parsed = JSON.parse(content);
    
    expect(parsed.content).toEqual(logEntries);
    expect(parsed.metadata.category).toBe('log');
  });
  
  it('should list all artifacts', () => {
    // We've created 3 artifacts so far
    const artifacts = artifactManager.listArtifacts();
    expect(artifacts.length).toBe(3);
  });
  
  it('should get an artifact by name', () => {
    // Create a specific artifact to retrieve
    const testData = { specific: 'data' };
    artifactManager.createArtifact({
      name: 'specific-artifact',
      content: testData
    });
    
    const artifact = artifactManager.getArtifact('specific-artifact');
    expect(artifact.content).toEqual(testData);
  });
  
  it('should handle non-JSON artifacts', () => {
    const textContent = 'This is plain text content';
    const artifactPath = artifactManager.createArtifact({
      name: 'text-artifact',
      content: textContent,
      extension: 'txt',
      stringify: false
    });
    
    expect(fs.existsSync(artifactPath)).toBe(true);
    
    const content = fs.readFileSync(artifactPath, 'utf8');
    expect(content).toBe(textContent);
  });
});

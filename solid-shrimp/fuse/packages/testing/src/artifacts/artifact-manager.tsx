/**
 * Test Artifact Generation Utilities for The New Fuse
 * 
 * This module provides utilities for generating and managing test artifacts
 * such as snapshots, logs, and other outputs from tests.
 */

import fs from 'fs';
import path from 'path';
import { expect as jestExpect } from '@jest/globals';

/**
 * Interface for artifact metadata
 */
export interface ArtifactMetadata {
  timestamp: string;
  testName?: string;
  testFile?: string;
  category?: string;
  tags?: string[];
  [key: string]: any;
}

/**
 * Options for creating an artifact
 */
export interface CreateArtifactOptions {
  name: string;
  content: any;
  extension?: string;
  metadata?: Partial<ArtifactMetadata>;
  stringify?: boolean;
  pretty?: boolean;
}

/**
 * Class for managing test artifacts
 */
export class ArtifactManager {
  private baseDir: string;
  private runId: string;
  
  /**
   * Create a new ArtifactManager
   * @param options Options for the artifact manager
   */
  constructor(options?: { baseDir?: string; runId?: string }) {
    this.baseDir = options?.baseDir || process.env.TEST_ARTIFACTS_DIR || path.join(process.cwd(), 'test-artifacts');
    this.runId = options?.runId || process.env.TEST_RUN_ID || `test-run-${Date.now()}`;
    
    // Ensure the base directory exists
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    
    // Ensure the run directory exists
    const runDir = this.getRunDirectory();
    if (!fs.existsSync(runDir)) {
      fs.mkdirSync(runDir, { recursive: true });
    }
  }
  
  /**
   * Get the directory for the current test run
   */
  getRunDirectory(): string {
    return path.join(this.baseDir, this.runId);
  }
  
  /**
   * Create a new artifact
   * @param options Options for creating the artifact
   * @returns Path to the created artifact
   */
  createArtifact(options: CreateArtifactOptions): string {
    const {
      name,
      content,
      extension = 'json',
      metadata = {},
      stringify = true,
      pretty = true
    } = options;
    
    // Create a sanitized filename
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const sanitizedName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `${sanitizedName}-${timestamp}.${extension}`;
    
    // Create the artifact path
    const artifactPath = path.join(this.getRunDirectory(), filename);
    
    // Prepare the content
    let fileContent: string;
    if (stringify) {
      // For JSON content
      const fullContent = {
        metadata: {
          timestamp: new Date().toISOString(),
          runId: this.runId,
          ...metadata
        },
        content
      };
      fileContent = pretty
        ? JSON.stringify(fullContent, null, 2)
        : JSON.stringify(fullContent);
    } else {
      // For raw content (like images, text, etc.)
      fileContent = content.toString();
    }
    
    // Write the artifact to disk
    fs.writeFileSync(artifactPath, fileContent);
    
    return artifactPath;
  }
  
  /**
   * Create a snapshot artifact
   * @param name Name of the snapshot
   * @param data Data to snapshot
   * @param metadata Additional metadata
   * @returns Path to the created snapshot
   */
  createSnapshot(name: string, data: any, metadata: Partial<ArtifactMetadata> = {}): string {
    return this.createArtifact({
      name: `snapshot-${name}`,
      content: data,
      metadata: {
        category: 'snapshot',
        ...metadata
      }
    });
  }
  
  /**
   * Create a log artifact
   * @param name Name of the log
   * @param entries Log entries
   * @param metadata Additional metadata
   * @returns Path to the created log
   */
  createLog(name: string, entries: any[], metadata: Partial<ArtifactMetadata> = {}): string {
    return this.createArtifact({
      name: `log-${name}`,
      content: entries,
      metadata: {
        category: 'log',
        ...metadata
      }
    });
  }
  
  /**
   * Create a report artifact
   * @param name Name of the report
   * @param data Report data
   * @param metadata Additional metadata
   * @returns Path to the created report
   */
  createReport(name: string, data: any, metadata: Partial<ArtifactMetadata> = {}): string {
    return this.createArtifact({
      name: `report-${name}`,
      content: data,
      metadata: {
        category: 'report',
        ...metadata
      }
    });
  }
  
  /**
   * List all artifacts for the current run
   * @returns Array of artifact paths
   */
  listArtifacts(): string[] {
    const runDir = this.getRunDirectory();
    if (!fs.existsSync(runDir)) {
      return [];
    }
    
    return fs.readdirSync(runDir)
      .filter(file => !file.startsWith('.'))
      .map(file => path.join(runDir, file));
  }
  
  /**
   * Get an artifact by name
   * @param name Name of the artifact
   * @returns Artifact content or null if not found
   */
  getArtifact(name: string): any | null {
    const artifacts = this.listArtifacts();
    const artifact = artifacts.find(a => path.basename(a).includes(name));
    
    if (!artifact) {
      return null;
    }
    
    const content = fs.readFileSync(artifact, 'utf8');
    try {
      return JSON.parse(content);
    } catch (e) {
      return content;
    }
  }
}

/**
 * Create a Jest matcher for artifact generation
 * @param artifactManager Artifact manager instance
 * @returns Jest matcher
 */
export function createArtifactMatcher(artifactManager: ArtifactManager): any {
  return {
    /**
     * Custom matcher to generate an artifact from a value
     */
    toGenerateArtifact(received: any, name: string, metadata: Partial<ArtifactMetadata> = {}) {
      const artifactPath = artifactManager.createArtifact({
        name,
        content: received,
        metadata
      });
      
      return {
        pass: true,
        message: () => `Generated artifact: ${artifactPath}`
      };
    }
  };
}

// --- Global Instance and Jest Integration ---

// Export a default instance for convenience in tests
export const artifactManager = new ArtifactManager();

// Export matchers for explicit use if needed
export const artifactMatchers = createArtifactMatcher(artifactManager);

// Attempt to automatically extend Jest's expect if it's available globally.
// This requires '@types/jest' for compile-time safety.
try {
  if (typeof jestExpect !== 'undefined' && typeof jestExpect.extend === 'function') {
    jestExpect.extend(artifactMatchers);
    // console.log('Successfully extended Jest expect with artifact matchers.'); // Optional debug log
  }
} catch (error) {
   console.error('Could not automatically extend Jest expect:', error);
   // This might happen in non-Jest environments or if Jest types are missing.
}

// Default export remains the manager instance
export default artifactManager;
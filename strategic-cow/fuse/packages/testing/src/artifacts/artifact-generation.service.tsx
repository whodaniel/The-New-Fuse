import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import archiver from 'archiver';

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const mkdir = util.promisify(fs.mkdir);

export interface TestArtifact {
  name: string;
  type: 'screenshot' | 'video' | 'log' | 'report' | 'coverage' | 'other';
  content: Buffer | string;
  metadata?: Record<string, any>;
}

export interface ArtifactGenerationConfig {
  outputDir: string;
  createArchive: boolean;
  includeTimestamp: boolean;
  retentionDays: number;
}

@Injectable()
export class ArtifactGenerationService {
  private readonly config: ArtifactGenerationConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      outputDir: this.configService.get<string>('testing.artifacts.outputDir', 'test-artifacts'),
      createArchive: this.configService.get<boolean>('testing.artifacts.createArchive', true),
      includeTimestamp: this.configService.get<boolean>('testing.artifacts.includeTimestamp', true),
      retentionDays: this.configService.get<number>('testing.artifacts.retentionDays', 30)
    };
  }

  /**
   * Save a test artifact
   */
  async saveArtifact(artifact: TestArtifact): Promise<string> {
    // Create output directory if it doesn't exist
    const outputDir = path.join(this.config.outputDir, artifact.type);
    await mkdir(outputDir, { recursive: true });
    
    // Generate filename
    const timestamp = this.config.includeTimestamp ? `-${new Date().toISOString().replace(/:/g, '-')}` : '';
    const filename = `${artifact.name}${timestamp}`;
    const outputPath = path.join(outputDir, filename);
    
    // Save artifact
    if (Buffer.isBuffer(artifact.content)) {
      await writeFile(outputPath, artifact.content);
    } else {
      await writeFile(outputPath, artifact.content);
    }
    
    // Save metadata if provided
    if (artifact.metadata) {
      await writeFile(`${outputPath}.meta.json`, JSON.stringify(artifact.metadata, null, 2));
    }
    
    return outputPath;
  }

  /**
   * Save multiple artifacts
   */
  async saveArtifacts(artifacts: TestArtifact[]): Promise<string[]> {
    const paths = [];
    
    for (const artifact of artifacts) {
      const path = await this.saveArtifact(artifact);
      paths.push(path);
    }
    
    return paths;
  }

  /**
   * Create an archive of artifacts
   */
  async createArtifactArchive(
    name: string,
    artifacts: TestArtifact[] | string[],
    metadata?: Record<string, any>
  ): Promise<string> {
    // Create output directory if it doesn't exist
    await mkdir(this.config.outputDir, { recursive: true });
    
    // Generate archive filename
    const timestamp = this.config.includeTimestamp ? `-${new Date().toISOString().replace(/:/g, '-')}` : '';
    const archiveName = `${name}${timestamp}.zip`;
    const archivePath = path.join(this.config.outputDir, archiveName);
    
    // Create archive
    const output = fs.createWriteStream(archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);
    
    // Add artifacts to archive
    for (const artifact of artifacts) {
      if (typeof artifact === 'string') {
        // Artifact is a file path
        archive.file(artifact, { name: path.basename(artifact) });
      } else {
        // Artifact is a TestArtifact object
        const content = Buffer.isBuffer(artifact.content) 
          ? artifact.content 
          : Buffer.from(artifact.content);
        
        archive.append(content, { name: artifact.name });
        
        if (artifact.metadata) {
          archive.append(JSON.stringify(artifact.metadata, null, 2), { name: `${artifact.name}.meta.json` });
        }
      }
    }
    
    // Add metadata if provided
    if (metadata) {
      archive.append(JSON.stringify(metadata, null, 2), { name: 'archive-metadata.json' });
    }
    
    // Finalize archive
    await archive.finalize();
    
    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(archivePath));
      archive.on('error', reject);
    });
  }

  /**
   * Clean up old artifacts
   */
  async cleanupOldArtifacts(): Promise<number> {
    if (this.config.retentionDays <= 0) {
      return 0; // No cleanup needed
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    
    let deletedCount = 0;
    
    // Recursively find and delete old files
    const deleteOldFiles = async (dir: string) => {
      const files = await util.promisify(fs.readdir)(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await util.promisify(fs.stat)(filePath);
        
        if (stats.isDirectory()) {
          // Recursively process subdirectories
          const subDirDeletedCount = await deleteOldFiles(filePath);
          deletedCount += subDirDeletedCount;
          
          // Delete empty directories
          const remainingFiles = await util.promisify(fs.readdir)(filePath);
          if (remainingFiles.length === 0) {
            await util.promisify(fs.rmdir)(filePath);
          }
        } else if (stats.mtime < cutoffDate) {
          // Delete old files
          await util.promisify(fs.unlink)(filePath);
          deletedCount++;
        }
      }
      
      return deletedCount;
    };
    
    try {
      if (fs.existsSync(this.config.outputDir)) {
        deletedCount = await deleteOldFiles(this.config.outputDir);
      }
    } catch (error) {
      console.error('Error cleaning up old artifacts:', error);
    }
    
    return deletedCount;
  }
}

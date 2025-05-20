import { vol } from 'memfs';
import { join } from 'path';

export interface VirtualFileSystemOptions {
  root?: string;
  initialFiles?: Record<string, string>;
}

export class VirtualFileSystem {
  private root: string;

  constructor(options: VirtualFileSystemOptions = {}) {
    this.root = options.root || '/sandbox';
    this.reset(options.initialFiles);
  }

  /**
   * Reset the virtual filesystem to initial state
   */
  reset(initialFiles: Record<string, string> = {}): void {
    vol.reset();
    for (const [path, content] of Object.entries(initialFiles)) {
      this.writeFile(path, content);
    }
  }

  /**
   * Write content to a file
   */
  writeFile(path: string, content: string): void {
    const fullPath = this.resolvePath(path);
    vol.mkdirpSync(this.getDirname(fullPath));
    vol.writeFileSync(fullPath, content);
  }

  /**
   * Read content from a file
   */
  readFile(path: string): string {
    const fullPath = this.resolvePath(path);
    // Explicitly cast to string, as readFileSync with 'utf-8' should return string
    return vol.readFileSync(fullPath, 'utf-8') as string;
  }

  /**
   * Check if a file exists
   */
  exists(path: string): boolean {
    return vol.existsSync(this.resolvePath(path));
  }

  /**
   * List files in a directory
   */
  listFiles(path: string = '/'): string[] {
    const fullPath = this.resolvePath(path);
    // Explicitly cast to string[], as readdirSync without encoding returns string[]
    return vol.readdirSync(fullPath) as string[];
  }

  /**
   * Delete a file or directory
   */
  delete(path: string): void {
    const fullPath = this.resolvePath(path);
    vol.rmSync(fullPath, { recursive: true, force: true });
  }

  /**
   * Get file stats
   */
  getStats(path: string) {
    const fullPath = this.resolvePath(path);
    return vol.statSync(fullPath);
  }

  /**
   * Create a directory
   */
  mkdir(path: string): void {
    const fullPath = this.resolvePath(path);
    vol.mkdirSync(fullPath, { recursive: true });
  }

  private resolvePath(path: string): string {
    return join(this.root, path);
  }

  private getDirname(path: string): string {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/');
  }
}
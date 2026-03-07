import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

interface CleanupOptions {
  all?: boolean;
  deps?: boolean;
  build?: boolean;
  docker?: boolean;
  cache?: boolean;
}

class ProjectCleaner {
  private commandExists(command: string): boolean {
    try {
      execSync(`command -v ${command}`);
      return true;
    } catch {
      return false;
    }
  }

  private cleanDependencies(): void {
    
    this.safeRemove('node_modules');
    this.safeRemove('.yarn/cache');
    execSync('find . -name "node_modules" -type d -prune -exec rm -rf {} +');
    this.safeRemove('package-lock.json');
    this.safeRemove('yarn.lock');
  }

  private cleanBuildArtifacts(): void {
    
    execSync('find . -name "dist" -type d -prune -exec rm -rf {} +');
    execSync('find . -name ".next" -type d -prune -exec rm -rf {} +');
    execSync('find . -name ".turbo" -type d -prune -exec rm -rf {} +');
    execSync('find . -name "*.tsbuildinfo" -type f -delete');
    execSync('find . -name ".cache" -type d -prune -exec rm -rf {} +');
  }

  private cleanDocker(): void {
    if (!this.commandExists('docker')) {
      
      return;
    }

    try {
      execSync('docker-compose down --remove-orphans');
      execSync('docker system prune -af --volumes');
    } catch (error) {
      
    }
  }

  private cleanCache(): void {
    
    execSync('yarn cache clean');
    
    if (this.commandExists('redis-cli')) {
      try {
        execSync('redis-cli FLUSHALL');
      } catch {
        
      }
    }

    // Clean test caches
    execSync('find . -name ".pytest_cache" -type d -exec rm -rf {} +');
    execSync('find . -name "__pycache__" -type d -exec rm -rf {} +');
    execSync('find . -name "coverage" -type d -exec rm -rf {} +');
  }

  private safeRemove(path: string): void {
    const fullPath = join(process.cwd(), path);
    if (existsSync(fullPath)) {
      rmSync(fullPath, { recursive: true, force: true });
    }
  }

  public clean(options: CleanupOptions): void {

    if (options.all || options.deps) {
      this.cleanDependencies();
    }

    if (options.all || options.build) {
      this.cleanBuildArtifacts();
    }

    if (options.all || options.docker) {
      this.cleanDocker();
    }

    if (options.all || options.cache) {
      this.cleanCache();
    }

  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: CleanupOptions = {
  all: args.includes('--all'),
  deps: args.includes('--deps'),
  build: args.includes('--build'),
  docker: args.includes('--docker'),
  cache: args.includes('--cache'),
};

// If no specific options provided, default to --all
if (!Object.values(options).some(Boolean)) {
  options.all = true;
}

const cleaner = new ProjectCleaner();
cleaner.clean(options);
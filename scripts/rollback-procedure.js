#!/usr/bin/env node

/**
 * Rollback Procedure Script
 * Provides safe rollback options for the reorganization process
 */

import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

class RollbackManager {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  }

  async promptUser(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  async showRollbackOptions() {
    console.log('\n=== ROLLBACK OPTIONS ===');
    console.log('1. Complete rollback to backup branch');
    console.log('2. Partial rollback (specific commits)');
    console.log('3. File-level rollback');
    console.log('4. Database rollback only');
    console.log('5. Cancel and return');
    
    const choice = await this.promptUser('\nSelect rollback option (1-5): ');
    
    switch (choice.trim()) {
      case '1':
        await this.completeRollback();
        break;
      case '2':
        await this.partialRollback();
        break;
      case '3':
        await this.fileLevelRollback();
        break;
      case '4':
        await this.databaseRollback();
        break;
      case '5':
        this.log('Rollback cancelled');
        break;
      default:
        this.log('Invalid option selected', 'error');
        await this.showRollbackOptions();
    }
    
    this.rl.close();
  }

  async completeRollback() {
    this.log('Initiating complete rollback...');
    
    try {
      // Check if backup branch exists
      const branches = execSync('git branch -a', { encoding: 'utf8' });
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const backupBranch = `backup-${today}`;
      
      if (!branches.includes(backupBranch)) {
        // Try to find any backup branch
        const backupBranches = branches.split('\n').filter(branch => branch.includes('backup-'));
        
        if (backupBranches.length === 0) {
          this.log('No backup branch found. Checking for backup tag...', 'warn');
          
          const tags = execSync('git tag --list backup-*', { encoding: 'utf8' });
          if (tags.trim()) {
            const latestTag = tags.trim().split('\n').pop();
            this.log(`Found backup tag: ${latestTag}`);
            
            const confirm = await this.promptUser(`Rollback to tag ${latestTag}? (y/N): `);
            if (confirm.toLowerCase() === 'y') {
              execSync(`git reset --hard ${latestTag}`);
              this.log('Rollback to backup tag completed');
            }
          } else {
            this.log('No backup found. Cannot perform complete rollback.', 'error');
          }
          return;
        }
        
        // Use the latest backup branch
        const latestBackup = backupBranches[backupBranches.length - 1].trim();
        this.log(`Using backup branch: ${latestBackup}`);
        execSync(`git checkout ${latestBackup}`);
      } else {
        execSync(`git checkout ${backupBranch}`);
      }
      
      // Reinstall dependencies
      this.log('Reinstalling dependencies...');
      execSync('bun install', { stdio: 'inherit' });
      
      // Rebuild
      this.log('Rebuilding project...');
      execSync('bun run build', { stdio: 'inherit' });
      
      // Verify rollback
      await this.verifyRollback();
      
      this.log('✅ Complete rollback successful');
    } catch (error) {
      this.log(`Complete rollback failed: ${error.message}`, 'error');
    }
  }

  async partialRollback() {
    this.log('Initiating partial rollback...');
    
    try {
      // Show recent commits
      const commits = execSync('git log --oneline -10', { encoding: 'utf8' });
      console.log('\nRecent commits:');
      console.log(commits);
      
      const commitHash = await this.promptUser('Enter commit hash to rollback to: ');
      
      if (commitHash.trim()) {
        const confirm = await this.promptUser(`Rollback to commit ${commitHash}? This will lose recent changes. (y/N): `);
        
        if (confirm.toLowerCase() === 'y') {
          execSync(`git reset --hard ${commitHash.trim()}`);
          
          // Reinstall and rebuild
          this.log('Reinstalling dependencies...');
          execSync('bun install', { stdio: 'inherit' });
          
          this.log('Rebuilding project...');
          execSync('bun run build', { stdio: 'inherit' });
          
          await this.verifyRollback();
          this.log('✅ Partial rollback successful');
        }
      }
    } catch (error) {
      this.log(`Partial rollback failed: ${error.message}`, 'error');
    }
  }

  async fileLevelRollback() {
    this.log('Initiating file-level rollback...');
    
    try {
      // Show modified files
      const modifiedFiles = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' });
      
      if (!modifiedFiles.trim()) {
        this.log('No modified files found');
        return;
      }
      
      console.log('\nModified files:');
      console.log(modifiedFiles);
      
      const filePath = await this.promptUser('Enter file path to rollback (or "all" for all files): ');
      
      if (filePath.trim().toLowerCase() === 'all') {
        const confirm = await this.promptUser('Rollback all modified files? (y/N): ');
        if (confirm.toLowerCase() === 'y') {
          execSync('git checkout HEAD~1 -- .');
          this.log('All files rolled back');
        }
      } else if (filePath.trim()) {
        if (fs.existsSync(filePath.trim())) {
          execSync(`git checkout HEAD~1 -- "${filePath.trim()}"`);
          this.log(`File ${filePath.trim()} rolled back`);
        } else {
          this.log('File not found', 'error');
        }
      }
      
      await this.verifyRollback();
    } catch (error) {
      this.log(`File-level rollback failed: ${error.message}`, 'error');
    }
  }

  async databaseRollback() {
    this.log('Initiating database rollback...');
    
    try {
      // Check if migration scripts exist
      const migrationDirs = ['migrations', 'src/migrations', 'apps/api/src/migrations'];
      let migrationDir = null;
      
      for (const dir of migrationDirs) {
        if (fs.existsSync(dir)) {
          migrationDir = dir;
          break;
        }
      }
      
      if (!migrationDir) {
        this.log('No migration directory found', 'warn');
        return;
      }
      
      this.log(`Found migrations in: ${migrationDir}`);
      
      // Show recent migrations
      const migrations = fs.readdirSync(migrationDir)
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
        .sort()
        .reverse()
        .slice(0, 5);
      
      console.log('\nRecent migrations:');
      migrations.forEach((migration, index) => {
        console.log(`${index + 1}. ${migration}`);
      });
      
      const steps = await this.promptUser('Number of migration steps to rollback: ');
      const stepCount = parseInt(steps.trim());
      
      if (stepCount > 0) {
        const confirm = await this.promptUser(`Rollback ${stepCount} database migrations? (y/N): `);
        
        if (confirm.toLowerCase() === 'y') {
          // Try common migration rollback commands
          const rollbackCommands = [
            `bun run migration:rollback --steps=${stepCount}`,
            `bun run typeorm migration:revert`,
            `npm run migration:rollback ${stepCount}`
          ];
          
          for (const command of rollbackCommands) {
            try {
              this.log(`Trying: ${command}`);
              execSync(command, { stdio: 'inherit' });
              this.log('Database rollback successful');
              return;
            } catch (cmdError) {
              this.log(`Command failed: ${command}`, 'warn');
            }
          }
          
          this.log('All rollback commands failed. Manual intervention required.', 'error');
        }
      }
    } catch (error) {
      this.log(`Database rollback failed: ${error.message}`, 'error');
    }
  }

  async verifyRollback() {
    this.log('Verifying rollback...');
    
    try {
      // Basic verification
      execSync('bun run type-check', { stdio: 'pipe' });
      this.log('✓ TypeScript compilation successful');
      
      execSync('bun test --passWithNoTests', { stdio: 'pipe' });
      this.log('✓ Tests passing');
      
      // Save rollback verification
      const verification = {
        timestamp: new Date().toISOString(),
        status: 'successful',
        branch: execSync('git branch --show-current', { encoding: 'utf8' }).trim(),
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
      };
      
      if (!fs.existsSync('validation-results')) {
        fs.mkdirSync('validation-results');
      }
      
      fs.writeFileSync('validation-results/rollback-verification.json', JSON.stringify(verification, null, 2));
      
    } catch (error) {
      this.log(`Rollback verification failed: ${error.message}`, 'error');
      
      const verification = {
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: error.message
      };
      
      if (!fs.existsSync('validation-results')) {
        fs.mkdirSync('validation-results');
      }
      
      fs.writeFileSync('validation-results/rollback-verification.json', JSON.stringify(verification, null, 2));
    }
  }

  async emergencyProcedures() {
    console.log('\n=== EMERGENCY PROCEDURES ===');
    console.log('1. Clear all caches');
    console.log('2. Reset node_modules');
    console.log('3. Emergency database reset');
    console.log('4. Service restart simulation');
    
    const choice = await this.promptUser('Select emergency procedure (1-4): ');
    
    switch (choice.trim()) {
      case '1':
        this.log('Clearing caches...');
        try {
          execSync('bun pm cache rm');
          this.log('Cache cleared');
        } catch (error) {
          this.log(`Cache clear failed: ${error.message}`, 'error');
        }
        break;
        
      case '2':
        this.log('Resetting node_modules...');
        try {
          execSync('rm -rf node_modules package-lock.json bun.lockb');
          execSync('bun install');
          this.log('Dependencies reinstalled');
        } catch (error) {
          this.log(`Dependencies reset failed: ${error.message}`, 'error');
        }
        break;
        
      case '3':
        const confirm = await this.promptUser('This will reset the database. Continue? (y/N): ');
        if (confirm.toLowerCase() === 'y') {
          try {
            execSync('bun run db:reset', { stdio: 'inherit' });
            this.log('Database reset completed');
          } catch (error) {
            this.log(`Database reset failed: ${error.message}`, 'error');
          }
        }
        break;
        
      case '4':
        this.log('Simulating service restart...');
        try {
          execSync('bun run build');
          this.log('Build successful - services ready for restart');
        } catch (error) {
          this.log(`Service restart check failed: ${error.message}`, 'error');
        }
        break;
    }
  }
}

// Main execution
async function main() {
  const rollbackManager = new RollbackManager();
  
  console.log('=== ROLLBACK PROCEDURE MANAGER ===');
  console.log('This script helps you safely rollback changes made during reorganization.');
  
  const action = process.argv[2];
  
  if (action === 'emergency') {
    await rollbackManager.emergencyProcedures();
  } else {
    await rollbackManager.showRollbackOptions();
  }
}

main().catch(error => {
  console.error('Rollback script failed:', error);
  process.exit(1);
});

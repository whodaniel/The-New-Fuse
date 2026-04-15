/**
 * Simple script to help execute the cleanup initialization
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  
  // Execute the init script with proper output handling
  execSync('node scripts/init-cleanup.js', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
} catch (error) {
  console.error('Error running initialization:', error.message);
  process.exit(1);
}

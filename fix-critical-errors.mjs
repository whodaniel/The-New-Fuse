#!/usr/bin/env node

// Simple fix script for critical TypeScript issues
import { readFile, writeFile } from 'fs/promises';
import { readdir } from 'fs/promises';
import path from 'path';

const BACKEND_DIR = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/apps/backend/src';

async function getFiles(dir, files = []) {
  const items = await readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      await getFiles(fullPath, files);
    } else if (item.name.endsWith('.ts') && !item.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function fixFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;

    // Fix critical import issues
    const originalContent = content;

    // Fix relative imports without .js
    content = content.replace(/from ['"](\.\.[\/\\][^'"]*(?<!\.js|\.json))['"];?/g, "from '$1.js';");
    content = content.replace(/from ['"](\.[\/\\][^'"]*(?<!\.js|\.json))['"];?/g, "from '$1.js';");

    // Fix Redis imports
    content = content.replace(/import Redis from ['"]ioredis['"];?/g, "import { Redis } from 'ioredis';");

    // Fix JWT imports and usage
    if (content.includes('jwt.sign') && !content.includes('SignOptions')) {
      content = content.replace(/import jwt from ['"]jsonwebtoken['"];?/g, "import jwt, { SignOptions } from 'jsonwebtoken';");
      content = content.replace(/jwt\.sign\(([^,]+),\s*([^,]+),\s*\{\s*expiresIn:\s*([^}]+)\s*\}/g, "jwt.sign($1, $2, { expiresIn: $3 } as SignOptions");
    }

    if (content !== originalContent) {
      await writeFile(filePath, content, 'utf8');
      console.log(`Fixed: ${path.relative(process.cwd(), filePath)}`);
      modified = true;
    }

    return modified;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Starting critical TypeScript fixes...');
  
  const files = await getFiles(BACKEND_DIR);
  console.log(`Found ${files.length} TypeScript files`);
  
  let fixedCount = 0;
  for (const file of files) {
    const wasFixed = await fixFile(file);
    if (wasFixed) fixedCount++;
  }
  
  console.log(`Fixed ${fixedCount} files`);
}

main().catch(console.error);

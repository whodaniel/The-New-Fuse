#!/usr/bin/env ts-node

/**
 * Script to systematically fix common ESLint issues across the codebase
 */

import * as fs from 'fs';
import * as path from 'path';

interface FixRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const fixes: FixRule[] = [
  // Fix 'any' types with Record<string, unknown>
  {
    pattern: /: any\b/g,
    replacement: ': unknown',
    description: 'Replace any with unknown for better type safety'
  },
  
  // Fix Promise<any> with Promise<unknown>
  {
    pattern: /Promise<any>/g,
    replacement: 'Promise<unknown>',
    description: 'Replace Promise<any> with Promise<unknown>'
  },
  
  // Fix Record<string, any> with Record<string, unknown>
  {
    pattern: /Record<string, any>/g,
    replacement: 'Record<string, unknown>',
    description: 'Replace Record<string, any> with Record<string, unknown>'
  },
  
  // Fix unused parameters by prefixing with underscore
  {
    pattern: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,)]+)(?=\s*[,)])/g,
    replacement: (match: string, paramName: string, paramType: string) => {
      // Only prefix with _ if it's clearly an unused parameter in context
      if (paramName.match(/^(config|context|workflow|testCase|environment|results|visibility)$/)) {
        return `_${paramName}: ${paramType}`;
      }
      return match;
    },
    description: 'Prefix potentially unused parameters with underscore'

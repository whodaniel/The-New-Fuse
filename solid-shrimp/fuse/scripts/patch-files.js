#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Function to read file if exists
function readFileIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (e) {}
  return null;
}

// Patch middleware files
function patchRateLimitMiddleware() {
  const filePath = path.join(process.cwd(), 'src/core/middleware/rate-limit.middleware.ts');
  const content = readFileIfExists(filePath);
  
  if (content) {

    // Add imports and fix container references
    let updated = content;
    if (!updated.includes("import { container }") && updated.includes("container.get")) {
      updated = `import { container } from '../di/container.js';\n${updated}`;
    }
    
    // Fix type references
    updated = updated.replace(/TYPES\.Config/g, 'TYPES.ConfigService')
                   .replace(/TYPES\.Logger/g, 'TYPES.LoggingService')
                   .replace(/TYPES\.Time/g, 'TYPES.TimeService')
                   .replace(/TYPES\.Cache/g, 'TYPES.CacheService');
    
    fs.writeFileSync(filePath, updated);
    
  }
}

// Patch security service
function patchSecurityService() {
  const filePath = path.join(process.cwd(), 'src/core/security/security-service.ts');
  const content = readFileIfExists(filePath);
  
  if (content) {

    // Fix return types and null checks
    let updated = content.replace(
      /validateRequestIP\([^)]+\)[^{]+{/,
      'validateRequestIP(req: Request, res: Response): Response | void {'
    ).replace(
      /blockBruteForceAttempt\([^)]+\)[^{]+{/,
      'blockBruteForceAttempt(req: Request, res: Response, ip: string, path: string): Response | void {'
    ).replace(
      /rejectUnsupportedMediaType\([^)]+\)[^{]+{/,
      'rejectUnsupportedMediaType(req: Request, res: Response): Response | void {'
    ).replace(
      /rejectOversizedPayload\([^)]+\)[^{]+{/,
      'rejectOversizedPayload(req: Request, res: Response): Response | void {'
    ).replace(
      /ip: req\.ip,/,
      'ip: req.ip || "unknown",'
    ).replace(
      /ip, path/g,
      'ip || "unknown", path'
    );
    
    fs.writeFileSync(filePath, updated);
    
  }
}

// Patch hook files
function patchAuthHook() {
  const filePath = path.join(process.cwd(), 'src/hooks/useAuth.ts');
  const content = readFileIfExists(filePath);
  
  if (content) {

    // Fix toast reference
    let updated = content.replace(
      /const { toast } = useToast\(\);/,
      'const { addToast } = useToast();'
    );
    
    // Fix API calls with type parameters
    updated = updated.replace(
      /api\.post<([^>]+)>/g, 
      'api.post'
    ).replace(
      /api\.put<([^>]+)>/g,
      'api.put'
    ).replace(
      /api\.get<([^>]+)>/g,
      'api.get'
    );
    
    fs.writeFileSync(filePath, updated);
    
  }
}

function patchFileUploadHook() {
  const filePath = path.join(process.cwd(), 'src/hooks/useFileUpload.ts');
  const content = readFileIfExists(filePath);
  
  if (content) {

    // Add missing options
    let updated = content;
    if (updated.includes('interface FileUploadOptions') && !updated.includes('data?: Record<string, any>')) {
      updated = updated.replace(
        /interface FileUploadOptions {/,
        'interface FileUploadOptions {\n  data?: Record<string, any>;\n  showSuccessToast?: boolean;\n  showErrorToast?: boolean;'
      );
    }
    
    // Fix type casting
    updated = updated.replace(
      /formData\.append\(key, value\);/,
      'formData.append(key, value as string);'
    );
    
    // Fix setState types
    updated = updated.replace(
      /setState\(prev => \({/g,
      'setState((prev: any) => ({'
    );
    
    fs.writeFileSync(filePath, updated);
    
  }
}

// Patch monitoring service
function patchMonitoringService() {
  const filePath = path.join(process.cwd(), 'src/core/monitoring/monitoring-service.ts');
  const content = readFileIfExists(filePath);
  
  if (content) {

    // Fix TYPES references
    let updated = content.replace(/TYPES\.Logger/g, 'TYPES.LoggingService')
                        .replace(/TYPES\.Config/g, 'TYPES.ConfigService');
    
    fs.writeFileSync(filePath, updated);
    
  }
}

// Run all patches
patchRateLimitMiddleware();
patchSecurityService();
patchAuthHook();
patchFileUploadHook();
patchMonitoringService();


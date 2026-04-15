/**
 * Script to identify duplicate components in The New Fuse codebase
 * This script analyzes the component files and identifies potential duplicates
 * based on naming patterns and file content similarity.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const PROJECT_ROOT = process.cwd();
const COMPONENT_DIRS = [
  'src/components',
  'packages/*/src/components',
  'packages/@the-new-fuse/*/src/components',
  'apps/*/src/components'
];
const OUTPUT_FILE = 'duplicate-components.json';

// Store component information
const components = [];
const duplicateSets = [];

/**
 * Calculate a hash of file content for similarity comparison
 */
function calculateFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Extract component name from file path
 */
function extractComponentName(filePath) {
  const basename = path.basename(filePath);
  return basename.split('.')[0]; // Remove extension
}

/**
 * Find all component files in the specified directories
 */
function findComponentFiles() {
  COMPONENT_DIRS.forEach(dirPattern => {
    const dirs = require('glob').sync(dirPattern, { cwd: PROJECT_ROOT });
    
    dirs.forEach(dir => {
      const fullDir = path.join(PROJECT_ROOT, dir);
      if (!fs.existsSync(fullDir)) return;
      
      const files = fs.readdirSync(fullDir, { recursive: true });
      
      files.forEach(file => {
        if (typeof file !== 'string') return; // Skip non-string entries (Node.js v16+)
        
        const fullPath = path.join(fullDir, file);
        if (!fs.statSync(fullPath).isFile()) return;
        
        // Check if it's a component file
        if (/\.(jsx?|tsx?)$/.test(file) && !/\.(test|spec)\.(jsx?|tsx?)$/.test(file)) {
          const componentName = extractComponentName(file);
          const fileHash = calculateFileHash(fullPath);
          
          if (fileHash) {
            components.push({
              path: path.relative(PROJECT_ROOT, fullPath),
              name: componentName,
              extension: path.extname(file),
              hash: fileHash
            });
          }
        }
      });
    });
  });
}

/**
 * Group components by name to identify potential duplicates
 */
function identifyDuplicatesByName() {
  const componentsByName = {};
  
  components.forEach(component => {
    if (!componentsByName[component.name]) {
      componentsByName[component.name] = [];
    }
    componentsByName[component.name].push(component);
  });
  
  // Find components with the same name
  Object.entries(componentsByName)
    .filter(([_, components]) => components.length > 1)
    .forEach(([name, components]) => {
      duplicateSets.push({
        name,
        type: 'name_match',
        components: components.map(c => ({ path: c.path, extension: c.extension }))
      });
    });
}

/**
 * Identify components with similar content
 */
function identifySimilarComponents() {
  const componentsByHash = {};
  
  components.forEach(component => {
    if (!componentsByHash[component.hash]) {
      componentsByHash[component.hash] = [];
    }
    componentsByHash[component.hash].push(component);
  });
  
  // Find components with the same content hash
  Object.entries(componentsByHash)
    .filter(([_, components]) => components.length > 1)
    .forEach(([hash, components]) => {
      // Skip if all components have the same name (already caught by name check)
      const uniqueNames = new Set(components.map(c => c.name));
      if (uniqueNames.size > 1) {
        duplicateSets.push({
          type: 'content_match',
          components: components.map(c => ({ name: c.name, path: c.path, extension: c.extension }))
        });
      }
    });
}

/**
 * Main execution function
 */
function main() {
  console.log('Scanning for component files...');
  findComponentFiles();
  console.log(`Found ${components.length} component files`);
  
  console.log('Identifying duplicates by name...');
  identifyDuplicatesByName();
  
  console.log('Identifying similar components by content...');
  identifySimilarComponents();
  
  // Write results to file
  const results = {
    totalComponents: components.length,
    duplicateSets: duplicateSets,
    summary: {
      nameMatches: duplicateSets.filter(set => set.type === 'name_match').length,
      contentMatches: duplicateSets.filter(set => set.type === 'content_match').length,
      totalDuplicateSets: duplicateSets.length
    }
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`Results written to ${OUTPUT_FILE}`);
  console.log(`Found ${results.summary.totalDuplicateSets} potential duplicate sets`);
}

// Run the script
main();
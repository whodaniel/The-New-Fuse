/**
 * Script to identify and consolidate duplicate components in The New Fuse codebase
 * This script builds on identify-duplicate-components.js to provide actionable consolidation steps
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
const DUPLICATE_COMPONENTS_FILE = 'duplicate-components.json';
const LOST_COMPONENTS_FILE = 'component-analysis-results.json';
const CONSOLIDATION_PLAN_FILE = 'component-consolidation-plan.json';
const CONSOLIDATION_REPORT_FILE = 'component-consolidation-report.md';

// Store component information
const components = [];
const duplicateSets = [];
let lostComponents = [];

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
        components: components.map(c => ({ path: c.path, extension: c.extension })),
        priority: getPriorityForComponent(name)
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
          components: components.map(c => ({ name: c.name, path: c.path, extension: c.extension })),
          priority: Math.max(...Array.from(uniqueNames).map(name => getPriorityForComponent(name)))
        });
      }
    });
}

/**
 * Load lost components from component analysis results
 */
function loadLostComponents() {
  try {
    if (fs.existsSync(LOST_COMPONENTS_FILE)) {
      const results = JSON.parse(fs.readFileSync(LOST_COMPONENTS_FILE, 'utf8'));
      lostComponents = results.potentiallyLost || [];
      console.log(`Loaded ${lostComponents.length} potentially lost components`);
    } else {
      console.log(`Warning: ${LOST_COMPONENTS_FILE} not found. Run find-lost-components.js first.`);
    }
  } catch (error) {
    console.error(`Error loading lost components:`, error.message);
  }
}

/**
 * Determine priority for component consolidation
 * High priority for UI, auth, and layout components
 */
function getPriorityForComponent(name) {
  const highPriorityPatterns = [
    // UI Components
    /^Button$/i, /Button$/i, /^Btn$/i,
    /^Card$/i, /Card$/i,
    /^Input$/i, /Input$/i,
    /^Modal$/i, /Modal$/i,
    /^Table$/i, /Table$/i,
    /^Form$/i, /Form$/i,
    /^Select$/i, /Select$/i,
    /^Dropdown$/i, /Dropdown$/i,
    /^Checkbox$/i, /Checkbox$/i,
    /^Radio$/i, /Radio$/i,
    /^Toggle$/i, /Toggle$/i,
    /^Switch$/i, /Switch$/i,
    
    // Auth Components
    /^Login$/i, /Login$/i,
    /^Register$/i, /Register$/i,
    /^Signup$/i, /Signup$/i,
    /^Auth$/i, /Auth$/i,
    /^Password$/i, /Password$/i,
    
    // Layout Components
    /^Header$/i, /Header$/i,
    /^Footer$/i, /Footer$/i,
    /^Sidebar$/i, /Sidebar$/i,
    /^Nav$/i, /Nav$/i,
    /^Navigation$/i, /Navigation$/i,
    /^Layout$/i, /Layout$/i,
    /^Container$/i, /Container$/i
  ];
  
  const mediumPriorityPatterns = [
    /^List$/i, /List$/i,
    /^Item$/i, /Item$/i,
    /^Icon$/i, /Icon$/i,
    /^Badge$/i, /Badge$/i,
    /^Alert$/i, /Alert$/i,
    /^Notification$/i, /Notification$/i,
    /^Toast$/i, /Toast$/i,
    /^Tooltip$/i, /Tooltip$/i,
    /^Popover$/i, /Popover$/i,
    /^Menu$/i, /Menu$/i,
    /^Tab$/i, /Tab$/i,
    /^Panel$/i, /Panel$/i,
    /^Dialog$/i, /Dialog$/i
  ];
  
  if (highPriorityPatterns.some(pattern => pattern.test(name))) {
    return 'high';
  } else if (mediumPriorityPatterns.some(pattern => pattern.test(name))) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Generate a consolidation plan for duplicate components
 */
function generateConsolidationPlan() {
  const plan = {
    highPriority: [],
    mediumPriority: [],
    lowPriority: [],
    lostComponents: {
      total: lostComponents.length,
      samples: lostComponents.slice(0, 10) // Just include a few samples
    }
  };
  
  // Sort duplicate sets by priority
  duplicateSets.forEach(set => {
    const item = {
      ...set,
      recommendedAction: 'consolidate',
      targetPath: determineTargetPath(set),
      consolidationSteps: generateConsolidationSteps(set)
    };
    
    if (set.priority === 'high') {
      plan.highPriority.push(item);
    } else if (set.priority === 'medium') {
      plan.mediumPriority.push(item);
    } else {
      plan.lowPriority.push(item);
    }
  });
  
  return plan;
}

/**
 * Determine the best target path for consolidation
 */
function determineTargetPath(set) {
  // Prefer components in ui or ui-components packages
  const components = set.components;
  
  // First priority: packages/ui/src/components
  const uiComponent = components.find(c => c.path.includes('packages/ui/src/components'));
  if (uiComponent) return uiComponent.path;
  
  // Second priority: packages/ui-components
  const uiComponentsComponent = components.find(c => c.path.includes('packages/ui-components'));
  if (uiComponentsComponent) return uiComponentsComponent.path;
  
  // Third priority: packages/core/components
  const coreComponent = components.find(c => c.path.includes('packages/core/components'));
  if (coreComponent) return coreComponent.path;
  
  // Fourth priority: packages/shared/components
  const sharedComponent = components.find(c => c.path.includes('packages/shared/components'));
  if (sharedComponent) return sharedComponent.path;
  
  // Default: first component in the list (usually alphabetically first)
  return components[0].path;
}

/**
 * Generate steps for consolidating components
 */
function generateConsolidationSteps(set) {
  const targetPath = determineTargetPath(set);
  const steps = [
    `1. Review all implementations to understand functionality differences`,
    `2. Create consolidated version at ${targetPath} that supports all use cases`,
    `3. Update all references to use the consolidated component`,
    `4. Add comprehensive tests for the consolidated component`,
    `5. Remove redundant implementations after verifying functionality`
  ];
  
  return steps;
}

/**
 * Generate a markdown report for the consolidation plan
 */
function generateMarkdownReport(plan) {
  let report = `# Component Consolidation Report\n\n`;
  report += `Generated on ${new Date().toISOString()}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- Total Components: ${components.length}\n`;
  report += `- Duplicate Sets: ${duplicateSets.length}\n`;
  report += `- High Priority Duplicates: ${plan.highPriority.length}\n`;
  report += `- Medium Priority Duplicates: ${plan.mediumPriority.length}\n`;
  report += `- Low Priority Duplicates: ${plan.lowPriority.length}\n`;
  report += `- Potentially Lost Components: ${plan.lostComponents.total}\n\n`;
  
  report += `## High Priority Consolidation Tasks\n\n`;
  plan.highPriority.forEach((item, index) => {
    report += `### ${index + 1}. ${item.name || 'Unnamed Component Set'}\n\n`;
    report += `**Type:** ${item.type === 'name_match' ? 'Name Match' : 'Content Match'}\n\n`;
    report += `**Components to Consolidate:**\n\n`;
    item.components.forEach(comp => {
      report += `- `${comp.path}`\n`;
    });
    report += `\n**Target Path:** `${item.targetPath}`\n\n`;
    report += `**Consolidation Steps:**\n\n`;
    item.consolidationSteps.forEach(step => {
      report += `${step}\n`;
    });
    report += `\n`;
  });
  
  report += `## Medium Priority Consolidation Tasks\n\n`;
  plan.mediumPriority.forEach((item, index) => {
    report += `### ${index + 1}. ${item.name || 'Unnamed Component Set'}\n\n`;
    report += `**Type:** ${item.type === 'name_match' ? 'Name Match' : 'Content Match'}\n\n`;
    report += `**Components to Consolidate:**\n\n`;
    item.components.forEach(comp => {
      report += `- `${comp.path}`\n`;
    });
    report += `\n**Target Path:** `${item.targetPath}`\n\n`;
    report += `**Consolidation Steps:**\n\n`;
    item.consolidationSteps.forEach(step => {
      report += `${step}\n`;
    });
    report += `\n`;
  });
  
  report += `## Low Priority Consolidation Tasks\n\n`;
  // Only show the first 10 low priority tasks to keep the report manageable
  const lowPriorityToShow = plan.lowPriority.slice(0, 10);
  lowPriorityToShow.forEach((item, index) => {
    report += `### ${index + 1}. ${item.name || 'Unnamed Component Set'}\n\n`;
    report += `**Type:** ${item.type === 'name_match' ? 'Name Match' : 'Content Match'}\n\n`;
    report += `**Components to Consolidate:**\n\n`;
    item.components.forEach(comp => {
      report += `- `${comp.path}`\n`;
    });
    report += `\n**Target Path:** `${item.targetPath}`\n\n`;
  });
  
  if (plan.lowPriority.length > 10) {
    report += `*...and ${plan.lowPriority.length - 10} more low priority tasks*\n\n`;
  }
  
  report += `## Potentially Lost Components\n\n`;
  report += `There are ${plan.lostComponents.total} potentially lost components that are not referenced by other files.\n\n`;
  report += `**Sample of Lost Components:**\n\n`;
  plan.lostComponents.samples.forEach(comp => {
    report += `- `${comp.path}`\n`;
  });
  report += `\n*See ${LOST_COMPONENTS_FILE} for the complete list.*\n\n`;
  
  report += `## Next Steps\n\n`;
  report += `1. Start with high priority component consolidation\n`;
  report += `2. Create backups before making changes\n`;
  report += `3. Update tests after consolidation\n`;
  report += `4. Review potentially lost components for possible reuse\n`;
  
  return report;
}

/**
 * Main execution function
 */
function main() {
  console.log('Starting component consolidation analysis...');
  
  console.log('Scanning for component files...');
  findComponentFiles();
  console.log(`Found ${components.length} component files`);
  
  console.log('Identifying duplicates by name...');
  identifyDuplicatesByName();
  
  console.log('Identifying similar components by content...');
  identifySimilarComponents();
  
  console.log('Loading potentially lost components...');
  loadLostComponents();
  
  console.log('Generating consolidation plan...');
  const plan = generateConsolidationPlan();
  
  // Write consolidation plan to file
  fs.writeFileSync(CONSOLIDATION_PLAN_FILE, JSON.stringify(plan, null, 2));
  console.log(`Consolidation plan written to ${CONSOLIDATION_PLAN_FILE}`);
  
  // Generate and write markdown report
  const report = generateMarkdownReport(plan);
  fs.writeFileSync(CONSOLIDATION_REPORT_FILE, report);
  console.log(`Consolidation report written to ${CONSOLIDATION_REPORT_FILE}`);
  
  console.log('Summary:');
  console.log(`- Total Components: ${components.length}`);
  console.log(`- Duplicate Sets: ${duplicateSets.length}`);
  console.log(`- High Priority Duplicates: ${plan.highPriority.length}`);
  console.log(`- Medium Priority Duplicates: ${plan.mediumPriority.length}`);
  console.log(`- Low Priority Duplicates: ${plan.lowPriority.length}`);
  console.log(`- Potentially Lost Components: ${lostComponents.length}`);
}

// Run the script
main();
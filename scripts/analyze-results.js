/**
 * Analysis Results Helper for The New Fuse
 * 
 * This script helps extract key insights from the analysis reports
 * and suggests priority areas for cleanup.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { exec } from 'child_process';

// ES modules setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const execPromise = promisify(exec);
const access = promisify(fs.access);

const PROJECT_ROOT = path.resolve(__dirname, '..');

async function fileExists(filePath) {
  try {
    await access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

async function runCleanupAnalysis() {

  try {
    const resultsPath = path.join(PROJECT_ROOT, 'reports', 'cleanup-results.txt');
    
    // Run the cleanup.js script and capture its output
    ...');
    
    try {
      const { stdout } = await execPromise(`node ${path.join(__dirname, 'cleanup.js')}`, {
        cwd: PROJECT_ROOT,
      });
      
      // Save the output to the results file
      await writeFile(resultsPath, stdout, 'utf8');
      
      return true;
    } catch (error) {
      console.error(`Error running cleanup analysis: ${error.message}`);
      
      return false;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return false;
  }
}

async function summarizeCleanupResults() {

  const resultsPath = path.join(PROJECT_ROOT, 'reports', 'cleanup-results.txt');
  const resultsExists = await fileExists(resultsPath);
  
  if (!resultsExists) {
    const analysisRun = await runCleanupAnalysis();
    if (!analysisRun) {
      // Create a basic report without the detailed analysis
      await generateBasicReport();
      return;
    }
  }
  
  try {
    const content = await readFile(resultsPath, 'utf8');
    
    // Extract key information from results
    const unusedFiles = content.match(/Potentially unused: .+/g) || [];
    const duplicateFunctions = content.split('Top recurring function patterns')[1]?.split('\n').filter(line => line.trim()) || [];
    const outdatedDocs = content.match(/Documentation might be outdated: .+/g) || [];
    const highlyImported = content.match(/  .+: imported in \d+ files/g) || [];
    const complexComponents = [];
    
    // Find complex components section and extract data
    const complexComponentsSection = content.split('Top 10 most complex components')[1] || '';
    const complexComponentLines = complexComponentsSection.split('\n');
    for (let i = 0; i < complexComponentLines.length; i++) {
      const line = complexComponentLines[i];
      if (line.match(/^\s+\d+\./)) {
        const component = line.trim();
        const details = complexComponentLines[i+1]?.trim() || '';
        complexComponents.push({ component, details });
        i++; // Skip the details line in the next iteration
      }
    }
    
    // Create summary object
    const summary = {
      unusedFiles: unusedFiles.length,
      duplicateFunctions: duplicateFunctions.length,
      outdatedDocs: outdatedDocs.length,
      highlyImportedModules: highlyImported.length,
      complexComponents: complexComponents.length,
      details: {
        unusedFiles: unusedFiles.map(line => line.replace('Potentially unused: ', '')),
        topDuplicateFunctions: duplicateFunctions.slice(0, 5),
        outdatedDocs: outdatedDocs.map(line => line.replace('Documentation might be outdated: ', '')),
        topImported: highlyImported.slice(0, 5),
        topComplex: complexComponents.slice(0, 5)
      }
    };
    
    // Generate suggested priorities
    const priorities = [];
    
    if (unusedFiles.length > 10) {
      priorities.push('Remove unused files (high number detected)');
    } else if (unusedFiles.length > 0) {
      priorities.push('Review and remove unused files');
    }
    
    if (outdatedDocs.length > 0) {
      priorities.push('Update outdated documentation');
    }
    
    if (complexComponents.length > 0) {
      priorities.push('Refactor complex components');
    }
    
    if (duplicateFunctions.length > 10) {
      priorities.push('Consolidate duplicate functions');
    } else if (duplicateFunctions.length > 0) {
      priorities.push('Review potential duplicate code patterns');
    }
    
    // If no specific priorities were found, add some general ones
    if (priorities.length === 0) {
      priorities.push('Run final-cleanup.js to remove console.logs and standardize imports');
      priorities.push('Update documentation to reflect current architecture');
      priorities.push('Standardize folder structure');
    }
    
    // Write summary to file
    const summaryPath = path.join(PROJECT_ROOT, 'reports', 'analysis-summary.json');
    await writeFile(summaryPath, JSON.stringify({
      summary,
      suggestedPriorities: priorities
    }, null, 2), 'utf8');

    priorities.forEach((priority, index) => {
      
    });

    // Generate a markdown report with actionable items
    let reportContent = `# The New Fuse - Cleanup Analysis Report

## Summary of Findings
- **Unused Files**: ${summary.unusedFiles} files may be unused
- **Duplicate Functions**: ${summary.duplicateFunctions} potential duplicate function patterns
- **Outdated Documentation**: ${summary.outdatedDocs} documentation files may be outdated
- **Highly Imported Modules**: ${summary.highlyImportedModules} modules imported in multiple files
- **Complex Components**: ${summary.complexComponents} components identified as complex

## Suggested Priority Areas

${priorities.map((priority, index) => `${index + 1}. ${priority}`).join('\n')}
`;

    // Only include sections with actual content
    if (summary.details.unusedFiles.length > 0) {
      reportContent += `
## Top Items to Address

### Unused Files to Review
${summary.details.unusedFiles.slice(0, 10).map(file => `- \`${file}\``).join('\n')}
`;
    }

    if (summary.details.outdatedDocs.length > 0) {
      reportContent += `
### Outdated Documentation to Update
${summary.details.outdatedDocs.slice(0, 10).map(doc => `- \`${doc}\``).join('\n')}
`;
    }

    if (summary.details.topComplex.length > 0) {
      reportContent += `
### Complex Components to Refactor
${summary.details.topComplex.map(item => `- ${item.component}\n  - ${item.details}`).join('\n')}
`;
    }

    reportContent += `
## Next Steps
1. Update \`cleanup-plan-working.md\` with specific tasks based on these findings
2. Use \`node scripts/final-cleanup.js\` to perform automated cleanup operations
3. Run \`node scripts/update-progress.js\` periodically to track your progress

*Generated on ${new Date().toISOString().split('T')[0]}*
`;

    const reportPath = path.join(PROJECT_ROOT, 'reports', 'cleanup-action-plan.md');
    await writeFile(reportPath, reportContent, 'utf8');

  } catch (error) {
    console.error('Error summarizing cleanup results:', error.message);
    await generateBasicReport();
  }
}

async function generateBasicReport() {

  // Default priorities without detailed analysis
  const priorities = [
    'Run scripts/cleanup.js to identify unused files and code patterns',
    'Remove console.log statements and commented out code with scripts/final-cleanup.js',
    'Update documentation to reflect current architecture',
    'Standardize folder structure following component-standards.md',
    'Implement tree-shaking as described in optimization-guide.md'
  ];
  
  // Generate a basic report
  const reportContent = `# The New Fuse - Cleanup Action Plan

## Note
This is a basic action plan generated without detailed code analysis. For more detailed insights, please run:
\`\`\`bash
node scripts/cleanup.js > reports/cleanup-results.txt
node scripts/analyze-results.js
\`\`\`

## Recommended Priority Areas

${priorities.map((priority, index) => `${index + 1}. ${priority}`).join('\n')}

## Initial Tasks

1. **Remove Unused Imports & Dead Code**
   - Run \`node scripts/final-cleanup.js\` to automatically remove console.logs and standardize imports
   - Review the generated \`unused-imports.txt\` and \`unused-files.txt\` files

2. **Documentation Update**
   - Review README.md files across the project
   - Ensure documentation matches current implementation
   - Follow standards in \`docs/component-standards.md\`

3. **Structure Standardization**
   - Organize code following the folder structure in \`docs/component-standards.md\`
   - Consolidate utilities into shared locations
   - Create proper barrel files (index.ts) for clean exports

## Next Steps
1. Update \`cleanup-plan-working.md\` with specific tasks based on your findings
2. Use \`node scripts/final-cleanup.js\` to perform automated cleanup operations
3. Run \`node scripts/update-progress.js\` periodically to track your progress

*Generated on ${new Date().toISOString().split('T')[0]}*
`;

  const reportPath = path.join(PROJECT_ROOT, 'reports', 'cleanup-action-plan.md');
  await writeFile(reportPath, reportContent, 'utf8');

  // Write a minimal analysis summary
  const summaryPath = path.join(PROJECT_ROOT, 'reports', 'analysis-summary.json');
  await writeFile(summaryPath, JSON.stringify({
    summary: {
      unusedFiles: 0,
      duplicateFunctions: 0,
      outdatedDocs: 0,
      highlyImportedModules: 0,
      complexComponents: 0,
      details: {
        unusedFiles: [],
        topDuplicateFunctions: [],
        outdatedDocs: [],
        topImported: [],
        topComplex: []
      }
    },
    suggestedPriorities: priorities
  }, null, 2), 'utf8');
}

async function analyzeDependencies() {

  try {
    const depsPath = path.join(PROJECT_ROOT, 'reports', 'dependencies-report.json');
    const depsExists = await fileExists(depsPath);
    
    if (!depsExists) {
      
      return;
    }
    
    const depsContent = await readFile(depsPath, 'utf8');
    const depsData = JSON.parse(depsContent);

    // Check for outdated npm packages

  } catch (error) {
    console.error('Error analyzing dependencies:', error.message);
  }
}

async function main() {

  await summarizeCleanupResults();
  await analyzeDependencies();

}

main().catch(console.error);

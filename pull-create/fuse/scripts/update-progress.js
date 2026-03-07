/**
 * Cleanup Progress Update Script for The New Fuse
 * 
 * This script updates the progress dashboard based on the cleanup plan
 * and provides a summary of the current cleanup status.
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const PROJECT_ROOT = path.resolve(__dirname, '..');

async function parseCleanupPlan() {
  const planPath = path.join(PROJECT_ROOT, 'cleanup-plan-working.md');
  
  try {
    const content = await readFile(planPath, 'utf8');
    const sections = content.split('##').slice(1);
    
    const categories = [];
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    
    for (const section of sections) {
      if (section.trim().startsWith('Completed Items') || 
          section.trim().startsWith('Next Steps') ||
          section.trim().startsWith('Final Verification')) {
        continue;
      }
      
      const lines = section.split('\n');
      const categoryName = lines[0].trim();
      
      const taskLines = lines.filter(line => line.trim().startsWith('- ['));
      const tasks = taskLines.length;
      const completed = taskLines.filter(line => line.includes('- [x]')).length;
      const inProgress = taskLines.filter(line => line.includes('- [~]')).length;
      
      if (tasks > 0) {
        categories.push({
          name: categoryName,
          total: tasks,
          completed,
          inProgress,
          notStarted: tasks - completed - inProgress
        });
        
        totalTasks += tasks;
        completedTasks += completed;
        inProgressTasks += inProgress;
      }
    }
    
    return {
      categories,
      summary: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        notStarted: totalTasks - completedTasks - inProgressTasks,
        percentComplete: Math.round((completedTasks / totalTasks) * 100)
      }
    };
  } catch (error) {
    console.error('Error parsing cleanup plan:', error.message);
    return {
      categories: [],
      summary: { total: 0, completed: 0, inProgress: 0, notStarted: 0, percentComplete: 0 }
    };
  }
}

async function updateDashboard(progress) {
  const dashboardPath = path.join(PROJECT_ROOT, 'CLEANUP-DASHBOARD-CURRENT.md');
  
  try {
    let content = await readFile(dashboardPath, 'utf8');
    
    // Update progress table
    let progressTable = '| Category | Not Started | In Progress | Completed | Total Tasks |\n';
    progressTable += '|----------|-------------|-------------|-----------|-------------|\n';
    
    for (const category of progress.categories) {
      progressTable += `| ${category.name} | ${category.notStarted} | ${category.inProgress} | ${category.completed} | ${category.total} |\n`;
    }
    
    progressTable += `| **TOTAL** | **${progress.summary.notStarted}** | **${progress.summary.inProgress}** | **${progress.summary.completed}** | **${progress.summary.total}** |`;
    
    // Replace existing table
    const tableRegex = /\| Category \|[\s\S]*?\| \*\*TOTAL\*\* \|[\s\S]*?\|/;
    content = content.replace(tableRegex, progressTable);
    
    // Add timestamp
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    content = content.replace(/# The New Fuse Cleanup Dashboard/, 
                           `# The New Fuse Cleanup Dashboard\n\nLast updated: ${timestamp} (${progress.summary.percentComplete}% complete)`);
    
    await writeFile(dashboardPath, content, 'utf8');
    
  } catch (error) {
    console.error('Error updating dashboard:', error.message);
  }
}

async function main() {

  const progress = await parseCleanupPlan();

  `);

  for (const category of progress.categories) {
    const categoryPercent = Math.round((category.completed / category.total) * 100);
    `);
  }
  
  await updateDashboard(progress);
}

main().catch(console.error);

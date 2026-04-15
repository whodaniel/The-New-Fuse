#!/usr/bin/env node

/**
 * Progress Monitoring Dashboard for The New Fuse Codebase Improvement
 * 
 * This script checks the current progress of the improvement roadmap by:
 * 1. Analyzing the roadmap markdown file
 * 2. Checking GitHub issues (if CLI available)
 * 3. Generating progress reports
 * 4. Suggesting next actions
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class ProgressMonitor {
  constructor() {
    this.roadmapPath = 'CODEBASE_IMPROVEMENT_ROADMAP.md';
    this.progressReportsDir = 'progress-reports';
    this.ghAvailable = this.checkGitHubCLI();
  }

  checkGitHubCLI() {
    try {
      execSync('gh --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  async run() {
    console.log(`${colors.cyan}${colors.bright}🚀 The New Fuse - Progress Monitor${colors.reset}\n`);
    
    try {
      // Read and parse roadmap
      const roadmapProgress = this.parseRoadmap();
      
      // Get GitHub data if available
      let githubData = null;
      if (this.ghAvailable) {
        githubData = await this.getGitHubData();
      }
      
      // Generate dashboard
      this.displayDashboard(roadmapProgress, githubData);
      
      // Generate recommendations
      this.generateRecommendations(roadmapProgress, githubData);
      
      // Save progress report
      this.saveProgressReport(roadmapProgress, githubData);
      
    } catch (error) {
      console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }

  parseRoadmap() {
    if (!fs.existsSync(this.roadmapPath)) {
      throw new Error(`Roadmap file not found: ${this.roadmapPath}`);
    }

    const content = fs.readFileSync(this.roadmapPath, 'utf8');
    
    // Extract overall progress
    const progressMatch = content.match(/\*\*Total Progress: (\d+)% \((\d+)\/(\d+) tasks\)\*\*/);
    const overallProgress = progressMatch ? {
      percentage: parseInt(progressMatch[1]),
      completed: parseInt(progressMatch[2]),
      total: parseInt(progressMatch[3])
    } : { percentage: 0, completed: 0, total: 0 };

    // Extract phase progress
    const phases = {};
    const phaseMatches = content.matchAll(/- \[([ x])\] \*\*Phase (\d+) Complete\*\* \((\d+)\/(\d+) tasks\)/g);
    
    for (const match of phaseMatches) {
      const phaseNumber = match[2];
      phases[`phase-${phaseNumber}`] = {
        completed: match[1] === 'x',
        completedTasks: parseInt(match[3]),
        totalTasks: parseInt(match[4]),
        percentage: parseInt(match[4]) > 0 ? Math.round((parseInt(match[3]) / parseInt(match[4])) * 100) : 0
      };
    }

    // Extract task checkboxes by phase
    const taskPattern = /- \[([ x])\] \*\*Task (\d+\.\d+\.\d+):\*\*(.*?)$/gm;
    const tasks = {};
    let taskMatch;
    
    while ((taskMatch = taskPattern.exec(content)) !== null) {
      const taskId = taskMatch[2];
      const phaseNum = taskId.split('.')[0];
      const phaseKey = `phase-${phaseNum}`;
      
      if (!tasks[phaseKey]) tasks[phaseKey] = [];
      
      tasks[phaseKey].push({
        id: taskId,
        title: taskMatch[3].trim(),
        completed: taskMatch[1] === 'x',
        status: taskMatch[1] === 'x' ? 'completed' : 'pending'
      });
    }

    return {
      overall: overallProgress,
      phases,
      tasks,
      lastUpdated: this.extractLastUpdated(content)
    };
  }

  extractLastUpdated(content) {
    const match = content.match(/\*\*Last Updated:\*\* (\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : 'Unknown';
  }

  async getGitHubData() {
    if (!this.ghAvailable) return null;

    try {
      // Get all roadmap-related issues
      const issuesOutput = execSync('gh issue list --label "phase-1,phase-2,phase-3,phase-4" --state all --json number,title,state,labels,assignees,updatedAt --limit 100', 
        { encoding: 'utf8', stdio: 'pipe' });
      
      const issues = JSON.parse(issuesOutput);
      
      // Organize by phases
      const githubData = {
        'phase-1': { open: [], closed: [] },
        'phase-2': { open: [], closed: [] },
        'phase-3': { open: [], closed: [] },
        'phase-4': { open: [], closed: [] }
      };

      issues.forEach(issue => {
        const phaseLabel = issue.labels.find(label => 
          ['phase-1', 'phase-2', 'phase-3', 'phase-4'].includes(label.name)
        );
        
        if (phaseLabel) {
          const phase = phaseLabel.name;
          const status = issue.state === 'CLOSED' ? 'closed' : 'open';
          githubData[phase][status].push({
            number: issue.number,
            title: issue.title,
            assignees: issue.assignees.map(a => a.login),
            updatedAt: issue.updatedAt
          });
        }
      });

      return githubData;
    } catch (error) {
      console.warn(`${colors.yellow}⚠️  Could not fetch GitHub data: ${error.message}${colors.reset}`);
      return null;
    }
  }

  displayDashboard(roadmapProgress, githubData) {
    console.log(`${colors.bright}📊 PROGRESS DASHBOARD${colors.reset}`);
    console.log(`${colors.bright}===================${colors.reset}\n`);

    // Overall progress
    const { overall } = roadmapProgress;
    const progressBar = this.createProgressBar(overall.percentage);
    console.log(`${colors.bright}Overall Progress: ${overall.percentage}% (${overall.completed}/${overall.total} tasks)${colors.reset}`);
    console.log(`${progressBar}\n`);

    // Phase breakdown
    console.log(`${colors.bright}📋 PHASE BREAKDOWN${colors.reset}`);
    console.log(`${colors.bright}==================${colors.reset}`);
    
    Object.entries(roadmapProgress.phases).forEach(([phase, data]) => {
      const phaseNum = phase.replace('phase-', '');
      const statusIcon = data.completed ? '✅' : data.completedTasks > 0 ? '🟡' : '⭕';
      const progressBar = this.createProgressBar(data.percentage, 20);
      
      console.log(`\n${statusIcon} ${colors.bright}Phase ${phaseNum}${colors.reset}: ${data.percentage}% (${data.completedTasks}/${data.totalTasks})`);
      console.log(`   ${progressBar}`);
      
      // Show GitHub integration if available
      if (githubData && githubData[phase]) {
        const github = githubData[phase];
        const totalGithub = github.open.length + github.closed.length;
        if (totalGithub > 0) {
          console.log(`   ${colors.blue}GitHub: ${github.closed.length}/${totalGithub} issues closed${colors.reset}`);
        }
      }
    });

    console.log(`\n${colors.bright}📅 TIMELINE${colors.reset}`);
    console.log(`${colors.bright}==========${colors.reset}`);
    console.log(`Last Updated: ${roadmapProgress.lastUpdated}`);
    console.log(`Data Source: ${githubData ? 'Roadmap + GitHub' : 'Roadmap only'}`);
  }

  createProgressBar(percentage, width = 30) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    let color = colors.red;
    if (percentage >= 75) color = colors.green;
    else if (percentage >= 50) color = colors.yellow;
    else if (percentage >= 25) color = colors.blue;
    
    return `${color}${bar}${colors.reset} ${percentage}%`;
  }

  generateRecommendations(roadmapProgress, githubData) {
    console.log(`\n${colors.bright}🎯 RECOMMENDATIONS${colors.reset}`);
    console.log(`${colors.bright}=================${colors.reset}`);

    // Find current phase
    const currentPhase = this.getCurrentPhase(roadmapProgress);
    console.log(`${colors.cyan}📍 Current Focus: ${currentPhase}${colors.reset}`);

    // Suggest next actions
    const nextActions = this.getNextActions(roadmapProgress, githubData);
    if (nextActions.length > 0) {
      console.log(`\n${colors.bright}Next Actions:${colors.reset}`);
      nextActions.forEach((action, index) => {
        console.log(`${index + 1}. ${action}`);
      });
    }

    // GitHub integration suggestions
    if (!this.ghAvailable) {
      console.log(`\n${colors.yellow}💡 Install GitHub CLI for enhanced tracking:${colors.reset}`);
      console.log(`   brew install gh && gh auth login`);
    }
  }

  getCurrentPhase(roadmapProgress) {
    for (const [phase, data] of Object.entries(roadmapProgress.phases)) {
      if (!data.completed && data.completedTasks < data.totalTasks) {
        return phase.replace('phase-', 'Phase ');
      }
    }
    return 'All phases complete! 🎉';
  }

  getNextActions(roadmapProgress, githubData) {
    const actions = [];
    
    // Check for stalled tasks
    const stalledPhases = Object.entries(roadmapProgress.phases)
      .filter(([phase, data]) => !data.completed && data.completedTasks === 0);
    
    if (stalledPhases.length > 0) {
      actions.push(`${colors.red}Start working on ${stalledPhases[0][0]} tasks${colors.reset}`);
    }

    // Check for GitHub integration
    if (this.ghAvailable && githubData) {
      const openIssues = Object.values(githubData)
        .reduce((total, phase) => total + phase.open.length, 0);
      
      if (openIssues > 0) {
        actions.push(`${colors.blue}Review and assign ${openIssues} open GitHub issues${colors.reset}`);
      }
    }

    // Check for documentation updates
    const daysSinceUpdate = this.getDaysSinceUpdate(roadmapProgress.lastUpdated);
    if (daysSinceUpdate > 7) {
      actions.push(`${colors.yellow}Update roadmap progress (last updated ${daysSinceUpdate} days ago)${colors.reset}`);
    }

    return actions;
  }

  getDaysSinceUpdate(lastUpdated) {
    if (lastUpdated === 'Unknown') return Infinity;
    const lastDate = new Date(lastUpdated);
    const now = new Date();
    return Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  }

  saveProgressReport(roadmapProgress, githubData) {
    // Create progress reports directory
    if (!fs.existsSync(this.progressReportsDir)) {
      fs.mkdirSync(this.progressReportsDir, { recursive: true });
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const reportPath = path.join(this.progressReportsDir, `progress-${currentDate}.json`);
    
    const report = {
      date: currentDate,
      overall: roadmapProgress.overall,
      phases: roadmapProgress.phases,
      github: githubData,
      recommendations: this.getNextActions(roadmapProgress, githubData)
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n${colors.green}📄 Progress report saved: ${reportPath}${colors.reset}`);
  }
}

// Run the progress monitor
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new ProgressMonitor();
  monitor.run().catch(error => {
    console.error(`${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export default ProgressMonitor;
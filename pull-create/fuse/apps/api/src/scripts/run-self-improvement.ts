#!/usr/bin/env ts-node

/**
 * Self-Improvement Swarm Demonstration
 *
 * This script runs a live demonstration of the AI agent swarm
 * working together to improve The New Fuse framework.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CoordinatorAgentService } from '../agents/coordinator.service';

async function bootstrap() {
  console.log('🚀 Starting Self-Improvement Agent Swarm...\n');
  console.log('='.repeat(80));
  console.log('  AI AGENTS IMPROVING THE NEW FUSE FRAMEWORK');
  console.log('='.repeat(80));
  console.log();

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  // Get the Coordinator service
  const coordinator = app.get(CoordinatorAgentService);

  console.log('📋 Agent Swarm Composition:');
  console.log('  1. Analyzer Agent     - Scans codebase for issues');
  console.log('  2. Architect Agent    - Reviews architecture & suggests improvements');
  console.log('  3. Implementer Agent  - Writes code improvements');
  console.log('  4. Reviewer Agent     - Reviews code for quality & security');
  console.log('  5. Coordinator Agent  - Orchestrates the workflow');
  console.log();

  console.log('🔄 Self-Improvement Loop:');
  console.log('  1. Analyzer scans codebase → finds issues');
  console.log('  2. Architect designs solution → creates task');
  console.log('  3. Implementer writes code → creates PR');
  console.log('  4. Reviewer checks code → approves');
  console.log('  5. Coordinator merges → deploys');
  console.log('  6. Loop continues (agents improve themselves!)');
  console.log();

  console.log('🎬 Starting live demonstration...\n');

  try {
    // Run the self-improvement cycle
    const cycle = await coordinator.startSelfImprovementCycle();

    console.log();
    console.log('='.repeat(80));
    console.log('  CYCLE COMPLETE');
    console.log('='.repeat(80));
    console.log();

    // Get the detailed report
    const report = await coordinator.getCycleReport();

    console.log(report.summary);
    console.log();

    console.log('📊 Detailed Improvements:');
    console.log('-'.repeat(80));
    report.improvements.forEach((imp, index) => {
      const emoji = imp.status === 'completed' ? '✅' :
                    imp.status === 'in_progress' ? '⏳' :
                    imp.status === 'failed' ? '❌' : '⏸️';
      console.log(`${index + 1}. ${emoji} ${imp.title} [${imp.status}]`);
    });
    console.log();

    console.log('💬 Agent Communication Log:');
    console.log('-'.repeat(80));
    report.chatLog.slice(0, 20).forEach((msg, index) => {
      const time = msg.timestamp.toLocaleTimeString();
      console.log(`[${time}] ${msg.from} → ${msg.to}: ${msg.message}`);
    });

    if (report.chatLog.length > 20) {
      console.log(`... and ${report.chatLog.length - 20} more messages`);
    }
    console.log();

    console.log('⏱️  Timeline of Events:');
    console.log('-'.repeat(80));
    report.timeline.slice(0, 15).forEach((event, index) => {
      const time = event.time.toLocaleTimeString();
      console.log(`[${time}] ${event.event}`);
    });

    if (report.timeline.length > 15) {
      console.log(`... and ${report.timeline.length - 15} more events`);
    }
    console.log();

    console.log('🎯 Success Metrics:');
    console.log('-'.repeat(80));
    const progress = await coordinator.trackProgress();
    console.log(`  Total Tasks:        ${progress.totalTasks}`);
    console.log(`  Completed:          ${progress.completed} ✅`);
    console.log(`  In Progress:        ${progress.inProgress} ⏳`);
    console.log(`  Pending:            ${progress.pending} ⏸️`);
    console.log(`  Failed:             ${progress.failed} ❌`);
    console.log(`  Completion:         ${progress.percentComplete}%`);
    console.log();

    console.log('🏆 Impact Summary:');
    console.log('-'.repeat(80));
    console.log(`  Issues Found:       ${report.metrics.totalIssuesFound}`);
    console.log(`  Issues Fixed:       ${report.metrics.issuesFixed}`);
    console.log(`  Features Added:     ${report.metrics.featuresAdded}`);
    console.log(`  Tests Created:      ${report.metrics.testsCreated}`);
    console.log(`  Avg Review Score:   ${report.metrics.codeReviewScore.toFixed(1)}/100`);
    console.log();

    console.log('✨ Self-Improvement Cycle Complete!');
    console.log();
    console.log('The agents are now continuously monitoring and improving the framework.');
    console.log('Next cycle will begin automatically based on detected changes.');
    console.log();

  } catch (error) {
    console.error('❌ Error during self-improvement cycle:', error);
    console.error((error as Error).stack);
  } finally {
    await app.close();
  }
}

// Run the demonstration
bootstrap().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

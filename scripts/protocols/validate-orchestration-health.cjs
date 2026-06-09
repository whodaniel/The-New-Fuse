#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CALENDAR_PATH = path.join(__dirname, '../../docs/operations/TNF_STAFF_MASTER_CALENDAR_AND_SCHEDULE.md');

function validateOrchestrationHealth() {
  console.log('Validating Orchestration Governance Health...');

  if (!fs.existsSync(CALENDAR_PATH)) {
    console.error(`Error: Could not find Master Calendar at ${CALENDAR_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CALENDAR_PATH, 'utf-8');
  
  // Find the Schedule Table
  const tableLines = content.split('\n').filter(line => line.trim().startsWith('|'));
  
  if (tableLines.length < 2) {
    console.error('Error: No schedule table found in the Master Calendar.');
    process.exit(1);
  }

  const header = tableLines[0];
  if (!header.includes('Last Audited') || !header.includes('Challenge Rationale')) {
    console.error('Error: Orchestration Governance Protocol violated.');
    console.error('The Master Calendar table must include "Last Audited" and "Challenge Rationale" columns.');
    process.exit(1);
  }

  console.log('✓ Found required governance columns.');

  const dataRows = tableLines.slice(2);
  let failed = false;

  dataRows.forEach((row, index) => {
    // Basic Markdown table parsing
    const columns = row.split('|').map(col => col.trim()).filter(col => col.length > 0);
    
    if (columns.length < 12) {
      console.warn(`Warning: Row ${index + 1} seems malformed or missing the governance columns.`);
      return;
    }

    const scheduleId = columns[0];
    const lastAudited = columns[10];
    const challengeRationale = columns[11];

    if (!lastAudited || lastAudited === '') {
      console.error(`Error: Schedule '${scheduleId}' is missing a 'Last Audited' date.`);
      failed = true;
    }

    if (!challengeRationale || challengeRationale === '') {
      console.error(`Error: Schedule '${scheduleId}' is missing a 'Challenge Rationale'.`);
      failed = true;
    }
  });

  if (failed) {
    console.error('\n❌ Orchestration Governance check failed. Ensure all schedules are audited and justified.');
    process.exit(1);
  }

  console.log('✅ Orchestration Governance check passed.');
}

validateOrchestrationHealth();

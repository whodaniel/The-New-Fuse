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
    // Slice split('|') without dropping empty cells so trailing/leading blanks
    // and middle empty cells stay at their original index. Trim only the value
    // we read, not the structural token count.
    const raw = row.split('|');
    // Drop the leading and trailing empty strings that surround `| col | col |`.
    const columns = raw.length >= 2 && raw[0].trim() === '' ? raw.slice(1, -1) : raw;
    const expectedColumns = 12;

    if (columns.length !== expectedColumns) {
      console.warn(
        `Warning: Row ${index + 1} has ${columns.length} columns (expected ${expectedColumns}); skipping governance check.`
      );
      return;
    }

    const scheduleId = columns[0].trim();
    const lastAudited = columns[10].trim();
    const challengeRationale = columns[11].trim();

    if (!lastAudited) {
      console.error(`Error: Schedule '${scheduleId}' is missing a 'Last Audited' date.`);
      failed = true;
    }

    if (!challengeRationale) {
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

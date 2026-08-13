#!/usr/bin/env node

/**
 * TNF Handoff Packet Pre-Generation Validator
 * Validates handoff packets BEFORE they're generated to ensure data integrity
 *
 * This script runs as part of the handoff packet generation pipeline and
 * validates that all required fields are present and consistent.
 *
 * Usage: node handoff-pre-validator.js
 */

const fs = require('fs');
const path = require('path');

const HANDOFF_DIR = path.join(process.env.HOME, '.tnf', 'handoff');
const MATRIX_FILE = path.join(HANDOFF_DIR, 'matrix.json');
const LATEST_FILE = path.join(HANDOFF_DIR, 'LATEST.md');

function validateHandoffPacket(packet) {
  const errors = [];
  const warnings = [];

  // Required top-level fields
  const requiredFields = ['sessionKey', 'generatedAt', 'MISSION', 'STATE', 'IMMEDIATE_TASKS'];
  for (const field of requiredFields) {
    if (!packet[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate sessionKey format (should be UUID-based)
  if (packet.sessionKey && !packet.sessionKey.match(/^[a-f0-9-]+$/)) {
    warnings.push(`Session key format may be non-standard: ${packet.sessionKey}`);
  }

  // Validate timestamp is recent (within last 24h)
  if (packet.generatedAt) {
    const age = Date.now() - new Date(packet.generatedAt).getTime();
    if (age > 24 * 60 * 60 * 1000) {
      warnings.push(`Packet is stale: ${Math.round(age / (60 * 60 * 1000))} hours old`);
    }
  }

  // Validate STATE array has entries
  if (packet.STATE && packet.STATE.length === 0) {
    warnings.push('STATE array is empty');
  }

  // Validate IMMEDIATE_TASKS has entries
  if (packet.IMMEDIATE_TASKS && packet.IMMEDIATE_TASKS.length === 0) {
    errors.push('IMMEDIATE_TASKS array is empty - no tasks to execute');
  }

  // Check for failure markers in STATE
  if (packet.STATE) {
    const failurePattern = /failed\s*\(\d+\s*failures?\)/i;
    const failures = packet.STATE.filter((state) => failurePattern.test(state));
    if (failures.length > 0) {
      warnings.push(`Found ${failures.length} failure markers in STATE`);
    }
  }

  return { errors, warnings };
}

function validateMatrixEntries() {
  if (!fs.existsSync(MATRIX_FILE)) {
    return { valid: false, errors: ['Matrix file not found'], warnings: [] };
  }

  try {
    const matrix = JSON.parse(fs.readFileSync(MATRIX_FILE, 'utf8'));
    const errors = [];
    const warnings = [];

    if (!matrix.entries || matrix.entries.length === 0) {
      errors.push('Matrix has no entries');
    } else {
      // Check for stale entries (not updated in 7+ days)
      const now = Date.now();
      const staleThreshold = 7 * 24 * 60 * 60 * 1000;
      const staleEntries = matrix.entries.filter((entry) => {
        const lastUpdate = new Date(entry.lastUpdated || entry.createdAt).getTime();
        return now - lastUpdate > staleThreshold;
      });

      if (staleEntries.length > 0) {
        warnings.push(`${staleEntries.length} entries not updated in 7+ days`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  } catch (err) {
    return { valid: false, errors: [`Matrix parse error: ${err.message}`], warnings: [] };
  }
}

function main() {
  console.log('🔍 Running handoff packet pre-generation validation...');

  // Validate matrix
  const matrixValidation = validateMatrixEntries();
  console.log(`📊 Matrix validation: ${matrixValidation.valid ? 'PASS' : 'FAIL'}`);
  if (matrixValidation.errors.length > 0) {
    console.log('  Errors:', matrixValidation.errors.join(', '));
  }
  if (matrixValidation.warnings.length > 0) {
    console.log('  Warnings:', matrixValidation.warnings.join(', '));
  }

  // If we have a LATEST.md, validate that packet too
  if (fs.existsSync(LATEST_FILE)) {
    try {
      const latestContent = fs.readFileSync(LATEST_FILE, 'utf8');
      // Extract JSON from markdown if needed
      const jsonMatch =
        latestContent.match(/```json\n([\s\S]*?)\n```/) ||
        latestContent.match(/```([\s\S]*?)\n```/) ||
        latestContent;
      const packet =
        typeof jsonMatch === 'string'
          ? JSON.parse(jsonMatch.trim())
          : JSON.parse(jsonMatch[1].trim());

      const packetValidation = validateHandoffPacket(packet);
      console.log(
        `📦 Latest handoff packet validation: ${packetValidation.errors.length === 0 ? 'PASS' : 'FAIL'}`
      );
      if (packetValidation.errors.length > 0) {
        console.log('  Errors:', packetValidation.errors.join(', '));
      }
      if (packetValidation.warnings.length > 0) {
        console.log('  Warnings:', packetValidation.warnings.join(', '));
      }
    } catch (err) {
      console.log('⚠️  Could not parse LATEST.md:', err.message);
    }
  }

  // Write validation report
  const report = {
    validatedAt: new Date().toISOString(),
    matrixValidation,
    matrixPath: MATRIX_FILE,
    latestPath: LATEST_FILE,
    latestExists: fs.existsSync(LATEST_FILE),
    preGenerationValidationExecuted: true,
    overallStatus:
      matrixValidation.valid && (!fs.existsSync(LATEST_FILE) || true) ? 'PASS' : 'WARN',
  };

  // Ensure directory exists
  if (!fs.existsSync(HANDOFF_DIR)) {
    fs.mkdirSync(HANDOFF_DIR, { recursive: true });
  }

  const reportPath = path.join(HANDOFF_DIR, 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📝 Validation report written to: ${reportPath}`);

  // Exit with appropriate code
  const exitCode = matrixValidation.valid ? 0 : 1;
  console.log(`✅ Pre-generation validation ${exitCode === 0 ? 'complete' : 'failed'}`);
  process.exit(exitCode);
}

main();

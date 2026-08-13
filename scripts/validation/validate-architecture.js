#!/usr/bin/env node
/**
 * Information-architecture validator (restored from stub).
 * Scores real filesystem / schema presence instead of hardcoded 95% placeholders.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function score(checks) {
  if (checks.length === 0) return 0;
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

class ArchitectureValidator {
  constructor() {
    this.metricsDir = path.join(repoRoot, '.fuse/monitoring/metrics');
    this.logsDir = path.join(repoRoot, '.fuse/monitoring/logs');
    this.metricsPath = path.join(this.metricsDir, 'current.json');
    this.reportPath = path.join(this.logsDir, 'validation-report.json');
    this.checks = {};
    this.results = {
      schemaCompliance: 0,
      crossReferenceValidity: 0,
      mcpProtocolCompliance: 0,
      messageFormatValidity: 0,
      apiCompliance: 0,
      integrationPatternAdherence: 0,
    };
  }

  async validate() {
    console.log('Validating Information Architecture compliance...');
    this.validateDocumentStructure();
    this.validateCrossReferences();
    this.validateMCPCompliance();
    this.validateMessageFormats();
    this.validateAPICompliance();
    this.validateIntegrationPatterns();
    this.exportMetrics();
    this.generateReport();
  }

  validateDocumentStructure() {
    console.log('Validating document structure...');
    const checks = [
      exists('docs/protocols/LIVING_STATE.md'),
      exists('docs/protocols/SESSION_HANDOFF_TEMPLATE.md'),
      exists('docs/protocols/AGENT_STATUS_LEDGER.md'),
      exists('docs/protocols/schemas/tnf-session-handoff.schema.json'),
      exists('docs/core/AGENTS.md') || exists('AGENTS.md'),
      exists('docs/protocols/reports/SESSION_HANDOFF_LATEST.json'),
    ];
    this.checks.documentStructure = checks;
    this.results.schemaCompliance = score(checks);
  }

  validateCrossReferences() {
    console.log('Validating cross-references...');
    const checks = [
      exists('docs/protocols/HANDOFF_VALIDATION_PIPELINE.md'),
      exists('docs/protocols/SESSION_HANDOFF_ENFORCEMENT.md'),
      exists('scripts/protocols/enforce-session-handoff.cjs'),
      exists('scripts/protocols/emit-session-handoff.cjs'),
      exists('scripts/handoff-pre-validator.js'),
      exists('scripts/handoff-pre-validator.cjs'),
    ];
    this.checks.crossReferences = checks;
    this.results.crossReferenceValidity = score(checks);
  }

  validateMCPCompliance() {
    console.log('Validating MCP protocol compliance...');
    const checks = [
      exists('docs/protocols/schemas/twip-envelope.schema.json'),
      exists('docs/protocols/schemas/twip-identity.schema.json'),
      exists('packages/protocol-contracts'),
      exists('scripts/validate-protocol-schemas.cjs'),
    ];
    this.checks.mcp = checks;
    this.results.mcpProtocolCompliance = score(checks);
  }

  validateMessageFormats() {
    console.log('Validating message formats...');
    const checks = [
      exists('docs/protocols/schemas/sgp-envelope.schema.json'),
      exists('docs/protocols/schemas/sgp-payloads.schema.json'),
      exists('docs/protocols/schemas/tnf-hook-chain.schema.json'),
      exists('docs/protocols/schemas/tnf-master-cumulative-id.schema.json'),
    ];
    this.checks.messageFormats = checks;
    this.results.messageFormatValidity = score(checks);
  }

  validateAPICompliance() {
    console.log('Validating API compliance...');
    const checks = [
      exists('apps/api') || exists('packages/relay-core'),
      exists('packages/tnf-cli/src/cli.ts'),
      exists('packages/protocol-contracts/src/handoff.ts') ||
        exists('packages/relay-core/src/protocol/handoff-protocol.ts'),
    ];
    this.checks.api = checks;
    this.results.apiCompliance = score(checks);
  }

  validateIntegrationPatterns() {
    console.log('Validating integration patterns...');
    const checks = [
      exists('scripts/validation/validate-architecture.js'),
      exists('.fuse/config/monitoring/information-architecture.yml'),
      exists('packages/tnf-cli/src/commands/hermes-parity-gaps.ts'),
      exists('packages/tnf-cli/src/commands/peer-cli-parity-gaps.ts'),
      exists('docs/protocols/LIVING_STATE.md'),
    ];
    this.checks.integration = checks;
    this.results.integrationPatternAdherence = score(checks);
  }

  ensureDirs() {
    fs.mkdirSync(this.metricsDir, { recursive: true });
    fs.mkdirSync(this.logsDir, { recursive: true });
  }

  exportMetrics() {
    console.log('Exporting metrics...');
    this.ensureDirs();
    const metrics = {
      timestamp: new Date().toISOString(),
      metrics: this.results,
      checks: this.checks,
      stub: false,
    };
    fs.writeFileSync(this.metricsPath, JSON.stringify(metrics, null, 2));
  }

  generateReport() {
    console.log('Generating validation report...');
    this.ensureDirs();
    const report = {
      timestamp: new Date().toISOString(),
      summary: 'Information Architecture Validation Report',
      results: this.results,
      recommendations: this.generateRecommendations(),
      stub: false,
    };
    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
    const avg = Math.round(
      Object.values(this.results).reduce((a, b) => a + b, 0) / Object.keys(this.results).length
    );
    console.log(`Validation complete. Average score: ${avg}%. Report: ${this.reportPath}`);
  }

  generateRecommendations() {
    const recommendations = [];
    if (this.results.schemaCompliance < 100) {
      recommendations.push('Restore missing protocol / handoff documents');
    }
    if (this.results.crossReferenceValidity < 100) {
      recommendations.push('Wire handoff enforcement scripts and docs');
    }
    if (this.results.mcpProtocolCompliance < 100) {
      recommendations.push('Ensure TWIP schemas and protocol-contracts package exist');
    }
    if (this.results.messageFormatValidity < 100) {
      recommendations.push('Add missing SGP / hook / MCID schemas');
    }
    if (this.results.apiCompliance < 100) {
      recommendations.push('Confirm API / relay / CLI surfaces are present');
    }
    if (this.results.integrationPatternAdherence < 100) {
      recommendations.push('Restore monitoring config and peer parity modules');
    }
    return recommendations;
  }
}

const validator = new ArchitectureValidator();
validator.validate().catch((err) => {
  console.error(err);
  process.exit(1);
});

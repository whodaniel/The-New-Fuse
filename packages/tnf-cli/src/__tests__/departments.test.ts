#!/usr/bin/env node
/**
 * Corporate department catalog + utterance routing.
 * Run: pnpm exec tsx src/__tests__/departments.test.ts
 */
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  loadDepartmentCatalog,
  loadDepartmentStaffing,
  resolveDepartment,
} from '../departments.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('corporate departments', () => {
  it('loads distinct operator-facing departments', () => {
    const catalog = loadDepartmentCatalog(repoRoot);
    const ids = catalog.departments.map((d) => d.id);
    for (const id of ['hr', 'marketing', 'design', 'legal', 'tech', 'finance', 'product', 'ops']) {
      assert.ok(ids.includes(id), `missing department ${id}`);
    }
    assert.equal(new Set(ids).size, ids.length);
  });

  it('routes informal department names', () => {
    assert.equal(
      resolveDepartment(repoRoot, 'ask Legal about the privacy policy').department?.id,
      'legal'
    );
    assert.equal(resolveDepartment(repoRoot, 'HR').department?.id, 'hr');
    assert.equal(resolveDepartment(repoRoot, 'people ops').department?.id, 'hr');
    assert.equal(
      resolveDepartment(repoRoot, 'engineering please review this').department?.id,
      'tech'
    );
    assert.equal(resolveDepartment(repoRoot, 'no department here').matched, false);
  });

  it('indexes existing agents and skills under departments without collapsing categories', () => {
    const staffing = loadDepartmentStaffing(repoRoot);
    assert.ok(staffing, 'staffing-index.json should exist');
    const legalAgents = staffing.departments.legal.agents.map((a) => a.name);
    assert.ok(legalAgents.includes('legal-compliance-agent'));
    const techSkills = staffing.departments.tech.skills.map((s) => s.name);
    assert.ok(techSkills.includes('tnf-engineering-context'));
    const engineeringContext = staffing.departments.tech.skills.find(
      (s) => s.name === 'tnf-engineering-context'
    );
    assert.equal(engineeringContext?.category, 'tnf-platform');
  });
});

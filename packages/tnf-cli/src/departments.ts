/**
 * Operator-facing corporate departments for TNF CLI routing.
 *
 * Pipeline Clusters (Scouting, Library, Engineering, Governance, Journaling)
 * remain the internal execution metaphor. Named departments (HR, Marketing,
 * Design, Legal, Tech, …) are how an operator addresses the agent.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface CorporateDepartment {
  id: string;
  name: string;
  aliases: string[];
  cluster: string;
  voice: string;
  owns: string[];
  does_not_own: string[];
  skills: string[];
  commands: string[];
}

export interface DepartmentStaffMember {
  name: string;
  category?: string | null;
  path?: string;
  vendor?: boolean;
}

export interface DepartmentStaffingIndex {
  schema: string;
  updated_at?: string;
  policy?: Record<string, string>;
  departments: Record<string, { agents: DepartmentStaffMember[]; skills: DepartmentStaffMember[] }>;
}

export interface DepartmentCatalog {
  schema: string;
  updated_at?: string;
  purpose?: string;
  usage?: Record<string, unknown>;
  departments: CorporateDepartment[];
}

export interface DepartmentRoute {
  matched: boolean;
  department: CorporateDepartment | null;
  query: string;
  reason: string;
}

const CATALOG_REL = 'data/departments/corporate-departments.json';
const STAFFING_REL = 'data/departments/staffing-index.json';

export function departmentCatalogPath(repoRoot: string): string {
  return path.join(repoRoot, CATALOG_REL);
}

export function loadDepartmentCatalog(repoRoot: string): DepartmentCatalog {
  const abs = departmentCatalogPath(repoRoot);
  if (!fs.existsSync(abs)) {
    throw new Error(`Department catalog missing: ${abs}`);
  }
  const parsed = JSON.parse(fs.readFileSync(abs, 'utf8')) as DepartmentCatalog;
  if (!Array.isArray(parsed.departments) || parsed.departments.length === 0) {
    throw new Error(`Department catalog has no departments: ${abs}`);
  }
  return parsed;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function resolveDepartment(repoRoot: string, utterance: string): DepartmentRoute {
  const query = String(utterance || '').trim();
  if (!query) {
    return { matched: false, department: null, query, reason: 'empty utterance' };
  }

  const catalog = loadDepartmentCatalog(repoRoot);
  const normalized = normalize(query);

  for (const dept of catalog.departments) {
    const needles = [dept.id, dept.name, ...dept.aliases].map(normalize);
    if (
      needles.some((needle) => needle && (normalized === needle || normalized.includes(needle)))
    ) {
      return {
        matched: true,
        department: dept,
        query,
        reason: `matched ${dept.name} (${dept.id})`,
      };
    }
  }

  return {
    matched: false,
    department: null,
    query,
    reason: 'no department alias matched',
  };
}

export function loadDepartmentStaffing(repoRoot: string): DepartmentStaffingIndex | null {
  const abs = path.join(repoRoot, STAFFING_REL);
  if (!fs.existsSync(abs)) return null;
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8')) as DepartmentStaffingIndex;
  } catch {
    return null;
  }
}

function nameList(rows: DepartmentStaffMember[] | undefined, limit = 24): string {
  const names = [...new Set((rows || []).map((r) => r.name).filter(Boolean))];
  if (!names.length) return '(none indexed)';
  const shown = names.slice(0, limit);
  const extra = names.length - shown.length;
  return extra > 0 ? `${shown.join(', ')} … +${extra} more` : shown.join(', ');
}

export function formatDepartmentCard(
  dept: CorporateDepartment,
  staffing?: DepartmentStaffingIndex | null
): string {
  const staff = staffing?.departments?.[dept.id];
  const agentNames = staff
    ? nameList(staff.agents)
    : dept.skills.length
      ? '(see catalog skills)'
      : '(none)';
  const skillNames = staff ? nameList(staff.skills) : dept.skills.join(', ') || '(none)';
  return [
    `Department: ${dept.name} (${dept.id})`,
    `Cluster: ${dept.cluster}`,
    `Voice: ${dept.voice}`,
    `Owns: ${dept.owns.join('; ')}`,
    `Does not own: ${dept.does_not_own.join('; ')}`,
    `Preferred skills: ${dept.skills.join(', ')}`,
    `Commands: ${dept.commands.join(', ')}`,
    `Agents (names only): ${agentNames}`,
    `Skills (names only): ${skillNames}`,
    'Progressive injection: do not load these bodies in bulk. Query one name, then read that one SKILL.md / agent file.',
  ].join('\n');
}

export function formatDepartmentOrientation(repoRoot: string): string {
  try {
    const catalog = loadDepartmentCatalog(repoRoot);
    const lines = catalog.departments.map(
      (dept) => `- ${dept.name} (\`${dept.id}\`): ${dept.owns[0] ?? dept.voice}`
    );
    return [
      '## Departments (operator-facing)',
      '',
      'When the operator says HR, Marketing, Design, Legal, Tech, Finance, Product, or Ops, adopt that department. Do not collapse those names into a generic Cluster unless they asked for the pipeline metaphor.',
      '',
      ...lines,
      '',
      '- List: `tnf department list`  Show: `tnf department show <id>`  Route: `tnf department route "<text>"`',
      '- Slash: `/department`, `/hr`, `/marketing`, `/design`, `/legal`, `/tech`, `/finance`, `/product`, `/ops`',
    ].join('\n');
  } catch {
    return [
      '## Departments (operator-facing)',
      '',
      '- Catalog unavailable. Expected `data/departments/corporate-departments.json`.',
    ].join('\n');
  }
}

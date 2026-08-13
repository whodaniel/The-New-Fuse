/**
 * Work-plane orientation copy for Turn Zero / frontload / TUI context.
 * Keep strings short — agents see this every interactive session.
 */

export const WORK_PLANE_PROTOCOL_PATH = 'docs/protocols/ADAPTABLE_HOST_VERIFICATION.md';

export const WORK_PLANE_LINES = [
  'Core OSS / Super Admin harness → public main (after review)',
  'Deployer config (env, keys, MCP URLs) → local/private only',
  'Tenant / personal user work → tenant DB or local-only — never OSS main',
] as const;

/** Multi-line block for TUI / interactive context packs. */
export function formatWorkPlaneOrientationMarkdown(): string {
  return [
    '## Work Plane Separation (Inspect before commit)',
    '',
    ...WORK_PLANE_LINES.map((line) => `- ${line}`),
    '',
    `- Canonical rubric: \`${WORK_PLANE_PROTOCOL_PATH}\` §Work Plane Separation`,
    '- Generalized env-gated adapters (e.g. `tnf spark` + `TNF_SPARK_*`) are OK on main; personal destinations are not.',
  ].join('\n');
}

/** Short console lines for ProtocolInterceptor preflight (no markdown headers). */
export function formatWorkPlaneOrientationConsole(): string[] {
  return [
    '  Work planes (classify before commit):',
    ...WORK_PLANE_LINES.map((line) => `    • ${line}`),
    `  Rubric: ${WORK_PLANE_PROTOCOL_PATH}`,
  ];
}

/**
 * Label was the only primitive in this package without a barrel file, so it was
 * never re-exported from components/index.ts and was effectively invisible to
 * consumers. The shared workflow node library needs it (form labels on the
 * agent, prompt and MCP-tool nodes), which is what surfaced the gap.
 */
export * from './Label.js';

import { ContextPackage } from '../types/events.js';

export const renderPromptFromPackage = (pkg: ContextPackage): string => {
  return [
    "You are an analysis assistant for trigger-first audio events.",
    "",
    `Rule ID: ${pkg.rule_id}`,
    `Stream ID: ${pkg.stream_id}`,
    `Created At: ${pkg.created_at}`,
    "",
    "Normalized Facts:",
    JSON.stringify(pkg.normalized_facts, null, 2),
    "",
    "Evidence:",
    JSON.stringify(pkg.evidence, null, 2),
    "",
    "Vector References:",
    JSON.stringify(pkg.vector_refs, null, 2),
    "",
    "Graph References:",
    JSON.stringify(pkg.graph_refs, null, 2),
    "",
    "Provenance:",
    JSON.stringify(pkg.provenance, null, 2),
    "",
    "Task: Explain likely intent, highlight uncertainty, and suggest next action."
  ].join("\n");
};


/**
 * Host injection for the shared workflow builder.
 *
 * Nodes call useWorkflowHost() instead of importing a specific app's hooks, so
 * the same node renders in the SaaS, the Tauri desktop app and the extension
 * panel with each supplying its own data access.
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import type { WorkflowHost } from './types.js';

const WorkflowHostContext = createContext<WorkflowHost | null>(null);

export interface WorkflowHostProviderProps {
  host: WorkflowHost;
  children: ReactNode;
}

export const WorkflowHostProvider: React.FC<WorkflowHostProviderProps> = ({ host, children }) => (
  <WorkflowHostContext.Provider value={host}>{children}</WorkflowHostContext.Provider>
);

/**
 * Fails loudly rather than rendering a half-dead node.
 *
 * A silently-empty node is exactly the failure this whole consolidation is
 * meant to end: the previous builders degraded quietly when data was missing,
 * so nobody noticed the palette was inert. A missing provider is a wiring bug
 * in the host and should say so.
 */
export function useWorkflowHost(): WorkflowHost {
  const host = useContext(WorkflowHostContext);
  if (!host) {
    throw new Error(
      '[workflow-builder] No WorkflowHostProvider found. Wrap the builder in ' +
        '<WorkflowHostProvider host={...}> and supply the agent, MCP, database and ' +
        'execution ports for this surface.'
    );
  }
  return host;
}

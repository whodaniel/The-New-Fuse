// Discover onboarded agents and validate declared protocols.
//
// Sources of truth for "who is onboarded":
//   1. Redis HSET `tnf:agent-registry`             — runtime agents (any platform)
//   2. `~/.tnf/.context-injected.agentsUpdated`    — canonical services/components
//                                                      re-injected each cycle
//   3. `~/.tnf/state/*.json`                       — running daemons which may not
//                                                      be in the registry yet
//
// Protocols live under `docs/protocols/` and a few under `.tnf/docs/`. We
// validate each declared protocol has either:
//   - `docs/protocols/<id>.md`
//   - `docs/protocols/<id>/*.md` (directory containing at least one .md)
//   - `.tnf/docs/<id>.md` (legacy fallback)

import { promises as fs } from 'node:fs';
import * as path from 'node:path';

import type { RefreshContextAgentRef } from './envelope.js';

export interface DiscoveredAgent extends RefreshContextAgentRef {
  source: 'redis' | 'context-injected' | 'daemon-state';
}

export interface ProtocolContractRef {
  id: string;
  path: string | null;
  contractPresent: boolean;
}

export interface RefreshContextInput {
  repoRoot: string;
  tnfHome: string;
}

const PROTOCOL_FILE_CANDIDATES = (id: string): string[] => [
  path.join('docs/protocols', `${id}.md`),
  path.join('docs/protocols', id, 'README.md'),
  path.join('docs/protocols', id, 'PROTOCOL.md'),
  path.join('.tnf/docs', `${id}.md`),
  path.join('docs', `${id}.md`),
];

export async function readContextInjectedFile(tnfHome: string): Promise<{
  filePath: string;
  protocolsInjected: string[];
  agentsUpdated: string[];
  previousInjection: string | null;
  previousStatus: string | null;
} | null> {
  const filePath = path.join(tnfHome, '.context-injected');
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      filePath,
      protocolsInjected: Array.isArray(parsed.protocolsInjected) ? parsed.protocolsInjected : [],
      agentsUpdated: Array.isArray(parsed.agentsUpdated) ? parsed.agentsUpdated : [],
      previousInjection: typeof parsed.lastInjection === 'string' ? parsed.lastInjection : null,
      previousStatus: typeof parsed.validationStatus === 'string' ? parsed.validationStatus : null,
    };
  } catch {
    return null;
  }
}

export async function discoverDaemons(tnfHome: string): Promise<string[]> {
  const stateDir = path.join(tnfHome, 'state');
  try {
    const entries = await fs.readdir(stateDir);
    return entries.filter((e) => e.endsWith('.json')).map((e) => e.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}

export function unionAgents(
  registry: Record<string, RefreshContextAgentRef>,
  previousAgentsUpdated: string[]
): DiscoveredAgent[] {
  const ids = new Set<string>();
  for (const id of Object.keys(registry)) ids.add(id);
  for (const id of previousAgentsUpdated) ids.add(id);
  const out: DiscoveredAgent[] = [];
  for (const id of ids) {
    const fromRegistry = registry[id];
    if (fromRegistry) {
      out.push({ ...fromRegistry, source: 'redis' });
    } else {
      out.push({
        id,
        name: id,
        isOnline: false,
        source: 'context-injected',
      });
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export async function verifyProtocols(
  repoRoot: string,
  protocols: string[]
): Promise<ProtocolContractRef[]> {
  const out: ProtocolContractRef[] = [];
  for (const protocol of protocols) {
    let resolvedPath: string | null = null;
    let contractPresent = false;
    for (const candidate of PROTOCOL_FILE_CANDIDATES(protocol)) {
      const fullPath = path.join(repoRoot, candidate);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isFile()) {
          resolvedPath = candidate;
          contractPresent = true;
          break;
        }
      } catch {
        // try next candidate
      }
    }
    out.push({
      id: protocol,
      path: resolvedPath,
      contractPresent,
    });
  }
  return out;
}

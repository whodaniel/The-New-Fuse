import type { OperatorSynergySnapshot } from './types';

/**
 * Agent populations, named.
 *
 * Every operator surface used to derive its own count from the snapshot and label
 * the result "agents":
 *
 *   Dashboard hero      unifiedAgents.length                       -> "10 agents"
 *   Multi-Agent Chat    unifiedAgents.filter(not error/offline)    -> "4 agents available"
 *   Knowledge Hub       topology.nodes.length                      -> "8 nodes"
 *   Knowledge Hub chip  federatedAgentCount                        -> "4 federated"
 *   Dashboard relay     relayHealth.agents                         -> varies
 *
 * Each number was correct. None said which population it counted, so the app
 * appeared to contradict itself about its own state — the one thing an operator
 * console cannot do. These selectors keep the distinctions and force a label to
 * travel with every number.
 */

const OFFLINE_STATUSES = new Set(['error', 'offline', 'disconnected', 'unregistered']);

export interface AgentPopulations {
  /** Everything the desktop knows about, healthy or not. */
  registered: number;
  /** Registered minus anything erroring or offline. */
  online: number;
  /** Nodes drawn in the topology graph — may include non-agent infrastructure. */
  topologyNodes: number;
  /** Agents the relay itself reports, independent of local discovery. */
  federated: number;
  /** Channels on the relay. */
  channels: number;
  /** True when local discovery and the relay disagree about the population. */
  divergent: boolean;
}

export function selectAgentPopulations(snapshot: OperatorSynergySnapshot): AgentPopulations {
  const agents = snapshot.unifiedAgents ?? [];
  const registered = agents.length;
  const online = agents.filter(
    (agent) => !OFFLINE_STATUSES.has(String(agent.status ?? '').toLowerCase())
  ).length;
  const federated = snapshot.federatedAgentCount ?? 0;

  return {
    registered,
    online,
    topologyNodes: snapshot.topology?.nodes?.length ?? 0,
    federated,
    channels: snapshot.channelCount ?? 0,
    // Only meaningful once the relay has actually reported a population.
    divergent: federated > 0 && registered > 0 && federated !== registered,
  };
}

/**
 * The one-line population summary used in page subtitles and the status bar.
 * Reads "10 registered · 4 online" and collapses to "4 agents" only when the two
 * populations genuinely agree, so a single number never hides a discrepancy.
 */
export function describePopulation(p: AgentPopulations): string {
  if (p.registered === 0) return 'no agents';
  if (p.registered === p.online) {
    return `${p.online} ${p.online === 1 ? 'agent' : 'agents'}`;
  }
  return `${p.registered} registered · ${p.online} online`;
}

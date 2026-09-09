/**
 * Louvain community detection.
 *
 * Implemented here rather than pulled in as a dependency: the algorithm is small,
 * and TNF's existing "clusters" are authored wiki categories rather than anything
 * computed. This gives the graph communities that are actually derived from its
 * own structure.
 *
 * Standard two-phase Louvain: local modularity optimisation, then aggregation of
 * each community into a super-node, repeated until modularity stops improving.
 * The input graph is never mutated.
 */
import type { CodeGraph } from './schema.js';

export interface ClusterOptions {
  /** Modularity resolution. Above 1 yields more, smaller communities. */
  resolution?: number;
  /** Stop when a full pass improves modularity by less than this. */
  minImprovement?: number;
  /** Deterministic iteration cap, so a pathological graph cannot spin. */
  maxPasses?: number;
}

export interface ClusterResult {
  /** community id -> member node ids, largest community first. */
  communities: Map<number, string[]>;
  /** node id -> community id. */
  membership: Map<string, number>;
  modularity: number;
}

interface WeightedGraph {
  /** index -> (neighbour index -> weight) */
  adjacency: Map<number, Map<number, number>>;
  /** index -> self-loop weight (accumulates during aggregation) */
  selfLoops: Map<number, number>;
  /** Sum of all edge weights, counting each undirected edge once. */
  totalWeight: number;
}

export function cluster(graph: CodeGraph, options: ClusterOptions = {}): ClusterResult {
  const resolution = options.resolution ?? 1;
  const minImprovement = options.minImprovement ?? 1e-6;
  const maxPasses = options.maxPasses ?? 20;

  const ids = [...graph.nodes.keys()];
  const indexOf = new Map<string, number>(ids.map((id, i) => [id, i]));

  const original = toWeightedGraph(graph, indexOf);
  let working = original;
  // Each level maps an index in `working` back to the set of original node indices.
  let levelMembers: number[][] = ids.map((_, i) => [i]);
  let membershipByIndex = new Int32Array(ids.length).map((_, i) => i);
  let bestModularity = -Infinity;

  for (let pass = 0; pass < maxPasses; pass += 1) {
    const local = optimiseLocally(working, resolution);
    // Score against the ORIGINAL graph, not the aggregated one. Aggregated levels
    // carry accumulated self-loop weight, so scoring them yields a number outside
    // modularity's [-1, 1] range and makes the stopping test meaningless.
    const projected = projectMembership(local.membership, levelMembers, ids.length);
    const q = modularityOf(original, projected, resolution);
    if (q - bestModularity < minImprovement) break;
    bestModularity = q;

    // Project this level's assignment down onto the original nodes.
    const nextMembers: number[][] = [];
    const communityIndex = new Map<number, number>();
    for (let i = 0; i < local.membership.length; i += 1) {
      const community = local.membership[i] as number;
      let slot = communityIndex.get(community);
      if (slot === undefined) {
        slot = nextMembers.length;
        communityIndex.set(community, slot);
        nextMembers.push([]);
      }
      (nextMembers[slot] as number[]).push(...(levelMembers[i] as number[]));
    }
    for (let slot = 0; slot < nextMembers.length; slot += 1) {
      for (const original of nextMembers[slot] as number[]) membershipByIndex[original] = slot;
    }

    if (nextMembers.length === levelMembers.length) break; // nothing merged
    levelMembers = nextMembers;
    working = aggregate(working, local.membership, communityIndex);
  }

  const communities = new Map<number, string[]>();
  ids.forEach((id, i) => {
    const community = membershipByIndex[i] as number;
    const bucket = communities.get(community);
    if (bucket) bucket.push(id);
    else communities.set(community, [id]);
  });

  // Renumber largest-first so community 0 is always the biggest.
  const ordered = [...communities.entries()].sort((a, b) => b[1].length - a[1].length);
  const renumbered = new Map<number, string[]>();
  const membership = new Map<string, number>();
  ordered.forEach(([, members], newId) => {
    renumbered.set(newId, members);
    for (const member of members) membership.set(member, newId);
  });

  return {
    communities: renumbered,
    membership,
    modularity: bestModularity === -Infinity ? 0 : bestModularity,
  };
}

function toWeightedGraph(graph: CodeGraph, indexOf: Map<string, number>): WeightedGraph {
  const adjacency = new Map<number, Map<number, number>>();
  for (let i = 0; i < indexOf.size; i += 1) adjacency.set(i, new Map());
  let totalWeight = 0;

  for (const edge of graph.edges) {
    const a = indexOf.get(edge.source);
    const b = indexOf.get(edge.target);
    if (a === undefined || b === undefined || a === b) continue;
    bump(adjacency.get(a) as Map<number, number>, b, 1);
    bump(adjacency.get(b) as Map<number, number>, a, 1);
    totalWeight += 1;
  }
  return { adjacency, selfLoops: new Map(), totalWeight };
}

function bump(map: Map<number, number>, key: number, by: number): void {
  map.set(key, (map.get(key) ?? 0) + by);
}

function degreeOf(g: WeightedGraph, node: number): number {
  let degree = (g.selfLoops.get(node) ?? 0) * 2;
  for (const w of g.adjacency.get(node)?.values() ?? []) degree += w;
  return degree;
}

function optimiseLocally(g: WeightedGraph, resolution: number): { membership: number[] } {
  const size = g.adjacency.size;
  const membership = Array.from({ length: size }, (_, i) => i);
  if (g.totalWeight === 0) return { membership };

  const twoM = 2 * g.totalWeight;
  const degrees = Array.from({ length: size }, (_, i) => degreeOf(g, i));
  const communityTotal = degrees.slice();

  let moved = true;
  let guard = 0;
  while (moved && guard < 50) {
    moved = false;
    guard += 1;
    for (let node = 0; node < size; node += 1) {
      const current = membership[node] as number;
      const k = degrees[node] as number;
      communityTotal[current] = (communityTotal[current] as number) - k;

      // Weight from this node into each neighbouring community.
      const weightTo = new Map<number, number>();
      weightTo.set(current, 0);
      for (const [neighbour, w] of g.adjacency.get(node) ?? []) {
        if (neighbour === node) continue;
        bump(weightTo, membership[neighbour] as number, w);
      }

      let best = current;
      let bestGain = 0;
      for (const [community, weight] of weightTo) {
        const gain = weight - (resolution * (communityTotal[community] as number) * k) / twoM;
        const baseline =
          (weightTo.get(current) ?? 0) -
          (resolution * (communityTotal[current] as number) * k) / twoM;
        if (gain > bestGain && gain > baseline) {
          bestGain = gain;
          best = community;
        }
      }

      communityTotal[best] = (communityTotal[best] as number) + k;
      if (best !== current) {
        membership[node] = best;
        moved = true;
      }
    }
  }
  return { membership };
}

function aggregate(
  g: WeightedGraph,
  membership: number[],
  communityIndex: Map<number, number>
): WeightedGraph {
  const adjacency = new Map<number, Map<number, number>>();
  const selfLoops = new Map<number, number>();
  for (const slot of communityIndex.values()) adjacency.set(slot, new Map());

  let totalWeight = 0;
  const seen = new Set<string>();
  for (const [node, neighbours] of g.adjacency) {
    const a = communityIndex.get(membership[node] as number) as number;
    selfLoops.set(a, (selfLoops.get(a) ?? 0) + (g.selfLoops.get(node) ?? 0));
    for (const [neighbour, w] of neighbours) {
      const b = communityIndex.get(membership[neighbour] as number) as number;
      const key = node < neighbour ? `${node}:${neighbour}` : `${neighbour}:${node}`;
      if (seen.has(key)) continue;
      seen.add(key);
      totalWeight += w;
      if (a === b) {
        selfLoops.set(a, (selfLoops.get(a) ?? 0) + w);
      } else {
        bump(adjacency.get(a) as Map<number, number>, b, w);
        bump(adjacency.get(b) as Map<number, number>, a, w);
      }
    }
  }
  return { adjacency, selfLoops, totalWeight };
}

function modularityOf(g: WeightedGraph, membership: number[], resolution: number): number {
  if (g.totalWeight === 0) return 0;
  const twoM = 2 * g.totalWeight;
  const internal = new Map<number, number>();
  const total = new Map<number, number>();

  for (let node = 0; node < membership.length; node += 1) {
    const community = membership[node] as number;
    total.set(community, (total.get(community) ?? 0) + degreeOf(g, node));
    internal.set(community, (internal.get(community) ?? 0) + (g.selfLoops.get(node) ?? 0) * 2);
    for (const [neighbour, w] of g.adjacency.get(node) ?? []) {
      if ((membership[neighbour] as number) === community) {
        internal.set(community, (internal.get(community) ?? 0) + w);
      }
    }
  }

  let q = 0;
  for (const [community, inWeight] of internal) {
    const totalWeight = total.get(community) ?? 0;
    q += inWeight / twoM - resolution * (totalWeight / twoM) ** 2;
  }
  return q;
}

/**
 * Map a level-local membership back onto original node indices.
 *
 * `levelMembers[i]` lists the original indices collapsed into working-node `i`,
 * so every one of them inherits `membership[i]`.
 */
function projectMembership(
  membership: number[],
  levelMembers: number[][],
  originalSize: number
): number[] {
  const projected = new Array<number>(originalSize).fill(0);
  for (let i = 0; i < membership.length; i += 1) {
    for (const original of levelMembers[i] ?? []) {
      projected[original] = membership[i] as number;
    }
  }
  return projected;
}

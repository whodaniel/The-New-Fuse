/**
 * Extraction validator.
 *
 * This is the gate, not a linter. `build()` calls `assertValid()` before it will
 * consume an extraction, so an edge that omits `confidence` — or claims one that
 * is not in the vocabulary — cannot enter the graph at all. A validator that only
 * warned would be another inert gate.
 */
import {
  CONFIDENCES,
  EDGE_RELATIONS,
  NODE_KINDS,
  type Confidence,
  type EdgeRelation,
  type Extraction,
  type NodeKind,
} from './schema.js';

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

/**
 * Return a list of human-readable schema errors. Empty means valid.
 *
 * Errors are returned rather than thrown so a caller extracting hundreds of
 * files can report every bad file at once instead of dying on the first.
 */
export function validateExtraction(data: unknown): string[] {
  const errors: string[] = [];
  if (typeof data !== 'object' || data === null) {
    return ['extraction must be an object with `nodes` and `edges` arrays'];
  }
  const { nodes, edges } = data as Partial<Extraction>;

  if (!Array.isArray(nodes)) {
    errors.push('`nodes` must be an array');
  }
  if (!Array.isArray(edges)) {
    errors.push('`edges` must be an array');
  }
  if (errors.length > 0) return errors;

  const ids = new Set<string>();
  (nodes as Extraction['nodes']).forEach((n, i) => {
    const at = `nodes[${i}]`;
    if (!isNonEmptyString(n?.id)) {
      errors.push(`${at}.id must be a non-empty string`);
      return;
    }
    if (ids.has(n.id)) errors.push(`${at}.id duplicated within this extraction: ${n.id}`);
    ids.add(n.id);
    if (!isNonEmptyString(n.label)) errors.push(`${at}.label must be a non-empty string`);
    if (!NODE_KINDS.includes(n.kind as NodeKind)) {
      errors.push(`${at}.kind must be one of ${NODE_KINDS.join('|')} (got ${String(n.kind)})`);
    }
    if (typeof n.sourceFile !== 'string') {
      errors.push(`${at}.sourceFile must be a string ('' for external nodes)`);
    }
    if (n.kind !== 'external' && !isNonEmptyString(n.sourceFile)) {
      errors.push(`${at}.sourceFile is required for non-external node ${n.id}`);
    }
    if (n.sourceLocation !== undefined && !/^L\d+$/.test(n.sourceLocation)) {
      errors.push(`${at}.sourceLocation must look like 'L42' (got ${String(n.sourceLocation)})`);
    }
  });

  (edges as Extraction['edges']).forEach((e, i) => {
    const at = `edges[${i}]`;
    if (!isNonEmptyString(e?.source)) errors.push(`${at}.source must be a non-empty string`);
    if (!isNonEmptyString(e?.target)) errors.push(`${at}.target must be a non-empty string`);
    if (!EDGE_RELATIONS.includes(e?.relation as EdgeRelation)) {
      errors.push(
        `${at}.relation must be one of ${EDGE_RELATIONS.join('|')} (got ${String(e?.relation)})`
      );
    }
    // The rule this package exists for.
    if (!CONFIDENCES.includes(e?.confidence as Confidence)) {
      errors.push(
        `${at} has no valid confidence label. Every edge must declare one of ` +
          `${CONFIDENCES.join('|')} — an unlabelled edge is a claim without evidence. ` +
          `(got ${String(e?.confidence)}, ${String(e?.source)} -${String(e?.relation)}-> ${String(e?.target)})`
      );
    }
    if (e?.source === e?.target) {
      errors.push(`${at} is a self-edge (${String(e?.source)}); drop it at extraction time`);
    }
  });

  return errors;
}

/** Throw on the first invalid extraction, listing every error found. */
export function assertValid(data: unknown, context = 'extraction'): asserts data is Extraction {
  const errors = validateExtraction(data);
  if (errors.length > 0) {
    throw new Error(
      `Invalid ${context} (${errors.length} error${errors.length === 1 ? '' : 's'}):\n  - ` +
        errors.join('\n  - ')
    );
  }
}

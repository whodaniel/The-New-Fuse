#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * TNF AgentCard -> A2A Agent Card projection.
 *
 * TNF carries two agent-card schemas that describe the same subject and never
 * referenced each other:
 *
 *   data/agent-registry/agent-card.schema.json    "TNF AgentCard"    internal
 *   packages/a2a-protocol/agent-card.schema.json  "A2A Agent Card"   interop
 *
 * They disagree on the identity field (`id` vs `agentId`), the version field
 * (`schemaVersion` vs `version`), and what `skills` means. Left undeclared, a
 * consumer cannot tell whether they are alternatives, versions of one another,
 * or complementary.
 *
 * They are complementary. The TNF card is CANONICAL for internal registry
 * state; the A2A card is a PROJECTION of it for external interop — the same
 * relationship `canonicalEntityId` has with UFTE's `federatedId`. This script
 * makes that mapping executable rather than documentary, because a mapping no
 * script performs drifts the moment either schema changes.
 *
 * AARS is the load-bearing overlap. Both schemas already carry it with the same
 * three factors, spelled differently:
 *
 *   TNF   classification.aarsScore : number
 *         classification.aarsFactors.{autonomy,toolUse,persistence}
 *   A2A   aars.score               : number
 *         aars.factors.{autonomy,toolUse,persistence}
 *
 * (TNF documents it as "Agentic AI Risk Score — multiplier to standard CVSS".)
 *
 * Usage
 *   node scripts/protocols/agent-card-projection.cjs            # conformance report
 *   node scripts/protocols/agent-card-projection.cjs --emit     # write A2A cards
 *   node scripts/protocols/agent-card-projection.cjs --json
 *
 * MEASURED 2026-08-09 over the 136 cards in `data/agent-registry/agents.json`:
 *
 *   conform to TNF schema : 0/136   — every card lacks `schemaVersion`,
 *                                     `categoriesNormalized`, `classification`
 *   project to valid A2A  : 136/136
 *
 * The canonical internal schema has zero conformance while the interop
 * projection is total. The data predates the schema, and nothing validates it —
 * the same "described but unenforced" pattern found in the tagging protocol and
 * UFTE (see PROTOCOL_COHESION_RECONCILIATION_2026-08-09.md §5).
 *
 * This script deliberately does NOT backfill the missing fields.
 * `categoriesNormalized` could plausibly be derived from `tags`, but
 * `classification` requires `domain`, `workflowStage`, `complexity`, and
 * `riskTier` — inventing a risk tier for 136 agents would manufacture
 * governance data that downstream consumers would then trust. Report the gap;
 * let it be filled deliberately.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TNF_SCHEMA = path.join(ROOT, 'data/agent-registry/agent-card.schema.json');
const A2A_SCHEMA = path.join(ROOT, 'packages/a2a-protocol/agent-card.schema.json');
const CARDS = path.join(ROOT, 'data/agent-registry/agents.json');
const OUT = path.join(ROOT, 'data/agent-registry/a2a-cards.json');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

/**
 * Minimal required-key check. Deliberately not a full JSON-Schema validator:
 * pulling ajv in for `required` would add a dependency to a diagnostic script,
 * and missing-required is the failure mode that actually occurs here.
 */
function missingRequired(obj, schema) {
  return (schema.required || []).filter((k) => obj[k] === undefined || obj[k] === null);
}

/**
 * Project one TNF card into A2A shape.
 *
 * `endpoint` is A2A-required and has no TNF counterpart — an internal registry
 * entry need not be externally addressable. It is synthesised from the agent id
 * under a `tnf://` scheme rather than invented as an http URL, so a consumer can
 * see the agent is local and not attempt to call it.
 */
function project(card) {
  const cls = card.classification || {};
  const a2a = {
    version: card.version || card.schemaVersion || '1.0.0',
    agentId: card.id,
    name: card.displayName || card.name,
    endpoint: card.endpoint || `tnf://agent/${card.id}`,
    // A2A `skills` is the capability surface. TNF splits this across `skills`,
    // `capabilities`, and `tools`; union them rather than picking one, since a
    // consumer asking "what can this do" wants all three.
    skills: [
      ...new Set([...(card.skills || []), ...(card.capabilities || []), ...(card.tools || [])]),
    ],
  };
  if (card.description) a2a.description = card.description;
  if (cls.aarsScore !== undefined || cls.aarsFactors) {
    a2a.aars = {};
    if (cls.aarsScore !== undefined) a2a.aars.score = cls.aarsScore;
    if (cls.aarsFactors) a2a.aars.factors = cls.aarsFactors;
  }
  return a2a;
}

function main(argv) {
  const emit = argv.includes('--emit');
  const asJson = argv.includes('--json');

  const tnfSchema = readJson(TNF_SCHEMA);
  const a2aSchema = readJson(A2A_SCHEMA);
  const raw = readJson(CARDS);
  const cards = Array.isArray(raw) ? raw : raw.agents || [];

  const missingByKey = new Map();
  let conformingTnf = 0;
  // Schema conformance and assessed governance data are different questions.
  // On 2026-08-09 all 136 cards were brought to 136/136 by writing one
  // identical default into every `classification` — riskTier=low,
  // complexity=medium, domain=[general], workflowStage=[execution] — and
  // `categoriesNormalized=["Uncategorized"]`. The validator went green while
  // `financial-manager-agent`, `contract-manager-agent`, and
  // `tax-compliance-agent` all became "low risk". A green number over
  // placeholder data is worse than a red one: 0/136 says "unclassified",
  // 136/136-with-one-value says "all assessed, all safe".
  //
  // Defaults now carry `classification.assessment: "defaulted-unassessed"`.
  // Conformance stays honest AND the assessment gap stays visible.
  let unassessed = 0;
  const projected = [];
  const projectionFailures = [];

  for (const card of cards) {
    const miss = missingRequired(card, tnfSchema);
    if (miss.length === 0) conformingTnf += 1;
    if ((card.classification || {}).assessment === 'defaulted-unassessed') unassessed += 1;
    for (const k of miss) missingByKey.set(k, (missingByKey.get(k) || 0) + 1);

    const a2a = project(card);
    const a2aMiss = missingRequired(a2a, a2aSchema);
    if (a2aMiss.length) projectionFailures.push({ id: card.id, missing: a2aMiss });
    else projected.push(a2a);
  }

  const result = {
    cards: cards.length,
    conformsToTnfSchema: conformingTnf,
    tnfMissingFields: Object.fromEntries([...missingByKey].sort((a, b) => b[1] - a[1])),
    projectedToA2A: projected.length,
    projectionFailures: projectionFailures.length,
  };

  if (asJson) {
    console.log(JSON.stringify({ ...result, failures: projectionFailures.slice(0, 20) }, null, 2));
  } else {
    console.log('[agent-card-projection]\n');
    console.log(`  cards                    : ${result.cards}`);
    console.log(`  conform to TNF schema    : ${conformingTnf}/${cards.length}`);
    console.log(`  classification ASSESSED  : ${cards.length - unassessed}/${cards.length}`);
    if (unassessed) {
      console.log(
        `    ^ ${unassessed} carry defaulted placeholders, not assessments.\n` +
          '      Conformance is green; governance data is not yet real.'
      );
    }
    if (missingByKey.size) {
      console.log('\n  TNF required fields missing (count of cards):');
      for (const [k, n] of Object.entries(result.tnfMissingFields)) {
        console.log(`    ${k.padEnd(24)} ${n}`);
      }
    }
    console.log(`\n  project to valid A2A     : ${projected.length}/${cards.length}`);
    if (projectionFailures.length) {
      console.log('  projection failures:');
      for (const f of projectionFailures.slice(0, 5)) {
        console.log(`    ${f.id}: missing ${f.missing.join(', ')}`);
      }
    }
  }

  if (emit) {
    fs.writeFileSync(OUT, `${JSON.stringify(projected, null, 2)}\n`);
    console.log(`\n  written: ${path.relative(ROOT, OUT)}  (${projected.length} cards)`);
  }
  return projectionFailures.length ? 1 : 0;
}

try {
  process.exit(main(process.argv.slice(2)));
} catch (error) {
  console.error(`[agent-card-projection] ${error.message}`);
  process.exit(1);
}

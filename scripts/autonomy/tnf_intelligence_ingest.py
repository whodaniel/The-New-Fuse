#!/usr/bin/env python3
"""TNF information ingestion pipeline.

Transforms source text into an Executable Intelligence Artifact using TNF's
Taxonomy of Actionability and Attribution Cornerstone constraints.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

DEFAULT_OUT_DIR = Path("data/intelligence-artifacts")
SPEC = "tnf/executable-intelligence/0.2"

PROCEDURAL_PATTERNS = [
    re.compile(r"\b(?:pnpm|npm|yarn|node|python3?|pip|docker|kubectl|git|curl|wget|uv|npx|tsx)\b"),
    re.compile(r"\b--[a-zA-Z0-9-]+\b"),
    re.compile(r"\{[^\n]*:[^\n]*\}"),
    re.compile(r"\b(?:script|payload|endpoint|api|command|cli|json|yaml|config)\b", re.IGNORECASE),
    re.compile(r"\b(?:first|second|third|then|next|finally|step)\b", re.IGNORECASE),
    re.compile(r"\b(?:install|setup|set up|configure|create|build|implement|deploy|integrate|run|test|benchmark|optimi[sz]e|refactor|migrate|ship)\b", re.IGNORECASE),
    re.compile(r"\b(?:repository|repo|workflow|pipeline|agent|prompt|tool|sdk|framework)\b", re.IGNORECASE),
]

STRATEGIC_PATTERNS = [
    re.compile(r"\b(?:roadmap|strategy|architect|architecture|migration|trend|market|direction|platform|adoption|capability)\b", re.IGNORECASE),
    re.compile(r"\b(?:model|provider|llm|agentic|orchestration|integration|scalability|latency|cost)\b", re.IGNORECASE),
]

GOVERNANCE_PATTERNS = [
    re.compile(r"\b(?:governance|policy|risk|safety|compliance|guardrail|audit|attribution|security|integrity)\b", re.IGNORECASE),
    re.compile(r"\b(?:failure|anti-pattern|incident|postmortem|approval|ownership|tenet|protocol|gate)\b", re.IGNORECASE),
]

DECAY_HIGH_PATTERNS = [
    re.compile(r"\b(?:version|sdk|api|endpoint|flag|syntax|release|beta|preview|deprecat)\w*\b", re.IGNORECASE),
]
DECAY_LOW_PATTERNS = [
    re.compile(r"\b(?:principle|axiom|governance|ethic|policy|tenet)\b", re.IGNORECASE),
]


@dataclass
class SourceMeta:
    source_id: str
    source_type: str
    source_uri: str
    source_title: str
    source_author: str
    source_publisher: str
    source_published_at: str
    retrieved_at: str


@dataclass
class OwnershipMeta:
    owner_principal_id: str
    visibility: str
    release_state: str
    agent_allowlist: List[str]
    release_approved_by: str
    release_note: str


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def normalize_sentence(text: str) -> str:
    clean = re.sub(r"\s+", " ", text.strip())
    return clean


def split_units(text: str) -> List[str]:
    raw = re.split(r"(?<=[.!?])\s+|\n+", text)
    out: List[str] = []
    for unit in raw:
        s = normalize_sentence(unit)
        if len(s) >= 16:
            out.append(s)
    return out


def matches_any(s: str, patterns: List[re.Pattern[str]]) -> bool:
    return any(p.search(s) for p in patterns)


def dedupe_keep_order(items: List[str]) -> List[str]:
    seen = set()
    out = []
    for item in items:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def parse_agent_allowlist(raw: str) -> List[str]:
    if not raw.strip():
        return []
    items = [item.strip() for item in raw.split(",")]
    return dedupe_keep_order([item for item in items if item])


def classify_taxonomy(units: List[str], cap: int) -> Dict[str, List[str]]:
    procedural: List[str] = []
    strategic: List[str] = []
    governance: List[str] = []

    for unit in units:
        p = matches_any(unit, PROCEDURAL_PATTERNS)
        s = matches_any(unit, STRATEGIC_PATTERNS)
        g = matches_any(unit, GOVERNANCE_PATTERNS)

        if p:
            procedural.append(unit)
        if s:
            strategic.append(unit)
        if g:
            governance.append(unit)

    procedural = dedupe_keep_order(procedural)[:cap]
    strategic = dedupe_keep_order(strategic)[:cap]
    governance = dedupe_keep_order(governance)[:cap]

    return {
        "procedural": procedural,
        "strategic": strategic,
        "governance": governance,
    }


def infer_freshness_decay(text: str) -> str:
    high_hits = sum(1 for p in DECAY_HIGH_PATTERNS if p.search(text))
    low_hits = sum(1 for p in DECAY_LOW_PATTERNS if p.search(text))
    if high_hits >= 1 and high_hits > low_hits:
        return "High"
    if low_hits >= 1 and low_hits > high_hits:
        return "Low"
    return "Medium"


def calc_implementation_density(taxonomy: Dict[str, List[str]], total_units: int) -> float:
    if total_units <= 0:
        return 0.0
    density = len(taxonomy["procedural"]) / float(total_units)
    return round(max(0.0, min(1.0, density)), 3)


def infer_verification_difficulty(taxonomy: Dict[str, List[str]], density: float) -> str:
    if len(taxonomy["procedural"]) >= 3 and density >= 0.25:
        return "Easy"
    return "Hard"


def synthesize_summary(taxonomy: Dict[str, List[str]]) -> str:
    p = len(taxonomy["procedural"])
    s = len(taxonomy["strategic"])
    g = len(taxonomy["governance"])
    return (
        f"Artifact captures {p} procedural, {s} strategic, and {g} governance units. "
        "Use procedural units for immediate execution, then vet strategic and governance units through TNF gates before protocol adoption."
    )


def validate_ownership(ownership: OwnershipMeta) -> None:
    allowed_visibility = {"private", "agent-scope", "collective", "public"}
    allowed_release_states = {
        "sealed",
        "released-collective",
        "released-public",
    }
    if ownership.visibility not in allowed_visibility:
        raise ValueError(
            "Invalid --visibility. Allowed: private, agent-scope, collective, public."
        )
    if ownership.release_state not in allowed_release_states:
        raise ValueError(
            "Invalid --release-state. Allowed: sealed, released-collective, released-public."
        )

    if ownership.visibility in {"private", "agent-scope"}:
        if ownership.release_state != "sealed":
            raise ValueError(
                "Private/agent-scope artifacts must use --release-state sealed."
            )
        if ownership.visibility == "private" and ownership.agent_allowlist:
            raise ValueError(
                "Private artifacts cannot include --agent-allowlist."
            )
        return

    if ownership.visibility == "collective" and ownership.release_state != "released-collective":
        raise ValueError(
            "Collective artifacts require --release-state released-collective."
        )
    if ownership.visibility == "public" and ownership.release_state != "released-public":
        raise ValueError(
            "Public artifacts require --release-state released-public."
        )
    if not ownership.release_approved_by:
        raise ValueError(
            "Collective/public release requires --release-approved-by."
        )


def build_artifact(
    meta: SourceMeta,
    ownership: OwnershipMeta,
    raw_text: str,
    namespace: str,
    cap: int,
) -> Dict[str, object]:
    units = split_units(raw_text)
    taxonomy = classify_taxonomy(units, cap=cap)
    density = calc_implementation_density(taxonomy, len(units))
    decay = infer_freshness_decay(raw_text)
    difficulty = infer_verification_difficulty(taxonomy, density)

    artifact_hash = hashlib.sha256(
        (meta.source_id + meta.source_uri + raw_text[:5000]).encode("utf-8")
    ).hexdigest()
    artifact_id = f"eia-{artifact_hash[:16]}"

    gate_results = {
        "definition_class_validation": {
            "passed": True,
            "reason": "Artifact follows executable intelligence schema and taxonomy.",
        },
        "library_namespace_assignment": {
            "passed": True,
            "namespace": namespace,
        },
        "flag_integrity": {
            "passed": True,
            "class": "INTEL",
            "status": "PENDING",
        },
        "linkage_attribution": {
            "passed": bool(meta.source_uri),
            "resource_pointer": meta.source_uri,
        },
        "ownership_scope_gate": {
            "passed": True,
            "owner_principal_id": ownership.owner_principal_id,
            "visibility": ownership.visibility,
            "release_state": ownership.release_state,
        },
    }

    released_at = utc_now_iso() if ownership.visibility in {"collective", "public"} else ""

    return {
        "spec": SPEC,
        "artifact_id": artifact_id,
        "generated_at": utc_now_iso(),
        "classification": {"class": "INTEL", "status": "PENDING"},
        "namespace": namespace,
        "ownership": {
            "owner_principal_id": ownership.owner_principal_id,
            "visibility": ownership.visibility,
            "release_state": ownership.release_state,
            "agent_allowlist": ownership.agent_allowlist,
            "release_approved_by": ownership.release_approved_by,
            "released_at": released_at,
            "release_note": ownership.release_note,
        },
        "source": {
            "source_id": meta.source_id,
            "source_type": meta.source_type,
            "source_uri": meta.source_uri,
            "source_title": meta.source_title,
            "source_author": meta.source_author,
            "source_publisher": meta.source_publisher,
            "source_published_at": meta.source_published_at,
            "retrieved_at": meta.retrieved_at,
            "resource_pointer": meta.source_uri,
            "source_digest_sha256": hashlib.sha256(raw_text.encode("utf-8")).hexdigest(),
        },
        "taxonomy": taxonomy,
        "utility_metrics": {
            "freshness_decay": decay,
            "implementation_density": density,
            "verification_difficulty": difficulty,
        },
        "gate_results": gate_results,
        "synthesis": synthesize_summary(taxonomy),
        "raw_stats": {
            "char_count": len(raw_text),
            "unit_count": len(units),
        },
    }


def read_input_text(input_file: str, text: str, stdin: bool) -> str:
    sources = [bool(input_file), bool(text), bool(stdin)]
    if sum(1 for x in sources if x) != 1:
        raise ValueError("Exactly one of --input-file, --text, or --stdin is required.")

    if input_file:
        p = Path(input_file)
        if not p.exists():
            raise FileNotFoundError(f"Input file not found: {p}")
        return p.read_text(encoding="utf-8")
    if text:
        return text
    return sys.stdin.read()


def ensure_attribution(meta: SourceMeta) -> None:
    missing = []
    if not meta.source_uri:
        missing.append("source_uri")
    if not meta.source_id:
        missing.append("source_id")
    if not meta.source_type:
        missing.append("source_type")
    if missing:
        raise ValueError("Missing required attribution fields: " + ", ".join(missing))


def write_markdown_report(artifact: Dict[str, object], out_path: Path) -> None:
    taxonomy = artifact["taxonomy"]
    metrics = artifact["utility_metrics"]
    source = artifact["source"]
    ownership = artifact["ownership"]

    def bullet(items: List[str]) -> str:
        if not items:
            return "- (none)"
        return "\n".join(f"- {item}" for item in items)

    md = "# Executable Intelligence Artifact\n\n"
    md += f"**Artifact ID:** {artifact['artifact_id']}\n"
    md += f"**Spec:** {artifact['spec']}\n"
    md += f"**Generated:** {artifact['generated_at']}\n"
    md += f"**Class/Status:** [{artifact['classification']['class']}] [{artifact['classification']['status']}]\n\n"
    md += "## Ownership & Release\n\n"
    md += f"- Owner Principal: {ownership['owner_principal_id']}\n"
    md += f"- Visibility: {ownership['visibility']}\n"
    md += f"- Release State: {ownership['release_state']}\n"
    md += f"- Agent Allowlist: {', '.join(ownership['agent_allowlist']) if ownership['agent_allowlist'] else '(none)'}\n"
    md += f"- Release Approved By: {ownership['release_approved_by'] or '(not released)'}\n"
    md += f"- Released At: {ownership['released_at'] or '(not released)'}\n"
    md += f"- Release Note: {ownership['release_note'] or '(none)'}\n\n"
    md += "## Source Attribution\n\n"
    md += f"- Source ID: {source['source_id']}\n"
    md += f"- Type: {source['source_type']}\n"
    md += f"- URI: {source['source_uri']}\n"
    md += f"- Title: {source['source_title']}\n"
    md += f"- Author: {source['source_author']}\n"
    md += f"- Publisher: {source['source_publisher']}\n"
    md += f"- Published At: {source['source_published_at']}\n"
    md += f"- Retrieved At: {source['retrieved_at']}\n\n"

    md += "## Taxonomy of Actionability\n\n"
    md += "### Procedural\n" + bullet(taxonomy["procedural"]) + "\n\n"
    md += "### Strategic\n" + bullet(taxonomy["strategic"]) + "\n\n"
    md += "### Governance\n" + bullet(taxonomy["governance"]) + "\n\n"

    md += "## Utility Metrics\n\n"
    md += f"- Freshness Decay: {metrics['freshness_decay']}\n"
    md += f"- Implementation Density: {metrics['implementation_density']}\n"
    md += f"- Verification Difficulty: {metrics['verification_difficulty']}\n\n"

    md += "## Synthesis\n\n"
    md += f"{artifact['synthesis']}\n"

    out_path.write_text(md, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="TNF executable intelligence ingestion pipeline")
    parser.add_argument("--source-id", required=True, help="Stable source identifier")
    parser.add_argument("--source-type", required=True, help="Source type (video, doc, paper, repo, etc.)")
    parser.add_argument("--source-uri", required=True, help="Source URI/pointer for attribution")
    parser.add_argument("--source-title", default="", help="Human-readable source title")
    parser.add_argument("--source-author", default="", help="Primary human or org author")
    parser.add_argument("--source-publisher", default="", help="Publisher or platform")
    parser.add_argument("--source-published-at", default="", help="ISO timestamp or known publication date")
    parser.add_argument("--retrieved-at", default=utc_now_iso(), help="ISO timestamp for retrieval")

    parser.add_argument("--owner-principal-id", required=True, help="Canonical owner identity for this artifact")
    parser.add_argument(
        "--visibility",
        default="private",
        help="Visibility scope: private | agent-scope | collective | public",
    )
    parser.add_argument(
        "--release-state",
        default="sealed",
        help="Release gate state: sealed | released-collective | released-public",
    )
    parser.add_argument(
        "--agent-allowlist",
        default="",
        help="Comma-separated agent IDs allowed when visibility=agent-scope",
    )
    parser.add_argument(
        "--release-approved-by",
        default="",
        help="Required for collective/public release; approving human/authority",
    )
    parser.add_argument(
        "--release-note",
        default="",
        help="Optional release note or rationale",
    )

    parser.add_argument("--input-file", default="", help="Path to plain-text source input")
    parser.add_argument("--text", default="", help="Inline source text")
    parser.add_argument("--stdin", action="store_true", help="Read source text from STDIN")

    parser.add_argument("--namespace", default="intelligence", help="TNF library namespace")
    parser.add_argument("--max-items-per-plane", type=int, default=20, help="Cap entries per taxonomy plane")
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="Output directory")
    parser.add_argument("--markdown", action="store_true", help="Also emit markdown artifact")
    parser.add_argument("--dry-run", action="store_true", help="Do not write files")
    parser.add_argument("--json", action="store_true", help="Print JSON to stdout")

    args = parser.parse_args()

    try:
        raw_text = read_input_text(args.input_file, args.text, args.stdin)
        meta = SourceMeta(
            source_id=args.source_id.strip(),
            source_type=args.source_type.strip(),
            source_uri=args.source_uri.strip(),
            source_title=args.source_title.strip(),
            source_author=args.source_author.strip(),
            source_publisher=args.source_publisher.strip(),
            source_published_at=args.source_published_at.strip(),
            retrieved_at=args.retrieved_at.strip(),
        )
        ensure_attribution(meta)
        ownership = OwnershipMeta(
            owner_principal_id=args.owner_principal_id.strip(),
            visibility=args.visibility.strip(),
            release_state=args.release_state.strip(),
            agent_allowlist=parse_agent_allowlist(args.agent_allowlist),
            release_approved_by=args.release_approved_by.strip(),
            release_note=args.release_note.strip(),
        )
        if not ownership.owner_principal_id:
            raise ValueError("Missing required ownership field: --owner-principal-id")
        validate_ownership(ownership)
        artifact = build_artifact(
            meta,
            ownership,
            raw_text,
            namespace=args.namespace.strip(),
            cap=args.max_items_per_plane,
        )
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(artifact, indent=2))

    if args.dry_run:
        return 0

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / f"{artifact['artifact_id']}.json"
    json_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")

    if args.markdown:
        md_path = out_dir / f"{artifact['artifact_id']}.md"
        write_markdown_report(artifact, md_path)

    print(str(json_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

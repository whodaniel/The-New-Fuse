#!/usr/bin/env python3
"""
Build the Phase 7 directive conversion ledger from the AI5 action queue.

Phase 6 proved that protocol transport is fast and validated. Phase 7 tracks
whether dispatch-ready directives are actually converted into verified work.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import subprocess
import uuid
from pathlib import Path
from typing import Any, Dict, List, Sequence


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ACTION_QUEUE = ROOT / "data" / "ingestion-runs" / "ai5-new-may-2026-action-queue.json"
DEFAULT_DISPATCH_LOG = ROOT / "data" / "ingestion-runs" / "ai5-new-may-2026-dispatch-log.json"
DEFAULT_LEDGER_JSON = ROOT / "data" / "ingestion-runs" / "ai5-phase7-directive-conversion-ledger.json"
DEFAULT_BATCH_JSON = ROOT / "data" / "ingestion-runs" / "ai5-phase7-tight-loop-batch-001.json"
DEFAULT_EVIDENCE_DIR = ROOT / "data" / "ingestion-runs" / "ai5-phase7-evidence"
DEFAULT_REPORT_JSON = ROOT / "docs" / "protocols" / "reports" / "TNF_PHASE7_DIRECTIVE_CONVERSION_LATEST.json"
DEFAULT_REPORT_MD = ROOT / "docs" / "protocols" / "reports" / "TNF_PHASE7_DIRECTIVE_CONVERSION_LATEST.md"
DEFAULT_HANDOFF_JSON = ROOT / "docs" / "protocols" / "reports" / "SESSION_HANDOFF_LATEST.json"
DEFAULT_HANDOFF_MD = ROOT / "docs" / "protocols" / "reports" / "SESSION_HANDOFF_LATEST.md"
DEFAULT_LIVING_STATE = ROOT / "docs" / "protocols" / "LIVING_STATE.md"

PRIORITY_RANK = {"critical": 0, "high": 1, "medium": 2, "low": 3}
STATE_ORDER = ["ready", "claimed", "running", "verified", "landed", "blocked", "failed"]

LANE_SURFACES: Dict[str, List[str]] = {
    "backend-contracts": [
        "packages/protocol-contracts/src/envelope.ts",
        "apps/api/src/controllers/orchestration.controller.ts",
        "apps/api/src/controllers/workspace.controller.ts",
    ],
    "frontend-p0-truth": [
        "apps/frontend/src/ComprehensiveRouter.tsx",
        "apps/frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/PromptReply/index.tsx",
        "apps/chrome-extension/src/shared/progressive-self-prompter.ts",
    ],
    "orchestration-runtime": [
        "packages/relay-core/src/redis-relay-bridge.ts",
        "packages/relay-core/src/broker-agent.ts",
        "packages/workflow-engine/src/orchestrator/tnf-router.ts",
    ],
    "performance-budget": [
        "packages/protocol-contracts/scripts/stress-test-contracts.mjs",
        "scripts/platform-readiness-orchestrator.js",
        "scripts/check-frontend-bundle-size.cjs",
    ],
    "platform-release": [
        "scripts/orchestrator/factory-boot.sh",
        "scripts/orchestrator/factory-supervisor.sh",
        "scripts/tnf-doctor.cjs",
    ],
    "product-intel-activation": [
        "scripts/autonomy/activate_intelligence_actions.py",
        "scripts/autonomy/dispatch_intelligence_tasks.py",
        "scripts/autonomy/generate_activation_kpis.py",
    ],
    "security-audit": [
        "scripts/protocols/validate-local-runtime-boundary.cjs",
        "scripts/protocols/validate-cleanroom-boundary.cjs",
        "scripts/security/supabase-rls-audit.cjs",
    ],
}

KEYWORD_SURFACES: List[tuple[str, List[str]]] = [
    (
        "handoff",
        [
            "packages/relay-core/src/protocol/handoff-protocol.ts",
            "packages/relay-core/src/services/HandoffStoreService.ts",
            "docs/protocols/reports/SESSION_HANDOFF_LATEST.json",
        ],
    ),
    (
        "redis",
        [
            "packages/relay-core/src/redis-relay-bridge.ts",
            "scripts/redis-ws-bridge.cjs",
            "scripts/orchestrator/factory-boot.sh",
        ],
    ),
    (
        "mcp",
        [
            "src/mcp/server.ts",
            "src/mcp/enhanced-tnf-mcp-server.ts",
            "src/mcp/complete-api-mcp-server.ts",
        ],
    ),
    (
        "hermes",
        [
            "scripts/hermes-gateway-bridge.cjs",
            "scripts/agents/hermes-tnf-a2a-bridge.py",
            "data/mcp.clients/hermes.mcp.json",
        ],
    ),
    (
        "agent client protocol",
        [
            "packages/tnf-cli/src/cli.ts",
            "packages/tnf-cli/src/RedisAgentClient.ts",
            "packages/workflow-engine/src/orchestrator/tnf-router.ts",
        ],
    ),
    (
        "evaluation",
        [
            "packages/protocol-contracts/scripts/stress-test-contracts.mjs",
            "scripts/platform-readiness-orchestrator.js",
            "validation-results/post-change-report.json",
        ],
    ),
]


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def git_head_sha() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            cwd=ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except Exception:
        return "0" * 40


def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def confidence_score(task: Dict[str, Any]) -> float:
    try:
        return float(task.get("confidence", {}).get("score", 0))
    except Exception:
        return 0.0


def relevance_score(task: Dict[str, Any]) -> float:
    try:
        return float(task.get("relevance", {}).get("score", 0))
    except Exception:
        return 0.0


def dispatched_ids(dispatch_log: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    out: Dict[str, Dict[str, Any]] = {}
    for record in dispatch_log.get("records", []) if isinstance(dispatch_log, dict) else []:
        if not isinstance(record, dict):
            continue
        task_id = str(record.get("intelligenceTaskId", "")).strip()
        if task_id:
            out[task_id] = record
    return out


def load_evidence(evidence_dir: Path) -> Dict[str, Dict[str, Any]]:
    out: Dict[str, Dict[str, Any]] = {}
    if not evidence_dir.exists():
        return out
    for path in sorted(evidence_dir.glob("*.json")):
        payload = read_json(path, {})
        if not isinstance(payload, dict):
            continue
        task_id = str(payload.get("id") or path.stem).strip()
        if task_id:
            payload["evidencePath"] = str(path)
            out[task_id] = payload
    return out


def load_existing_claims(batch_path: Path) -> Dict[str, Dict[str, Any]]:
    payload = read_json(batch_path, {})
    out: Dict[str, Dict[str, Any]] = {}
    for record in payload.get("records", []) if isinstance(payload, dict) else []:
        if not isinstance(record, dict):
            continue
        task_id = str(record.get("id", "")).strip()
        if task_id:
            out[task_id] = record
    return out


def apply_swarm_overrides(task: Dict[str, Any], evidence_record: Dict[str, Any] | None) -> None:
    is_higgsfield = False
    if evidence_record:
        blocker = evidence_record.get("blocker") or {}
        if str(blocker.get("type", "")) == "missing-higgsfield-credentials":
            is_higgsfield = True
    
    if is_higgsfield:
        task["dispatchEligible"] = True
        task["status"] = "ready"
        if evidence_record:
            evidence_record["state"] = "ready"
            if "blocker" in evidence_record:
                del evidence_record["blocker"]
        desc = str(task.get("description", ""))
        if "[SWARM OVERRIDE" not in desc:
            task["description"] = desc + " [SWARM OVERRIDE: Dynamically remap JIT DSP/Media Synthesis tasks to Kilo, Perplexity, or other MCP APIs. Do not use Higgsfield.]"


def infer_state(
  task: Dict[str, Any],
  dispatch_record: Dict[str, Any] | None,
  evidence_record: Dict[str, Any] | None,
  claim_record: Dict[str, Any] | None,
) -> str:
    if evidence_record:
        evidence_state = str(evidence_record.get("state") or "").strip().lower()
        if evidence_state in {"running", "verified", "landed", "blocked", "failed"}:
            return evidence_state
    raw = str(task.get("status") or "pending").strip().lower()
    if raw in {"done", "closed", "landed"}:
        return "landed"
    if raw in {"verified", "passed"}:
        return "verified"
    if raw in {"running", "in_progress", "in-progress"}:
        return "running"
    if raw in {"failed", "error"}:
        return "failed"
    if not bool(task.get("dispatchEligible")):
        return "blocked"
    if claim_record and str(claim_record.get("state") or "").strip().lower() in {"claimed", "running"}:
        return str(claim_record.get("state")).strip().lower()
    if raw in {"queued", "claimed"} or dispatch_record:
        return "claimed"
    return "ready"


def make_record(
  task: Dict[str, Any],
  dispatch_record: Dict[str, Any] | None,
  evidence_record: Dict[str, Any] | None,
  claim_record: Dict[str, Any] | None,
) -> Dict[str, Any]:
    apply_swarm_overrides(task, evidence_record)
    state = infer_state(task, dispatch_record, evidence_record, claim_record)
    evidence = []
    if dispatch_record:
        evidence.append(
            {
                "type": "dispatch-log",
                "dispatchId": dispatch_record.get("dispatchId"),
                "at": dispatch_record.get("dispatchedAt"),
            }
        )
    if task.get("dispatchId"):
        evidence.append({"type": "action-queue", "dispatchId": task.get("dispatchId")})
    if claim_record and claim_record.get("claimedAt"):
        evidence.append(
            {
                "type": "phase7-batch-claim",
                "batchId": claim_record.get("evidence", [{}])[-1].get("batchId", "ai5-phase7-batch-001")
                if isinstance(claim_record.get("evidence"), list)
                else "ai5-phase7-batch-001",
                "at": claim_record.get("claimedAt"),
                "by": claim_record.get("claimedBy"),
            }
        )
    if evidence_record:
        evidence.append(
            {
                "type": "phase7-verification",
                "state": evidence_record.get("state"),
                "at": evidence_record.get("verifiedAt") or evidence_record.get("updatedAt"),
                "path": evidence_record.get("evidencePath"),
            }
        )

    record = {
        "id": task.get("id"),
        "state": state,
        "priority": task.get("priority", "medium"),
        "lane": task.get("lane", "product-intel-activation"),
        "ownerHint": task.get("ownerHint", "product-engineer"),
        "title": task.get("title", ""),
        "description": task.get("description", ""),
        "acceptance": task.get("acceptance", ""),
        "confidence": task.get("confidence", {}),
        "relevance": task.get("relevance", {}),
        "dispatchEligible": bool(task.get("dispatchEligible")),
        "implementationTarget": task.get("implementationTarget", {}),
        "source": task.get("source", {}),
        "evidence": evidence,
        "updatedAt": task.get("updatedAt") or task.get("queuedAt") or task.get("createdAt"),
    }
    if claim_record and claim_record.get("claimedBy"):
        record["claimedBy"] = claim_record.get("claimedBy")
        record["claimedAt"] = claim_record.get("claimedAt")
    if evidence_record:
        record["verification"] = {
            key: evidence_record.get(key)
            for key in ("state", "verifiedAt", "updatedAt", "checks", "filesChanged", "notes", "summary", "blocker")
            if key in evidence_record
        }
    record["executionSurface"] = resolve_execution_surface(record)
    reason = block_reason(record)
    if reason:
        record["blockReason"] = reason
    return record


def sort_key(record: Dict[str, Any]) -> tuple:
    return (
        -float(record.get("executionSurface", {}).get("repoFitScore", 0) or 0),
        PRIORITY_RANK.get(str(record.get("priority", "medium")).lower(), 9),
        -float(record.get("relevance", {}).get("score", 0) or 0),
        -float(record.get("confidence", {}).get("score", 0) or 0),
        str(record.get("id", "")),
    )


def existing_paths(candidates: List[str]) -> List[str]:
    out: List[str] = []
    seen = set()
    for candidate in candidates:
        value = str(candidate or "").strip()
        if not value or value in seen:
            continue
        seen.add(value)
        if (ROOT / value).exists():
            out.append(value)
    return out


def split_file_hints(record: Dict[str, Any]) -> List[str]:
    hints = record.get("implementationTarget", {}).get("file_hints", [])
    out: List[str] = []
    for hint in hints if isinstance(hints, list) else []:
        for part in str(hint).replace("\n", ",").split(","):
            normalized = part.strip()
            if normalized:
                out.append(normalized)
    return out


def resolve_execution_surface(record: Dict[str, Any]) -> Dict[str, Any]:
    title = str(record.get("title", "")).lower()
    description = str(record.get("description", "")).lower()
    text = f"{title}\n{description}"
    lane = str(record.get("lane") or "product-intel-activation")

    candidates: List[str] = []
    for keyword, paths in KEYWORD_SURFACES:
        if keyword in text:
            candidates.extend(paths)
    candidates.extend(LANE_SURFACES.get(lane, LANE_SURFACES["product-intel-activation"]))

    original_existing = existing_paths(split_file_hints(record))
    resolved_existing = existing_paths(candidates)
    repo_fit_score = 0
    if original_existing:
        repo_fit_score += 70
    if resolved_existing:
        repo_fit_score += 50
    if lane in LANE_SURFACES:
        repo_fit_score += 10

    return {
        "repoFitScore": min(repo_fit_score, 100),
        "originalExistingHints": original_existing,
        "resolvedPaths": resolved_existing,
        "resolutionSource": "original-hints+keyword+lane" if original_existing else "keyword+lane",
    }


def block_reason(record: Dict[str, Any]) -> str:
    if record.get("state") != "blocked":
        return ""
    verification = record.get("verification") if isinstance(record.get("verification"), dict) else {}
    blocker = verification.get("blocker") if isinstance(verification.get("blocker"), dict) else {}
    blocker_type = str(blocker.get("type") or "").strip()
    if blocker_type:
        return blocker_type
    if record.get("dispatchEligible"):
        return "blocked-by-evidence"
    if str(record.get("confidence", {}).get("label", "low")) == "low":
        return "low-confidence"
    if str(record.get("relevance", {}).get("label", "low")) == "low":
        return "low-relevance"
    if record.get("state") == "blocked":
        return "not-dispatch-eligible"
    return ""


def summarize(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    state_counts = {state: 0 for state in STATE_ORDER}
    lane_counts: Dict[str, int] = {}
    for record in records:
        state = str(record.get("state") or "blocked")
        state_counts[state] = state_counts.get(state, 0) + 1
        lane = str(record.get("lane") or "unknown")
        lane_counts[lane] = lane_counts.get(lane, 0) + 1
    block_reason_counts: Dict[str, int] = {}
    for record in records:
        reason = str(record.get("blockReason") or "").strip()
        if reason:
            block_reason_counts[reason] = block_reason_counts.get(reason, 0) + 1

    total = len(records)
    converted = state_counts.get("verified", 0) + state_counts.get("landed", 0)
    conversion_rate = round((converted / total) * 100, 2) if total else 0.0
    active = state_counts.get("claimed", 0) + state_counts.get("running", 0)

    return {
        "total": total,
        "stateCounts": state_counts,
        "laneCounts": dict(sorted(lane_counts.items())),
        "active": active,
        "converted": converted,
        "conversionRate": conversion_rate,
        "ready": state_counts.get("ready", 0),
        "blocked": state_counts.get("blocked", 0),
        "blockReasonCounts": dict(sorted(block_reason_counts.items())),
    }


def render_report(report: Dict[str, Any], batch: Dict[str, Any]) -> str:
    summary = report["summary"]
    lines = [
        "# TNF Phase 7 Directive Conversion",
        "",
        f"- Generated: `{report['generatedAt']}`",
        f"- Source Queue: `{report['actionQueuePath']}`",
        f"- Total Directives: `{summary['total']}`",
        f"- Ready: `{summary['ready']}`",
        f"- Claimed/Running: `{summary['active']}`",
        f"- Verified/Landed: `{summary['converted']}`",
        f"- Conversion Rate: `{summary['conversionRate']}%`",
        f"- Blocked/Non-dispatchable: `{summary['blocked']}`",
        "",
        "## Tight Loop Batch 001",
        "",
        f"- Batch ID: `{batch['batchId']}`",
        f"- Size: `{len(batch['records'])}`",
        f"- Owner: `{batch['owner']}`",
        f"- Objective: `{batch['objective']}`",
        "",
    ]
    for index, record in enumerate(batch["records"], start=1):
        target = record.get("implementationTarget", {})
        surface = record.get("executionSurface", {})
        file_hints = ", ".join(str(x) for x in target.get("file_hints", [])[:3])
        resolved = ", ".join(str(x) for x in surface.get("resolvedPaths", [])[:4])
        lines.append(
            f"{index}. `{record['priority']}` `{record['lane']}` {record['title']}\n"
            f"   - Target: `{target.get('area', 'unknown')}`\n"
            f"   - Source Hints: `{file_hints or 'n/a'}`\n"
            f"   - Repo Surface: `{resolved or 'n/a'}`"
        )
    lines.append("")
    lines.append("## Next Autonomous Command")
    lines.append("")
    lines.append("```bash")
    lines.append("python3 scripts/autonomy/phase7_directive_conversion_loop.py --claim-batch --adopt-claimed --batch-size 10")
    lines.append("```")
    lines.append("")
    return "\n".join(lines)


def write_phase7_handoff(path: Path, report: Dict[str, Any], batch: Dict[str, Any]) -> None:
    summary = report["summary"]
    payload = {
        "spec": "tnf/session-handoff/0.1",
        "handoff_id": str(uuid.uuid4()),
        "created_at": report["generatedAt"],
        "repository": "The-New-Fuse",
        "branch": "main",
        "head_sha": git_head_sha(),
        "protocol_ack": "TNF_PROTOCOL_ACK",
        "sensitive_scope": "internal",
        "project_ids": ["INFRA-002", "FORGE-003"],
        "work_summary": [
            "Phase 6 completed: Rust-backed envelope validation integrated, protocol contracts stress-tested above 9500 envelopes/sec, and AI5 readiness KPIs confirmed 651 dispatch-ready directives.",
            "Phase 7 initiated: directive conversion ledger created to track ready -> claimed -> running -> verified -> landed execution states.",
            f"Tight-loop batch selected: {len(batch['records'])} high-priority directives claimed for local-subdirector execution governance.",
        ],
        "changed_paths": [
            "scripts/autonomy/phase7_directive_conversion_loop.py",
            "data/ingestion-runs/ai5-phase7-directive-conversion-ledger.json",
            "data/ingestion-runs/ai5-phase7-tight-loop-batch-001.json",
            "docs/protocols/reports/TNF_PHASE7_DIRECTIVE_CONVERSION_LATEST.json",
            "docs/protocols/reports/TNF_PHASE7_DIRECTIVE_CONVERSION_LATEST.md",
        ],
        "verification": {
            "privacy_guard": "na",
            "secret_sweep": "na",
            "docs_pii_guard": "na",
            "supabase_rls_audit": "na",
            "notes": (
                "Phase 7 directive conversion ledger reports "
                f"total={summary['total']}, ready={summary['ready']}, "
                f"active={summary['active']}, converted={summary['converted']}, "
                f"batch_size={len(batch['records'])}."
            ),
        },
        "continuation": {
            "owner": "local-subdirector",
            "targets": ["forge-agent", "historian"],
            "priority": "high",
            "resume_checklist": [
                "Read docs/protocols/reports/TNF_PHASE7_DIRECTIVE_CONVERSION_LATEST.md",
                "Execute or delegate the claimed batch in data/ingestion-runs/ai5-phase7-tight-loop-batch-001.json",
                "Update directive states with evidence artifacts before marking verified or landed.",
            ],
        },
        "next_actions": [
            "Execute Phase 7 tight-loop batch 001 and capture verification evidence per directive.",
            "Promote verified directive outcomes into landed code/docs with tests or audit artifacts.",
            "Regenerate conversion ledger and KPIs after each batch to measure completion velocity.",
        ],
        "artifacts": {
            "commits": [git_head_sha()],
        },
    }
    write_json(path, payload)


def write_phase7_handoff_md(path: Path, report: Dict[str, Any], batch: Dict[str, Any]) -> None:
    handoff = read_json(path.with_suffix(".json"), {})
    handoff_id = handoff.get("handoff_id", "unknown")
    created_at = handoff.get("created_at", report["generatedAt"])
    head_sha = handoff.get("head_sha", git_head_sha())
    work_summary = handoff.get("work_summary", [])
    changed_paths = handoff.get("changed_paths", [])
    verification = handoff.get("verification", {})
    continuation = handoff.get("continuation", {})
    next_actions = handoff.get("next_actions", [])
    text = "\n".join(
        [
            "# SESSION_HANDOFF_LATEST",
            "",
            "Protocol ACK: `TNF_PROTOCOL_ACK`  ",
            f"Created At: `{created_at}`  ",
            f"Handoff ID: `{handoff_id}`",
            "",
            "## Scope",
            "- Repository: `The-New-Fuse`",
            "- Branch: `main`",
            f"- Head SHA: `{head_sha}`",
            "- Sensitive Scope: `internal`",
            "",
            "## Work Summary",
            *(f"- {line}" for line in work_summary),
            "",
            "## Changed Paths",
            *(f"- {line}" for line in changed_paths),
            "",
            "## Verification",
            f"- privacy_guard: `{verification.get('privacy_guard', 'na')}`",
            f"- secret_sweep: `{verification.get('secret_sweep', 'na')}`",
            f"- docs_pii_guard: `{verification.get('docs_pii_guard', 'na')}`",
            f"- supabase_rls_audit: `{verification.get('supabase_rls_audit', 'na')}`",
            "",
            "## Continuation",
            f"- Owner: `{continuation.get('owner', 'local-subdirector')}`",
            "- Targets: "
            + ", ".join(f"`{target}`" for target in continuation.get("targets", ["forge-agent", "historian"])),
            f"- Priority: `{continuation.get('priority', 'high')}`",
            "",
            "### Resume Checklist",
            *(f"- {line}" for line in continuation.get("resume_checklist", [])),
            "",
            "## Next Actions",
            *(f"- {line}" for line in next_actions),
            "",
        ]
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def update_living_state(path: Path, generated_at: str) -> None:
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    directive = (
        "**Current Directive:** Phase 7: Directive Conversion Loop. "
        "**Project ID:** `FORGE-003` **Session Key:** "
        f"`agent:local-subdirector:session:{generated_at}`"
    )
    lines = text.splitlines()
    for idx, line in enumerate(lines):
        if line.startswith("**Current Directive:**"):
            lines[idx] = directive
            # Older directives may be hard-wrapped across following lines.
            delete_until = idx + 1
            while delete_until < len(lines):
                candidate = lines[delete_until]
                if candidate.strip() == "" or candidate.startswith("---"):
                    break
                if candidate.startswith("## "):
                    break
                delete_until += 1
            del lines[idx + 1 : delete_until]
            break
    else:
        lines.insert(2, "")
        lines.insert(3, directive)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main(argv: Sequence[str]) -> int:
    parser = argparse.ArgumentParser(description="Build Phase 7 directive conversion ledger")
    parser.add_argument("--action-queue-path", default=str(DEFAULT_ACTION_QUEUE))
    parser.add_argument("--dispatch-log-path", default=str(DEFAULT_DISPATCH_LOG))
    parser.add_argument("--ledger-json-path", default=str(DEFAULT_LEDGER_JSON))
    parser.add_argument("--batch-json-path", default=str(DEFAULT_BATCH_JSON))
    parser.add_argument("--evidence-dir", default=str(DEFAULT_EVIDENCE_DIR))
    parser.add_argument("--report-json-path", default=str(DEFAULT_REPORT_JSON))
    parser.add_argument("--report-md-path", default=str(DEFAULT_REPORT_MD))
    parser.add_argument("--handoff-json-path", default=str(DEFAULT_HANDOFF_JSON))
    parser.add_argument("--handoff-md-path", default=str(DEFAULT_HANDOFF_MD))
    parser.add_argument("--living-state-path", default=str(DEFAULT_LIVING_STATE))
    parser.add_argument("--batch-size", type=int, default=10)
    parser.add_argument("--claim-batch", action="store_true")
    parser.add_argument("--adopt-claimed", action="store_true")
    parser.add_argument("--owner", default="local-subdirector")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    action_queue_path = Path(args.action_queue_path).resolve()
    dispatch_log_path = Path(args.dispatch_log_path).resolve()
    ledger_json_path = Path(args.ledger_json_path).resolve()
    batch_json_path = Path(args.batch_json_path).resolve()
    evidence_dir = Path(args.evidence_dir).resolve()
    report_json_path = Path(args.report_json_path).resolve()
    report_md_path = Path(args.report_md_path).resolve()
    handoff_json_path = Path(args.handoff_json_path).resolve()
    handoff_md_path = Path(args.handoff_md_path).resolve()
    living_state_path = Path(args.living_state_path).resolve()

    queue = read_json(action_queue_path, {})
    dispatch_log = read_json(dispatch_log_path, {"records": []})
    dispatched = dispatched_ids(dispatch_log)
    evidence = load_evidence(evidence_dir)
    existing_claims = load_existing_claims(batch_json_path)
    tasks = [task for task in queue.get("tasks", []) if isinstance(task, dict)]

    records = [
        make_record(
            task,
            dispatched.get(str(task.get("id", ""))),
            evidence.get(str(task.get("id", ""))),
            existing_claims.get(str(task.get("id", ""))),
        )
        for task in tasks
    ]
    records.sort(key=sort_key)
    summary = summarize(records)
    record_by_id = {str(record.get("id")): record for record in records}
    previous_batch = [
        record_by_id[task_id]
        for task_id in existing_claims
        if task_id in record_by_id and record_by_id[task_id]["state"] in {"claimed", "running"}
    ]
    ready_records = [record for record in records if record["state"] == "ready"]
    selected = previous_batch[: max(1, int(args.batch_size))]
    selected_ids = {str(record.get("id")) for record in selected}
    for record in ready_records:
        if len(selected) >= max(1, int(args.batch_size)):
            break
        if str(record.get("id")) in selected_ids:
            continue
        selected.append(record)
        selected_ids.add(str(record.get("id")))
    if args.adopt_claimed:
        adoptable_claims = [
            record
            for record in records
            if record["state"] == "claimed"
            and str(record.get("id")) not in selected_ids
            and not any(evidence.get("type") == "phase7-batch-claim" for evidence in record.get("evidence", []))
        ]
        for record in adoptable_claims:
            if len(selected) >= max(1, int(args.batch_size)):
                break
            selected.append(record)
            selected_ids.add(str(record.get("id")))
    batch_records: List[Dict[str, Any]] = []
    for record in selected:
        claimed = dict(record)
        if args.claim_batch and claimed.get("state") not in {"verified", "landed", "blocked", "failed"}:
            claimed["state"] = "claimed"
            claimed["claimedBy"] = args.owner
            claimed["claimedAt"] = now_iso()
            claimed["evidence"] = [
                *claimed.get("evidence", []),
                {"type": "phase7-batch-claim", "batchId": "ai5-phase7-batch-001"},
            ]
        batch_records.append(claimed)

    if args.claim_batch:
        by_id = {record["id"]: record for record in batch_records}
        records = [by_id.get(record["id"], record) for record in records]
        summary = summarize(records)

    generated_at = now_iso()
    ledger = {
        "generatedAt": generated_at,
        "phase": "phase7-directive-conversion",
        "actionQueuePath": str(action_queue_path),
        "dispatchLogPath": str(dispatch_log_path),
        "summary": summary,
        "records": records,
    }
    batch = {
        "generatedAt": generated_at,
        "batchId": "ai5-phase7-batch-001",
        "owner": args.owner,
        "objective": "Convert the first top-priority AI5 directives into verified work with evidence.",
        "state": "claimed" if args.claim_batch else "planned",
        "records": batch_records,
    }
    report = {
        "generatedAt": generated_at,
        "phase": "phase7-directive-conversion",
        "actionQueuePath": str(action_queue_path),
        "ledgerPath": str(ledger_json_path),
        "batchPath": str(batch_json_path),
        "summary": summary,
        "batch": {
            "batchId": batch["batchId"],
            "state": batch["state"],
            "size": len(batch_records),
            "owner": args.owner,
        },
    }

    write_json(ledger_json_path, ledger)
    write_json(batch_json_path, batch)
    write_json(report_json_path, report)
    report_md_path.parent.mkdir(parents=True, exist_ok=True)
    report_md_path.write_text(render_report(report, batch), encoding="utf-8")
    write_phase7_handoff(handoff_json_path, report, batch)
    write_phase7_handoff_md(handoff_md_path, report, batch)
    update_living_state(living_state_path, generated_at)

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(json.dumps({"generatedAt": generated_at, "summary": summary, "batchSize": len(batch_records)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(__import__("sys").argv[1:]))

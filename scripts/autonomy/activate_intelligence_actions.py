#!/usr/bin/env python3
"""
Promote Executable Intelligence Artifacts into a concrete action queue.

This script closes the ingest->execution gap by turning taxonomy planes
into prioritized tasks with owners, lanes, and acceptance criteria.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Sequence, Tuple


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = ROOT / "data" / "ingestion-runs" / "ai5-new-may-2026-manifest.json"
DEFAULT_ARTIFACT_DIR = ROOT / "data" / "intelligence-artifacts"
DEFAULT_OUT_PATH = ROOT / "data" / "ingestion-runs" / "ai5-new-may-2026-action-queue.json"

LANE_RULES: List[Tuple[re.Pattern[str], str, str]] = [
    (re.compile(r"\b(auth|security|compliance|risk|policy|guardrail|privacy)\b", re.IGNORECASE), "security-audit", "security-auditor"),
    (re.compile(r"\b(deploy|release|rollback|runtime|cloudflare|infra|production)\b", re.IGNORECASE), "platform-release", "devops-engineer"),
    (re.compile(r"\b(api|endpoint|backend|database|sql|schema|migration)\b", re.IGNORECASE), "backend-contracts", "backend-specialist"),
    (re.compile(r"\b(frontend|ui|ux|css|layout|design|mobile)\b", re.IGNORECASE), "frontend-p0-truth", "frontend-specialist"),
    (re.compile(r"\b(test|benchmark|latency|performance|eval|quality)\b", re.IGNORECASE), "performance-budget", "performance-optimizer"),
    (re.compile(r"\b(agent|orchestrat|workflow|queue|router|relay|tooling|protocol)\b", re.IGNORECASE), "orchestration-runtime", "orchestration-engineer"),
]

CRITICAL_HINTS = re.compile(r"\b(launch|release|production|critical|security|blocker|incident)\b", re.IGNORECASE)
HIGH_HINTS = re.compile(r"\b(implement|ship|deploy|integrate|benchmark|validate|migrate)\b", re.IGNORECASE)
PROCEDURAL_HINTS = re.compile(
    r"\b(implement|configure|deploy|ship|build|built|run|create|add|update|replace|migrate|test|verify|measure|benchmark|refactor|enable|disable|audit|gate|gather|prototype|evaluate|design)\b",
    re.IGNORECASE,
)
COMMAND_HINTS = re.compile(r"\b(pnpm|npm|yarn|python|node|git|docker|kubectl|curl|bash|sql)\b", re.IGNORECASE)
ACTION_START_HINTS = re.compile(
    r"^(implement|configure|deploy|ship|build|create|add|update|replace|migrate|test|verify|measure|benchmark|refactor|enable|disable|audit|gate|gather|prototype|evaluate|design|run|use|set)\b",
    re.IGNORECASE,
)
DISPATCH_SPECIFICITY_HINTS = re.compile(
    r"\b(api|endpoint|service|workflow|queue|router|relay|extension|script|module|database|schema|migration|prompt|model|benchmark|test|deploy|integration|telemetry|pipeline)\b",
    re.IGNORECASE,
)

IMPLEMENTATION_TARGET_RULES: List[Tuple[re.Pattern[str], str, List[str]]] = [
    (
        re.compile(r"\b(chrome extension|content script|manifest|youtube|playlist|oauth)\b", re.IGNORECASE),
        "extension-ingest-surface",
        [
            "apps/chrome-extension/src/v6/background/index.ts",
            "apps/chrome-extension/src/v6/popup/popup.js",
            "scripts/autonomy/ingest_ai5_and_new_may_notes.py",
        ],
    ),
    (
        re.compile(r"\b(api|endpoint|backend|database|sql|migration|schema)\b", re.IGNORECASE),
        "backend-and-data",
        [
            "apps/api/src/modules/task/task.service.ts",
            "apps/api/src/modules/task/task.controller.ts",
            "packages/database/src/drizzle/schema/tasks.ts",
        ],
    ),
    (
        re.compile(r"\b(frontend|ui|ux|react|component|dashboard)\b", re.IGNORECASE),
        "frontend-delivery",
        [
            "apps/frontend/src/pages/TNFCommandCenter.tsx",
            "apps/frontend/src/pages/Tasks/Detail.tsx",
            "apps/frontend/src/services/unifiedLedgerApi.ts",
        ],
    ),
    (
        re.compile(r"\b(agent|orchestrat|workflow|queue|relay|router|tooling|protocol)\b", re.IGNORECASE),
        "orchestration-runtime",
        [
            "packages/relay-core/src/director-agent.ts",
            "packages/workflow-engine/src/telemetry/TelemetryService.ts",
            "scripts/protocols/chronological-dispatch.cjs",
        ],
    ),
]


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def normalize_line(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip()


def is_transcript_available(status: str) -> bool:
    return str(status or "").strip().lower() in {"cache_hit", "fetched"}


def dedupe_keep_order(lines: List[str]) -> List[str]:
    seen = set()
    out: List[str] = []
    for line in lines:
        key = normalize_line(line).lower()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(normalize_line(line))
    return out


def is_actionable_procedural(line: str) -> bool:
    text = normalize_line(line)
    lower = text.lower()
    if len(text) < 24:
        return False
    if "transcript unavailable in this run" in lower:
        return False
    if text.startswith("(") and "transcript" in lower:
        return False
    if text.endswith(","):
        return False
    if text.lower().startswith(("who ", "what ", "why ", "when ", "where ", "how ")):
        return False
    if text.lower().startswith(("and ", "but ", "or ", "so ", "then ", "because ")):
        return False
    if text.startswith("Video Title:") or text.startswith("Video URL:") or text.startswith("Video ID:"):
        return False
    if text.startswith("Required downstream processing"):
        return False
    if text.lower().endswith((" the", " a", " an", " to", " of", " and", " or", " for", " with", " into", " from")):
        return False
    if text.lower().endswith((" create", " build", " implement", " deploy", " configure", " run", " test", " migrate", " gather", " add", " update")):
        return False
    words = re.findall(r"[A-Za-z0-9']+", text)
    if len(words) < 6:
        return False
    has_action = bool(PROCEDURAL_HINTS.search(text) or COMMAND_HINTS.search(text))
    if not has_action:
        return False
    if COMMAND_HINTS.search(text):
        return True
    return bool(ACTION_START_HINTS.search(text))


def is_dispatch_ready_action(line: str) -> bool:
    text = normalize_line(line)
    if not is_actionable_procedural(text):
        return False
    if COMMAND_HINTS.search(text):
        return True
    return bool(DISPATCH_SPECIFICITY_HINTS.search(text))


def infer_lane_owner(text: str) -> Tuple[str, str]:
    for pattern, lane, owner in LANE_RULES:
        if pattern.search(text):
            return lane, owner
    return "product-intel-activation", "product-engineer"


def infer_priority(*, source_type: str, text: str, density: float, plane: str) -> str:
    score = 30
    if source_type == "video":
        score += 10
    if plane == "procedural":
        score += 15
    if plane == "governance":
        score += 10
    if density >= 0.15:
        score += 10
    elif density <= 0.01:
        score -= 5
    if CRITICAL_HINTS.search(text):
        score += 30
    elif HIGH_HINTS.search(text):
        score += 15

    if score >= 80:
        return "critical"
    if score >= 60:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def infer_implementation_target(action_text: str, source_title: str) -> Dict[str, Any]:
    combined = f"{action_text} {source_title}"
    for pattern, area, file_hints in IMPLEMENTATION_TARGET_RULES:
        if pattern.search(combined):
            return {
                "area": area,
                "file_hints": file_hints,
                "rationale": f"Matched target rule for area '{area}'",
            }
    return {
        "area": "cross-stack-intel-activation",
        "file_hints": [
            "scripts/autonomy/activate_intelligence_actions.py",
            "scripts/autonomy/ingest_ai5_and_new_may_notes.py",
        ],
        "rationale": "No strong domain match; defaulting to cross-stack activation surface.",
    }


def infer_confidence(
    *,
    plane: str,
    action_text: str,
    transcript_status: str,
    source_type: str,
) -> Dict[str, Any]:
    score = 0.35
    text = normalize_line(action_text)
    has_command = bool(COMMAND_HINTS.search(text))
    has_procedural = bool(PROCEDURAL_HINTS.search(text))
    transcript_available = transcript_status in {"cache_hit", "fetched"}

    if plane == "procedural":
        score += 0.25
    if has_command:
        score += 0.2
    if has_procedural:
        score += 0.1
    if transcript_available:
        score += 0.1
    if source_type == "video":
        score += 0.05
    if plane == "strategic" and text.lower().startswith("acquire transcript/captions"):
        score -= 0.2

    score = max(0.0, min(0.99, round(score, 2)))
    if score >= 0.8:
        label = "high"
    elif score >= 0.55:
        label = "medium"
    else:
        label = "low"
    return {"score": score, "label": label}


def task_id_for(source_id: str, artifact_id: str, plane: str, action_text: str) -> str:
    digest = hashlib.sha256(f"{source_id}|{artifact_id}|{plane}|{normalize_line(action_text)}".encode("utf-8")).hexdigest()
    return f"act-{digest[:16]}"


def resolve_v2_directives(artifact_dir: Path, source_id: str, source_uri: str) -> List[Dict[str, Any]]:
    candidates: List[Path] = [artifact_dir / f"{source_id}-v2-extracted.json"]
    if source_id.startswith("yt-ai5-"):
        video_id = source_id[len("yt-ai5-") :]
        candidates.append(artifact_dir / f"{video_id}-v2-extracted.json")
    match = re.search(r"[?&]v=([A-Za-z0-9_-]{6,})", source_uri or "")
    if match:
        candidates.append(artifact_dir / f"{match.group(1)}-v2-extracted.json")

    seen = set()
    for path in candidates:
        path_key = str(path)
        if path_key in seen:
            continue
        seen.add(path_key)
        if path.exists():
            data = read_json(path)
            directives = data.get("directives", [])
            if isinstance(directives, list):
                return [d for d in directives if isinstance(d, dict)]
    return []


def make_task(
    *,
    source_id: str,
    source_type: str,
    source_uri: str,
    source_title: str,
    artifact_id: str,
    generated_at: str,
    freshness_decay: str,
    density: float,
    transcript_status: str,
    plane: str,
    action_text: str,
) -> Dict[str, Any]:
    lane, owner = infer_lane_owner(action_text)
    priority = infer_priority(source_type=source_type, text=action_text, density=density, plane=plane)
    target = infer_implementation_target(action_text, source_title)
    confidence = infer_confidence(
        plane=plane,
        action_text=action_text,
        transcript_status=transcript_status,
        source_type=source_type,
    )
    dispatch_eligible = (
        plane == "procedural"
        and is_transcript_available(transcript_status)
        and confidence["label"] in {"medium", "high"}
        and is_dispatch_ready_action(action_text)
    )
    short = normalize_line(action_text)
    if len(short) > 110:
        short = short[:107].rstrip() + "..."
    return {
        "id": task_id_for(source_id, artifact_id, plane, action_text),
        "status": "pending",
        "priority": priority,
        "lane": lane,
        "ownerHint": owner,
        "taskType": f"{plane}_activation",
        "title": f"[AI5] {short}",
        "description": action_text,
        "acceptance": f"Execution evidence captured for: {short}",
        "confidence": confidence,
        "dispatchEligible": dispatch_eligible,
        "implementationTarget": target,
        "createdAt": now_iso(),
        "source": {
            "source_id": source_id,
            "source_type": source_type,
            "source_uri": source_uri,
            "source_title": source_title,
            "artifact_id": artifact_id,
            "artifact_generated_at": generated_at,
            "freshness_decay": freshness_decay,
            "implementation_density": density,
            "transcript_status": transcript_status or "unknown",
        },
    }


def plane_actions(taxonomy: Dict[str, Any], max_per_plane: int) -> Dict[str, List[str]]:
    procedural = dedupe_keep_order([str(x) for x in taxonomy.get("procedural", [])])[:max_per_plane]
    strategic = dedupe_keep_order([str(x) for x in taxonomy.get("strategic", [])])[:max_per_plane]
    governance = dedupe_keep_order([str(x) for x in taxonomy.get("governance", [])])[:max_per_plane]
    return {"procedural": procedural, "strategic": strategic, "governance": governance}


def activate_from_manifest(
    *,
    manifest: Dict[str, Any],
    artifact_dir: Path,
    max_per_plane: int,
    source_prefixes: Tuple[str, ...],
) -> Dict[str, Any]:
    tasks: List[Dict[str, Any]] = []
    sources_seen = 0
    artifacts_resolved = 0
    procedural_artifacts = 0
    dormant_artifacts = 0
    no_procedural_video_sources: List[str] = []
    missing_transcript_sources: List[str] = []

    for item in manifest.get("items", []):
        if not item.get("ok"):
            continue
        source_id = str(item.get("sourceId", "")).strip()
        if not source_id:
            continue
        if source_prefixes and not any(source_id.startswith(prefix) for prefix in source_prefixes):
            continue
        sources_seen += 1
        artifact_id = str(item.get("artifactId") or item.get("result", {}).get("artifact_id") or "").strip()
        if not artifact_id:
            dormant_artifacts += 1
            continue

        artifact_path = artifact_dir / f"{artifact_id}.json"
        if not artifact_path.exists():
            dormant_artifacts += 1
            continue

        artifacts_resolved += 1
        artifact = read_json(artifact_path)

        taxonomy = plane_actions(artifact.get("taxonomy", {}), max_per_plane=max_per_plane)
        metrics = artifact.get("utility_metrics", {})
        source = artifact.get("source", {})
        density = float(metrics.get("implementation_density") or 0.0)
        freshness = str(metrics.get("freshness_decay") or "Medium")
        generated_at = str(artifact.get("generated_at") or "")

        source_type = str(source.get("source_type") or item.get("sourceType") or "")
        source_uri = str(source.get("source_uri") or item.get("sourceUri") or "")
        source_title = str(source.get("source_title") or item.get("title") or source_id)
        transcript_status = str(item.get("transcriptStatus") or "").strip().lower()
        transcript_available = is_transcript_available(transcript_status)
        v2_directives = resolve_v2_directives(artifact_dir, source_id, source_uri)

        local_actions: List[Tuple[str, str, Dict[str, Any]]] = []

        # Prefer V2 directives when available.
        for d in v2_directives:
            steps = [str(s).strip() for s in d.get("steps", []) if str(s).strip()]
            if not steps:
                continue
            steps_md = "\n".join([f"- {s}" for s in steps])
            full_description = f"{d.get('title')}\n\nSteps:\n{steps_md}\n\nRationale: {d.get('rationale')}"
            impl_score = float(d.get("metrics", {}).get("implementability", 0.5))
            dispatch_ready = bool(d.get("dispatch_ready"))
            overrides = {
                "target_override": {"area": "v2-extracted", "file_hints": [d.get("target")]},
                "confidence_override": {"score": impl_score, "label": "high" if dispatch_ready else "medium"},
                "dispatch_eligible_override": dispatch_ready,
            }
            local_actions.append(("procedural", full_description, overrides))

        # Fallback to taxonomy-extracted procedural lines when V2 is absent.
        if not v2_directives:
            filtered_procedural = [line for line in taxonomy["procedural"] if is_actionable_procedural(line)] if transcript_available else []
            for line in filtered_procedural:
                local_actions.append(("procedural", line, {}))

        # Always include one governance gate reminder if present.
        for line in taxonomy["governance"][:1]:
            local_actions.append(("governance", f"Apply governance gate before adoption: {line}", {}))

        has_procedural_action = any(plane == "procedural" for plane, _, _ in local_actions)
        if has_procedural_action:
            procedural_artifacts += 1
        if not local_actions and source_type == "video":
            no_procedural_video_sources.append(source_id)
            if transcript_available:
                local_actions.append(
                    (
                        "strategic",
                        f"Transcript is already ingested for '{source_title}'. Extract concrete procedural steps and map each to an implementable code change candidate.",
                        {}
                    )
                )
            else:
                missing_transcript_sources.append(source_id)
                local_actions.append(
                    (
                        "strategic",
                        f"Acquire transcript/captions for '{source_title}' and re-run ingestion to produce procedural implementation tasks.",
                        {}
                    )
                )

        if not local_actions:
            dormant_artifacts += 1
            continue

        for plane, action_text, overrides in local_actions:
            tasks.append(
                make_task_v2(
                    source_id=source_id,
                    source_type=source_type,
                    source_uri=source_uri,
                    source_title=source_title,
                    artifact_id=artifact_id,
                    generated_at=generated_at,
                    freshness_decay=freshness,
                    density=density,
                    transcript_status=transcript_status,
                    plane=plane,
                    action_text=action_text,
                    overrides=overrides
                )
            )

    deduped: Dict[str, Dict[str, Any]] = {}
    for task in tasks:
        deduped[task["id"]] = task
    rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    merged_tasks = sorted(deduped.values(), key=lambda t: (rank.get(t["priority"], 9), t["title"]))
    dispatch_eligible_count = sum(1 for task in merged_tasks if task.get("dispatchEligible"))
    confidence_counts: Dict[str, int] = {"high": 0, "medium": 0, "low": 0}
    implementation_area_counts: Dict[str, int] = {}
    for task in merged_tasks:
        label = str(task.get("confidence", {}).get("label") or "low")
        confidence_counts[label] = confidence_counts.get(label, 0) + 1
        area = str(task.get("implementationTarget", {}).get("area") or "cross-stack-intel-activation")
        implementation_area_counts[area] = implementation_area_counts.get(area, 0) + 1

    activation_coverage = round((len(merged_tasks) / artifacts_resolved), 3) if artifacts_resolved else 0.0
    procedural_coverage = round((procedural_artifacts / artifacts_resolved), 3) if artifacts_resolved else 0.0

    return {
        "tasks": merged_tasks,
        "summary": {
            "sources_seen": sources_seen,
            "artifacts_resolved": artifacts_resolved,
            "tasks_generated": len(merged_tasks),
            "procedural_artifacts": procedural_artifacts,
            "dormant_artifacts": dormant_artifacts,
            "activation_coverage_tasks_per_artifact": activation_coverage,
            "immediate_execution_coverage": procedural_coverage,
            "no_procedural_video_count": len(no_procedural_video_sources),
            "no_procedural_video_sources": no_procedural_video_sources[:100],
            "missing_transcript_count": len(missing_transcript_sources),
            "missing_transcript_sources": missing_transcript_sources[:100],
            "transcript_present_but_nonprocedural_count": max(
                0, len(no_procedural_video_sources) - len(missing_transcript_sources)
            ),
            "dispatch_eligible_count": dispatch_eligible_count,
            "confidence_counts": confidence_counts,
            "implementation_area_counts": implementation_area_counts,
        },
    }


def compute_relevance_score(text: str, source_title: str) -> Dict[str, Any]:
    score = 0
    text_lower = text.lower()
    title_lower = source_title.lower()
    
    # 1. Codebase Surface Match (High Signal)
    if re.search(r"\b(apps/|packages/|scripts/|docs/|infra/)\b", text_lower):
        score += 40
    
    # 2. Specific TNF Component Match
    tnf_components = [
        "relay", "adk", "protocol", "contract", "forge", "llvm", "tsgo", 
        "supabase", "redis", "worker", "d1", "r2", "mcp", "orchestrat",
        "envelope", "handoff", "identity", "governance", "sgp", "twip"
    ]
    for comp in tnf_components:
        if comp in text_lower:
            score += 10
            
    # 3. Product Lane Match
    for pattern, lane, _ in LANE_RULES:
        if pattern.search(text_lower):
            score += 15
            break
            
    # 4. Action Specificity
    if DISPATCH_SPECIFICITY_HINTS.search(text_lower):
        score += 15
        
    # 5. TNF Context from Source Title
    if "tnf" in title_lower or "the new fuse" in title_lower:
        score += 10
        
    score = min(100, score)
    
    label = "low"
    if score >= 70:
        label = "high"
    elif score >= 40:
        label = "medium"
        
    return {"score": score, "label": label}


def make_task_v2(
    *,
    source_id: str,
    source_type: str,
    source_uri: str,
    source_title: str,
    artifact_id: str,
    generated_at: str,
    freshness_decay: str,
    density: float,
    transcript_status: str,
    plane: str,
    action_text: str,
    overrides: Dict[str, Any] = None,
) -> Dict[str, Any]:
    overrides = overrides or {}
    lane, owner = infer_lane_owner(action_text)
    priority = infer_priority(source_type=source_type, text=action_text, density=density, plane=plane)
    target = overrides.get("target_override") or infer_implementation_target(action_text, source_title)
    confidence = overrides.get("confidence_override") or infer_confidence(
        plane=plane,
        action_text=action_text,
        transcript_status=transcript_status,
        source_type=source_type,
    )
    
    relevance = compute_relevance_score(action_text, source_title)

    if "dispatch_eligible_override" in overrides:
        # Honor the override from V2 extraction and bypass strict relevance gate
        dispatch_eligible = bool(overrides.get("dispatch_eligible_override"))
        if dispatch_eligible and relevance["label"] == "low":
            relevance["label"] = "medium"
            relevance["score"] = max(40, relevance["score"])
    else:
        dispatch_eligible = (
            plane == "procedural"
            and is_transcript_available(transcript_status)
            and confidence["label"] in {"medium", "high"}
            and relevance["label"] in {"medium", "high"}
            and is_dispatch_ready_action(action_text)
        )

    short = normalize_line(action_text.split("\n")[0])
    if len(short) > 110:
        short = short[:107].rstrip() + "..."

    return {
        "id": task_id_for(source_id, artifact_id, plane, action_text),
        "status": "pending",
        "priority": priority,
        "lane": lane,
        "ownerHint": owner,
        "taskType": f"{plane}_activation",
        "title": f"[AI5] {short}",
        "description": action_text,
        "acceptance": f"Execution evidence captured for: {short}",
        "confidence": confidence,
        "relevance": relevance,
        "dispatchEligible": dispatch_eligible,
        "implementationTarget": target,
        "createdAt": now_iso(),
        "source": {
            "source_id": source_id,
            "source_type": source_type,
            "source_uri": source_uri,
            "source_title": source_title,
            "artifact_id": artifact_id,
            "artifact_generated_at": generated_at,
            "freshness_decay": freshness_decay,
            "implementation_density": density,
            "transcript_status": transcript_status or "unknown",
        },
    }


def merge_existing_status(new_tasks: List[Dict[str, Any]], existing_tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    existing_by_id: Dict[str, Dict[str, Any]] = {}
    for task in existing_tasks:
        task_id = str(task.get("id", "")).strip()
        if task_id:
            existing_by_id[task_id] = task

    merged: List[Dict[str, Any]] = []
    for task in new_tasks:
        previous = existing_by_id.get(task["id"])
        if previous:
            for key in ("status", "assignee", "updatedAt", "executedAt", "resolution", "notes"):
                if key in previous:
                    task[key] = previous[key]
            for key in ("queuedAt", "queueKey", "dispatchId"):
                if key in previous:
                    task[key] = previous[key]
        if str(task.get("status") or "").strip().lower() == "queued" and not bool(task.get("dispatchEligible")):
            task["status"] = "pending"
            task.pop("queuedAt", None)
            task.pop("queueKey", None)
            task.pop("dispatchId", None)
        merged.append(task)
    return merged


def main(argv: Sequence[str]) -> int:
    parser = argparse.ArgumentParser(description="Activate executable intelligence artifacts into an action queue")
    parser.add_argument("--manifest-path", default=str(DEFAULT_MANIFEST))
    parser.add_argument("--artifact-dir", default=str(DEFAULT_ARTIFACT_DIR))
    parser.add_argument("--out-path", default=str(DEFAULT_OUT_PATH))
    parser.add_argument(
        "--source-prefixes",
        default="yt-ai5-",
        help="Comma-separated source ID prefixes to include (default: yt-ai5-)",
    )
    parser.add_argument("--max-items-per-plane", type=int, default=3)
    parser.add_argument(
        "--min-dispatch-confidence",
        default="medium",
        choices=["low", "medium", "high"],
        help="Minimum confidence label for execution candidate promotion",
    )
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    manifest_path = Path(args.manifest_path).resolve()
    artifact_dir = Path(args.artifact_dir).resolve()
    out_path = Path(args.out_path).resolve()

    if not manifest_path.exists():
        raise FileNotFoundError(f"Manifest not found: {manifest_path}")
    if not artifact_dir.exists():
        raise FileNotFoundError(f"Artifact directory not found: {artifact_dir}")

    source_prefixes = tuple(
        prefix.strip() for prefix in str(args.source_prefixes or "").split(",") if prefix.strip()
    )

    manifest = read_json(manifest_path)
    activation = activate_from_manifest(
        manifest=manifest,
        artifact_dir=artifact_dir,
        max_per_plane=max(1, int(args.max_items_per_plane)),
        source_prefixes=source_prefixes,
    )

    existing_tasks: List[Dict[str, Any]] = []
    if out_path.exists():
        try:
            existing_payload = read_json(out_path)
            existing_tasks = [x for x in existing_payload.get("tasks", []) if isinstance(x, dict)]
        except Exception:
            existing_tasks = []

    merged_tasks = merge_existing_status(activation["tasks"], existing_tasks)
    min_rank = {"low": 0, "medium": 1, "high": 2}
    execution_candidates = [
        task
        for task in merged_tasks
        if task.get("dispatchEligible")
        and min_rank.get(str(task.get("confidence", {}).get("label") or "low"), 0)
        >= min_rank[args.min_dispatch_confidence]
    ]
    status_counts: Dict[str, int] = {}
    for task in merged_tasks:
        status = str(task.get("status") or "pending")
        status_counts[status] = status_counts.get(status, 0) + 1

    payload = {
        "generatedAt": now_iso(),
        "seedSource": "tnf-executable-intelligence-activation",
        "manifestPath": str(manifest_path),
        "artifactDir": str(artifact_dir),
        "sourcePrefixes": list(source_prefixes),
        "summary": {
            **activation["summary"],
            "status_counts": status_counts,
            "open_tasks": sum(count for status, count in status_counts.items() if status not in {"done", "closed", "cancelled"}),
            "execution_candidates": len(execution_candidates),
            "execution_candidate_threshold": args.min_dispatch_confidence,
        },
        "tasks": merged_tasks,
        "executionCandidates": execution_candidates,
    }

    if args.json:
        print(json.dumps(payload, indent=2))

    if args.dry_run:
        return 0

    write_json(out_path, payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

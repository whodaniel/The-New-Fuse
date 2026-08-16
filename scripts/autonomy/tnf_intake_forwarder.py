#!/usr/bin/env python3
"""
[CLASS:PRIME] [STATUS:LOCKED] [DOC_TYPE:INTAKE_FORWARDER] [DOMAIN_SCOPE:TNF_AUTONOMY]
TNF Durable Intake Forwarder & Gauntlet Gatekeeper

Bridges personal developer intakes (Apple Notes, YouTube transcripts, daily ledgers)
with the open source TNF codebase via authenticated permission gates and the
TNF Intelligence Pipeline Gauntlet.

Flow:
  Personal Dropzone (gitignored) -> Authenticated Config / Permissions ->
  Gauntlet Gates (PII Scrub, Attribution, Density, Utility) ->
  Graduated Distillation -> Permanent Open Source Knowledge Graph
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG_PATH = ROOT / "data" / "harness" / "intake-forwarder-config.json"
USER_CONFIG_PATH = Path.home() / ".tnf" / "intake-forwarder.json"
DEFAULT_PUBLIC_OUTPUT_DIR = ROOT / "docs" / "distilled-intel"
DEFAULT_ARTIFACT_DIR = ROOT / "data" / "intelligence-artifacts"

# Personal drop candidates (checked in order, gitignored / operator-local)
DEFAULT_CANDIDATE_DIRS = [
    ROOT / "docs" / "personal",
    Path.home() / ".tnf" / "personal-intelligence",
    ROOT / "concordance_results" / "user",
    ROOT / "data" / "transcripts",
]


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def sha256_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def load_config(config_path: Path) -> Dict[str, Any]:
    if USER_CONFIG_PATH.exists():
        try:
            with USER_CONFIG_PATH.open("r", encoding="utf-8") as handle:
                return json.load(handle)
        except Exception as err:
            sys.stderr.write(f"Warning: Failed to load user config {USER_CONFIG_PATH}: {err}\n")

    if config_path.exists():
        try:
            with config_path.open("r", encoding="utf-8") as handle:
                return json.load(handle)
        except Exception as err:
            sys.stderr.write(f"Warning: Failed to load default config {config_path}: {err}\n")

    # Default fallback configuration
    return {
        "version": "1.0.0",
        "operator": {
            "authenticated_role": "lead_architect",
            "access_level": "developer_privileged",
            "auto_graduate_vetted": True,
        },
        "gauntlet_rubric": {
            "min_implementation_density": 0.04,
            "required_attribution": True,
            "pii_redaction_strict": True,
            "enforce_chronological_lineage": True,
            "allowed_target_visibility": ["public", "internal_team"],
        },
        "pii_redaction_patterns": [
            r"([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)",
            r"(ghp_[a-zA-Z0-9]{36}|sk-[a-zA-Z0-9]{48}|AIzaSy[a-zA-Z0-9_-]{33})",
            r"(\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)",
        ],
        "registered_intake_sources": [
            {"name": "apple-notes-dev", "path": "docs/personal", "type": "markdown"},
            {"name": "youtube-ai6", "path": "data/transcripts", "type": "transcript"},
            {"name": "operator-local", "path": "~/.tnf/personal-intelligence", "type": "markdown"},
        ],
    }


class GauntletGatekeeper:
    """Evaluates raw intake content through the 4-Gate Vetting Procedure."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.rubric = config.get("gauntlet_rubric", {})
        self.pii_patterns = [
            re.compile(p, re.IGNORECASE) for p in config.get("pii_redaction_patterns", [])
        ]

    def redact_pii(self, content: str) -> Tuple[str, int]:
        redacted = content
        replacements = 0
        for pattern in self.pii_patterns:
            matches = list(pattern.finditer(redacted))
            replacements += len(matches)
            redacted = pattern.sub("[REDACTED_BY_GAUNTLET]", redacted)
        return redacted, replacements

    def assess_density_and_utility(self, content: str) -> Dict[str, Any]:
        lines = [l.strip() for l in content.splitlines() if l.strip()]
        total_lines = len(lines)
        if total_lines == 0:
            return {"density": 0.0, "procedural": 0, "strategic": 0, "governance": 0, "passed": False}

        procedural = sum(1 for l in lines if re.search(r"\b(run|build|test|deploy|script|fix|implement|pnpm|cargo|node)\b", l, re.I))
        strategic = sum(1 for l in lines if re.search(r"\b(architecture|vision|protocol|harness|engine|milestone|supercycle)\b", l, re.I))
        governance = sum(1 for l in lines if re.search(r"\b(attribution|gate|sovereignty|permission|pii|tenet|standard)\b", l, re.I))

        density = (procedural + strategic + governance) / total_lines
        min_density = self.rubric.get("min_implementation_density", 0.04)

        return {
            "density": round(density, 4),
            "procedural": procedural,
            "strategic": strategic,
            "governance": governance,
            "passed": density >= min_density,
        }

    def evaluate(self, source_path: Path, raw_content: str) -> Dict[str, Any]:
        # Gate 1: PII Scrubbing
        sanitized_content, redaction_count = self.redact_pii(raw_content)

        # Gate 2: Density & Utility
        metrics = self.assess_density_and_utility(sanitized_content)

        # Gate 3: Attribution check
        has_attribution = (
            "[CLASS:" in raw_content or "Source:" in raw_content or "Provenance" in raw_content or "apple-notes" in str(source_path) or "yt-" in str(source_path)
        )

        # Overall graduation approval
        passed = metrics["passed"] and (has_attribution or not self.rubric.get("required_attribution", True))

        return {
            "source_path": str(source_path),
            "redactions": redaction_count,
            "metrics": metrics,
            "has_attribution": has_attribution,
            "graduated": passed,
            "sanitized_content": sanitized_content,
        }


def run_intake_scan(
    config: Dict[str, Any],
    output_dir: Path,
    dry_run: bool = False,
) -> Dict[str, Any]:
    gatekeeper = GauntletGatekeeper(config)
    output_dir.mkdir(parents=True, exist_ok=True)
    graduated_items = []
    scanned_count = 0

    candidate_paths = []
    for cand in DEFAULT_CANDIDATE_DIRS:
        if cand.exists():
            for f in cand.glob("**/*"):
                if f.is_file() and f.suffix.lower() in [".md", ".txt", ".json"]:
                    candidate_paths.append(f)

    for file_path in candidate_paths:
        scanned_count += 1
        try:
            raw_text = file_path.read_text(encoding="utf-8")
        except Exception:
            continue

        result = gatekeeper.evaluate(file_path, raw_text)
        if result["graduated"]:
            artifact_id = f"graduated-{sha256_hash(str(file_path) + result['sanitized_content'])}"
            target_out = output_dir / f"{artifact_id}.md"

            distilled_doc = (
                f"# [CLASS:GRADUATED] [STATUS:VERIFIED] [DOC_TYPE:INTEL_DISTILLATION] [DOMAIN_SCOPE:OPEN_SOURCE]\n"
                f"# Graduated Intelligence Unit: {file_path.name}\n\n"
                f"**Attribution Hash:** `{sha256_hash(str(file_path))}`  \n"
                f"**Graduation Timestamp:** {now_iso()}  \n"
                f"**Gauntlet Metrics:** Density={result['metrics']['density']} | Procedural={result['metrics']['procedural']} | Strategic={result['metrics']['strategic']} | Governance={result['metrics']['governance']}  \n\n"
                f"---\n\n"
                f"{result['sanitized_content']}\n"
            )

            if not dry_run:
                target_out.write_text(distilled_doc, encoding="utf-8")

            graduated_items.append({
                "source": str(file_path),
                "target": str(target_out),
                "artifact_id": artifact_id,
                "metrics": result["metrics"],
            })

    return {
        "timestamp": now_iso(),
        "scanned_files": scanned_count,
        "graduated_count": len(graduated_items),
        "graduated_items": graduated_items,
        "dry_run": dry_run,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="TNF Durable Intake Forwarder & Gauntlet Gatekeeper")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG_PATH), help="Path to config file")
    parser.add_argument("--out-dir", default=str(DEFAULT_PUBLIC_OUTPUT_DIR), help="Output directory for graduated open source intel")
    parser.add_argument("--dry-run", action="store_true", help="Evaluate without writing files")
    args = parser.parse_args()

    config = load_config(Path(args.config))
    result = run_intake_scan(config, Path(args.out_dir), dry_run=args.dry_run)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())

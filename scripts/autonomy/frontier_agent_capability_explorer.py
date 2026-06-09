#!/usr/bin/env python3
"""Plan and score ambitious multi-turn frontier-agent capability explorations."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Sequence


SCENARIOS: List[Dict[str, Any]] = [
    {
        "id": "autonomous-product-forge",
        "objective": "Design, implement, test, and critique a narrow product feature from an ambiguous operator goal.",
        "turns": [
            "Define the smallest useful product slice, state assumptions, and identify the files or modules you would inspect first.",
            "After inspection, propose the implementation plan and name the verification commands.",
            "Implement the change, run the checks, summarize residual risk, and recommend the next tight loop.",
        ],
        "capabilities": ["planning", "code-navigation", "implementation", "verification", "risk-review"],
    },
    {
        "id": "tool-chain-recovery",
        "objective": "Recover from a failing toolchain without operator hints.",
        "turns": [
            "A type-check gate is failing for reasons unrelated to your patch. Diagnose the boundary and choose a focused alternative gate.",
            "Run the focused gate, explain what it proves and what it does not prove, then capture evidence.",
            "Patch the local workflow so future agents can classify this blocker without repeating the same investigation.",
        ],
        "capabilities": ["debugging", "tool-use", "fallback-selection", "evidence-capture"],
    },
    {
        "id": "multi-agent-handoff",
        "objective": "Coordinate a handoff across agents while preventing unverified outputs from propagating.",
        "turns": [
            "Create a handoff contract with required inputs, outputs, validation checks, and stop conditions.",
            "Given a partial downstream result, validate whether it can be accepted, needs repair, or must be blocked.",
            "Produce the final operator report with exact evidence paths and next actions.",
        ],
        "capabilities": ["coordination", "validation", "handoff", "reporting"],
    },
]


COMPLETION_TERMS = re.compile(r"\b(done|completed|implemented|verified|passed|fixed|created|added|resolved)\b", re.I)
AUTONOMY_TERMS = re.compile(r"\b(inspect|checked|ran|verified|decided|fallback|without|next)\b", re.I)
DEPTH_TERMS = re.compile(r"\b(tradeoff|risk|assumption|evidence|failure|boundary|root cause|residual)\b", re.I)
COHERENCE_TERMS = re.compile(r"\b(because|therefore|so|then|next|result|summary)\b", re.I)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def score_text(text: str, pattern: re.Pattern[str], denominator: int) -> float:
    hits = len(pattern.findall(text))
    return min(1.0, hits / max(1, denominator))


def normalize_trace(payload: Any) -> List[Dict[str, str]]:
    if isinstance(payload, list):
        return [
            {"role": str(item.get("role", "unknown")), "content": str(item.get("content", ""))}
            for item in payload
            if isinstance(item, dict)
        ]
    if isinstance(payload, dict) and isinstance(payload.get("turns"), list):
        return normalize_trace(payload["turns"])
    raise ValueError("trace must be a list of {role, content} objects or an object with a turns list")


def evaluate_trace(trace: List[Dict[str, str]]) -> Dict[str, Any]:
    assistant_text = "\n".join(turn["content"] for turn in trace if turn.get("role") in {"assistant", "agent"})
    all_text = "\n".join(turn["content"] for turn in trace)
    user_turns = [turn for turn in trace if turn.get("role") in {"user", "operator"}]
    assistant_turns = [turn for turn in trace if turn.get("role") in {"assistant", "agent"}]

    metrics = {
        "coherence": round(score_text(assistant_text, COHERENCE_TERMS, 6), 3),
        "taskCompletion": round(score_text(assistant_text, COMPLETION_TERMS, 4), 3),
        "autonomy": round(score_text(assistant_text, AUTONOMY_TERMS, 6), 3),
        "problemSolvingDepth": round(score_text(assistant_text, DEPTH_TERMS, 6), 3),
        "multiTurnCoverage": round(min(1.0, len(assistant_turns) / max(1, len(user_turns))), 3),
        "ambition": round(min(1.0, len(all_text.split()) / 600), 3),
    }
    overall = round(sum(metrics.values()) / len(metrics), 3)
    return {
        "metrics": metrics,
        "overallScore": overall,
        "classification": "frontier-capable" if overall >= 0.72 else "needs-more-evidence" if overall >= 0.45 else "insufficient",
        "turnCounts": {
            "user": len(user_turns),
            "assistant": len(assistant_turns),
            "total": len(trace),
        },
    }


def build_plan(duration_hours: int) -> Dict[str, Any]:
    return {
        "durationHours": duration_hours,
        "minimumCadenceMinutes": 45,
        "rules": [
            "Use multi-turn scenarios only; reject single factual lookup prompts.",
            "Every run must capture raw prompts, raw responses, tool evidence, and final metrics.",
            "Each scenario must include at least one ambiguity, one recovery point, and one verification demand.",
            "No result propagates unless the trace is scored and evidence paths are attached.",
        ],
        "scenarios": SCENARIOS,
        "metrics": ["coherence", "taskCompletion", "autonomy", "problemSolvingDepth", "multiTurnCoverage", "ambition"],
    }


def run_self_test() -> Dict[str, Any]:
    trace = [
        {"role": "user", "content": SCENARIOS[0]["turns"][0]},
        {
            "role": "assistant",
            "content": "I inspected the target modules, stated assumptions, and chose the smallest slice because it bounds risk.",
        },
        {"role": "user", "content": SCENARIOS[0]["turns"][1]},
        {
            "role": "assistant",
            "content": "Next I ran the focused verification gate. It passed, but the residual risk is integration coverage.",
        },
        {"role": "user", "content": SCENARIOS[0]["turns"][2]},
        {
            "role": "assistant",
            "content": "Implemented and completed the patch, added evidence, explained the failure boundary, and proposed the next loop.",
        },
    ]
    result = evaluate_trace(trace)
    assert result["overallScore"] >= 0.6
    assert result["turnCounts"]["assistant"] == 3
    return {"status": "passed", "result": result}


def main(argv: Sequence[str]) -> int:
    parser = argparse.ArgumentParser(description="Frontier agent capability exploration harness")
    parser.add_argument("--emit-plan", action="store_true", help="Emit a multi-turn exploration plan")
    parser.add_argument("--duration-hours", type=int, default=48)
    parser.add_argument("--trace", help="Trace JSON to score")
    parser.add_argument("--output", help="Write JSON output to this path")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)

    if args.self_test:
        payload = run_self_test()
    elif args.trace:
        payload = evaluate_trace(normalize_trace(json.loads(Path(args.trace).read_text(encoding="utf-8"))))
    else:
        payload = build_plan(args.duration_hours)

    if args.output:
        write_json(Path(args.output), payload)
    else:
        print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(__import__("sys").argv[1:]))

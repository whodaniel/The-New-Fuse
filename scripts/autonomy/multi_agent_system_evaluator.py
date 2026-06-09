#!/usr/bin/env python3
"""Deterministic evaluator for TNF multi-agent interaction traces."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


CHECKS = (
    "routing-selection",
    "subagent-understanding",
    "result-format",
    "control-handoff",
)


def normalize_key(value: str) -> str:
    return re.sub(r"[\s_\-]+", "", value).lower()


def pick(record: dict[str, Any], candidates: list[str], default: Any = None) -> Any:
    normalized = {normalize_key(str(key)): value for key, value in record.items()}
    for candidate in candidates:
        key = normalize_key(candidate)
        if key in normalized:
            return normalized[key]
    return default


def as_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return json.dumps(value, sort_keys=True)


@dataclass
class CheckResult:
    check: str
    subject: str
    passed: bool
    reason: str

    def to_json(self) -> dict[str, Any]:
        return {
            "check": self.check,
            "subject": self.subject,
            "passed": self.passed,
            "reason": self.reason,
        }


def evaluate_routing(trace: dict[str, Any]) -> list[CheckResult]:
    routing = pick(trace, ["routing", "router", "routingDecision"], {}) or {}
    if not isinstance(routing, dict):
        return [
            CheckResult("routing-selection", "router", False, "routing decision is not an object")
        ]

    selected = pick(routing, ["selectedAgentId", "selectedAgent", "agentId"])
    expected = pick(routing, ["expectedAgentId", "expectedAgent"])
    requested = pick(routing, ["requestedCapability", "intent", "taskType"])
    selected_capabilities = pick(routing, ["selectedCapabilities", "agentCapabilities"], []) or []
    expected_capabilities = pick(routing, ["expectedCapabilities", "requiredCapabilities"], []) or []

    if expected:
        passed = selected == expected
        reason = f"selected={selected!r}, expected={expected!r}"
        return [CheckResult("routing-selection", "router", passed, reason)]

    if expected_capabilities:
        selected_set = {str(item).lower() for item in selected_capabilities}
        expected_set = {str(item).lower() for item in expected_capabilities}
        overlap = sorted(selected_set.intersection(expected_set))
        passed = bool(overlap)
        reason = f"capability overlap={overlap}" if passed else "no expected capability overlap"
        return [CheckResult("routing-selection", "router", passed, reason)]

    passed = bool(selected and requested)
    reason = "selected agent and requested capability present" if passed else "missing selected agent or request"
    return [CheckResult("routing-selection", "router", passed, reason)]


def evaluate_agents(trace: dict[str, Any]) -> list[CheckResult]:
    agents = pick(trace, ["agents", "subAgents", "agentInteractions"], []) or []
    if not isinstance(agents, list):
        return [
            CheckResult("subagent-understanding", "agents", False, "agent interactions are not a list")
        ]

    results: list[CheckResult] = []
    if not agents:
        return [
            CheckResult("subagent-understanding", "agents", False, "no sub-agent interactions found")
        ]

    for index, agent in enumerate(agents):
        if not isinstance(agent, dict):
            subject = f"agent[{index}]"
            results.append(CheckResult("subagent-understanding", subject, False, "not an object"))
            continue

        subject = str(pick(agent, ["agentId", "id", "name"], f"agent[{index}]"))
        task = as_text(pick(agent, ["receivedTask", "instruction", "task", "prompt"]))
        understanding = as_text(
            pick(agent, ["understanding", "interpretedTask", "summary", "plan", "response"])
        ).lower()
        expected_keywords = pick(agent, ["expectedIntentKeywords", "expectedKeywords"], []) or []

        if expected_keywords:
            missing = [kw for kw in expected_keywords if str(kw).lower() not in understanding]
            results.append(
                CheckResult(
                    "subagent-understanding",
                    subject,
                    not missing,
                    "all expected keywords present" if not missing else f"missing keywords={missing}",
                )
            )
        else:
            results.append(
                CheckResult(
                    "subagent-understanding",
                    subject,
                    bool(task),
                    "received task is present" if task else "missing received task/instruction",
                )
            )

        result = pick(agent, ["result", "output", "generatedInformation", "response"])
        expected_keys = pick(agent, ["expectedOutputKeys", "requiredOutputKeys"], []) or []
        result_keys = set(result.keys()) if isinstance(result, dict) else set()
        if expected_keys:
            missing_keys = [key for key in expected_keys if key not in result_keys]
            passed = not missing_keys
            reason = "all expected output keys present" if passed else f"missing output keys={missing_keys}"
        else:
            passed = bool(as_text(result).strip())
            reason = "non-empty result/output present" if passed else "missing result/output"
        results.append(CheckResult("result-format", subject, passed, reason))

        terminated = bool(pick(agent, ["terminated", "completed", "stopped"], False))
        handoff_to = pick(agent, ["handoffTo", "nextAgentId", "controlHandoff"])
        passed = terminated or bool(handoff_to)
        reason = "terminated" if terminated else f"handoff={handoff_to!r}" if handoff_to else "no termination or handoff"
        results.append(CheckResult("control-handoff", subject, passed, reason))

    return results


def evaluate_trace(trace: dict[str, Any]) -> dict[str, Any]:
    checks = evaluate_routing(trace) + evaluate_agents(trace)
    passed = sum(1 for check in checks if check.passed)
    total = len(checks)
    by_check = {
        check: {
            "passed": sum(1 for item in checks if item.check == check and item.passed),
            "total": sum(1 for item in checks if item.check == check),
        }
        for check in CHECKS
    }

    return {
        "interactionId": pick(trace, ["interactionId", "traceId", "id"], "unknown"),
        "score": round(passed / total, 4) if total else 0,
        "passed": passed,
        "total": total,
        "byCheck": by_check,
        "checks": [check.to_json() for check in checks],
    }


def sample_trace() -> dict[str, Any]:
    return {
        "interactionId": "sample-multi-agent-flow",
        "routing": {
            "requestedCapability": "frontend-p0-truth",
            "selectedAgentId": "frontend-specialist",
            "expectedAgentId": "frontend-specialist",
        },
        "agents": [
            {
                "agentId": "frontend-specialist",
                "receivedTask": "Add structured page data for autonomous DOM extraction.",
                "expectedIntentKeywords": ["structured", "DOM", "extraction"],
                "summary": "Implemented structured JSON-LD and DOM extraction data.",
                "result": {"files": ["AgentTruthLayer.tsx"], "state": "verified"},
                "terminated": True,
            }
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="Path to a multi-agent trace JSON file")
    parser.add_argument("--output", type=Path, help="Optional path for the evaluation result JSON")
    parser.add_argument("--self-test", action="store_true", help="Evaluate a built-in passing trace")
    args = parser.parse_args()

    if args.self_test:
        trace = sample_trace()
    elif args.input:
        trace = json.loads(args.input.read_text())
    else:
        parser.error("provide --input or --self-test")

    if not isinstance(trace, dict):
        raise TypeError("trace root must be a JSON object")

    result = evaluate_trace(trace)
    payload = json.dumps(result, indent=2, sort_keys=True)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload + "\n")
    print(payload)

    return 0 if result["score"] == 1 else 2


if __name__ == "__main__":
    sys.exit(main())

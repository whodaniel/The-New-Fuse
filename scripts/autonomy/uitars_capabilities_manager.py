#!/usr/bin/env python3
"""UITARS-style capability registry for code and external tool interaction."""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


SAFE_TOOL_KINDS = {"read", "search", "lint", "typecheck", "test", "format", "diagnose"}
RISKY_TOOL_KINDS = {"write", "execute", "deploy", "network", "shell"}


@dataclass
class ToolCapability:
    name: str
    kind: str
    description: str
    input_schema: dict[str, Any] = field(default_factory=dict)
    output_modes: list[str] = field(default_factory=lambda: ["stdout", "json"])
    requires_approval: bool = False

    def to_json(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "kind": self.kind,
            "description": self.description,
            "inputSchema": self.input_schema,
            "outputModes": self.output_modes,
            "requiresApproval": self.requires_approval,
        }


class UITARSCapabilityManager:
    def __init__(self) -> None:
        self.tools: dict[str, ToolCapability] = {}
        self.code_languages = {"typescript", "javascript", "python", "json", "markdown", "shell"}
        self.modes = {"visual", "code", "tool", "orchestration"}

    def register_tool(self, capability: ToolCapability) -> None:
        if capability.kind in RISKY_TOOL_KINDS and not capability.requires_approval:
            raise ValueError(f"risky tool kind {capability.kind!r} must require approval")
        self.tools[capability.name] = capability

    def discover(self) -> dict[str, Any]:
        return {
            "schema": "tnf/uitars-capabilities/1.0",
            "modes": sorted(self.modes),
            "codeLanguages": sorted(self.code_languages),
            "tools": [tool.to_json() for tool in sorted(self.tools.values(), key=lambda item: item.name)],
        }

    def validate_tool_call(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        tool = self.tools.get(name)
        if not tool:
            return {"allowed": False, "reason": f"unknown tool: {name}"}

        missing = [
            key
            for key, spec in tool.input_schema.items()
            if spec.get("required") is True and key not in arguments
        ]
        if missing:
            return {"allowed": False, "reason": f"missing required arguments: {missing}"}

        return {
            "allowed": True,
            "reason": "tool call matches registered capability",
            "requiresApproval": tool.requires_approval,
            "tool": tool.to_json(),
        }

    def parse_tool_output(self, output: str) -> dict[str, Any]:
        stripped = output.strip()
        if not stripped:
            return {"mode": "empty", "data": None, "summary": "no output"}

        try:
            data = json.loads(stripped)
            return {"mode": "json", "data": data, "summary": "parsed JSON tool output"}
        except json.JSONDecodeError:
            lines = [line for line in stripped.splitlines() if line.strip()]
            return {
                "mode": "stdout",
                "data": {"lines": lines, "lineCount": len(lines)},
                "summary": f"captured {len(lines)} stdout line(s)",
            }

    def plan_transition(self, current_mode: str, requested_action: str) -> dict[str, Any]:
        action = requested_action.lower()
        if any(token in action for token in ["click", "screen", "visual", "dom"]):
            next_mode = "visual"
        elif any(token in action for token in ["edit", "code", "parse", "generate"]):
            next_mode = "code"
        elif any(token in action for token in ["tool", "test", "lint", "shell", "api"]):
            next_mode = "tool"
        else:
            next_mode = "orchestration"

        return {
            "from": current_mode,
            "to": next_mode,
            "action": requested_action,
            "seamless": current_mode in self.modes and next_mode in self.modes,
        }


def default_manager() -> UITARSCapabilityManager:
    manager = UITARSCapabilityManager()
    manager.register_tool(
        ToolCapability(
            name="code.parse",
            kind="read",
            description="Parse source code and return structural facts.",
            input_schema={"path": {"type": "string", "required": True}},
        )
    )
    manager.register_tool(
        ToolCapability(
            name="tool.run_check",
            kind="test",
            description="Run a bounded verification command and parse its output.",
            input_schema={"command": {"type": "string", "required": True}},
            output_modes=["stdout", "json", "exit_code"],
        )
    )
    manager.register_tool(
        ToolCapability(
            name="code.apply_patch",
            kind="write",
            description="Apply a reviewed source-code patch.",
            input_schema={"patch": {"type": "string", "required": True}},
            output_modes=["json"],
            requires_approval=True,
        )
    )
    return manager


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--discover", action="store_true", help="Print registered capabilities")
    parser.add_argument("--validate-call", help="Tool name to validate")
    parser.add_argument("--arguments", default="{}", help="JSON arguments for --validate-call")
    parser.add_argument("--parse-output", help="Raw tool output or @path to parse")
    parser.add_argument("--plan-transition", nargs=2, metavar=("MODE", "ACTION"))
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    manager = default_manager()
    result: dict[str, Any]

    if args.self_test:
        validation = manager.validate_tool_call("tool.run_check", {"command": "pnpm test"})
        parsed = manager.parse_tool_output('{"status":"ok"}')
        transition = manager.plan_transition("visual", "edit TypeScript code")
        result = {
            "ok": validation["allowed"] and parsed["mode"] == "json" and transition["to"] == "code",
            "validation": validation,
            "parsed": parsed,
            "transition": transition,
        }
    elif args.discover:
        result = manager.discover()
    elif args.validate_call:
        result = manager.validate_tool_call(args.validate_call, json.loads(args.arguments))
    elif args.parse_output is not None:
        output = (
            Path(args.parse_output[1:]).read_text()
            if args.parse_output.startswith("@")
            else args.parse_output
        )
        result = manager.parse_tool_output(output)
    elif args.plan_transition:
        result = manager.plan_transition(args.plan_transition[0], args.plan_transition[1])
    else:
        parser.error("choose --discover, --validate-call, --parse-output, --plan-transition, or --self-test")

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result.get("ok", True) else 2


if __name__ == "__main__":
    sys.exit(main())

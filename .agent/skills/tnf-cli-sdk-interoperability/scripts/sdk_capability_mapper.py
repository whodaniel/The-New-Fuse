#!/usr/bin/env python3
"""Generate a TNF CLI integration capability matrix for selected SDKs."""

from __future__ import annotations

import argparse
import json
from typing import Dict, List

SDK_LIBRARY: Dict[str, Dict[str, object]] = {
    "openai-agents": {
        "auth": ["api-key", "oauth"],
        "capabilities": ["tools", "streaming", "multimodal", "agent-handoffs"],
        "suggested_tnf_surfaces": ["auth", "run", "agent", "tools"],
    },
    "openai-responses": {
        "auth": ["api-key"],
        "capabilities": ["tool-calling", "reasoning", "streaming", "json-output"],
        "suggested_tnf_surfaces": ["auth", "run", "models"],
    },
    "anthropic-sdk": {
        "auth": ["api-key"],
        "capabilities": ["tool-use", "streaming", "prompt-caching"],
        "suggested_tnf_surfaces": ["auth", "run", "models"],
    },
    "google-genai": {
        "auth": ["api-key", "service-account"],
        "capabilities": ["multimodal", "tools", "streaming", "safety-controls"],
        "suggested_tnf_surfaces": ["auth", "run", "models", "config"],
    },
    "github-mcp": {
        "auth": ["oauth", "pat"],
        "capabilities": ["repo-ops", "pr-ops", "issue-ops"],
        "suggested_tnf_surfaces": ["auth", "github", "pr", "mcp"],
    },
    "mcp-sdk": {
        "auth": ["provider-defined"],
        "capabilities": ["tool-registry", "resources", "prompts", "transport"],
        "suggested_tnf_surfaces": ["mcp", "tools", "config"],
    },
}


def build_matrix(sdks: List[str], tnf_commands: List[str]) -> Dict[str, object]:
    rows = []
    for sdk in sdks:
        entry = SDK_LIBRARY.get(sdk)
        if not entry:
            rows.append(
                {
                    "sdk": sdk,
                    "known": False,
                    "auth": [],
                    "capabilities": [],
                    "suggested_tnf_surfaces": tnf_commands,
                    "notes": "Unknown SDK key; add custom mapping manually.",
                }
            )
            continue

        mapped_surfaces = sorted(set((entry.get("suggested_tnf_surfaces") or []) + tnf_commands))
        rows.append(
            {
                "sdk": sdk,
                "known": True,
                "auth": entry.get("auth", []),
                "capabilities": entry.get("capabilities", []),
                "suggested_tnf_surfaces": mapped_surfaces,
                "notes": "Use contract + acceptance checklist before implementation.",
            }
        )

    return {
        "sdks": rows,
        "summary": {
            "total_requested": len(sdks),
            "known": sum(1 for r in rows if r["known"]),
            "unknown": sum(1 for r in rows if not r["known"]),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate TNF CLI SDK interoperability capability matrix")
    parser.add_argument("--sdk", action="append", default=[], help="SDK key (repeatable)")
    parser.add_argument("--tnf-command", action="append", default=[], help="TNF command to force-include")
    parser.add_argument("--json", action="store_true", help="Print JSON output")
    parser.add_argument("--out", help="Write JSON to file")
    parser.add_argument("--list", action="store_true", help="List known SDK keys and exit")
    args = parser.parse_args()

    if args.list:
        for key in sorted(SDK_LIBRARY.keys()):
            print(key)
        return 0

    if not args.sdk:
        parser.error("at least one --sdk is required unless --list is used")

    sdks = [v.strip().lower() for v in args.sdk if v and v.strip()]
    tnf_commands = [v.strip().lower() for v in args.tnf_command if v and v.strip()]

    matrix = build_matrix(sdks, tnf_commands)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump(matrix, fh, indent=2)
            fh.write("\n")

    if args.json:
        print(json.dumps(matrix, indent=2))
    else:
        print("SDK Capability Matrix")
        for row in matrix["sdks"]:
            print(f"- {row['sdk']} (known={row['known']})")
            print(f"  auth: {', '.join(row['auth']) if row['auth'] else 'none'}")
            print(
                "  capabilities: "
                + (", ".join(row["capabilities"]) if row["capabilities"] else "none")
            )
            print(
                "  TNF surfaces: "
                + (", ".join(row["suggested_tnf_surfaces"]) if row["suggested_tnf_surfaces"] else "none")
            )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

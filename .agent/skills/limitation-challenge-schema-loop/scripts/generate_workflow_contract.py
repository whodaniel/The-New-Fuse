#!/usr/bin/env python3
"""Generate a schema-first workflow contract from a limitation and node list."""

import argparse
import json
import re
from datetime import datetime, timezone


def slugify(value):
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def derive_challenge(limitation):
    return f"Overcome: {limitation.strip()}"


def node_contract(node_name, index, total):
    node_id = slugify(node_name) or f"node-{index + 1}"
    handoff_to = None

    output_required = ["trace_id", "node_id", "status", "payload"]

    return {
        "id": node_id,
        "purpose": f"Execute the '{node_name}' step",
        "input_schema": {
            "type": "object",
            "required": ["trace_id", "payload"],
            "properties": {
                "trace_id": {"type": "string"},
                "payload": {"type": "object"},
                "context": {"type": "object"},
            },
            "additionalProperties": True,
        },
        "output_schema": {
            "type": "object",
            "required": output_required,
            "properties": {
                "trace_id": {"type": "string"},
                "node_id": {"type": "string", "const": node_id},
                "status": {"type": "string", "enum": ["ok", "partial", "blocked"]},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "payload": {
                    "type": "object",
                    "properties": {
                        "raw": {"type": "object"},
                        "normalized": {"type": "object"},
                        "signals": {"type": "array"},
                    },
                    "additionalProperties": True,
                },
                "errors": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["code", "message"],
                        "properties": {
                            "code": {"type": "string"},
                            "message": {"type": "string"},
                            "retryable": {"type": "boolean"},
                        },
                        "additionalProperties": True,
                    },
                },
                "next_action": {"type": "string"},
            },
            "additionalProperties": True,
        },
        "handoff_to": handoff_to,
    }


def build_contract(limitation, challenge, nodes):
    timestamp = datetime.now(timezone.utc).isoformat()
    parsed_nodes = [n for n in nodes if n.strip()]

    contracts = []
    for idx, name in enumerate(parsed_nodes):
        contract = node_contract(name.strip(), idx, len(parsed_nodes))
        if idx + 1 < len(parsed_nodes):
            contract["handoff_to"] = slugify(parsed_nodes[idx + 1])
        contracts.append(contract)

    return {
        "version": "1.0",
        "generated_at": timestamp,
        "principles": {
            "framing": "This is the limitation I ran up against. So, this is the challenge we will overcome!",
            "schema_directive": "Map out the specific data schemas these nodes will use to pass the parsed content back and forth.",
        },
        "problem": {
            "limitation": limitation,
            "challenge": challenge,
        },
        "workflow": {
            "nodes": contracts,
            "example_trace": {
                "trace_id": "trace-example-001",
                "node_id": slugify(parsed_nodes[0]) if parsed_nodes else "node-1",
                "status": "ok",
                "confidence": 0.92,
                "payload": {
                    "raw": {"input": "example"},
                    "normalized": {"intent": "example-intent"},
                    "signals": ["schema-aligned", "handoff-ready"],
                },
                "errors": [],
                "next_action": "continue",
            },
        },
    }


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limitation", required=True, help="Observed limitation to address")
    parser.add_argument("--challenge", help="Challenge objective. Defaults to derived value")
    parser.add_argument(
        "--nodes",
        nargs="+",
        default=["ingest", "parse", "normalize", "decide", "execute", "verify"],
        help="Ordered node names",
    )
    parser.add_argument("--out", help="Optional output path for generated JSON")
    return parser.parse_args()


def main():
    args = parse_args()
    limitation = args.limitation.strip()
    challenge = args.challenge.strip() if args.challenge else derive_challenge(limitation)

    contract = build_contract(limitation, challenge, args.nodes)
    rendered = json.dumps(contract, indent=2) + "\n"

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(rendered)
        print(f"Wrote workflow contract to {args.out}")
    else:
        print(rendered, end="")


if __name__ == "__main__":
    main()

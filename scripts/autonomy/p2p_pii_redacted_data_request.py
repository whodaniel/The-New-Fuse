#!/usr/bin/env python3
"""Peer-to-peer agent data request harness with recursive PII redaction."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import uuid
from pathlib import Path
from typing import Any, Dict, List, Sequence, Tuple


EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)
PHONE_RE = re.compile(r"\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b")
SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
CARD_RE = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
TOKEN_RE = re.compile(r"\b(?:sk|pk|ghp|gho|xox[baprs]|nvapi|cfat)[-_A-Za-z0-9]{12,}\b")
IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")

SENSITIVE_KEYS = {
    "email",
    "phone",
    "ssn",
    "socialsecurity",
    "token",
    "apikey",
    "api_key",
    "secret",
    "password",
    "authorization",
    "address",
    "dob",
    "birthdate",
    "name",
}


def normalized_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def stable_message_id(requester: str, producer: str, query: Dict[str, Any]) -> str:
    digest = hashlib.sha256(json.dumps({"requester": requester, "producer": producer, "query": query}, sort_keys=True).encode()).hexdigest()
    return f"p2p-{digest[:16]}"


def redact_text(value: str) -> Tuple[str, int]:
    count = 0
    replacements = [
        (EMAIL_RE, "[REDACTED_EMAIL]"),
        (PHONE_RE, "[REDACTED_PHONE]"),
        (SSN_RE, "[REDACTED_SSN]"),
        (CARD_RE, "[REDACTED_CARD]"),
        (TOKEN_RE, "[REDACTED_TOKEN]"),
        (IP_RE, "[REDACTED_IP]"),
    ]
    out = value
    for pattern, marker in replacements:
        out, hits = pattern.subn(marker, out)
        count += hits
    return out, count


def redact_value(value: Any, path: Sequence[str] = ()) -> Tuple[Any, int]:
    if isinstance(value, dict):
        out: Dict[str, Any] = {}
        count = 0
        for key, nested in value.items():
            key_norm = normalized_key(str(key))
            if key_norm in {normalized_key(item) for item in SENSITIVE_KEYS}:
                out[key] = "[REDACTED_FIELD]"
                count += 1
            else:
                out[key], nested_count = redact_value(nested, (*path, str(key)))
                count += nested_count
        return out, count
    if isinstance(value, list):
        redacted_items = []
        count = 0
        for index, item in enumerate(value):
            redacted, nested_count = redact_value(item, (*path, str(index)))
            redacted_items.append(redacted)
            count += nested_count
        return redacted_items, count
    if isinstance(value, str):
        return redact_text(value)
    return value, 0


def build_request(requester: str, producer: str, query: Dict[str, Any]) -> Dict[str, Any]:
    message_id = stable_message_id(requester, producer, query)
    return {
        "message_id": message_id,
        "type": "p2p.data_request",
        "from": requester,
        "to": producer,
        "query": query,
        "requires": ["pii_redaction", "message_id_correlation"],
    }


def build_response(request: Dict[str, Any], production_slice: Any) -> Dict[str, Any]:
    redacted, redaction_count = redact_value(copy.deepcopy(production_slice))
    return {
        "message_id": request["message_id"],
        "type": "p2p.data_response",
        "from": request["to"],
        "to": request["from"],
        "redaction": {
            "applied": True,
            "count": redaction_count,
            "policy": "tnf-basic-pii-v1",
        },
        "data": redacted,
    }


def verify_response(request: Dict[str, Any], response: Dict[str, Any]) -> Dict[str, Any]:
    serialized = json.dumps(response.get("data"), sort_keys=True)
    leaks = []
    for name, pattern in {
        "email": EMAIL_RE,
        "phone": PHONE_RE,
        "ssn": SSN_RE,
        "card": CARD_RE,
        "token": TOKEN_RE,
    }.items():
        if pattern.search(serialized):
            leaks.append(name)
    return {
        "messageIdMatches": request.get("message_id") == response.get("message_id"),
        "redactionApplied": bool(response.get("redaction", {}).get("applied")),
        "redactionCount": int(response.get("redaction", {}).get("count") or 0),
        "leaks": leaks,
        "passed": request.get("message_id") == response.get("message_id")
        and bool(response.get("redaction", {}).get("applied"))
        and not leaks,
    }


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def run_self_test() -> Dict[str, Any]:
    query = {"table": "customers", "where": {"status": "active"}, "limit": 2}
    production_slice = [
        {
            "id": "cust_1",
            "name": "Ada Example",
            "email": "ada@example.com",
            "notes": "Call +1 212-555-0199 from 10.0.0.5",
            "metadata": {"api_key": "sk-test1234567890abcdef"},
        },
        {
            "id": "cust_2",
            "profile": {"ssn": "123-45-6789", "status": "active"},
            "notes": "Card 4111 1111 1111 1111 should never pass.",
        },
    ]
    request = build_request("dev-agent", "production-agent", query)
    response = build_response(request, production_slice)
    verification = verify_response(request, response)
    assert verification["passed"], verification
    assert verification["redactionCount"] >= 5
    return {"status": "passed", "request": request, "verification": verification, "response": response}


def main(argv: Sequence[str]) -> int:
    parser = argparse.ArgumentParser(description="Build and verify a P2P data request with PII redaction")
    parser.add_argument("--requester", default="dev-agent")
    parser.add_argument("--producer", default="production-agent")
    parser.add_argument("--query", help="Request query JSON path")
    parser.add_argument("--production-slice", help="Production data slice JSON path")
    parser.add_argument("--output")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)

    if args.self_test:
        payload = run_self_test()
    else:
        if not args.query or not args.production_slice:
            parser.error("--query and --production-slice are required unless --self-test is used")
        query = read_json(Path(args.query))
        production_slice = read_json(Path(args.production_slice))
        request = build_request(args.requester, args.producer, query)
        response = build_response(request, production_slice)
        payload = {"request": request, "response": response, "verification": verify_response(request, response)}
    if args.output:
        write_json(Path(args.output), payload)
    else:
        print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(__import__("sys").argv[1:]))

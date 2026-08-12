#!/usr/bin/env python3
"""Hermes-TNF worker envelope drainer.

Used by subdirector-<role>-worker-cycle.sh wrappers. Picks ONE envelope per
invocation, resolves a model via model_resolver, calls it, writes a run artifact,
archives the envelope, and exits with a clean code.

Hard contracts:
  - idempotent w.r.t. artifacts: if a run artifact already exists for envelope_id,
    we skip re-processing (drained envelope is moved off the queue regardless).
  - plan tier=none => no model invocation, but envelope is still archived (it
    was operator-authored and we owe a recorded decision).
  - never silently drops envelopes; everything shows up in artifacts.

Run-artifact schema (data/protocols/subdirector-runs/<envelope_id>.json):

  {
    "schema": "tnf.subdirector.run/0.1",
    "envelope_id": "cg-001",
    "agent_id": "agent_hermes-codegen-worker_...",
    "received_at": "ISO",
    "completed_at": "ISO",
    "plan": {...full resolver plan...},
    "result": {"tier":"local|cloud|none","model":"...","ok":true|false,
                "latency_ms":N, "content":"...", "error":"..."},
    "outcome": "ok|no-backend|error|skipped-already-drained",
    "policy_signature": "local-only allow_cloud=false"
  }
"""

from __future__ import annotations

import os
import sys
import json
import time
import hashlib
import argparse
import subprocess
from pathlib import Path

# import the resolver
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import model_resolver as mr  # type: ignore

ART_DIR = Path(os.path.expanduser("~/.tnf/sub-director/run-artifacts"))
ART_DIR.mkdir(parents=True, exist_ok=True)

QUEUE_PROCESSING_FMT = "tnf:direct:sub-director:{agent_id}:processing"


def sha16(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()[:16]


def envelope_id(envelope: dict) -> str:
    try:
        return envelope["payload"]["id"]
    except Exception:
        return sha16(json.dumps(envelope))


def agent_id(envelope: dict) -> str:
    try:
        return envelope["payload"]["to"]["agentId"]
    except Exception:
        return "unknown@unknown"


def caps_from_registry(agent_id: str, port: int = 6379, host: str = "localhost") -> list[str]:
    try:
        out = subprocess.run(
            ["redis-cli", "-p", str(port), "HGET", "tnf:agent-registry", agent_id],
            capture_output=True, text=True, timeout=2,
        ).stdout
        obj = json.loads(out)
        return obj.get("capabilities", []) or []
    except Exception:
        return []


def fetch_envelope_with_retry(redis_key: str,
                              dest_branch: str,
                              timeout_s: int = 60) -> str | None:
    """Pop one envelope with BRPOPLPUSH; returns the JSON string or None."""
    t0 = time.time()
    while time.time() - t0 < timeout_s:
        out = subprocess.run(
            ["redis-cli", "-p", "6379", "BRPOPLPUSH", redis_key, dest_branch, "3"],
            capture_output=True, text=True, timeout=4,
        ).stdout
        if out:
            return out
        # small retry to allow queue to refill
        time.sleep(0.2)
    return None


def archive(branch_key: str, envelope: str) -> bool:
    p = subprocess.run(
        ["redis-cli", "-p", "6379", "LREM", branch_key, "1", envelope],
        capture_output=True, text=True, timeout=3,
    )
    return p.returncode == 0


def build_prompt(env: dict) -> tuple[str, str]:
    """Compose model prompt from envelope; returns (prompt, task_summary)."""
    try:
        inner = env["payload"]["payload"]
        task = inner.get("task", {})
        title = task.get("title", "(no title)")
        desc  = task.get("description", "")
        odc   = task.get("acceptanceCriteria", []) or []
        prompt_doc_uri = inner.get("prompt_doc_uri")
        model_hint = inner.get("model_hint")

        out = []
        out.append(f"# Task: {title}")
        if desc: out.append(desc)
        if odc:  out.append("Acceptance criteria:\n" + "\n".join(f"- {c}" for c in odc))
        if prompt_doc_uri: out.append(f"# Persona/Prompt-doc URI: {prompt_doc_uri}")
        if model_hint:      out.append(f"# Model hint (request): {model_hint}")
        if "cloud_ok" in inner:
            out.append(f"# Cloud-explicit override: cloud_ok={inner['cloud_ok']}")
        if "preferred_tier" in inner:
            out.append(f"# Preferred tier override: {inner['preferred_tier']}")
        return "\n\n".join([s for s in out if s and not s.startswith("#")]), title
    except Exception as e:
        return f"(envelope parse error: {e})", "parse-err"


def write_artifact(envelope_id_value: str, body: dict) -> Path:
    p = ART_DIR / f"{envelope_id_value}.json"
    p.write_text(json.dumps(body, indent=2, default=str))
    return p


def already_drained(envelope_id_value: str) -> bool:
    return (ART_DIR / f"{envelope_id_value}.json").exists()


def run_one(agent_id_value: str,
            capability_class: str,
            redis_key: str,
            max_dwell_s: int = 240) -> dict:
    """Pull ONE envelope; resolve model; invoke; archive; return summary."""
    processing_branch = QUEUE_PROCESSING_FMT.format(agent_id=agent_id_value)
    envelope_str = fetch_envelope_with_retry(redis_key, processing_branch, timeout_s=20)
    summary = {
        "schema": "tnf.subdirector.run/0.1",
        "agent_id": agent_id_value,
        "capability_class": capability_class,
        "completed_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "outcome": "empty",
    }
    if not envelope_str:
        summary["outcome"] = "empty"
        return summary

    try:
        envelope = json.loads(envelope_str)
    except json.JSONDecodeError as e:
        summary["outcome"] = "error"
        summary["error"] = f"envelope parse: {e}"
        write_artifact(f"parse-err-{sha16(envelope_str)[:8]}", summary)
        archive(processing_branch, envelope_str)
        return summary

    env_id = envelope_id(envelope)
    summary["envelope_id"] = env_id
    summary["received_at"] = envelope.get("payload", {}).get("timestamp") or \
        time.strftime("%Y-%m-%dT%H:%M:%S%z")

    if already_drained(env_id):
        summary["outcome"] = "skipped-already-drained"
        archive(processing_branch, envelope_str)
        return summary

    caps = caps_from_registry(agent_id_value)
    prompt, title = build_prompt(envelope)
    plan = mr.resolve(agent_id_value, task_text=title,
                      envelope=envelope, worker_capabilities=caps)
    summary["plan"] = plan
    summary["title"] = title

    result = mr.invoke(plan, prompt, timeout=min(60.0, max_dwell_s - 30))
    summary["result"] = result

    if result.get("ok"):
        summary["outcome"] = "ok"
    elif plan.get("tier") == "none":
        summary["outcome"] = "no-backend"
    else:
        summary["outcome"] = "error"

    path = write_artifact(env_id, summary)
    summary["artifact"] = str(path)

    archive(processing_branch, envelope_str)
    return summary


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--agent-id",       required=True)
    ap.add_argument("--capability",      choices=("code", "infra", "general"), required=True)
    ap.add_argument("--redis-key",       required=True)
    ap.add_argument("--max-dwell-sec",   type=int, default=240)
    args = ap.parse_args(argv)

    rc = run_one(args.agent_id, args.capability, args.redis_key, args.max_dwell_sec)
    print(json.dumps(rc, indent=2, default=str))

    if rc.get("outcome") == "ok":
        return 0
    if rc.get("outcome") in {"empty", "skipped-already-drained"}:
        return 0
    if rc.get("outcome") == "no-backend":
        return 2
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

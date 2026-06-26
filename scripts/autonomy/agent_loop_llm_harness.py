#!/usr/bin/env python3
"""Inspect-act-verify agent loop with live LLM providers only."""

from __future__ import annotations

import argparse
import json
import os
import ssl
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Callable, Dict, List, Sequence


StepFn = Callable[[Dict[str, Any]], Dict[str, Any]]


class ModelClient:
    def complete(self, messages: List[Dict[str, str]]) -> str:
        raise NotImplementedError


class OpenAICompatibleClient(ModelClient):
    def __init__(self, base_url: str, api_key: str, model: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model

    def complete(self, messages: List[Dict[str, str]]) -> str:
        body = json.dumps({"model": self.model, "messages": messages, "temperature": 0.1}).encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}/chat/completions",
            data=body,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=45, context=ssl_context()) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")[:500]
            raise RuntimeError(f"LLM request failed: HTTP {error.code}: {detail}") from error
        return str(payload["choices"][0]["message"]["content"])


def ssl_context() -> ssl.SSLContext:
    try:
        import certifi  # type: ignore

        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def resolve_default_provider() -> str:
    explicit = os.environ.get("TNF_AGENT_LOOP_PROVIDER", "").strip().lower()
    if explicit:
        return explicit
    if os.environ.get("OPENROUTER_API_KEY"):
        return "openrouter"
    if os.environ.get("NVIDIA_API_KEY"):
        return "nvidia"
    if os.environ.get("OPENAI_COMPATIBLE_API_KEY") and os.environ.get("OPENAI_COMPATIBLE_BASE_URL"):
        return "openai-compatible"
    raise RuntimeError(
        "No LLM provider configured. Set TNF_AGENT_LOOP_PROVIDER or provider credentials "
        "(OPENROUTER_API_KEY, NVIDIA_API_KEY, or OPENAI_COMPATIBLE_*)."
    )


def build_model_client(provider: str) -> ModelClient:
    normalized = provider.lower()
    if normalized in {"openai-compatible", "openrouter", "nvidia"}:
        if normalized == "openrouter":
            base_url = os.environ.get("OPENROUTER_API_BASE_URL", "https://openrouter.ai/api/v1")
            api_key = os.environ.get("OPENROUTER_API_KEY", "")
            model = os.environ.get("OPENROUTER_MODEL", "openrouter/auto")
        elif normalized == "nvidia":
            base_url = os.environ.get("NVIDIA_API_BASE_URL", "https://integrate.api.nvidia.com/v1")
            api_key = os.environ.get("NVIDIA_API_KEY", "")
            model = os.environ.get("NVIDIA_MODEL", "openai/gpt-oss-120b")
        else:
            base_url = os.environ.get("OPENAI_COMPATIBLE_BASE_URL", "")
            api_key = os.environ.get("OPENAI_COMPATIBLE_API_KEY", "")
            model = os.environ.get("OPENAI_COMPATIBLE_MODEL", "")
        if not base_url or not api_key or not model:
            raise RuntimeError(f"missing provider configuration for {provider}")
        return OpenAICompatibleClient(base_url, api_key, model)
    raise RuntimeError(f"unsupported provider: {provider}")


def inspect_step(state: Dict[str, Any]) -> Dict[str, Any]:
    task = state["task"]
    state["inspection"] = {
        "taskLength": len(task),
        "tools": ["inspect", "act", "verify"],
        "constraints": ["no unverified propagation", "capture evidence"],
    }
    return state


def act_step(state: Dict[str, Any]) -> Dict[str, Any]:
    client: ModelClient = state["modelClient"]
    messages = [
        {
            "role": "system",
            "content": "You are an agent loop planner. Return concise next actions and verification gates.",
        },
        {
            "role": "user",
            "content": state["task"],
        },
    ]
    state["modelOutput"] = client.complete(messages)
    state["actions"] = [
        "inspect state before acting",
        "execute the narrowest useful action",
        "verify output before reporting completion",
    ]
    return state


def verify_step(state: Dict[str, Any]) -> Dict[str, Any]:
    output = str(state.get("modelOutput") or "")
    state["verification"] = {
        "hasModelOutput": bool(output.strip()),
        "hasInspection": bool(state.get("inspection")),
        "hasActions": bool(state.get("actions")),
        "passed": bool(output.strip()) and bool(state.get("inspection")) and bool(state.get("actions")),
    }
    return state


def run_loop(task: str, provider: str) -> Dict[str, Any]:
    state: Dict[str, Any] = {
        "task": task,
        "provider": provider,
        "modelClient": build_model_client(provider),
        "trace": [],
    }
    for name, step in [("inspect", inspect_step), ("act", act_step), ("verify", verify_step)]:
        state = step(state)
        state["trace"].append({"step": name, "keys": sorted(key for key in state.keys() if key != "modelClient")})
    state.pop("modelClient", None)
    return state


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def run_self_test() -> Dict[str, Any]:
    provider = resolve_default_provider()
    result = run_loop("Summarize the agent loop integration contract.", provider)
    if not result["verification"]["passed"]:
        raise AssertionError(result)
    if not str(result.get("modelOutput") or "").strip():
        raise AssertionError("empty model output from live provider")
    return {
        "status": "passed",
        "provider": provider,
        "verification": result["verification"],
        "trace": result["trace"],
    }


def main(argv: Sequence[str]) -> int:
    parser = argparse.ArgumentParser(description="Run an inspect-act-verify agent loop with a live LLM provider")
    parser.add_argument("--task", default="Plan the next inspect-act-verify loop.")
    parser.add_argument("--provider", default="")
    parser.add_argument("--output")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)

    provider = args.provider.strip() or resolve_default_provider()
    payload = run_self_test() if args.self_test else run_loop(args.task, provider)
    if args.output:
        write_json(Path(args.output), payload)
    else:
        print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(__import__("sys").argv[1:]))

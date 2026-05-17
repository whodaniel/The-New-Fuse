from __future__ import annotations

import asyncio
import json
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse

CONTRACTS_PY_ROOT = (
    Path(__file__).resolve().parents[2]
    / "packages"
    / "protocol-contracts"
    / "generated"
    / "python"
)

if str(CONTRACTS_PY_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTRACTS_PY_ROOT))

from tnf_contracts.adk_execute_request import ExecuteRequest
from tnf_contracts.adk_execute_response import ExecuteResponse

APP_VERSION = "0.1.0"
DEFAULT_MODEL = os.getenv("ADK_DEFAULT_MODEL", "gemini-2.5-pro")
STUB_MODE = os.getenv("ADK_GATEWAY_STUB_MODE", "true").lower() != "false"
REQUIRED_GATEWAY_KEY = os.getenv("ADK_GATEWAY_API_KEY", "").strip()
ADK_REQUEST_TIMEOUT_MS = int(os.getenv("ADK_REQUEST_TIMEOUT_MS", "120000"))


app = FastAPI(
    title="TNF Google ADK Gateway",
    version=APP_VERSION,
    description="Adapter gateway between TNF and Google ADK runtime.",
)


def _validate_gateway_key(x_adk_gateway_key: Optional[str]) -> None:
    if REQUIRED_GATEWAY_KEY and x_adk_gateway_key != REQUIRED_GATEWAY_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing gateway API key")


def _ensure_google_credentials() -> None:
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    google_key = os.getenv("GOOGLE_API_KEY", "").strip()
    if gemini_key and not google_key:
        # Keep compatibility with environments that still use GEMINI_API_KEY.
        os.environ["GOOGLE_API_KEY"] = gemini_key
        google_key = gemini_key

    if google_key:
        return

    use_vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "").strip().lower() == "true"
    has_vertex_cfg = bool(
        os.getenv("GOOGLE_CLOUD_PROJECT", "").strip()
        and os.getenv("GOOGLE_CLOUD_LOCATION", "").strip()
    )
    if use_vertex and has_vertex_cfg:
        return

    raise HTTPException(
        status_code=503,
        detail=(
            "Google ADK runtime credentials are not configured. "
            "Set GOOGLE_API_KEY (or GEMINI_API_KEY), "
            "or configure Vertex AI with GOOGLE_GENAI_USE_VERTEXAI=true, "
            "GOOGLE_CLOUD_PROJECT, and GOOGLE_CLOUD_LOCATION."
        ),
    )


def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4) if text else 1


def _last_user_message(messages: List[Any]) -> str:
    for message in reversed(messages):
        if message.role == "user":
            return message.content
    return ""


def _stub_execute(req: ExecuteRequest) -> ExecuteResponse:
    start = time.perf_counter()
    prompt = _last_user_message(req.input.messages)
    prompt_excerpt = prompt[:500]
    content = (
        f"[google-adk stub] Received request for agent '{req.agentId}'. "
        f"Prompt excerpt: {prompt_excerpt}"
    )

    input_text = "\n".join([m.content for m in req.input.messages])
    input_tokens = _estimate_tokens(input_text)
    output_tokens = _estimate_tokens(content)

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    return ExecuteResponse(
        requestId=req.requestId or str(uuid.uuid4()),
        traceId=req.traceId or str(uuid.uuid4()),
        status="ok",
        output={"content": content, "parts": []},
        usage={
            "inputTokens": input_tokens,
            "outputTokens": output_tokens,
            "totalTokens": input_tokens + output_tokens,
        },
        toolCalls=[],
        latencyMs=elapsed_ms,
        provider="google-adk",
        model=req.model or DEFAULT_MODEL,
        metadata={
            "stubMode": True,
            "source": req.metadata.source,
            "policyProfile": req.metadata.policyProfile,
        },
    )


def _extract_system_instruction(messages: List[Any]) -> str:
    system_lines = [message.content for message in messages if message.role == "system" and message.content]
    return "\n".join(system_lines).strip()


def _build_user_prompt(messages: List[Any]) -> str:
    conversational_messages = [message for message in messages if message.role != "system"]
    if not conversational_messages:
        return ""

    if len(conversational_messages) == 1 and conversational_messages[0].role == "user":
        return conversational_messages[0].content

    lines: List[str] = []
    for message in conversational_messages:
        role_label = "Assistant" if message.role == "assistant" else "User"
        lines.append(f"{role_label}: {message.content}")
    lines.append("Assistant:")
    return "\n\n".join(lines)


def _extract_event_text(event: Any) -> str:
    content = getattr(event, "content", None)
    if not content or not getattr(content, "parts", None):
        return ""

    text_parts: List[str] = []
    for part in content.parts:
        text = getattr(part, "text", None)
        if isinstance(text, str) and text:
            text_parts.append(text)

    return "".join(text_parts).strip()


def _merge_text(previous: str, current: str) -> str:
    if not current:
        return previous
    if not previous:
        return current
    if current.startswith(previous):
        return current
    if previous.endswith(current):
        return previous
    if current in previous:
        return previous
    return previous + current


def _derive_delta(previous: str, current: str) -> str:
    if not current:
        return ""
    if not previous:
        return current
    if current == previous:
        return ""
    if current.startswith(previous):
        return current[len(previous) :]
    if current in previous:
        return ""
    return current


def _usage_from_event(event: Any, input_text: str, output_text: str) -> Dict[str, int]:
    usage_metadata = getattr(event, "usage_metadata", None)
    if usage_metadata is None:
        input_tokens = _estimate_tokens(input_text)
        output_tokens = _estimate_tokens(output_text)
        return {
            "inputTokens": input_tokens,
            "outputTokens": output_tokens,
            "totalTokens": input_tokens + output_tokens,
        }

    input_tokens = int(getattr(usage_metadata, "prompt_token_count", 0) or 0)
    output_tokens = int(getattr(usage_metadata, "candidates_token_count", 0) or 0)
    total_tokens = int(getattr(usage_metadata, "total_token_count", input_tokens + output_tokens) or 0)
    return {
        "inputTokens": max(input_tokens, 0),
        "outputTokens": max(output_tokens, 0),
        "totalTokens": max(total_tokens, 0),
    }


def _load_adk_runtime() -> Dict[str, Any]:
    try:
        from google.adk.agents import LlmAgent
        from google.adk.runners import Runner
        from google.adk.sessions import InMemorySessionService
        from google.genai import types as genai_types
    except Exception as exc:  # pragma: no cover - import failure path
        raise HTTPException(
            status_code=503,
            detail=f"Google ADK runtime is unavailable in this environment: {exc}",
        ) from exc

    return {
        "LlmAgent": LlmAgent,
        "Runner": Runner,
        "InMemorySessionService": InMemorySessionService,
        "genai_types": genai_types,
    }


async def _run_adk(req: ExecuteRequest) -> ExecuteResponse:
    _ensure_google_credentials()
    runtime = _load_adk_runtime()
    LlmAgent = runtime["LlmAgent"]
    Runner = runtime["Runner"]
    InMemorySessionService = runtime["InMemorySessionService"]
    genai_types = runtime["genai_types"]

    input_text = "\n".join([message.content for message in req.input.messages])
    system_instruction = _extract_system_instruction(req.input.messages)
    user_prompt = _build_user_prompt(req.input.messages)
    if not user_prompt:
        raise HTTPException(status_code=400, detail="Input messages must contain at least one user message.")

    session_service = InMemorySessionService()
    app_name = f"tnf-adk-{req.workspaceId}"
    user_id = req.agentId or "tnf-adk-user"
    session_id = req.requestId or str(uuid.uuid4())
    await session_service.create_session(app_name=app_name, user_id=user_id, session_id=session_id)

    agent = LlmAgent(
        name=(req.agentId or "tnf_adk_agent").replace("-", "_"),
        model=req.model or DEFAULT_MODEL,
        instruction=system_instruction,
    )
    runner = Runner(app_name=app_name, agent=agent, session_service=session_service)

    new_message = genai_types.Content(
        role="user",
        parts=[genai_types.Part.from_text(text=user_prompt)],
    )

    start = time.perf_counter()
    merged_text = ""
    final_text = ""
    final_usage = {
        "inputTokens": _estimate_tokens(input_text),
        "outputTokens": 0,
        "totalTokens": _estimate_tokens(input_text),
    }
    model_version = req.model or DEFAULT_MODEL

    async def consume_events() -> None:
        nonlocal merged_text, final_text, final_usage, model_version

        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=new_message,
        ):
            current_text = _extract_event_text(event)
            if current_text:
                merged_text = _merge_text(merged_text, current_text)
                if bool(getattr(event, "is_final_response", lambda: False)()):
                    final_text = current_text

            event_usage = _usage_from_event(event, input_text, merged_text or final_text)
            if event_usage["totalTokens"] > 0:
                final_usage = event_usage

            event_model = getattr(event, "model_version", None)
            if isinstance(event_model, str) and event_model:
                model_version = event_model

    timeout_seconds = max(1, min(req.timeoutMs, ADK_REQUEST_TIMEOUT_MS)) / 1000
    try:
        await asyncio.wait_for(consume_events(), timeout=timeout_seconds)
    except asyncio.TimeoutError as exc:
        raise HTTPException(status_code=504, detail="Google ADK execution timed out.") from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Google ADK execution failed: {exc}") from exc
    finally:
        await runner.close()

    output_text = (final_text or merged_text).strip()
    if not output_text:
        raise HTTPException(status_code=502, detail="Google ADK returned no text content.")

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    return ExecuteResponse(
        requestId=req.requestId or str(uuid.uuid4()),
        traceId=req.traceId or str(uuid.uuid4()),
        status="ok",
        output={"content": output_text, "parts": []},
        usage=final_usage,
        toolCalls=[],
        latencyMs=elapsed_ms,
        provider="google-adk",
        model=model_version,
        metadata={
            "stubMode": False,
            "source": req.metadata.source,
            "policyProfile": req.metadata.policyProfile,
        },
    )


async def _run_adk_stream(req: ExecuteRequest) -> AsyncGenerator[str, None]:
    _ensure_google_credentials()
    runtime = _load_adk_runtime()
    LlmAgent = runtime["LlmAgent"]
    Runner = runtime["Runner"]
    InMemorySessionService = runtime["InMemorySessionService"]
    genai_types = runtime["genai_types"]

    input_text = "\n".join([message.content for message in req.input.messages])
    system_instruction = _extract_system_instruction(req.input.messages)
    user_prompt = _build_user_prompt(req.input.messages)
    if not user_prompt:
        raise HTTPException(status_code=400, detail="Input messages must contain at least one user message.")

    session_service = InMemorySessionService()
    app_name = f"tnf-adk-{req.workspaceId}"
    user_id = req.agentId or "tnf-adk-user"
    session_id = req.requestId or str(uuid.uuid4())
    await session_service.create_session(app_name=app_name, user_id=user_id, session_id=session_id)

    agent = LlmAgent(
        name=(req.agentId or "tnf_adk_agent").replace("-", "_"),
        model=req.model or DEFAULT_MODEL,
        instruction=system_instruction,
    )
    runner = Runner(app_name=app_name, agent=agent, session_service=session_service)
    new_message = genai_types.Content(
        role="user",
        parts=[genai_types.Part.from_text(text=user_prompt)],
    )

    aggregated_text = ""
    final_usage = {
        "inputTokens": _estimate_tokens(input_text),
        "outputTokens": 0,
        "totalTokens": _estimate_tokens(input_text),
    }
    model_version = req.model or DEFAULT_MODEL
    stream_error: Optional[str] = None

    try:
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=new_message,
        ):
            event_text = _extract_event_text(event)
            if event_text:
                delta = _derive_delta(aggregated_text, event_text)
                aggregated_text = _merge_text(aggregated_text, event_text)
                if delta:
                    yield json.dumps(
                        {
                            "event": "chunk",
                            "requestId": req.requestId,
                            "traceId": req.traceId,
                            "content": delta,
                        }
                    ) + "\n"

            event_usage = _usage_from_event(event, input_text, aggregated_text)
            if event_usage["totalTokens"] > 0:
                final_usage = event_usage

            event_model = getattr(event, "model_version", None)
            if isinstance(event_model, str) and event_model:
                model_version = event_model
    except HTTPException as exc:
        stream_error = str(exc.detail)
    except Exception as exc:
        stream_error = f"Google ADK streaming failed: {exc}"
    finally:
        await runner.close()

    if stream_error:
        yield json.dumps(
            {
                "event": "error",
                "requestId": req.requestId,
                "traceId": req.traceId,
                "error": stream_error,
            }
        ) + "\n"

    yield json.dumps(
        {
            "event": "done",
            "requestId": req.requestId,
            "traceId": req.traceId,
            "usage": final_usage,
            "model": model_version,
            "provider": "google-adk",
            "status": "error" if stream_error else "ok",
        }
    ) + "\n"


@app.get("/v1/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "tnf-google-adk-gateway",
        "version": APP_VERSION,
        "stubMode": STUB_MODE,
    }


@app.get("/v1/capabilities")
def capabilities() -> Dict[str, Any]:
    return {
        "provider": "google-adk",
        "stubMode": STUB_MODE,
        "endpoints": ["/v1/health", "/v1/execute", "/v1/execute/stream", "/v1/capabilities"],
        "features": {
            "execute": True,
            "streaming": True,
            "toolCalling": False,
        },
        "defaultModel": DEFAULT_MODEL,
    }


@app.post("/v1/execute", response_model=ExecuteResponse)
async def execute(
    req: ExecuteRequest,
    x_adk_gateway_key: Optional[str] = Header(default=None, alias="x-adk-gateway-key"),
) -> ExecuteResponse:
    _validate_gateway_key(x_adk_gateway_key)

    if not STUB_MODE:
        return await _run_adk(req)

    return _stub_execute(req)


@app.post("/v1/execute/stream")
async def execute_stream(
    req: ExecuteRequest,
    x_adk_gateway_key: Optional[str] = Header(default=None, alias="x-adk-gateway-key"),
) -> StreamingResponse:
    _validate_gateway_key(x_adk_gateway_key)

    if not STUB_MODE:
        _ensure_google_credentials()
        _load_adk_runtime()
        return StreamingResponse(_run_adk_stream(req), media_type="application/x-ndjson")

    execute_response = _stub_execute(req)
    output_obj = execute_response.output
    text = output_obj.content if hasattr(output_obj, "content") else output_obj.get("content", "")
    chunks = [text[i : i + 120] for i in range(0, len(text), 120)] or [""]

    async def generator():
        for chunk in chunks:
            event = {
                "event": "chunk",
                "requestId": execute_response.requestId,
                "traceId": execute_response.traceId,
                "content": chunk,
            }
            yield json.dumps(event) + "\n"
            await asyncio.sleep(0)

        done = {
            "event": "done",
            "requestId": execute_response.requestId,
            "traceId": execute_response.traceId,
            "usage": execute_response.usage.model_dump()
            if hasattr(execute_response.usage, "model_dump")
            else execute_response.usage,
            "model": execute_response.model,
            "provider": execute_response.provider,
        }
        yield json.dumps(done) + "\n"

    return StreamingResponse(generator(), media_type="application/x-ndjson")

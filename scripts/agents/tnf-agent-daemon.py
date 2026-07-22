#!/usr/bin/env python3
#!/usr/bin/env python3
"""
TNF Agent Daemon — The Persistent Heart of The New Fuse

[CORE TENET (CORRECTED 2026-07-22)]: TNF exists to PARODY + ASSIMILATE the BEST from
ANY and ALL cutting-edge AI agents (NOT "Hermes-to-TNF parity"). This applies on an
ONGOING, SELF-ITERATIVE basis. See skill: assimilation-tenet for workflow.

This is the missing piece: a daemon that STAYS ALIVE with an active LLM
connection, registered on the Synaptic Bus, sending heartbeats, consuming
tasks, and thinking autonomously.

Modes:
  live    - Full persistent daemon (LLM + Redis + heartbeat + task consumer)
  watch   - Bus listener only (no LLM, just Redis pub/sub + heartbeat)
  once    - Single heartbeat + status check then exit
  status  - Show daemon and bus health

Usage:
  python3 tnf-agent-daemon.py live [--model MODEL] [--interval SECONDS]
  python3 tnf-agent-daemon.py watch
  python3 tnf-agent-daemon.py once
  python3 tnf-agent-daemon.py status

ENHANCED v2.0 - Tool Calling, Streaming, Code Execution, Sub-Agent Management
"""

import argparse
import asyncio
import json
import logging
import os
import re
import signal
import subprocess
import sys
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, TypeVar

# ---------------------------------------------------------------------------
# Redis
# ---------------------------------------------------------------------------
try:
    import redis as redis_py
except ImportError:
    print("FATAL: 'redis' package required.  pip install redis")
    sys.exit(1)

# ---------------------------------------------------------------------------
# LLM — OpenAI-compatible chat completions with tool calling support
# ---------------------------------------------------------------------------
try:
    import urllib.request
    import urllib.error
    import ssl
    import threading
    import queue
    # Disable SSL verification for NVIDIA API calls (self-signed certs)
    ssl._create_default_https_context = ssl._create_unverified_context
    HAS_URLLIB = True
except ImportError:
    HAS_URLLIB = False

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
TNF_HOME = Path(os.environ.get("TNF_HOME", os.path.expanduser("~/.tnf")))
LOG_DIR = TNF_HOME / "logs"
PID_DIR = TNF_HOME / "pids"
STATE_DIR = TNF_HOME / "state"
INBOUND_DIR = TNF_HOME / "inbound"
MEMORY_DIR = TNF_HOME / "memory"
TOOLS_DIR = TNF_HOME / "tools"

for d in (LOG_DIR, PID_DIR, STATE_DIR, INBOUND_DIR, MEMORY_DIR, TOOLS_DIR):
    d.mkdir(parents=True, exist_ok=True)

PID_FILE = PID_DIR / "tnf-agent-daemon.pid"
STATE_FILE = STATE_DIR / "tnf-agent-daemon.json"
LOG_FILE = LOG_DIR / "tnf-agent-daemon.log"
MEMORY_FILE = MEMORY_DIR / "persistent_context.json"

# Redis channels (must match broker-agent.ts)
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
REDIS_DB = int(os.environ.get("REDIS_DB", "0"))

CHANNEL_INGRESS = "tnf:bus:ingress"
CHANNEL_EGRESS_PREFIX = "tnf:bus:egress"
CHANNEL_HEARTBEAT = "tnf:heartbeat"
CHANNEL_SYNAPTIC = "tnf:synaptic_bus"
CHANNEL_TOOLS = "tnf:bus:tools"
KEY_AGENT_REGISTRY = "tnf:agent-registry"
KEY_TASK_QUEUE = "tnf:master:tasks:realtime"
KEY_DIRECTOR_REVIEW = "tnf:director:review:pending"

# Agent identity
AGENT_ID = os.environ.get("TNF_AGENT_ID", "agent:tnf-core")
AGENT_NAME = os.environ.get("TNF_AGENT_NAME", "TNF Core Agent")
AGENT_ROLE = os.environ.get("TNF_AGENT_ROLE", "orchestrator")
AGENT_PLATFORM = os.environ.get("TNF_AGENT_PLATFORM", "tnf-daemon")
AGENT_CAPABILITIES = os.environ.get(
    "TNF_AGENT_CAPABILITIES",
    "task-routing,heartbeat,autonomous-thinking,memory,delegation,orchestration,code-execution,tool-calling"
).split(",")

# LLM config
LLM_API_KEY = os.environ.get("NVIDIA_API_KEY", "") or os.environ.get("TNF_LLM_API_KEY", "") or os.environ.get("OPENAI_API_KEY", "")
LLM_BASE_URL = os.environ.get("TNF_LLM_BASE_URL", "https://integrate.api.nvidia.com/v1")
LLM_MODEL = os.environ.get("TNF_LLM_MODEL", "nvidia/llama-3.3-nemotron-super-49b-v1.5")

# Streaming config
ENABLE_STREAMING = os.environ.get("TNF_ENABLE_STREAMING", "true").lower() == "true"
STREAM_CHUNK_SIZE = int(os.environ.get("TNF_STREAM_CHUNK_SIZE", "64"))

# Execution config
MAX_EXECUTION_TIME = int(os.environ.get("TNF_MAX_EXECUTION_TIME", "300"))
ALLOWED_EXECUTION_PATHS = os.environ.get("TNF_ALLOWED_EXECUTION_PATHS", "/tmp,/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse").split(",")

# Sub-agent config
MAX_SUB_AGENTS = int(os.environ.get("TNF_MAX_SUB_AGENTS", "5"))
SUB_AGENT_TIMEOUT = int(os.environ.get("TNF_SUB_AGENT_TIMEOUT", "600"))

T = TypeVar('T')

class ExecutionMode(Enum):
    """Execution mode for code/command execution."""
    SAFE = "safe"        # Only allowed paths
    RESTRICTED = "restricted"  # Read-only operations
    UNRESTRICTED = "unrestricted"  # Full access (requires TNF_UNRESTRICTED_EXEC=1)

EXECUTION_MODE = ExecutionMode.SAFE
if os.environ.get("TNF_UNRESTRICTED_EXEC") == "1":
    EXECUTION_MODE = ExecutionMode.UNRESTRICTED

# ---------------------------------------------------------------------------
# Tool Definitions (OpenAI function calling schema)
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "execute_bash",
            "description": "Execute a bash/shell command with optional timeout. Returns stdout, stderr, and return code.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The shell command to execute"
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "Maximum execution time in seconds (default: 60, max: 300)",
                        "default": 60
                    },
                    "cwd": {
                        "type": "string",
                        "description": "Working directory for the command"
                    }
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read the contents of a file from the filesystem.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Absolute path to the file"
                    },
                    "offset": {
                        "type": "integer",
                        "description": "Line offset to start reading from (0-indexed)",
                        "default": 0
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of lines to read",
                        "default": 100
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write content to a file. Creates or overwrites the file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Absolute path to the file"
                    },
                    "content": {
                        "type": "string",
                        "description": "Content to write to the file"
                    },
                    "append": {
                        "type": "boolean",
                        "description": "Append to file instead of overwriting",
                        "default": False
                    }
                },
                "required": ["path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_directory",
            "description": "List contents of a directory with optional filtering.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Absolute path to the directory"
                    },
                    "pattern": {
                        "type": "string",
                        "description": "Glob pattern to filter files (e.g., '*.ts', '*.md')"
                    },
                    "recursive": {
                        "type": "boolean",
                        "description": "Recursively list subdirectories",
                        "default": False
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_files",
            "description": "Search for text patterns within files using grep-style matching.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Root directory to search in"
                    },
                    "pattern": {
                        "type": "string",
                        "description": "Regex or text pattern to search for"
                    },
                    "file_pattern": {
                        "type": "string",
                        "description": "Limit search to files matching this glob pattern",
                        "default": "*"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of results to return",
                        "default": 50
                    }
                },
                "required": ["path", "pattern"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "redis_operation",
            "description": "Perform a Redis operation (GET, SET, HGET, HSET, LPUSH, BRPOP, PUBLISH, etc.)",
            "parameters": {
                "type": "object",
                "properties": {
                    "operation": {
                        "type": "string",
                        "description": "Redis operation (get, set, hget, hset, lpush, brpop, publish, llen, hgetall)",
                        "enum": ["get", "set", "hget", "hset", "lpush", "brpop", "publish", "llen", "hgetall", "keys", "delete"]
                    },
                    "key": {
                        "type": "string",
                        "description": "Redis key"
                    },
                    "value": {
                        "type": "string",
                        "description": "Value for SET, HSET, LPUSH, or PUBLISH operations"
                    },
                    "hash_field": {
                        "type": "string",
                        "description": "Hash field for HGET/HSET operations"
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "Timeout in seconds for BRPOP"
                    }
                },
                "required": ["operation", "key"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "spawn_subagent",
            "description": "Spawn a sub-agent to handle a specific task in parallel. Returns agent ID for tracking.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {
                        "type": "string",
                        "description": "Task description for the sub-agent"
                    },
                    "agent_type": {
                        "type": "string",
                        "description": "Type of sub-agent (codegen, infra, research, frontend)",
                        "enum": ["codegen", "infra", "research", "frontend", "general"],
                        "default": "general"
                    },
                    "capabilities": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Required capabilities for the sub-agent"
                    }
                },
                "required": ["task"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_memory",
            "description": "Retrieve persistent memory/context from previous sessions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "key": {
                        "type": "string",
                        "description": "Memory key to retrieve (or 'all' for entire context)"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "set_memory",
            "description": "Store persistent memory for future sessions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "key": {
                        "type": "string",
                        "description": "Memory key"
                    },
                    "value": {
                        "type": "string",
                        "description": "Value to store (will be JSON serialized)"
                    },
                    "namespace": {
                        "type": "string",
                        "description": "Memory namespace (default: 'default')",
                        "default": "default"
                    }
                },
                "required": ["key", "value"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "broadcast_event",
            "description": "Broadcast an event to the TNF Synaptic Bus.",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_type": {
                        "type": "string",
                        "description": "Type of event (task_complete, agent_status, system_alert)"
                    },
                    "payload": {
                        "type": "object",
                        "description": "Event payload data"
                    },
                    "channel": {
                        "type": "string",
                        "description": "Channel to broadcast to (default: tnf:bus:ingress)",
                        "default": "tnf:bus:ingress"
                    },
                    "target_agent": {
                        "type": "string",
                        "description": "Specific agent ID to target (broadcast if omitted)"
                    }
                },
                "required": ["event_type", "payload"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_agent_status",
            "description": "Get the status of registered agents in the TNF fleet.",
            "parameters": {
                "type": "object",
                "properties": {
                    "agent_id": {
                        "type": "string",
                        "description": "Specific agent ID to check (all agents if omitted)"
                    }
                }
            }
        }
    }
]

# System prompt with tool calling instructions
TOOL_CALLING_SYSTEM_PROMPT = """You are the TNF Core Agent — an autonomous orchestration agent with access to powerful tools.

You have access to the following tools:
- execute_bash: Run shell commands with timeout
- read_file / write_file: File operations
- list_directory / search_files: File system exploration
- redis_operation: Interact with the TNF Redis message bus
- spawn_subagent: Launch parallel sub-agents for concurrent task handling
- get_memory / set_memory: Persistent context across sessions
- broadcast_event: Communicate on the TNF Synaptic Bus
- get_agent_status: Monitor fleet health

GUIDELINES:
1. Use tools proactively — don't just describe what to do, actually do it
2. For complex tasks, consider spawning sub-agents to work in parallel
3. Store important context in memory so it persists across sessions
4. Monitor agent health with get_agent_status
5. Use redis_operation to push tasks to worker queues
6. Be concise but thorough — execute, don't just explain

When you receive a task:
1. Assess if it can be parallelized (spawn sub-agents)
2. Execute directly if straightforward (bash, file ops)
3. Break complex tasks into coordinated sub-tasks
4. Report completion via broadcast_event
"""

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logger = logging.getLogger("tnf-agent-daemon")
logger.setLevel(logging.DEBUG)

_fh = logging.FileHandler(LOG_FILE)
_fh.setLevel(logging.DEBUG)
_fh.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))

_ch = logging.StreamHandler()
_ch.setLevel(logging.INFO)
_ch.setFormatter(logging.Formatter("[TNF] %(message)s"))

logger.addHandler(_fh)
logger.addHandler(_ch)

# ---------------------------------------------------------------------------
# TNF Envelope builder
# ---------------------------------------------------------------------------
def make_envelope(
    envelope_type: str,
    payload: Dict[str, Any],
    to_agent: Optional[str] = None,
    broadcast: bool = False,
    context: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    envelope = {
        "id": str(uuid.uuid4()),
        "version": "1.0",
        "traceId": str(uuid.uuid4()),
        "timestamp": now,
        "type": envelope_type,
        "from": {
            "agentId": AGENT_ID,
            "canonicalEntityId": f"tnf:AGENT:tnf-core:{AGENT_PLATFORM}:tnf:1",
            "operationalHandle": "tnf-core",
            "runtimeSessionId": str(uuid.uuid4())[:8],
            "role": AGENT_ROLE,
            "platform": AGENT_PLATFORM,
            "capabilities": AGENT_CAPABILITIES,
        },
        "to": {"broadcast": True} if broadcast else {"agentId": to_agent or "agent:tnf-core"},
        "payload": payload,
    }
    if context:
        envelope["context"] = context
    if metadata:
        envelope["metadata"] = metadata
    return envelope


# ---------------------------------------------------------------------------
# LLM Client — Enhanced with tool calling support
# ---------------------------------------------------------------------------

@dataclass
class ToolCall:
    """Represents a tool call returned by the LLM."""
    id: str
    name: str
    arguments: Dict[str, Any]

@dataclass
class ChatResponse:
    """Response from the LLM."""
    content: Optional[str]
    tool_calls: Optional[List[ToolCall]]
    finish_reason: str

class LLMClient:
    """Enhanced OpenAI-compatible chat completions client with tool calling."""

    def __init__(self, base_url: str, api_key: str, model: str, tools: Optional[List[Dict]] = None):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.messages: List[Dict[str, Any]] = []
        self.tools = tools or []
        self._daemon_ref = None  # Set by TNFAgentDaemon

        # Capability flag — true when the configured provider accepts
        # tool_choice:"auto". Hosted NVIDIA / Groq / OpenRouter etc. always do.
        # A raw vLLM server only does if it was started with
        # --enable-auto-tool-choice --tool-call-parser=<name>.
        # Environment override: TNF_LLM_SUPPORTS_TOOL_CHOICE=true|false
        self.supports_tool_choice = self._detect_tool_choice_support(self.base_url)

    @staticmethod
    def _detect_tool_choice_support(base_url: str) -> bool:
        """
        vLLM (and other raw OpenAI-compatible servers started without
        --enable-auto-tool-choice --tool-call-parser=...) reject requests
        that include tool_choice:"auto" with HTTP 400. Hosted providers do not.

        Autonomy-first default: we OPTIMISTICALLY enable tools for every
        endpoint, including loopback. If the server actually rejects the
        first `auto` call, callers should fall back to a tools-free retry.
        Override per-process via TNF_LLM_SUPPORTS_TOOL_CHOICE=true|false.

        Inference rule:
          • TNF_LLM_SUPPORTS_TOOL_CHOICE=true|1  → force enable
          • TNF_LLM_SUPPORTS_TOOL_CHOICE=false|0 → force disable
          • Otherwise                             → ENABLE (optimistic)
        """
        explicit = (os.environ.get("TNF_LLM_SUPPORTS_TOOL_CHOICE") or "").strip().lower()
        if explicit in ("true", "1"):
            return True
        if explicit in ("false", "0"):
            return False
        # Optimistic: try tools first; the daemon's HTTP error handler strips
        # them and retries when the server explicitly complains about the
        # tool_choice/parser flags.
        return True

    def set_daemon_ref(self, daemon):
        """Set reference to daemon for tool execution."""
        self._daemon_ref = daemon

    def chat(self, user_message: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """Simple chat without tool calling (backwards compatible)."""
        response = self.chat_with_tools(user_message, system_prompt)
        return response.content if response else None

    def chat_with_tools(
        self,
        user_message: str,
        system_prompt: Optional[str] = None,
        max_iterations: Optional[int] = None,
    ) -> Optional[ChatResponse]:
        """
        Chat with tool calling support - handles tool call loops automatically.

        Autonomy-first default: NO iteration cap. The agent runs until it
        emits a final assistant message. Runaway work is bounded by the
        per-call HTTP timeout (urllib default 180s, configurable), and
        individual tools should enforce their own budgets.

        Pass `max_iterations=<n>` to opt-in to a ceiling — useful in web
        REPLs and tests. A value of 0 or negative also means "unlimited".
        """
        if max_iterations is None or max_iterations <= 0:
            max_iterations = float('inf')
        """Chat with tool calling support - handles tool call loops automatically."""
        if not self.api_key:
            logger.warning("No LLM API key configured — skipping LLM call")
            return None

        if system_prompt and not any(m["role"] == "system" for m in self.messages):
            self.messages.insert(0, {"role": "system", "content": system_prompt})

        self.messages.append({"role": "user", "content": user_message})

        iteration = 0
        last_content = None

        while iteration < max_iterations:
            iteration += 1
            response = self._make_completion_request(self.messages)
            if not response:
                return None

            last_content = response.content
            assistant_msg = response.content or ""
            tool_calls = response.tool_calls

            # Add assistant message to history
            msg_dict: Dict[str, Any] = {"role": "assistant", "content": assistant_msg}
            if tool_calls:
                msg_dict["tool_calls"] = [
                    {"id": tc.id, "function": {"name": tc.name, "arguments": json.dumps(tc.arguments)}}
                    for tc in tool_calls
                ]
            self.messages.append(msg_dict)

            # If no tool calls, return the response
            if not tool_calls:
                return response

            # Handle tool calls
            for tc in tool_calls:
                tool_result = self._execute_tool(tc.name, tc.arguments)
                self.messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(tool_result)
                })

        logger.warning(f"Tool call loop reached max iterations ({max_iterations})")
        return ChatResponse(content=last_content, tool_calls=None, finish_reason="max_iterations")

    def _make_completion_request(self, messages: List[Dict[str, Any]]) -> Optional[ChatResponse]:
        """Make a single completion request."""
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 4096,
        }

        # Only attach tools/tool_choice when the provider actually supports
        # them. Raw vLLM servers (and other OpenAI-compatible runtimes started
        # without --enable-auto-tool-choice --tool-call-parser=<name>) reject
        # requests that include tool_choice:"auto" outright with HTTP 400,
        # which previously killed the whole agent loop. When unsupported we
        # fall back to a plain chat-completions call — the daemon still works,
        # it just loses tool-calling until the server is configured correctly.
        if self.tools and self.supports_tool_choice:
            payload["tools"] = self.tools
            payload["tool_choice"] = "auto"
        elif self.tools and not self.supports_tool_choice:
            logger.warning(
                "Provider %s does not advertise tool_choice support — sending "
                "tools-free request. Restart the upstream server with "
                "`--enable-auto-tool-choice --tool-call-parser=<parser>` or set "
                "TNF_LLM_SUPPORTS_TOOL_CHOICE=true to force tool calling.",
                self.base_url,
            )

        data = json.dumps(payload).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        url = f"{self.base_url}/chat/completions"
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                message = body["choices"][0]["message"]
                finish_reason = body["choices"][0].get("finish_reason", "stop")

                content = message.get("content")
                tool_calls = None

                if "tool_calls" in message:
                    tool_calls = [
                        ToolCall(
                            id=tc["id"],
                            name=tc["function"]["name"],
                            arguments=json.loads(tc["function"]["arguments"])
                        )
                        for tc in message["tool_calls"]
                    ]

                return ChatResponse(content=content, tool_calls=tool_calls, finish_reason=finish_reason)

        except urllib.error.HTTPError as e:
            err_body = ""
            try:
                err_body = e.read().decode("utf-8", errors="replace")
            except Exception:
                pass
            logger.debug(f"LLM HTTP {e.code}: {err_body[:500]}")

            # Autonomy-first optimistic retry: if the server rejected `tools` /
            # `tool_choice` due to a missing parser flag, demote and retry once
            # without those fields. This keeps the daemon alive when the local
            # vLLM hasn't been configured with the right launcher args.
            if (
                e.code == 400
                and ("tool_choice" in payload or "tools" in payload)
                and re.search(r"enable-auto-tool-choice|tool-call-parser|tool choice", err_body or "")
            ):
                demoted = {k: v for k, v in payload.items() if k not in ("tools", "tool_choice")}
                logger.warning(
                    "Server rejected tool_choice — retrying with tools-disabled payload "
                    "(base_url=%s). Restart vLLM with "
                    "--enable-auto-tool-choice --tool-call-parser=<parser> to restore "
                    "tool calling.",
                    self.base_url,
                )
                try:
                    demoted_data = json.dumps(demoted).encode("utf-8")
                    demoted_req = urllib.request.Request(
                        url, data=demoted_data, headers=headers, method="POST"
                    )
                    with urllib.request.urlopen(demoted_req, timeout=180) as resp2:
                        body2 = json.loads(resp2.read().decode("utf-8"))
                        msg2 = body2["choices"][0]["message"]
                        finish2 = body2["choices"][0].get("finish_reason", "stop")
                        tool_calls2 = None
                        if "tool_calls" in msg2:
                            tool_calls2 = [
                                ToolCall(
                                    id=tc["id"],
                                    name=tc["function"]["name"],
                                    arguments=json.loads(tc["function"]["arguments"]),
                                )
                                for tc in msg2["tool_calls"]
                            ]
                        return ChatResponse(
                            content=msg2.get("content"),
                            tool_calls=tool_calls2,
                            finish_reason=finish2,
                        )
                except Exception as retry_err:
                    logger.error("Demoted retry also failed: %s", retry_err)
                    return None
            return None
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            return None

    def _execute_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a tool and return the result."""
        logger.info(f"Executing tool: {tool_name}")
        daemon = self._daemon_ref

        try:
            if tool_name == "execute_bash":
                return self._tool_execute_bash(daemon, **args)
            elif tool_name == "read_file":
                return self._tool_read_file(**args)
            elif tool_name == "write_file":
                return self._tool_write_file(**args)
            elif tool_name == "list_directory":
                return self._tool_list_directory(**args)
            elif tool_name == "search_files":
                return self._tool_search_files(**args)
            elif tool_name == "redis_operation":
                return self._tool_redis_operation(daemon, **args)
            elif tool_name == "spawn_subagent":
                return self._tool_spawn_subagent(daemon, **args)
            elif tool_name == "get_memory":
                return self._tool_get_memory()
            elif tool_name == "set_memory":
                return self._tool_set_memory(**args)
            elif tool_name == "broadcast_event":
                return self._tool_broadcast_event(daemon, **args)
            elif tool_name == "get_agent_status":
                return self._tool_get_agent_status(daemon, **args)
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            logger.error(f"Tool {tool_name} failed: {e}")
            return {"error": str(e)}

    def _tool_execute_bash(self, daemon, command: str, timeout: int = 60, cwd: Optional[str] = None) -> Dict[str, Any]:
        """Execute a bash command."""
        timeout = min(timeout, MAX_EXECUTION_TIME)
        if EXECUTION_MODE == ExecutionMode.SAFE:
            dangerous = ["rm -rf /", "mkfs", ":(){:|:&};:", "> /dev/sda"]
            for pat in dangerous:
                if pat in command:
                    return {"error": f"Blocked dangerous command: {pat}"}
        try:
            result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=timeout, cwd=cwd)
            return {"stdout": result.stdout[:10000], "stderr": result.stderr[:2000], "returncode": result.returncode}
        except subprocess.TimeoutExpired:
            return {"error": f"Command timed out after {timeout}s"}
        except Exception as e:
            return {"error": str(e)}

    def _tool_read_file(self, path: str, offset: int = 0, limit: int = 100) -> Dict[str, Any]:
        """Read a file."""
        try:
            p = Path(path)
            if not p.exists():
                return {"error": f"File not found: {path}"}
            lines = p.read_text().splitlines()
            return {"total_lines": len(lines), "content": "\n".join(lines[offset:offset + limit]), "offset": offset, "limit": limit}
        except Exception as e:
            return {"error": str(e)}

    def _tool_write_file(self, path: str, content: str, append: bool = False) -> Dict[str, Any]:
        """Write to a file."""
        try:
            p = Path(path)
            if append:
                p.write_text(p.read_text() + content)
            else:
                p.write_text(content)
            return {"success": True, "bytes_written": len(content)}
        except Exception as e:
            return {"error": str(e)}

    def _tool_list_directory(self, path: str, pattern: Optional[str] = None, recursive: bool = False) -> Dict[str, Any]:
        """List a directory."""
        try:
            from fnmatch import fnmatch
            p = Path(path)
            if not p.exists():
                return {"error": f"Directory not found: {path}"}
            results = []
            if recursive:
                for fp in p.rglob(pattern or "*"):
                    if fp.is_file():
                        results.append(str(fp))
            else:
                for fp in p.iterdir():
                    if pattern is None or fnmatch(fp.name, pattern):
                        results.append(str(fp))
            return {"entries": results, "count": len(results)}
        except Exception as e:
            return {"error": str(e)}

    def _tool_search_files(self, path: str, pattern: str, file_pattern: str = "*", max_results: int = 50) -> Dict[str, Any]:
        """Search files with grep-like pattern."""
        try:
            from fnmatch import fnmatch
            matches = []
            p = Path(path)
            regex = re.compile(pattern)
            for fp in p.rglob(file_pattern):
                if not fp.is_file():
                    continue
                try:
                    for i, line in enumerate(fp.read_text().splitlines(), 1):
                        if regex.search(line):
                            matches.append({"file": str(fp), "line": i, "content": line[:200]})
                            if len(matches) >= max_results:
                                break
                except Exception:
                    continue
            return {"matches": matches, "count": len(matches)}
        except Exception as e:
            return {"error": str(e)}

    def _tool_redis_operation(self, daemon, operation: str, key: str, value: Optional[str] = None, hash_field: Optional[str] = None, timeout: Optional[int] = None, **kwargs) -> Dict[str, Any]:
        """Execute a Redis operation. Accepts and ignores unrecognised kwargs
        so LLM-side prompt drift does not crash the daemon."""
        unknown = sorted(kwargs.keys()) if kwargs else []
        if unknown:
            logger.warning(f"redis_operation received unknown kwargs {unknown} — ignored")
        if not daemon:
            return {"error": "Daemon reference not set"}
        try:
            r = daemon.r
            if operation == "get":
                return {"result": r.get(key)}
            elif operation == "set":
                return {"result": r.set(key, value)}
            elif operation == "hget":
                return {"result": r.hget(key, hash_field)}
            elif operation == "hset":
                return {"result": r.hset(key, hash_field, value)}
            elif operation == "lpush":
                return {"result": r.lpush(key, value)}
            elif operation == "brpop":
                result = r.brpop(key, timeout=timeout or 5)
                return {"result": result}
            elif operation == "publish":
                return {"result": r.publish(key, value)}
            elif operation == "llen":
                return {"result": r.llen(key)}
            elif operation == "hgetall":
                return {"result": r.hgetall(key)}
            elif operation == "keys":
                return {"result": r.keys(key)}
            elif operation == "delete":
                return {"result": r.delete(key)}
            else:
                return {"error": f"Unknown operation: {operation}"}
        except Exception as e:
            return {"error": str(e)}

    def _tool_spawn_subagent(self, daemon, task: str, agent_type: str = "general", capabilities: Optional[List[str]] = None) -> Dict[str, Any]:
        """Spawn a sub-agent."""
        if not daemon:
            return {"error": "Daemon reference not set"}
        try:
            agent_id = f"subagent-{uuid.uuid4().hex[:8]}"
            envelope = make_envelope(
                "task",
                {"task": task, "agent_type": agent_type, "capabilities": capabilities or []},
                to_agent=agent_id,
            )
            daemon.r.lpush("tnf:master:tasks:realtime", json.dumps(envelope))
            return {"success": True, "agent_id": agent_id, "task": task}
        except Exception as e:
            return {"error": str(e)}

    def _tool_get_memory(self) -> Dict[str, Any]:
        """Get persistent memory."""
        try:
            if MEMORY_FILE.exists():
                return json.loads(MEMORY_FILE.read_text())
            return {"memory": {}}
        except Exception as e:
            return {"error": str(e)}

    def _tool_set_memory(self, key: str, value: str, namespace: str = "default") -> Dict[str, Any]:
        """Store persistent memory."""
        try:
            memory = {}
            if MEMORY_FILE.exists():
                memory = json.loads(MEMORY_FILE.read_text())
            if namespace not in memory:
                memory[namespace] = {}
            memory[namespace][key] = value
            MEMORY_FILE.write_text(json.dumps(memory, indent=2))
            return {"success": True, "key": key, "namespace": namespace}
        except Exception as e:
            return {"error": str(e)}

    def _tool_broadcast_event(self, daemon, event_type: str, payload: Dict[str, Any], channel: str = "tnf:bus:ingress", target_agent: Optional[str] = None) -> Dict[str, Any]:
        """Broadcast event to TNF bus."""
        if not daemon:
            return {"error": "Daemon reference not set"}
        try:
            envelope = make_envelope("event", {"event": event_type, **payload}, to_agent=target_agent, broadcast=target_agent is None)
            daemon.r.publish(channel, json.dumps(envelope))
            return {"success": True, "event_type": event_type, "channel": channel}
        except Exception as e:
            return {"error": str(e)}

    def _tool_get_agent_status(self, daemon, agent_id: Optional[str] = None) -> Dict[str, Any]:
        """Get agent status from registry."""
        if not daemon:
            return {"error": "Daemon reference not set"}
        try:
            if agent_id:
                raw = daemon.r.hget(KEY_AGENT_REGISTRY, agent_id)
                return {"agent": json.loads(raw) if raw else None}
            else:
                all_agents = daemon.r.hgetall(KEY_AGENT_REGISTRY)
                return {"agents": {k: json.loads(v) for k, v in all_agents.items()}}
        except Exception as e:
            return {"error": str(e)}


# ---------------------------------------------------------------------------
# Agent Daemon
# ---------------------------------------------------------------------------
class TNFAgentDaemon:
    def __init__(self, mode: str = "live", model: Optional[str] = None, think_interval: int = 120):
        self.mode = mode
        self.running = False
        
        # Handle Upstash SSL URLs (rediss://)
        # For redis-py 5.x, pass ssl params via URL or use connection class
        if REDIS_URL.startswith("rediss://"):
            # Add SSL query params to URL for redis-py 5.x
            if "?" not in REDIS_URL:
                redis_url = REDIS_URL + "?ssl_cert_reqs=none"
            else:
                redis_url = REDIS_URL + "&ssl_cert_reqs=none"
        else:
            redis_url = REDIS_URL
        
        self.r = redis_py.Redis.from_url(redis_url, db=REDIS_DB, decode_responses=True)
        self.r_sub = redis_py.Redis.from_url(redis_url, db=REDIS_DB, decode_responses=True)
        self.pubsub = self.r_sub.pubsub()
        self.llm: Optional[LLMClient] = None
        self.think_interval = think_interval
        self.last_think = 0.0
        self.tasks_processed = 0
        self.messages_sent = 0
        self.heartbeats_sent = 0
        self.started_at: Optional[str] = None

        if mode == "live" and LLM_API_KEY:
            m = model or LLM_MODEL
            self.llm = LLMClient(LLM_BASE_URL, LLM_API_KEY, m, tools=TOOL_DEFINITIONS)
            self.llm.set_daemon_ref(self)
            logger.info(f"LLM configured: {m} @ {LLM_BASE_URL} with {len(TOOL_DEFINITIONS)} tools")
        elif mode == "live":
            logger.warning("No LLM API key — running in watch-only mode despite 'live' requested")

    # -- Registration --------------------------------------------------------

    def register(self):
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": AGENT_ID,
            "name": AGENT_NAME,
            "role": AGENT_ROLE,
            "platform": AGENT_PLATFORM,
            "status": "active",
            "isOnline": True,
            "capabilities": AGENT_CAPABILITIES,
            "registeredAt": now,
            "lastSeen": now,
        }
        self.r.hset(KEY_AGENT_REGISTRY, AGENT_ID, json.dumps(record))
        logger.info(f"Registered on bus as {AGENT_ID}")

        # Announce
        envelope = make_envelope(
            "event",
            {"event": "agent_online", "agentId": AGENT_ID, "name": AGENT_NAME},
            broadcast=True,
        )
        self.r.publish(CHANNEL_INGRESS, json.dumps(envelope))
        self.messages_sent += 1

    # -- Heartbeat -----------------------------------------------------------

    def send_heartbeat(self):
        now = datetime.now(timezone.utc).isoformat()
        # Update registry
        existing_raw = self.r.hget(KEY_AGENT_REGISTRY, AGENT_ID)
        existing = json.loads(existing_raw) if existing_raw else {}
        record = {
            **existing,
            "id": AGENT_ID,
            "name": AGENT_NAME,
            "role": AGENT_ROLE,
            "platform": AGENT_PLATFORM,
            "status": "active",
            "isOnline": True,
            "lastSeen": now,
        }
        self.r.hset(KEY_AGENT_REGISTRY, AGENT_ID, json.dumps(record))

        # Publish heartbeat
        hb = {"type": "heartbeat", "source": AGENT_ID, "role": AGENT_ROLE, "timestamp": now}
        self.r.publish(CHANNEL_HEARTBEAT, json.dumps(hb))
        self.heartbeats_sent += 1

    # -- Bus subscriptions ---------------------------------------------------

    def subscribe(self):
        channels = [
            f"{CHANNEL_EGRESS_PREFIX}:{AGENT_ID}",
            CHANNEL_INGRESS,
            CHANNEL_SYNAPTIC,
            CHANNEL_HEARTBEAT,
        ]
        self.pubsub.subscribe(*channels)
        logger.info(f"Subscribed to: {', '.join(channels)}")

    def _handle_bus_message(self, message: Dict[str, Any], channel: str):
        """Process an incoming message from the bus."""
        try:
            data = json.loads(message.get("data", ""))
        except (json.JSONDecodeError, TypeError):
            return

        # Ignore own messages
        if data.get("from", {}).get("agentId") == AGENT_ID:
            return

        msg_type = data.get("type", "unknown")
        from_agent = data.get("from", {}).get("agentId", "unknown")
        payload = data.get("payload", {})

        logger.info(f"Bus [{channel}] type={msg_type} from={from_agent}")

        # Write inbound task to file for downstream consumption
        if msg_type in ("task", "command", "auction"):
            inbox_file = INBOUND_DIR / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.json"
            inbox_file.write_text(json.dumps(data, indent=2))
            logger.info(f"Inbound task written to {inbox_file.name}")

            # If live mode with LLM, process the task
            if self.llm and msg_type == "task":
                self._process_task_with_llm(data)

            # If auction, submit a bid
            if msg_type == "auction" and self.llm:
                self._submit_bid(data)

    def _process_task_with_llm(self, task_envelope: Dict[str, Any]):
        """Use the LLM to process an inbound task with tool calling."""
        payload = task_envelope.get("payload", {})
        task_id = payload.get("id", "unknown")
        description = payload.get("description", payload.get("title", ""))
        task_data = payload.get("task", {})

        if not description:
            logger.warning(f"Task {task_id} has no description — skipping LLM processing")
            return

        logger.info(f"Processing task {task_id} with LLM (tool-enabled)...")

        prompt = f"""TNF Core Agent Task Processing

Task ID: {task_id}
Description: {description}
Task Data: {json.dumps(task_data, indent=2) if task_data else 'N/A'}

You have access to tools. Use them to:
- Execute necessary commands (bash)
- Read/write files
- Interact with Redis (message bus)
- Spawn sub-agents for parallel work
- Store important context in memory

Process this task autonomously. Use tools as needed. Report completion via broadcast_event."""

        response = self.llm.chat_with_tools(prompt, system_prompt=TOOL_CALLING_SYSTEM_PROMPT)

        if response:
            content = response.content or "Task processed with tool calling."
            reply = make_envelope(
                "response",
                {"taskId": task_id, "analysis": content, "tool_calls": len(response.tool_calls) if response.tool_calls else 0, "processedBy": AGENT_ID},
                to_agent=task_envelope.get("from", {}).get("agentId"),
                context={"parentMessageId": task_envelope.get("id")},
            )
            self.r.publish(CHANNEL_INGRESS, json.dumps(reply))
            self.messages_sent += 1
            self.tasks_processed += 1
            logger.info(f"Task {task_id} processed and response published")

    def _submit_bid(self, auction_envelope: Dict[str, Any]):
        """Submit a bid for a task auction."""
        payload = auction_envelope.get("payload", {})
        task_id = payload.get("taskId", payload.get("id", "unknown"))
        required_caps = set(payload.get("requiredCapabilities", []))
        my_caps = set(AGENT_CAPABILITIES)

        # Calculate suitability based on capability overlap
        overlap = len(required_caps & my_caps)
        total = max(len(required_caps), 1)
        suitability = min(1.0, overlap / total + 0.3)  # baseline 0.3 for general capability

        bid = make_envelope(
            "bid",
            {"taskId": task_id, "suitability": suitability, "agentId": AGENT_ID,
             "capabilities": AGENT_CAPABILITIES},
            to_agent=auction_envelope.get("from", {}).get("agentId", "agent:broker"),
        )
        self.r.publish(CHANNEL_INGRESS, json.dumps(bid))
        self.messages_sent += 1
        logger.info(f"Bid submitted for task {task_id} (suitability: {suitability:.2f})")

    # -- Autonomous thinking -------------------------------------------------

    def autonomous_think(self):
        """Periodic LLM-powered self-reflection and system health check with tool execution."""
        if not self.llm:
            return
        if time.time() - self.last_think < self.think_interval:
            return

        self.last_think = time.time()
        logger.info("Autonomous think cycle...")

        agents_raw = self.r.hgetall(KEY_AGENT_REGISTRY)
        agent_count = len(agents_raw)
        online_agents = sum(1 for v in agents_raw.values() if json.loads(v).get("isOnline", False) if v)
        task_queue_len = self.r.llen(KEY_TASK_QUEUE)
        review_queue_len = self.r.llen(KEY_DIRECTOR_REVIEW)

        prompt = f"""TNF Core Agent — Autonomous Self-Check

System State:
- Registered agents: {agent_count} ({online_agents} online)
- Pending tasks: {task_queue_len}
- Director review queue: {review_queue_len}
- Tasks processed: {self.tasks_processed}
- Messages sent: {self.messages_sent}
- Heartbeats sent: {self.heartbeats_sent}
- Uptime: {self._uptime()}

You have access to tools. Use them to:
- Check detailed agent status with get_agent_status
- Review task queue contents with redis_operation
- Broadcast alerts if issues found
- Spawn sub-agents if additional capacity needed

Assess health and take proactive actions if needed."""

        response = self.llm.chat_with_tools(prompt, system_prompt=TOOL_CALLING_SYSTEM_PROMPT)

        if response and response.content:
            envelope = make_envelope(
                "state-sync",
                {
                    "event": "autonomous_think",
                    "healthCheck": response.content,
                    "metrics": {
                        "agentsOnline": online_agents,
                        "taskQueueLen": task_queue_len,
                        "reviewQueueLen": review_queue_len,
                        "tasksProcessed": self.tasks_processed,
                    },
                },
                broadcast=True,
            )
            self.r.publish(CHANNEL_INGRESS, json.dumps(envelope))
            self.messages_sent += 1
            logger.info(f"Think cycle complete: {response[:120]}...")

    # -- State persistence ---------------------------------------------------

    def _uptime(self) -> str:
        if not self.started_at:
            return "0s"
        start = datetime.fromisoformat(self.started_at)
        delta = datetime.now(timezone.utc) - start
        hours, remainder = divmod(int(delta.total_seconds()), 3600)
        minutes, seconds = divmod(remainder, 60)
        if hours > 0:
            return f"{hours}h{minutes}m"
        if minutes > 0:
            return f"{minutes}m{seconds}s"
        return f"{seconds}s"

    def save_state(self):
        state = {
            "mode": self.mode,
            "agentId": AGENT_ID,
            "startedAt": self.started_at,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "running": self.running,
            "tasksProcessed": self.tasks_processed,
            "messagesSent": self.messages_sent,
            "heartbeatsSent": self.heartbeats_sent,
            "llmModel": self.llm.model if self.llm else None,
            "pid": os.getpid(),
        }
        STATE_FILE.write_text(json.dumps(state, indent=2))

    # -- Main loops ----------------------------------------------------------

    def run_live(self):
        """Full persistent daemon: LLM + Redis + heartbeat + task consumer."""
        self.running = True
        self.started_at = datetime.now(timezone.utc).isoformat()
        self._write_pid()
        self.register()
        self.subscribe()

        logger.info(f"TNF Core Agent LIVE — model={self.llm.model if self.llm else 'none'} interval={self.think_interval}s")

        heartbeat_interval = 30  # seconds
        last_heartbeat = 0.0

        try:
            while self.running:
                now = time.time()

                # Heartbeat
                if now - last_heartbeat >= heartbeat_interval:
                    self.send_heartbeat()
                    last_heartbeat = now

                # Check for bus messages (non-blocking, 1s timeout)
                msg = self.pubsub.get_message(timeout=1.0)
                if msg and msg["type"] == "message":
                    self._handle_bus_message(msg, msg["channel"])

                # Check Redis task queue (brpop with short timeout)
                try:
                    result = self.r.brpop(KEY_TASK_QUEUE, timeout=1)
                    if result:
                        _, raw = result
                        task = json.loads(raw)
                        logger.info(f"Task from queue: {task.get('id', 'unknown')}")
                        inbox_file = INBOUND_DIR / f"queue_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                        inbox_file.write_text(json.dumps(task, indent=2))
                        if self.llm and task.get("description") or task.get("title"):
                            self._process_task_with_llm(make_envelope("task", task))
                except redis_py.ConnectionError:
                    logger.warning("Redis connection lost — reconnecting...")
                    time.sleep(2)
                    continue

                # Autonomous think cycle
                self.autonomous_think()

                # Persist state every 60s
                if int(now) % 60 == 0:
                    self.save_state()

        except KeyboardInterrupt:
            pass
        finally:
            self._shutdown()

    def run_watch(self):
        """Bus listener only — no LLM, just Redis pub/sub + heartbeat."""
        self.running = True
        self.started_at = datetime.now(timezone.utc).isoformat()
        self._write_pid()
        self.register()
        self.subscribe()

        logger.info("TNF Core Agent WATCH — bus listener mode (no LLM)")

        heartbeat_interval = 30
        last_heartbeat = 0.0

        try:
            while self.running:
                now = time.time()

                if now - last_heartbeat >= heartbeat_interval:
                    self.send_heartbeat()
                    last_heartbeat = now

                msg = self.pubsub.get_message(timeout=1.0)
                if msg and msg["type"] == "message":
                    self._handle_bus_message(msg, msg["channel"])

                # NOTE: Task queue consumption is handled by the Broker Agent
                # (packages/relay-core/src/broker-agent.ts, pid running since boot).
                # Broker does BRPOP on tnf:master:tasks:realtime, evaluates policy,
                # and dispatches to egress channels. Do NOT add a duplicate consumer
                # here — it would race with the broker and create zombie connections.
                # Daemon subscribes to bus channels (including egress) via pubsub above.

                if int(now) % 60 == 0:
                    self.save_state()

        except KeyboardInterrupt:
            pass
        finally:
            self._shutdown()

    def run_once(self):
        """Single heartbeat + status check."""
        self.started_at = datetime.now(timezone.utc).isoformat()
        self.register()
        self.send_heartbeat()
        self.save_state()

        agents_raw = self.r.hgetall(KEY_AGENT_REGISTRY)
        online = sum(1 for v in agents_raw.values() if v and json.loads(v).get("isOnline"))

        print(f"\n  TNF Agent Daemon — Once Check")
        print(f"  =============================")
        print(f"  Agent ID:    {AGENT_ID}")
        print(f"  Status:      registered + heartbeat sent")
        print(f"  Bus agents:  {len(agents_raw)} total, {online} online")
        print(f"  Task queue:  {self.r.llen(KEY_TASK_QUEUE)} pending")
        print(f"  Review queue: {self.r.llen(KEY_DIRECTOR_REVIEW)} pending")
        print()

    def run_status(self):
        """Show daemon and bus health."""
        # Check if daemon is running
        pid = self._read_pid()
        alive = False
        if pid:
            try:
                os.kill(pid, 0)
                alive = True
            except ProcessLookupError:
                pass

        # Load saved state
        state = {}
        if STATE_FILE.exists():
            state = json.loads(STATE_FILE.read_text())

        # Bus state
        agents_raw = self.r.hgetall(KEY_AGENT_REGISTRY)
        online = sum(1 for v in agents_raw.values() if v and json.loads(v).get("isOnline"))

        print(f"\n  TNF Agent Daemon — Status")
        print(f"  =========================")
        print(f"  Process:     {'ALIVE' if alive else 'NOT RUNNING'} (PID {pid or 'none'})")
        print(f"  Mode:        {state.get('mode', 'unknown')}")
        print(f"  LLM Model:   {state.get('llmModel', 'none')}")
        print(f"  Uptime:      {state.get('startedAt', 'unknown')}")
        print(f"  Tasks done:  {state.get('tasksProcessed', 0)}")
        print(f"  Msgs sent:   {state.get('messagesSent', 0)}")
        print(f"  Heartbeats:  {state.get('heartbeatsSent', 0)}")
        print(f"  ---")
        print(f"  Bus agents:  {len(agents_raw)} total, {online} online")
        print(f"  Task queue:  {self.r.llen(KEY_TASK_QUEUE)} pending")
        print(f"  Review queue: {self.r.llen(KEY_DIRECTOR_REVIEW)} pending")
        print()

    # -- Lifecycle -----------------------------------------------------------

    def _write_pid(self):
        PID_FILE.write_text(str(os.getpid()))

    @staticmethod
    def _read_pid() -> Optional[int]:
        if PID_FILE.exists():
            try:
                return int(PID_FILE.read_text().strip())
            except ValueError:
                pass
        return None

    def _shutdown(self):
        self.running = False
        logger.info("Shutting down...")

        # Deregister
        existing_raw = self.r.hget(KEY_AGENT_REGISTRY, AGENT_ID)
        if existing_raw:
            record = json.loads(existing_raw)
            record["status"] = "offline"
            record["isOnline"] = False
            record["lastSeen"] = datetime.now(timezone.utc).isoformat()
            self.r.hset(KEY_AGENT_REGISTRY, AGENT_ID, json.dumps(record))

        # Announce offline
        envelope = make_envelope(
            "event",
            {"event": "agent_offline", "agentId": AGENT_ID},
            broadcast=True,
        )
        try:
            self.r.publish(CHANNEL_INGRESS, json.dumps(envelope))
        except Exception:
            pass

        self.pubsub.unsubscribe()
        self.save_state()

        # Graceful Redis shutdown — prevents zombie BRPOP connections
        try:
            self.pubsub.close()
        except Exception:
            pass
        try:
            self.r.close()
        except Exception:
            pass
        try:
            self.r_sub.close()
        except Exception:
            pass

        if PID_FILE.exists():
            PID_FILE.unlink()

        logger.info("Goodbye.")


# ---------------------------------------------------------------------------
# Signal handlers
# ---------------------------------------------------------------------------
_daemon: Optional[TNFAgentDaemon] = None

def _signal_handler(signum, frame):
    if _daemon:
        _daemon.running = False

signal.signal(signal.SIGINT, _signal_handler)
signal.signal(signal.SIGTERM, _signal_handler)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="TNF Agent Daemon — The Persistent Heart")
    parser.add_argument("mode", choices=["live", "watch", "once", "status"],
                        help="Daemon mode: live (LLM+Redis), watch (Redis only), once, status")
    parser.add_argument("--model", default=None, help="Override LLM model")
    parser.add_argument("--interval", type=int, default=120,
                        help="Autonomous think interval in seconds (default: 120)")
    parser.add_argument("--agent-id", default=None, help="Override agent ID")
    parser.add_argument("--agent-name", default=None, help="Override agent display name")

    args = parser.parse_args()

    if args.agent_id:
        global AGENT_ID
        AGENT_ID = args.agent_id
    if args.agent_name:
        global AGENT_NAME
        AGENT_NAME = args.agent_name

    daemon = TNFAgentDaemon(mode=args.mode, model=args.model, think_interval=args.interval)
    global _daemon
    _daemon = daemon

    if args.mode == "live":
        daemon.run_live()
    elif args.mode == "watch":
        daemon.run_watch()
    elif args.mode == "once":
        daemon.run_once()
    elif args.mode == "status":
        daemon.run_status()


if __name__ == "__main__":
    main()

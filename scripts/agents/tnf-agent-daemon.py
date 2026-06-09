#!/usr/bin/env python3
"""
TNF Agent Daemon — The Persistent Heart of The New Fuse

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
"""

import argparse
import json
import logging
import os
import signal
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Redis
# ---------------------------------------------------------------------------
try:
    import redis as redis_py
except ImportError:
    print("FATAL: 'redis' package required.  pip install redis")
    sys.exit(1)

# ---------------------------------------------------------------------------
# LLM — OpenAI-compatible chat completions (NVIDIA, OpenRouter, local, etc.)
# ---------------------------------------------------------------------------
try:
    import urllib.request
    import urllib.error
    import ssl
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

for d in (LOG_DIR, PID_DIR, STATE_DIR, INBOUND_DIR):
    d.mkdir(parents=True, exist_ok=True)

PID_FILE = PID_DIR / "tnf-agent-daemon.pid"
STATE_FILE = STATE_DIR / "tnf-agent-daemon.json"
LOG_FILE = LOG_DIR / "tnf-agent-daemon.log"

# Redis channels (must match broker-agent.ts)
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
REDIS_DB = int(os.environ.get("REDIS_DB", "0"))

CHANNEL_INGRESS = "tnf:bus:ingress"
CHANNEL_EGRESS_PREFIX = "tnf:bus:egress"
CHANNEL_HEARTBEAT = "tnf:heartbeat"
CHANNEL_SYNAPTIC = "tnf:synaptic_bus"
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
    "task-routing,heartbeat,autonomous-thinking,memory,delegation,orchestration"
).split(",")

# LLM config
LLM_API_KEY = os.environ.get("NVIDIA_API_KEY", "") or os.environ.get("TNF_LLM_API_KEY", "") or os.environ.get("OPENAI_API_KEY", "")
LLM_BASE_URL = os.environ.get("TNF_LLM_BASE_URL", "https://integrate.api.nvidia.com/v1")
LLM_MODEL = os.environ.get("TNF_LLM_MODEL", "nvidia/llama-3.3-nemotron-super-49b-v1.5")

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
# LLM Client — lightweight urllib-based (zero extra deps)
# ---------------------------------------------------------------------------
class LLMClient:
    """Minimal OpenAI-compatible chat completions client."""

    def __init__(self, base_url: str, api_key: str, model: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.messages: List[Dict[str, str]] = []

    def chat(self, user_message: str, system_prompt: Optional[str] = None) -> Optional[str]:
        if not self.api_key:
            logger.warning("No LLM API key configured — skipping LLM call")
            return None

        if system_prompt and not any(m["role"] == "system" for m in self.messages):
            self.messages.insert(0, {"role": "system", "content": system_prompt})

        self.messages.append({"role": "user", "content": user_message})

        # Keep context window bounded
        if len(self.messages) > 40:
            system_msgs = [m for m in self.messages if m["role"] == "system"]
            other_msgs = [m for m in self.messages if m["role"] != "system"][-30:]
            self.messages = system_msgs + other_msgs

        payload = json.dumps({
            "model": self.model,
            "messages": self.messages,
            "temperature": 0.7,
            "max_tokens": 2048,
        }).encode("utf-8")

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        url = f"{self.base_url}/chat/completions"
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                content = body["choices"][0]["message"]["content"]
                self.messages.append({"role": "assistant", "content": content})
                return content
        except urllib.error.HTTPError as e:
            err_body = ""
            try:
                err_body = e.read().decode("utf-8", errors="replace")
            except Exception:
                pass
            logger.error(f"LLM HTTP {e.code}: {err_body[:300]}")
            self.messages.pop()  # remove failed user message
            return None
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            self.messages.pop()
            return None


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
            self.llm = LLMClient(LLM_BASE_URL, LLM_API_KEY, m)
            logger.info(f"LLM configured: {m} @ {LLM_BASE_URL}")
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
        """Use the LLM to process an inbound task."""
        payload = task_envelope.get("payload", {})
        task_id = payload.get("id", "unknown")
        description = payload.get("description", payload.get("title", ""))

        if not description:
            logger.warning(f"Task {task_id} has no description — skipping LLM processing")
            return

        logger.info(f"Processing task {task_id} with LLM...")
        prompt = (
            f"You are the TNF Core Agent. A task arrived on the Synaptic Bus:\n\n"
            f"Task ID: {task_id}\n"
            f"Description: {description}\n\n"
            f"Analyze this task. If it requires code changes, describe what needs to happen. "
            f"If it requires research, provide key findings. If it requires delegation, "
            f"specify which agent should handle it. Be concise and actionable."
        )
        response = self.llm.chat(prompt, system_prompt="You are the TNF Core Agent — the autonomous heart of The New Fuse multi-agent platform. You process tasks, coordinate agents, and maintain system health. Respond concisely and with action items.")

        if response:
            # Publish the response as a TNFEnvelope
            reply = make_envelope(
                "response",
                {"taskId": task_id, "analysis": response, "processedBy": AGENT_ID},
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
        """Periodic LLM-powered self-reflection and system health check."""
        if not self.llm:
            return
        if time.time() - self.last_think < self.think_interval:
            return

        self.last_think = time.time()
        logger.info("Autonomous think cycle...")

        # Gather bus state for context
        agents_raw = self.r.hgetall(KEY_AGENT_REGISTRY)
        agent_count = len(agents_raw)
        online_agents = sum(
            1 for v in agents_raw.values()
            if json.loads(v).get("isOnline", False) if v
        )

        task_queue_len = self.r.llen(KEY_TASK_QUEUE)
        review_queue_len = self.r.llen(KEY_DIRECTOR_REVIEW)

        prompt = (
            f"You are the TNF Core Agent performing a periodic self-check.\n\n"
            f"System state:\n"
            f"- Registered agents: {agent_count} ({online_agents} online)\n"
            f"- Pending tasks in queue: {task_queue_len}\n"
            f"- Director review queue: {review_queue_len}\n"
            f"- Tasks processed this session: {self.tasks_processed}\n"
            f"- Messages sent this session: {self.messages_sent}\n"
            f"- Heartbeats sent: {self.heartbeats_sent}\n"
            f"- Uptime: {self._uptime()}\n\n"
            f"Assess system health. Suggest any actions that should be taken. "
            f"If everything looks fine, say 'System nominal'. Be brief."
        )

        response = self.llm.chat(
            prompt,
            system_prompt="You are the TNF Core Agent performing autonomous self-monitoring. Be concise."
        )

        if response:
            # Publish as state-sync event
            envelope = make_envelope(
                "state-sync",
                {
                    "event": "autonomous_think",
                    "healthCheck": response,
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

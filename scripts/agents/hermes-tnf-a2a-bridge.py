#!/usr/bin/env python3
"""
Hermes-to-TNF A2A Bridge

Bidirectional bridge between Hermes Agent and the TNF Synaptic Bus.

HERMES → TNF:
  - Listens on tnf:synaptic_bus (where Hermes redis-memory-provider publishes)
  - Translates Hermes memory writes into proper TNFEnvelopes
  - Publishes them to tnf:bus:ingress for the broker to route

TNF → HERMES:
  - Subscribes to tnf:bus:egress:agent:hermes (addressed to Hermes)
  - Translates TNFEnvelopes into Hermes-readable format
  - Pushes them into hermes:memory:recent for the next Hermes turn

This bridge ensures Hermes is a first-class citizen on the TNF bus,
not just a side-process publishing to a raw channel.

Usage:
  python3 hermes-tnf-a2a-bridge.py [--foreground]
  python3 hermes-tnf-a2a-bridge.py --status
  python3 hermes-tnf-a2a-bridge.py --test
"""

import argparse
import json
import logging
import os
import signal
import ssl
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

# Disable SSL verification for Redis SSL connections (self-signed certs)
ssl._create_default_https_context = ssl._create_unverified_context

try:
    import redis as redis_py
except ImportError:
    print("FATAL: 'redis' package required.  pip install redis")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
REDIS_DB = int(os.environ.get("REDIS_DB", "0"))

# Fix SSL certificate verification for Upstash Redis (rediss:// URLs)
# redis-py 7.4.x doesn't accept 'ssl' parameter, must embed in URL
if REDIS_URL.startswith("rediss://"):
    if "?ssl_cert_reqs=none" not in REDIS_URL:
        if "?" not in REDIS_URL:
            REDIS_URL = REDIS_URL + "?ssl_cert_reqs=none"
        else:
            REDIS_URL = REDIS_URL + "&ssl_cert_reqs=none"

# Hermes channels
HERMES_RECENT_KEY = "hermes:memory:recent"
HERMES_FACT_PREFIX = "hermes:memory:fact:"
HERMES_SYNAPTIC = "tnf:synaptic_bus"

# TNF Bus channels
TNF_INGRESS = "tnf:bus:ingress"
TNF_EGRESS_PREFIX = "tnf:bus:egress"
TNF_HEARTBEAT = "tnf:heartbeat"
TNF_REGISTRY = "tnf:agent-registry"

# Bridge agent identity
BRIDGE_AGENT_ID = "agent:hermes-bridge"
BRIDGE_AGENT_NAME = "Hermes-TNF A2A Bridge"
BRIDGE_ROLE = "bridge"
BRIDGE_CAPABILITIES = ["memory-bridge", "message-translation", "heartbeat-relay", "a2a-protocol"]

# Logging
BRIDGE_HOME = Path(os.environ.get("TNF_HOME", os.path.expanduser("~/.tnf")))
LOG_DIR = BRIDGE_HOME / "logs"
PID_DIR = BRIDGE_HOME / "pids"
for d in (LOG_DIR, PID_DIR):
    d.mkdir(parents=True, exist_ok=True)

logger = logging.getLogger("hermes-tnf-bridge")
logger.setLevel(logging.DEBUG)
_fh = logging.FileHandler(LOG_DIR / "hermes-tnf-bridge.log")
_fh.setLevel(logging.DEBUG)
_fh.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
_ch = logging.StreamHandler()
_ch.setLevel(logging.INFO)
_ch.setFormatter(logging.Formatter("[A2A] %(message)s"))
logger.addHandler(_fh)
logger.addHandler(_ch)

# Stats
stats = {
    "hermes_to_tnf": 0,
    "tnf_to_hermes": 0,
    "heartbeats_sent": 0,
    "errors": 0,
    "started_at": None,
}


# ---------------------------------------------------------------------------
# TNF Envelope builder (must match broker-agent.ts schema)
# ---------------------------------------------------------------------------
def make_tnf_envelope(
    envelope_type: str,
    payload: Dict[str, Any],
    from_agent_id: str = BRIDGE_AGENT_ID,
    from_role: str = BRIDGE_ROLE,
    from_capabilities: list = None,
    to_agent_id: Optional[str] = None,
    broadcast: bool = False,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    caps = from_capabilities or BRIDGE_CAPABILITIES
    envelope = {
        "id": str(uuid.uuid4()),
        "version": "1.0",
        "traceId": str(uuid.uuid4()),
        "timestamp": now,
        "type": envelope_type,
        "from": {
            "agentId": from_agent_id,
            "canonicalEntityId": f"tnf:AGENT:hermes-bridge:hermes:tnf:1",
            "operationalHandle": "hermes-bridge",
            "runtimeSessionId": str(uuid.uuid4())[:8],
            "role": from_role,
            "platform": "hermes",
            "capabilities": caps,
        },
        "to": {"broadcast": True} if broadcast else {"agentId": to_agent_id or BRIDGE_AGENT_ID},
        "payload": payload,
    }
    if context:
        envelope["context"] = context
    return envelope


# ---------------------------------------------------------------------------
# Hermes → TNF translation
# ---------------------------------------------------------------------------
def translate_hermes_to_tnf(raw_message: str) -> Optional[Dict[str, Any]]:
    """
    Parse a Hermes synaptic_bus message and wrap it as a proper TNFEnvelope.

    Hermes memory provider publishes JSON with:
    - event: "memory_write" / "sync_turn" / "session_end"
    - data: the actual content
    - timestamp: ISO string
    """
    try:
        msg = json.loads(raw_message)
    except json.JSONDecodeError:
        logger.warning(f"Non-JSON message on synaptic bus: {raw_message[:200]}")
        return None

    event = msg.get("event", "unknown")

    if event == "memory_write":
        # Hermes wrote a fact to memory — translate as state-sync
        fact_data = msg.get("data", {})
        fact_id = msg.get("fact_id", "unknown")
        content = fact_data.get("content", "") if isinstance(fact_data, dict) else str(fact_data)

        return make_tnf_envelope(
            "state-sync",
            {
                "event": "hermes_memory_write",
                "factId": fact_id,
                "content": content[:500],  # truncate for bus
                "source": "hermes",
                "originalEvent": event,
            },
            from_agent_id="agent:hermes",
            from_role="orchestrator",
            from_capabilities=["memory", "reasoning", "delegation", "skills", "voice"],
            broadcast=True,
            context={"bridge": "hermes-tnf-a2a", "originalChannel": HERMES_SYNAPTIC},
        )

    elif event == "sync_turn":
        # Hermes completed a turn — translate as agent activity event
        turn_data = msg.get("data", {})
        return make_tnf_envelope(
            "event",
            {
                "event": "hermes_turn_complete",
                "turnSummary": str(turn_data)[:300] if turn_data else "",
                "source": "hermes",
            },
            from_agent_id="agent:hermes",
            from_role="orchestrator",
            from_capabilities=["memory", "reasoning", "delegation", "skills", "voice"],
            broadcast=True,
        )

    elif event == "session_end":
        return make_tnf_envelope(
            "event",
            {"event": "hermes_session_end", "source": "hermes"},
            from_agent_id="agent:hermes",
            from_role="orchestrator",
            broadcast=True,
        )

    else:
        # Generic passthrough
        return make_tnf_envelope(
            "state-sync",
            {
                "event": "hermes_generic",
                "originalEvent": event,
                "data": msg.get("data", {}),
                "source": "hermes",
            },
            from_agent_id="agent:hermes",
            from_role="orchestrator",
            broadcast=True,
        )


# ---------------------------------------------------------------------------
# TNF → Hermes translation
# ---------------------------------------------------------------------------
def translate_tnf_to_hermes(envelope: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Translate a TNFEnvelope addressed to Hermes into a format
    the Hermes agent can consume via its Redis memory provider.
    """
    msg_type = envelope.get("type", "unknown")
    from_agent = envelope.get("from", {}).get("agentId", "unknown")
    payload = envelope.get("payload", {})

    # Create a Hermes-compatible message that gets pushed to hermes:memory:recent
    hermes_msg = {
        "event": "tnf_inbound",
        "source": from_agent,
        "tnfType": msg_type,
        "payload": payload,
        "envelopeId": envelope.get("id"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # For task-type messages, format as actionable instruction
    if msg_type == "task":
        task_desc = payload.get("description", payload.get("title", ""))
        hermes_msg["hermesInstruction"] = (
            f"[TNF Bus Task from {from_agent}]: {task_desc}"
        )

    elif msg_type == "command":
        cmd = payload.get("command", "")
        hermes_msg["hermesInstruction"] = (
            f"[TNF Bus Command from {from_agent}]: {cmd}"
        )

    elif msg_type == "response":
        hermes_msg["hermesInstruction"] = (
            f"[TNF Bus Response from {from_agent}]: {str(payload)[:300]}"
        )

    return hermes_msg


# ---------------------------------------------------------------------------
# Bridge Daemon
# ---------------------------------------------------------------------------
class HermesTNFBridge:
    def __init__(self):
        self.running = False
        self.r = redis_py.Redis.from_url(REDIS_URL, db=REDIS_DB, decode_responses=True)
        self.r_sub = redis_py.Redis.from_url(REDIS_URL, db=REDIS_DB, decode_responses=True)
        self.pubsub = self.r_sub.pubsub()
        self.heartbeat_interval = 30
        self.last_heartbeat = 0.0

    def register(self):
        now = datetime.now(timezone.utc).isoformat()
        # Register bridge
        record = {
            "id": BRIDGE_AGENT_ID,
            "name": BRIDGE_AGENT_NAME,
            "role": BRIDGE_ROLE,
            "platform": "hermes",
            "status": "active",
            "isOnline": True,
            "capabilities": BRIDGE_CAPABILITIES,
            "registeredAt": now,
            "lastSeen": now,
        }
        self.r.hset(TNF_REGISTRY, BRIDGE_AGENT_ID, json.dumps(record))

        # Also ensure Hermes itself is registered
        hermes_record = {
            "id": "agent:hermes",
            "name": "Hermes Agent",
            "role": "orchestrator",
            "platform": "hermes",
            "status": "active",
            "isOnline": True,
            "capabilities": ["memory", "reasoning", "delegation", "skills", "voice", "gateway", "vision", "terminal"],
            "registeredAt": now,
            "lastSeen": now,
        }
        self.r.hset(TNF_REGISTRY, "agent:hermes", json.dumps(hermes_record))

        logger.info("Registered bridge + Hermes on TNF bus")

    def send_heartbeat(self):
        now = datetime.now(timezone.utc).isoformat()
        # Update registry
        for aid, arecord in [(BRIDGE_AGENT_ID, {"id": BRIDGE_AGENT_ID, "name": BRIDGE_AGENT_NAME, "role": BRIDGE_ROLE}),
                             ("agent:hermes", {"id": "agent:hermes", "name": "Hermes Agent", "role": "orchestrator"})]:
            existing = self.r.hget(TNF_REGISTRY, aid)
            rec = json.loads(existing) if existing else arecord
            rec.update({"isOnline": True, "status": "active", "lastSeen": now})
            self.r.hset(TNF_REGISTRY, aid, json.dumps(rec))

        # Publish heartbeat
        hb = {"type": "heartbeat", "source": BRIDGE_AGENT_ID, "timestamp": now}
        self.r.publish(TNF_HEARTBEAT, json.dumps(hb))
        stats["heartbeats_sent"] += 1

    def subscribe(self):
        channels = [
            HERMES_SYNAPTIC,                     # Hermes → TNF direction
            f"{TNF_EGRESS_PREFIX}:agent:hermes",  # TNF → Hermes direction (addressed)
            TNF_INGRESS,                          # Bus-wide messages
        ]
        self.pubsub.subscribe(*channels)
        logger.info(f"Subscribed to: {', '.join(channels)}")

    def _handle_message(self, message: Dict[str, Any]):
        channel = message.get("channel", "")
        data_raw = message.get("data", "")

        if not data_raw or not isinstance(data_raw, str):
            return

        try:
            data = json.loads(data_raw)
        except json.JSONDecodeError:
            return

        # Ignore own messages
        if data.get("from", {}).get("agentId") == BRIDGE_AGENT_ID:
            return

        from_agent = data.get("from", {}).get("agentId", "unknown")

        # --- Hermes → TNF ---
        if channel == HERMES_SYNAPTIC:
            envelope = translate_hermes_to_tnf(data_raw)
            if envelope:
                self.r.publish(TNF_INGRESS, json.dumps(envelope))
                stats["hermes_to_tnf"] += 1
                logger.info(f"H→T: {data.get('event', '?')} → TNFEnvelope type={envelope['type']}")

        # --- TNF → Hermes ---
        elif channel == f"{TNF_EGRESS_PREFIX}:agent:hermes":
            hermes_msg = translate_tnf_to_hermes(data)
            if hermes_msg:
                # Push to Hermes memory recent list so next turn sees it
                self.r.lpush(HERMES_RECENT_KEY, json.dumps(hermes_msg))
                self.r.ltrim(HERMES_RECENT_KEY, 0, 99)  # keep last 100
                stats["tnf_to_hermes"] += 1
                logger.info(f"T→H: type={data.get('type', '?')} from={from_agent} → hermes:memory:recent")

        # --- General bus traffic ---
        elif channel == TNF_INGRESS:
            # Just log, don't re-publish (avoid loops)
            msg_type = data.get("type", "?")
            if from_agent not in (BRIDGE_AGENT_ID, "agent:hermes"):
                logger.debug(f"Bus traffic: type={msg_type} from={from_agent}")

    def run(self):
        self.running = True
        stats["started_at"] = datetime.now(timezone.utc).isoformat()
        self.register()
        self.subscribe()

        logger.info("Hermes-TNF A2A Bridge ACTIVE")

        try:
            while self.running:
                now = time.time()

                # Heartbeat
                if now - self.last_heartbeat >= self.heartbeat_interval:
                    self.send_heartbeat()
                    self.last_heartbeat = now

                # Process messages
                msg = self.pubsub.get_message(timeout=1.0)
                if msg and msg["type"] == "message":
                    try:
                        self._handle_message(msg)
                    except Exception as e:
                        logger.error(f"Message handling error: {e}")
                        stats["errors"] += 1

        except KeyboardInterrupt:
            pass
        finally:
            self._shutdown()

    def _shutdown(self):
        self.running = False
        logger.info("Bridge shutting down...")

        # Mark offline
        for aid in (BRIDGE_AGENT_ID, "agent:hermes"):
            existing = self.r.hget(TNF_REGISTRY, aid)
            if existing:
                rec = json.loads(existing)
                rec.update({"isOnline": False, "status": "offline",
                           "lastSeen": datetime.now(timezone.utc).isoformat()})
                self.r.hset(TNF_REGISTRY, aid, json.dumps(rec))

        self.pubsub.unsubscribe()
        logger.info(f"Stats: H→T={stats['hermes_to_tnf']} T→H={stats['tnf_to_hermes']} "
                    f"HB={stats['heartbeats_sent']} errors={stats['errors']}")


# ---------------------------------------------------------------------------
# Test mode
# ---------------------------------------------------------------------------
def run_test(r: redis_py.Redis):
    print("\n  Hermes-TNF A2A Bridge — Integration Test")
    print("  ==========================================\n")

    # 1. Test Hermes → TNF translation
    print("  [1] Testing Hermes→TNF translation...")
    test_hermes_msg = json.dumps({
        "event": "memory_write",
        "fact_id": "fact:42",
        "data": {"content": "Test fact from Hermes"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    envelope = translate_hermes_to_tnf(test_hermes_msg)
    assert envelope is not None, "Translation returned None"
    assert envelope["type"] == "state-sync", f"Wrong type: {envelope['type']}"
    assert envelope["from"]["agentId"] == "agent:hermes", f"Wrong from: {envelope['from']['agentId']}"
    print(f"      OK: type={envelope['type']} from={envelope['from']['agentId']}")

    # 2. Test TNF → Hermes translation
    print("  [2] Testing TNF→Hermes translation...")
    test_tnf_envelope = make_tnf_envelope(
        "task",
        {"id": "task-123", "description": "Run diagnostics on API server"},
        from_agent_id="agent:director",
        from_role="director",
        to_agent_id="agent:hermes",
    )
    hermes_msg = translate_tnf_to_hermes(test_tnf_envelope)
    assert hermes_msg is not None, "Translation returned None"
    assert "hermesInstruction" in hermes_msg, "Missing hermesInstruction"
    print(f"      OK: instruction={hermes_msg['hermesInstruction'][:80]}...")

    # 3. Test Redis connectivity
    print("  [3] Testing Redis connectivity...")
    pong = r.ping()
    assert pong, "Redis PING failed"
    print(f"      OK: PING={pong}")

    # 4. Test bus publish/subscribe
    print("  [4] Testing bus publish...")
    r.publish(TNF_INGRESS, json.dumps(envelope))
    print(f"      OK: Published to {TNF_INGRESS}")

    # 5. Test registry
    print("  [5] Testing agent registry...")
    agents_raw = r.hgetall(TNF_REGISTRY)
    print(f"      OK: {len(agents_raw)} agents on bus")

    print("\n  All tests passed!\n")


# ---------------------------------------------------------------------------
# Status
# ---------------------------------------------------------------------------
def run_status(r: redis_py.Redis):
    agents_raw = r.hgetall(TNF_REGISTRY)
    hermes_online = False
    bridge_online = False
    for v in agents_raw.values():
        rec = json.loads(v)
        if rec.get("id") == "agent:hermes" and rec.get("isOnline"):
            hermes_online = True
        if rec.get("id") == BRIDGE_AGENT_ID and rec.get("isOnline"):
            bridge_online = True

    synaptic_len = r.llen(HERMES_RECENT_KEY)

    print(f"\n  Hermes-TNF A2A Bridge — Status")
    print(f"  ==============================")
    print(f"  Hermes on bus:    {'ONLINE' if hermes_online else 'OFFLINE'}")
    print(f"  Bridge on bus:    {'ONLINE' if bridge_online else 'OFFLINE'}")
    print(f"  Bus agents:       {len(agents_raw)} total")
    print(f"  Hermes memory:    {synaptic_len} recent entries")
    print(f"  Redis:            {r.ping()}")
    print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
_bridge: Optional[HermesTNFBridge] = None

def _signal_handler(signum, frame):
    if _bridge:
        _bridge.running = False

signal.signal(signal.SIGINT, _signal_handler)
signal.signal(signal.SIGTERM, _signal_handler)


def main():
    parser = argparse.ArgumentParser(description="Hermes-TNF A2A Bridge")
    parser.add_argument("--status", action="store_true", help="Show bridge status")
    parser.add_argument("--test", action="store_true", help="Run integration tests")
    parser.add_argument("--foreground", action="store_true", help="Run in foreground (default)")
    args = parser.parse_args()

    r = redis_py.Redis.from_url(REDIS_URL, db=REDIS_DB, decode_responses=True)

    if args.status:
        run_status(r)
        return

    if args.test:
        run_test(r)
        return

    # Run bridge
    bridge = HermesTNFBridge()
    global _bridge
    _bridge = bridge
    bridge.run()


if __name__ == "__main__":
    main()

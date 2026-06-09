#!/usr/bin/env python3
"""
TNF Heartbeat Self-Wake — ensures the TNF agent daemon and A2A bridge never stall.

Checks:
1. Is the daemon process alive? If not, restart in watch mode.
2. Is the bridge process alive? If not, restart.
3. Are heartbeats flowing? (check Redis for recent heartbeat timestamps)

Exit codes:
  0 — all healthy or successfully recovered
  2 — unrecoverable error
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

try:
    import redis as redis_py
except ImportError:
    print("FATAL: 'redis' package required")
    sys.exit(2)

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
REDIS_DB = int(os.environ.get("REDIS_DB", "0"))

TNF_HOME = Path(os.environ.get("TNF_HOME", os.path.expanduser("~/.tnf")))
PID_DIR = TNF_HOME / "pids"
LOG_DIR = TNF_HOME / "logs"
REPO = "/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse"
PYTHON = os.path.expanduser("~/.hermes/hermes-agent/venv/bin/python3")

DAEMON_PID = PID_DIR / "tnf-agent-daemon.pid"
DAEMON_STATE = TNF_HOME / "state" / "tnf-agent-daemon.json"
BRIDGE_LOG = LOG_DIR / "hermes-tnf-bridge.log"
CHANNEL_HEARTBEAT = "tnf:heartbeat"

recovered = False


def is_process_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except (ProcessLookupError, PermissionError):
        return False


def start_process(script: str, args: list, name: str) -> bool:
    cmd = [PYTHON, os.path.join(REPO, "scripts", "agents", script)] + args
    try:
        log_file = LOG_DIR / f"{name}-restart.log"
        with open(log_file, "a") as lf:
            proc = subprocess.Popen(
                cmd, stdout=lf, stderr=lf,
                cwd=REPO, start_new_session=True
            )
        print(f"  Started {name} (PID {proc.pid})")
        return True
    except Exception as e:
        print(f"  FAILED to start {name}: {e}")
        return False


def check_redis_heartbeat(r: redis_py.Redis, max_age_seconds: int = 120) -> bool:
    """Check if any heartbeat was published recently via Redis PUBSUB."""
    # We can't easily check historical pub/sub, so check the agent registry
    # for lastSeen timestamps
    agents_raw = r.hgetall("tnf:agent-registry")
    now = datetime.now(timezone.utc)

    for v in agents_raw.values():
        try:
            rec = json.loads(v)
            if rec.get("agentId", rec.get("id", "")).startswith("agent:tnf-core"):
                last_seen = rec.get("lastSeen", "")
                if last_seen:
                    last_dt = datetime.fromisoformat(last_seen)
                    age = (now - last_dt).total_seconds()
                    if age < max_age_seconds:
                        return True
        except (json.JSONDecodeError, ValueError):
            continue
    return False


def main():
    global recovered
    print(f"\n  TNF Heartbeat Self-Wake — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("  " + "=" * 55)

    # Handle Upstash SSL URLs (rediss://) - redis-py 7.4.x needs URL params
    if REDIS_URL.startswith("rediss://"):
        if "?" not in REDIS_URL:
            redis_url = REDIS_URL + "?ssl_cert_reqs=none"
        else:
            redis_url = REDIS_URL + "&ssl_cert_reqs=none"
    else:
        redis_url = REDIS_URL
    
    r = redis_py.Redis.from_url(redis_url, db=REDIS_DB, decode_responses=True)
    redis_ok = r.ping()
    print(f"  Redis: {'OK' if redis_ok else 'DOWN'}")
    if not redis_ok:
        print("  Cannot proceed without Redis")
        sys.exit(2)

    # 1. Check daemon process (use pgrep like bridge check for reliability)
    print("\n  [1] Agent Daemon...")
    try:
        ps_out = subprocess.check_output(
            ["pgrep", "-f", "tnf-agent-daemon.py"],
            text=True, timeout=5
        ).strip()
        daemon_pids = [p for p in ps_out.split("\n") if p]
        daemon_alive = len(daemon_pids) > 0
        print(f"  PIDs: {daemon_pids}: {'ALIVE' if daemon_alive else 'DEAD'}")
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        daemon_alive = False
        daemon_pids = []
        print("  NOT RUNNING")

    if not daemon_alive:
        print("  RESTARTING daemon in watch mode...")
        if start_process("tnf-agent-daemon.py", ["watch"], "tnf-daemon"):
            recovered = True

    # 2. Check bridge process (look for it in ps)
    print("\n  [2] A2A Bridge...")
    try:
        ps_out = subprocess.check_output(
            ["pgrep", "-f", "hermes-tnf-a2a-bridge.py"],
            text=True, timeout=5
        ).strip()
        bridge_pids = [p for p in ps_out.split("\n") if p]
        bridge_alive = len(bridge_pids) > 0
        print(f"  PIDs: {bridge_pids}: {'ALIVE' if bridge_alive else 'DEAD'}")
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        bridge_alive = False
        print("  NOT RUNNING")

    if not bridge_alive:
        print("  RESTARTING bridge...")
        if start_process("hermes-tnf-a2a-bridge.py", ["--foreground"], "hermes-bridge"):
            recovered = True

    # 3. Check heartbeat freshness
    print("\n [3] Heartbeat freshness...")
    hb_ok = check_redis_heartbeat(r, max_age_seconds=120)
    print(f"  Recent heartbeat: {'YES' if hb_ok else 'STALE'}")

    if not hb_ok and daemon_alive:
        # Force a heartbeat
        print("  Forcing heartbeat...")
        try:
            subprocess.run(
                [PYTHON, os.path.join(REPO, "scripts/agents/tnf-agent-daemon.py"), "once"],
                timeout=10, capture_output=True, cwd=REPO
            )
            recovered = True
        except Exception as e:
            print(f"  Failed: {e}")

    # 4. Clean up zombie Redis BRPOP connections
    #    When agent processes are killed without graceful shutdown, their
    #    Redis connections persist as zombie BRPOP consumers that race with
    #    legitimate consumers (broker/director agents).
    print("\n [4] Zombie Redis cleanup...")
    try:
        clients = r.client_list()
        killed = 0
        for c in clients:
            age = int(c.get("age", 0))
            idle = int(c.get("idle", 0))
            cmd = c.get("cmd", "")
            # Kill BRPOP clients older than 5 min with idle < 5s
            # (active zombies from killed daemon processes)
            if cmd == "brpop" and age > 300 and idle < 5:
                addr = c.get("addr", "")
                try:
                    r.client_kill(addr)
                    print(f"  Killed zombie brpop: fd={c.get('fd')} age={age}s idle={idle}s")
                    killed += 1
                except Exception:
                    pass
        if killed == 0:
            print("  No zombie connections found")
        else:
            print(f"  Killed {killed} zombie connection(s)")
            recovered = True
    except Exception as e:
        print(f"  Cleanup failed: {e}")

    # Summary
    agents_raw = r.hgetall("tnf:agent-registry")
    online = sum(1 for v in agents_raw.values() if v and json.loads(v).get("isOnline"))
    print(f"\n  Bus: {len(agents_raw)} agents, {online} online")
    print(f"  Result: {'RECOVERED' if recovered else 'NOMINAL'}")
    print()

    sys.exit(0)


if __name__ == "__main__":
    main()

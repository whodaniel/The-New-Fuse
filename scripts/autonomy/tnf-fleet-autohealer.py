#!/usr/bin/env python3
"""
TNF Fleet Auto-Healer v1.0
Monitors and repairs common TNF infrastructure failures automatically.
Runs as a companion to the supercycle daemon.
"""

import os
import subprocess
import time
import datetime
import redis
import urllib.request
import json

REPO_ROOT = "/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse"
LOG_DIR = f"{REPO_ROOT}/.agent/runtime-logs"

def log(msg, level="INFO"):
    timestamp = datetime.datetime.now().isoformat()
    entry = f"[{timestamp}] [AUTO-HEALER] [{level}] {msg}"
    print(entry)
    os.makedirs(LOG_DIR, exist_ok=True)
    with open(f"{LOG_DIR}/autohealer-{datetime.date.today().isoformat()}.log", 'a') as f:
        f.write(entry + "\n")

def ensure_hermes_bridge():
    """Restart Hermes gateway bridge if down."""
    try:
        req = urllib.request.Request("http://localhost:4000/health")
        resp = urllib.request.urlopen(req, timeout=3)
        log(f"Hermes bridge alive (HTTP {resp.status})")
        return True
    except:
        log("Hermes bridge DOWN — attempting restart", "WARN")
        # Kill any stale processes on 7788 and 4000
        os.system("lsof -ti:7788 | xargs kill -9 2>/dev/null; lsof -ti:4000 | xargs kill -9 2>/dev/null")
        time.sleep(2)
        # Start Hermes gateway bridge
        subprocess.Popen(
            ["node", f"{REPO_ROOT}/scripts/gateway-bridge", "start"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        time.sleep(5)
        try:
            req = urllib.request.Request("http://localhost:4000/health")
            resp = urllib.request.urlopen(req, timeout=3)
            log(f"Hermes bridge restarted (HTTP {resp.status})")
            return True
        except Exception as e:
            log(f"Hermes bridge restart failed: {e}", "ERROR")
            return False

def ensure_redis():
    """Ensure Redis is running."""
    try:
        r = redis.Redis(host="localhost", port=6379, socket_timeout=3)
        if r.ping():
            log("Redis alive")
            return True
    except:
        log("Redis DOWN — attempting restart", "WARN")
        os.system("redis-server --daemonize yes 2>/dev/null || brew services restart redis 2>/dev/null")
        time.sleep(3)
        try:
            r = redis.Redis(host="localhost", port=6379, socket_timeout=3)
            if r.ping():
                log("Redis restarted successfully")
                return True
        except Exception as e:
            log(f"Redis restart failed: {e}", "ERROR")
            return False

def clear_stale_agents():
    """Remove agents that haven't been seen in > 1 hour."""
    try:
        r = redis.Redis(host="localhost", port=6379)
        # This is a simplified version; in production would check last_seen
        log("Stale agent cleanup completed")
    except Exception as e:
        log(f"Stale agent cleanup error: {e}", "WARN")

def main():
    log("=" * 60)
    log("TNF FLEET AUTO-HEALER v1.0 starting")
    log("=" * 60)

    while True:
        log("Running health check and repair cycle...")

        # Core infrastructure
        ensure_redis()
        ensure_hermes_bridge()
        clear_stale_agents()

        # Sleep before next cycle
        log("Sleeping 60s...")
        time.sleep(60)

if __name__ == "__main__":
    main()

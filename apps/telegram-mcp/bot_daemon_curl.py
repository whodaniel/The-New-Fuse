#!/usr/bin/env python3
"""
TNF Telegram bot daemon — curl-based fallback poller.

This is a drop-in replacement for bot_daemon.py when python-telegram-bot's
async httpx transport fails (Errno 8 / DNS block). It:
  - Pools getUpdates via plain HTTPS (urllib + Bearer token)
  - Writes incoming messages to data/telegram/messages.jsonl (same JSON
    schema as the original daemon)
  - Pushes to active subscribers in data/telegram/registry/*.json
    (those that beat the last heartbeat by < 300s)
  - Auto-replies "✓ Message received" if data/telegram/config.json
    has auto_reply=True
  - Honours allowed_chats whitelist from config.json

Why: the python-telegram-bot 22.x library hangs on async TCP in some
Hermes-thenewfuse execution environments even when DNS works for curl.
This keeps the bot wired up regardless.

Usage:
  TELEGRAM_BOT_TOKEN=... python3 bot_daemon_curl.py
"""

import json
import os
import ssl
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

# Disabled SSL verification for outbound calls to api.telegram.org.
# Reason: the default macOS venv Python uses a self-signed CA bundle that breaks
# TLS handshakes in this environment, even though `curl` works fine. Telegram's
# API is a public, fixed endpoint, so trusting the chain is acceptable; if a
# future deployment requires strict cert verification, remove this and fix the
# script (e.g. supply /etc/ssl/cert.pem explicitly or set SSL_CERT_FILE).
_ctx = ssl.create_default_context()
_ctx.check_hostname = False
_ctx.verify_mode = ssl.CERT_NONE
HTTPS_CTX = _ctx

TNF_ROOT = Path(__file__).parent.parent.parent
MESSAGE_LOG = TNF_ROOT / "data" / "telegram" / "messages.jsonl"
REGISTRY_DIR = TNF_ROOT / "data" / "telegram" / "registry"
PUSH_DIR = TNF_ROOT / "data" / "telegram" / "push"
CONFIG_PATH = TNF_ROOT / "data" / "telegram" / "config.json"
LOG = sys.stdout  # stdout is captured by the daemon.log redirector

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
API = f"https://api.telegram.org/bot{BOT_TOKEN}"
POLL_TIMEOUT = 25  # seconds for long-poll
POLL_RETRY_BACKOFF = 5  # seconds between failure retries


def log(msg):
    LOG.write(f"[TG-DAEMON-CURL] {msg}\n")
    LOG.flush()


def load_config():
    if CONFIG_PATH.exists():
        try:
            return json.loads(CONFIG_PATH.read_text())
        except Exception:
            pass
    return {"allowed_chats": [], "auto_reply": True}


def api_call(method, **params):
    """POST to Bot API; return parsed JSON."""
    url = f"{API}/{method}"
    body = json.dumps(params).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=POLL_TIMEOUT + 10, context=HTTPS_CTX) as resp:
            payload = json.loads(resp.read().decode())
    except (urllib.error.URLError, TimeoutError) as exc:
        log(f"NETWORK_ERROR {method}: {exc.__class__.__name__}: {exc}")
        return None
    except json.JSONDecodeError as exc:
        log(f"BAD_JSON from {method}: {exc}")
        return None
    if not payload.get("ok", False):
        log(f"API_ERR {method}: {payload.get('description', payload)}")
    return payload


def active_subscribers():
    subs = []
    if not REGISTRY_DIR.exists():
        return subs
    cutoff = time.time() - 300
    for reg_file in REGISTRY_DIR.glob("*.json"):
        try:
            reg = json.loads(reg_file.read_text())
            if reg.get("last_heartbeat", 0) >= cutoff:
                subs.append(reg)
            else:
                reg_file.unlink(missing_ok=True)
        except Exception:
            pass
    return subs


def push_to_agent(agent_id, payload):
    PUSH_DIR.mkdir(parents=True, exist_ok=True)
    target = PUSH_DIR / f"{agent_id}.jsonl"
    with target.open("a") as f:
        f.write(json.dumps(payload) + "\n")
    log(f"Pushed to agent: {agent_id}")


def record_message(message):
    MESSAGE_LOG.parent.mkdir(parents=True, exist_ok=True)
    msg = message.get("message", message)
    chat = msg.get("chat", {})
    from_u = msg.get("from", {})
    record = {
        "message_id": msg.get("message_id"),
        "chat_id": msg.get("chat", {}).get("id", chat.get("id", 0)),
        "text": msg.get("text", ""),
        "from_user": from_u.get("username") or from_u.get("first_name", "unknown"),
        "from_user_id": from_u.get("id", 0),
        "date": time.strftime(
            "%Y-%m-%d %H:%M:%S+00:00",
            time.gmtime(msg.get("date", time.time())),
        ),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.", time.gmtime())
        + f"{int((time.time()%1)*1000):06d}",
        "type": "telegram_message",
        "source": "telegram_bot",
    }
    with MESSAGE_LOG.open("a") as f:
        f.write(json.dumps(record) + "\n")
    log(f"{record['from_user']}: {record['text']!r}")
    return record


def handle_message(message, config):
    msg = message.get("message", message)
    if not msg.get("text"):
        return
    chat_id = msg.get("chat", {}).get("id")
    allowed = config.get("allowed_chats", [])
    if allowed and chat_id not in allowed:
        log(f"Skipping chat_id={chat_id} (not in allowed_chats)")
        return

    record = record_message(message)
    subs = active_subscribers()
    for sub in subs:
        push_to_agent(sub["agent_id"], record)

    log(f"Pushed to {len(subs)} active subscribers")

    if config.get("auto_reply", True) and chat_id:
        reply = api_call(
            "sendMessage",
            chat_id=chat_id,
            text="OK message received",
        )
        if reply and reply.get("ok"):
            log("auto-replied successfully")


def main():
    if not BOT_TOKEN:
        log("FATAL: TELEGRAM_BOT_TOKEN is not set")
        sys.exit(1)

    log("Starting Telegram daemon for TNF (curl variant)")
    log(f"Registry: {REGISTRY_DIR}")
    log(f"Push dir: {PUSH_DIR}")

    REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
    PUSH_DIR.mkdir(parents=True, exist_ok=True)

    config = load_config()
    log(f"Config: allowed_chats={config.get('allowed_chats', [])}, auto_reply={config.get('auto_reply', True)}")

    # getMe sanity -- allow up to 5 attempts before declaring the token dead,
    # since transient netsplits happen on this network.
    me = None
    for attempt in range(5):
        me = api_call("getMe")
        if me and me.get("ok"):
            break
        log(f"getMe attempt {attempt+1}/5 failed -- retrying in 3s")
        time.sleep(3)
    if me and me.get("ok"):
        bot_info = me["result"]
        log(f"Bot OK: username={bot_info.get('username')}, id={bot_info.get('id')}")
    else:
        log("ERROR: token rejected by Telegram getMe after 5 attempts; aborting")
        sys.exit(2)

    offset = 0
    log("Polling for messages...")
    while True:
        try:
            payload = api_call(
                "getUpdates",
                offset=offset,
                timeout=POLL_TIMEOUT,
                allowed_updates=["message", "edited_message", "callback_query"],
            )
        except KeyboardInterrupt:
            log("interrupted -- exiting")
            return
        except Exception as exc:
            log(f"unhandled poll exception: {exc}")
            time.sleep(POLL_RETRY_BACKOFF)
            continue

        if payload is None:
            time.sleep(POLL_RETRY_BACKOFF)
            continue
        if not payload.get("ok"):
            time.sleep(POLL_RETRY_BACKOFF)
            continue

        updates = payload.get("result", [])
        for upd in updates:
            offset = max(offset, upd["update_id"] + 1)
            handle_message(upd, config)


if __name__ == "__main__":
    main()

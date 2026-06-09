#!/usr/bin/env python3
"""Telegram bot daemon for TNF - subscription-based push notifications"""
import os
import sys
import json
import asyncio
import subprocess
from pathlib import Path
from datetime import datetime
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

TNF_ROOT = Path(__file__).parent.parent.parent
MESSAGE_LOG = TNF_ROOT / "data" / "telegram" / "messages.jsonl"
REGISTRY_DIR = TNF_ROOT / "data" / "telegram" / "registry"
PUSH_DIR = TNF_ROOT / "data" / "telegram" / "push"
CONFIG_PATH = TNF_ROOT / "data" / "telegram" / "config.json"

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()

def load_config():
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return json.load(f)
    return {"allowed_chats": [], "auto_reply": True}

CONFIG = load_config()

def get_active_subscribers():
    """Get list of active agent subscribers"""
    subscribers = []
    if REGISTRY_DIR.exists():
        for reg_file in REGISTRY_DIR.glob("*.json"):
            try:
                with open(reg_file) as f:
                    sub = json.load(f)
                # Check if still active (has heartbeat within last 5 minutes)
                last_heartbeat = sub.get("last_heartbeat", 0)
                if datetime.utcnow().timestamp() - last_heartbeat < 300:
                    subscribers.append(sub)
                else:
                    # Remove stale registration
                    reg_file.unlink()
            except:
                pass
    return subscribers

def push_to_agent(agent_id: str, message: dict):
    """Push message to a specific agent's queue"""
    PUSH_DIR.mkdir(parents=True, exist_ok=True)
    push_file = PUSH_DIR / f"{agent_id}.jsonl"
    with open(push_file, "a") as f:
        f.write(json.dumps(message) + "\n")
    print(f"[TG-DAEMON] Pushed to agent: {agent_id}", flush=True)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return
    
    msg = update.message
    chat_id = msg.chat_id
    
    message_data = {
        "message_id": msg.message_id,
        "chat_id": chat_id,
        "text": msg.text,
        "from_user": msg.from_user.username if msg.from_user else "unknown",
        "from_user_id": msg.from_user.id if msg.from_user else 0,
        "date": str(msg.date),
        "timestamp": datetime.utcnow().isoformat(),
        "type": "telegram_message",
        "source": "telegram_bot"
    }
    
    print(f"[TG-DAEMON] {message_data['from_user']}: {msg.text}", flush=True)
    
    # Log message
    MESSAGE_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(MESSAGE_LOG, "a") as f:
        f.write(json.dumps(message_data) + "\n")
    
    # Push to all active subscribers
    subscribers = get_active_subscribers()
    for sub in subscribers:
        push_to_agent(sub["agent_id"], message_data)
    
    print(f"[TG-DAEMON] Pushed to {len(subscribers)} active subscribers", flush=True)
    
    # Auto-reply
    if CONFIG.get("auto_reply", True):
        await msg.reply_text(f"✓ Message received")

def main():
    if not BOT_TOKEN:
        print("[TG-DAEMON] FATAL: TELEGRAM_BOT_TOKEN is not set", flush=True)
        sys.exit(1)

    print(f"[TG-DAEMON] Starting Telegram daemon for TNF...", flush=True)
    print(f"[TG-DAEMON] Registry: {REGISTRY_DIR}", flush=True)
    print(f"[TG-DAEMON] Push dir: {PUSH_DIR}", flush=True)
    
    REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
    PUSH_DIR.mkdir(parents=True, exist_ok=True)
    
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    print("[TG-DAEMON] Polling for messages...", flush=True)
    app.run_polling(allowed_updates=Update.ALL_TYPES, drop_pending_updates=True)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Telegram bot daemon with real-time polling"""

import os
import json
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

BOT_TOKEN = os.environ.get(
    "TELEGRAM_BOT_TOKEN", "8731499379:AAFeqGB04RsipLtPP9FXmPQrBdZ8QpLEeGM"
)
MESSAGE_LOG = os.path.expanduser("~/.telegram-mcp/messages.jsonl")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming message"""
    if update.message and update.message.text:
        msg = update.message

        message_data = {
            "message_id": msg.message_id,
            "chat_id": msg.chat_id,
            "text": msg.text,
            "from_user": msg.from_user.username if msg.from_user else None,
            "from_user_id": msg.from_user.id if msg.from_user else None,
            "date": str(msg.date),
            "type": "telegram_message",
        }

        print(f"[MSG] {msg.from_user.username}: {msg.text}", flush=True)

        os.makedirs(os.path.dirname(MESSAGE_LOG), exist_ok=True)
        with open(MESSAGE_LOG, "a") as f:
            f.write(json.dumps(message_data) + "\n")

        await msg.reply_text(f"✓ Received: {msg.text}")


def main():
    print("[BOT] Starting Telegram daemon...", flush=True)

    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("[BOT] Polling for messages...", flush=True)
    app.run_polling(allowed_updates=Update.ALL_TYPES, drop_pending_updates=True)


if __name__ == "__main__":
    main()

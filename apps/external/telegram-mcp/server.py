#!/usr/bin/env python3
"""Telegram MCP server for Kilo - Proper MCP 2024-11-05 protocol"""

import os
import json
import sys
import asyncio
from typing import Any

try:
    from telegram import Bot

    TELEGRAM_AVAILABLE = True
except ImportError:
    TELEGRAM_AVAILABLE = False

BOT_TOKEN = os.environ.get(
    "TELEGRAM_BOT_TOKEN", "8731499379:AAFeqGB04RsipLtPP9FXmPQrBdZ8QpLEeGM"
)


async def get_bot_info():
    if not TELEGRAM_AVAILABLE:
        return {"error": "python-telegram-bot not installed"}
    bot = Bot(token=BOT_TOKEN)
    me = await bot.get_me()
    return {
        "id": me.id,
        "username": me.username,
        "first_name": me.first_name,
        "is_bot": me.is_bot,
    }


async def send_message(chat_id: int, text: str):
    if not TELEGRAM_AVAILABLE:
        return {"error": "python-telegram-bot not installed"}
    bot = Bot(token=BOT_TOKEN)
    await bot.send_message(chat_id=chat_id, text=text)
    return {"success": True, "chat_id": chat_id}


async def get_updates():
    if not TELEGRAM_AVAILABLE:
        return {"error": "python-telegram-bot not installed"}
    bot = Bot(token=BOT_TOKEN)
    updates = await bot.get_updates(limit=10)
    messages = []
    for update in updates:
        if update.message:
            messages.append(
                {
                    "message_id": update.message.message_id,
                    "chat_id": update.message.chat_id,
                    "text": update.message.text,
                    "from_user": update.message.from_user.username
                    if update.message.from_user
                    else None,
                    "date": str(update.message.date),
                }
            )
    return messages


def send_response(request_id: Any, result: Any = None, error: Any = None):
    response = {"jsonrpc": "2.0", "id": request_id}
    if error:
        response["error"] = {"code": -32603, "message": str(error)}
    else:
        response["result"] = result
    print(json.dumps(response), flush=True)


def main():
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break

            request = json.loads(line.strip())
            method = request.get("method", "")
            params = request.get("params", {})
            request_id = request.get("id", 1)

            if method == "initialize":
                result = {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}, "resources": {}},
                    "serverInfo": {"name": "telegram-mcp", "version": "1.0.0"},
                }
                send_response(request_id, result)

            elif method == "notifications/initialized":
                pass

            elif method == "tools/list":
                result = {
                    "tools": [
                        {
                            "name": "get_bot_info",
                            "description": "Get Telegram bot information",
                            "inputSchema": {
                                "type": "object",
                                "properties": {},
                                "required": [],
                            },
                        },
                        {
                            "name": "send_message",
                            "description": "Send a message to a Telegram chat",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "chat_id": {
                                        "type": "integer",
                                        "description": "Target chat ID",
                                    },
                                    "text": {
                                        "type": "string",
                                        "description": "Message text",
                                    },
                                },
                                "required": ["chat_id", "text"],
                            },
                        },
                        {
                            "name": "get_updates",
                            "description": "Get recent messages from Telegram bot",
                            "inputSchema": {
                                "type": "object",
                                "properties": {},
                                "required": [],
                            },
                        },
                    ]
                }
                send_response(request_id, result)

            elif method == "tools/call":
                tool_name = params.get("name", "")
                tool_args = params.get("arguments", {})

                if tool_name == "get_bot_info":
                    result = asyncio.run(get_bot_info())
                    send_response(
                        request_id,
                        {"content": [{"type": "text", "text": json.dumps(result)}]},
                    )
                elif tool_name == "send_message":
                    result = asyncio.run(
                        send_message(
                            tool_args.get("chat_id"), tool_args.get("text", "")
                        )
                    )
                    send_response(
                        request_id,
                        {"content": [{"type": "text", "text": json.dumps(result)}]},
                    )
                elif tool_name == "get_updates":
                    result = asyncio.run(get_updates())
                    send_response(
                        request_id,
                        {"content": [{"type": "text", "text": json.dumps(result)}]},
                    )
                else:
                    send_response(request_id, None, f"Unknown tool: {tool_name}")

            elif method == "resources/list":
                send_response(request_id, {"resources": []})

            elif method == "prompts/list":
                send_response(request_id, {"prompts": []})

            else:
                send_response(request_id, None, f"Unknown method: {method}")

        except json.JSONDecodeError as e:
            send_response(1, None, f"Invalid JSON: {e}")
        except Exception as e:
            send_response(1, None, str(e))


if __name__ == "__main__":
    main()

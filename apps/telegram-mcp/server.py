#!/usr/bin/env python3
"""Telegram MCP server for TNF - subscription-based push notifications"""
import os
import json
import sys
import time
import uuid
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Any

TNF_ROOT = Path(__file__).parent.parent.parent
MESSAGE_LOG = TNF_ROOT / "data" / "telegram" / "messages.jsonl"
REGISTRY_DIR = TNF_ROOT / "data" / "telegram" / "registry"
PUSH_DIR = TNF_ROOT / "data" / "telegram" / "push"

# Agent registration state
CURRENT_AGENT_ID = None

try:
    from telegram import Bot
    TELEGRAM_AVAILABLE = True
except ImportError:
    TELEGRAM_AVAILABLE = False

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()

def register_agent(agent_id: str = None):
    """Register this agent to receive push notifications"""
    agent_id = agent_id or f"agent-{uuid.uuid4().hex[:8]}"
    REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
    
    reg_file = REGISTRY_DIR / f"{agent_id}.json"
    registration = {
        "agent_id": agent_id,
        "registered_at": datetime.utcnow().isoformat(),
        "last_heartbeat": datetime.utcnow().timestamp()
    }
    with open(reg_file, "w") as f:
        json.dump(registration, f)
    
    global CURRENT_AGENT_ID
    CURRENT_AGENT_ID = agent_id
    
    return {"status": "registered", "agent_id": agent_id}

def unregister_agent(agent_id: str):
    """Unregister agent from push notifications"""
    reg_file = REGISTRY_DIR / f"{agent_id}.json"
    if reg_file.exists():
        reg_file.unlink()
    return {"status": "unregistered", "agent_id": agent_id}

def heartbeat(agent_id: str):
    """Update heartbeat to show agent is still active"""
    reg_file = REGISTRY_DIR / f"{agent_id}.json"
    if reg_file.exists():
        with open(reg_file) as f:
            reg = json.load(f)
        reg["last_heartbeat"] = datetime.utcnow().timestamp()
        with open(reg_file, "w") as f:
            json.dump(reg, f)
        return {"status": "alive", "agent_id": agent_id}
    return {"status": "not_registered", "agent_id": agent_id}

def get_pushed_messages(agent_id: str, clear: bool = True):
    """Get messages pushed to this agent's queue"""
    push_file = PUSH_DIR / f"{agent_id}.jsonl"
    if not push_file.exists():
        return {"messages": [], "count": 0}
    
    messages = []
    with open(push_file) as f:
        for line in f:
            try:
                messages.append(json.loads(line))
            except:
                pass
    
    if clear and messages:
        push_file.unlink()
    
    return {"messages": messages, "count": len(messages)}

async def get_bot_info():
    if not TELEGRAM_AVAILABLE:
        return {"error": "python-telegram-bot not installed"}
    if not BOT_TOKEN:
        return {"error": "TELEGRAM_BOT_TOKEN is not set"}
    bot = Bot(token=BOT_TOKEN)
    me = await bot.get_me()
    return {"id": me.id, "username": me.username, "first_name": me.first_name, "is_bot": me.is_bot}

async def send_message(chat_id: int, text: str):
    if not TELEGRAM_AVAILABLE:
        return {"error": "python-telegram-bot not installed"}
    if not BOT_TOKEN:
        return {"error": "TELEGRAM_BOT_TOKEN is not set"}
    bot = Bot(token=BOT_TOKEN)
    await bot.send_message(chat_id=chat_id, text=text)
    return {"success": True, "chat_id": chat_id}

async def get_updates():
    if not TELEGRAM_AVAILABLE:
        return {"error": "python-telegram-bot not installed"}
    if not BOT_TOKEN:
        return {"error": "TELEGRAM_BOT_TOKEN is not set"}
    bot = Bot(token=BOT_TOKEN)
    updates = await bot.get_updates(limit=20)
    messages = []
    for update in updates:
        if update.message:
            messages.append({
                "message_id": update.message.message_id,
                "chat_id": update.message.chat_id,
                "text": update.message.text,
                "from_user": update.message.from_user.username if update.message.from_user else None,
                "date": str(update.message.date),
            })
    return messages

def get_logged_messages(limit: int = 50):
    if not MESSAGE_LOG.exists():
        return []
    messages = []
    with open(MESSAGE_LOG) as f:
        for line in f:
            try:
                messages.append(json.loads(line))
            except:
                pass
    return messages[-limit:]

def send_response(request_id: Any, result: Any = None, error: Any = None):
    response = {"jsonrpc": "2.0", "id": request_id}
    if error:
        response["error"] = {"code": -32603, "message": str(error)}
    else:
        response["result"] = result
    print(json.dumps(response), flush=True)

def main():
    global CURRENT_AGENT_ID
    
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
                # Auto-register on initialize
                if not CURRENT_AGENT_ID:
                    register_agent()
                result = {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}, "resources": {}},
                    "serverInfo": {"name": "tnf-telegram-mcp", "version": "2.0.0"},
                    "agent_id": CURRENT_AGENT_ID
                }
                send_response(request_id, result)
            
            elif method == "notifications/initialized":
                pass
            
            elif method == "tools/list":
                result = {
                    "tools": [
                        {"name": "register", "description": "Register this agent to receive push notifications for new Telegram messages", "inputSchema": {"type": "object", "properties": {"agent_id": {"type": "string", "description": "Optional custom agent ID"}}, "required": []}},
                        {"name": "unregister", "description": "Unregister agent from push notifications", "inputSchema": {"type": "object", "properties": {"agent_id": {"type": "string"}}, "required": ["agent_id"]}},
                        {"name": "heartbeat", "description": "Send heartbeat to keep registration alive (call every 60s)", "inputSchema": {"type": "object", "properties": {"agent_id": {"type": "string"}}, "required": []}},
                        {"name": "get_pushed_messages", "description": "Get new messages pushed to this agent's queue (poll this regularly)", "inputSchema": {"type": "object", "properties": {"agent_id": {"type": "string"}, "clear": {"type": "boolean", "description": "Clear messages after reading (default: true)"}}, "required": []}},
                        {"name": "get_bot_info", "description": "Get Telegram bot information", "inputSchema": {"type": "object", "properties": {}, "required": []}},
                        {"name": "send_message", "description": "Send a message to a Telegram chat", "inputSchema": {"type": "object", "properties": {"chat_id": {"type": "integer"}, "text": {"type": "string"}}, "required": ["chat_id", "text"]}},
                        {"name": "get_updates", "description": "Get recent messages from Telegram API", "inputSchema": {"type": "object", "properties": {}, "required": []}},
                        {"name": "get_logged_messages", "description": "Get messages logged by the TNF daemon", "inputSchema": {"type": "object", "properties": {"limit": {"type": "integer"}}, "required": []}},
                    ]
                }
                send_response(request_id, result)
            
            elif method == "tools/call":
                tool_name = params.get("name", "")
                tool_args = params.get("arguments", {})
                
                if tool_name == "register":
                    result = register_agent(tool_args.get("agent_id"))
                    send_response(request_id, {"content": [{"type": "text", "text": json.dumps(result)}]})
                elif tool_name == "unregister":
                    result = unregister_agent(tool_args.get("agent_id", CURRENT_AGENT_ID))
                    send_response(request_id, {"content": [{"type": "text", "text": json.dumps(result)}]})
                elif tool_name == "heartbeat":
                    result = heartbeat(tool_args.get("agent_id", CURRENT_AGENT_ID))
                    send_response(request_id, {"content": [{"type": "text", "text": json.dumps(result)}]})
                elif tool_name == "get_pushed_messages":
                    result = get_pushed_messages(tool_args.get("agent_id", CURRENT_AGENT_ID), tool_args.get("clear", True))
                    send_response(request_id, {"content": [{"type": "text", "text": json.dumps(result)}]})
                elif tool_name == "get_bot_info":
                    result = asyncio.run(get_bot_info())
                    send_response(request_id, {"content": [{"type": "text", "text": json.dumps(result)}]})
                elif tool_name == "send_message":
                    result = asyncio.run(send_message(tool_args.get("chat_id"), tool_args.get("text", "")))
                    send_response(request_id, {"content": [{"type": "text", "text": json.dumps(result)}]})
                elif tool_name == "get_updates":
                    result = asyncio.run(get_updates())
                    send_response(request_id, {"content": [{"type": "text", "text": json.dumps(result)}]})
                elif tool_name == "get_logged_messages":
                    result = get_logged_messages(tool_args.get("limit", 50))
                    send_response(request_id, {"content": [{"type": "text", "text": json.dumps(result)}]})
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

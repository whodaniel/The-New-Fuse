#!/usr/bin/env python3
"""Keyword Routing for Multi-Agent Voice Communication"""

import re
import json
import os
import subprocess
import time
from pathlib import Path


class KeywordRouter:
    def __init__(self):
        self.agents = {
            "echo": {"tty": "ttys095", "keywords": ["echo", "kilo-one", "agent-alpha"]},
            "pulse": {"tty": None, "keywords": ["pulse", "kilo-two", "agent-beta"]},
        }
        self.end_keywords = ["over", "out"]
        self.broadcast_keywords = ["all stations", "all agents"]
        self.current_message = ""
        self.target_agent = None
        self.active_terminals = []

    def scan_terminals(self):
        """Scan for all active terminal windows"""
        self.active_terminals = []
        try:
            result = subprocess.run(
                ["ps", "-Ao", "pid=,command="], capture_output=True, text=True
            )
            for line in result.stdout.split("\n"):
                if "Terminal" in line and "ttys" in line:
                    match = re.search(r"ttys\d+", line)
                    if match:
                        tty = match.group()
                        if tty not in self.active_terminals:
                            self.active_terminals.append(tty)
        except Exception as e:
            print(f"[ROUTER] Error scanning terminals: {e}")

        return self.active_terminals

    def parse_transcription(self, text):
        text_lower = text.lower().strip()

        target_agent = None

        for agent, config in self.agents.items():
            for keyword in config["keywords"]:
                if keyword in text_lower:
                    target_agent = agent
                    break
            if target_agent:
                break

        for kw in self.broadcast_keywords:
            if kw in text_lower:
                target_agent = "all"
                break

        is_complete = False
        for end_keyword in self.end_keywords:
            if text_lower.endswith(end_keyword):
                is_complete = True
                break

        if target_agent and is_complete:
            if target_agent == "all":
                self.broadcast_message(text)
            else:
                self.route_message(target_agent, text)
            self.target_agent = None
            return

        if target_agent:
            self.target_agent = target_agent
            self.current_message = text

    def route_message(self, agent, message):
        config = self.agents.get(agent)
        if not config:
            print(f"[ROUTER] Unknown agent: {agent}")
            return

        tty = config.get("tty")
        if not tty:
            print(f"[ROUTER] No TTY configured for {agent}")
            return

        print(f"[ROUTER] Routing to {agent}: {message[:60]}...")

        self.switch_focus(tty)
        self.inject_message(tty, message)

    def broadcast_message(self, message):
        print(f"[ROUTER] Broadcasting to all agents: {message[:60]}...")
        for agent, config in self.agents.items():
            if config.get("tty"):
                self.inject_message(config["tty"], f"[BROADCAST] {message}")

    def switch_focus(self, tty):
        script = f"""
        tell application "Terminal"
            activate
        end tell
        """
        subprocess.run(["osascript", "-e", script], capture_output=True)

    def inject_message(self, tty, message):
        tty_path = f"/dev/{tty}"
        try:
            with open(tty_path, "w") as f:
                f.write(message + "\n")
        except Exception as e:
            print(f"[ROUTER] Failed to inject to {tty}: {e}")


if __name__ == "__main__":
    router = KeywordRouter()
    print("=" * 50)
    print("Keyword Router Active")
    print("=" * 50)
    print("Registered agents:")
    for agent, config in router.agents.items():
        print(f"  - {agent}: {config['keywords']}")
    print("\nProtocol keywords:")
    print("  - 'over' = end message, expect response")
    print("  - 'out' = end conversation, no response")
    print("  - 'all stations' = broadcast to all agents")
    print("\nListening for transcriptions...")
    print("=" * 50)

    stream_file = (
        Path.home() / ".local/share/The-New-Fuse/.voicebridge/voice_stream.txt"
    )

    last_size = 0

    while True:
        try:
            if stream_file.exists():
                current_size = stream_file.stat().st_size
                if current_size > last_size:
                    with open(stream_file, "r") as f:
                        f.seek(last_size)
                        new_content = f.read()
                        last_size = current_size

                        for line in new_content.strip().split("\n"):
                            if line:
                                router.parse_transcription(line)

            time.sleep(0.1)
        except KeyboardInterrupt:
            print("\n[ROUTER] Shutting down...")
            break
        except Exception as e:
            print(f"[ROUTER] Error: {e}")
            time.sleep(1)

#!/usr/bin/env python3
"""
[CLASS:PRIME] [STATUS:VERIFIED] [DOC_TYPE:BRIDGE_ROUTINE] [DOMAIN_SCOPE:GOOGLE_AI_INTELLIGENCE]
TNF Google Gemini & Antigravity Personal Intelligence Bridge

Discovers, indexes, normalizes, and syncs Google Gemini / Antigravity CLI sessions,
projects, conversation histories, brain transcripts, and Google AI ecosystem state
into local TNF registries (~/.tnf/sessions, ~/.local/share/tnf/sessions) and
prepares cloud-ready sync payloads for app.thenewfuse.com.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sqlite3
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def get_home() -> Path:
    return Path(os.environ.get("HOME", str(Path.home())))


def get_tnf_home() -> Path:
    env_tnf = os.environ.get("TNF_HOME")
    if env_tnf:
        return Path(env_tnf)
    return get_home() / ".tnf"


def get_gemini_home() -> Path:
    return get_home() / ".gemini"


def get_local_share_tnf() -> Path:
    return get_home() / ".local" / "share" / "tnf"


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


class GoogleAntigravityBridge:
    def __init__(self, tnf_home: Optional[Path] = None, gemini_home: Optional[Path] = None):
        self.tnf_home = tnf_home or get_tnf_home()
        self.gemini_home = gemini_home or get_gemini_home()
        self.local_share = get_local_share_tnf()

        self.db_path = self.gemini_home / "antigravity-cli" / "conversation_summaries.db"
        self.brain_dir = self.gemini_home / "antigravity-cli" / "brain"
        self.accounts_file = self.gemini_home / "google_accounts.json"
        self.projects_file = self.gemini_home / "projects.json"
        self.memory_dir = self.gemini_home / "memory"

        self.tnf_sessions_dir = self.tnf_home / "sessions"
        self.tnf_sessions_file = self.tnf_sessions_dir / "sessions.json"
        self.local_share_sessions_dir = self.local_share / "sessions"
        self.local_share_index_file = self.local_share_sessions_dir / "index.json"
        self.intel_dir = self.tnf_home / "personal-intelligence"

    def inspect_ecosystem(self) -> Dict[str, Any]:
        """Gathers status across all Google AI local assets."""
        account_info = {"active": None, "old": []}
        if self.accounts_file.exists():
            try:
                with self.accounts_file.open("r", encoding="utf-8") as f:
                    account_info = json.load(f)
            except Exception as err:
                account_info["error"] = str(err)

        projects_map = {}
        if self.projects_file.exists():
            try:
                with self.projects_file.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                    projects_map = data.get("projects", {})
            except Exception as err:
                projects_map["error"] = str(err)

        db_connected = False
        conversation_count = 0
        latest_conversation_time = None
        if self.db_path.exists():
            try:
                conn = sqlite3.connect(str(self.db_path))
                cursor = conn.cursor()
                cursor.execute("SELECT count(*), max(last_modified_time) FROM conversation_summaries;")
                row = cursor.fetchone()
                if row:
                    conversation_count = row[0]
                    latest_conversation_time = row[1]
                conn.close()
                db_connected = True
            except Exception as err:
                db_connected = False

        brain_count = 0
        if self.brain_dir.exists() and self.brain_dir.is_dir():
            brain_count = len([d for d in self.brain_dir.iterdir() if d.is_dir()])

        return {
            "account": account_info,
            "projects_count": len(projects_map),
            "projects": projects_map,
            "db_connected": db_connected,
            "db_path": str(self.db_path),
            "conversation_count": conversation_count,
            "latest_conversation_time": latest_conversation_time,
            "brain_sessions_count": brain_count,
            "intel_dir": str(self.intel_dir),
        }

    def fetch_all_conversations(self) -> List[Dict[str, Any]]:
        """Extracts all conversations from the Antigravity SQLite database."""
        if not self.db_path.exists():
            return []

        conversations = []
        try:
            conn = sqlite3.connect(str(self.db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT conversation_id, title, preview, step_count, last_modified_time,
                       workspace_uris, status, project_id, agent_name, last_user_input_time
                FROM conversation_summaries
                ORDER BY last_modified_time DESC
                """
            )
            for row in cursor.fetchall():
                conversations.append(dict(row))
            conn.close()
        except Exception as err:
            sys.stderr.write(f"Error reading conversation_summaries.db: {err}\n")

        return conversations

    def sync_to_tnf_sessions(self) -> Tuple[int, int]:
        """Synchronizes Antigravity conversations into TNF session registries."""
        convs = self.fetch_all_conversations()
        if not convs:
            return 0, 0

        self.tnf_sessions_dir.mkdir(parents=True, exist_ok=True)
        self.local_share_sessions_dir.mkdir(parents=True, exist_ok=True)
        self.intel_dir.mkdir(parents=True, exist_ok=True)

        # 1. Load existing ~/.tnf/sessions/sessions.json
        existing_tnf_sessions = []
        if self.tnf_sessions_file.exists():
            try:
                with self.tnf_sessions_file.open("r", encoding="utf-8") as f:
                    existing_tnf_sessions = json.load(f)
                    if not isinstance(existing_tnf_sessions, list):
                        existing_tnf_sessions = []
            except Exception:
                existing_tnf_sessions = []

        tnf_map = {s.get("id"): s for s in existing_tnf_sessions if isinstance(s, dict) and "id" in s}

        # 2. Load existing ~/.local/share/tnf/sessions/index.json
        existing_share_sessions = []
        if self.local_share_index_file.exists():
            try:
                with self.local_share_index_file.open("r", encoding="utf-8") as f:
                    existing_share_sessions = json.load(f)
                    if not isinstance(existing_share_sessions, list):
                        existing_share_sessions = []
            except Exception:
                existing_share_sessions = []

        share_map = {s.get("id"): s for s in existing_share_sessions if isinstance(s, dict) and "id" in s}

        synced_count = 0
        cloud_payload_entries = []

        for row in convs:
            cid = row.get("conversation_id")
            if not cid:
                continue

            session_id = f"agy-{cid[:16]}"
            title = row.get("title") or (row.get("preview")[:60] if row.get("preview") else f"Session {cid[:8]}")
            step_count = row.get("step_count") or 0
            mod_time = row.get("last_modified_time") or now_iso()
            workspace = row.get("workspace_uris") or ""
            project_id = row.get("project_id") or "general"
            status = "archived" if row.get("status") == "closed" else "active"

            brain_path = self.brain_dir / cid
            has_brain = brain_path.exists() and brain_path.is_dir()

            # Normalized TNF Session Schema
            session_entry: Dict[str, Any] = {
                "id": session_id,
                "name": title.strip(),
                "model": "google/gemini-2.0-flash",
                "provider": "google-gemini",
                "startTime": row.get("last_user_input_time") or mod_time,
                "lastMessageAt": mod_time,
                "messageCount": step_count,
                "tokenCount": step_count * 250,  # approximate token density
                "tags": ["google-ai", "antigravity", f"proj:{project_id}"],
                "status": status,
                "path": workspace,
                "metadata": {
                    "source": "antigravity-cli",
                    "originalConversationId": cid,
                    "hasBrainDir": has_brain,
                    "brainDir": str(brain_path) if has_brain else None,
                    "agentName": row.get("agent_name") or "Antigravity",
                },
            }

            tnf_map[session_id] = session_entry
            share_map[session_id] = {
                "id": session_id,
                "name": title.strip(),
                "provider": "google-gemini",
                "model": "google/gemini-2.0-flash",
                "createdAt": session_entry["startTime"],
                "updatedAt": mod_time,
                "messageCount": step_count,
                "projectPath": workspace,
                "metadata": session_entry["metadata"],
            }

            cloud_payload_entries.append({
                "sessionId": session_id,
                "conversationId": cid,
                "title": title.strip(),
                "stepCount": step_count,
                "lastActive": mod_time,
                "workspace": workspace,
                "project": project_id,
            })

            synced_count += 1

        # Write updated TNF sessions
        with self.tnf_sessions_file.open("w", encoding="utf-8") as f:
            json.dump(list(tnf_map.values()), f, indent=2)

        # Write updated Local Share index
        with self.local_share_index_file.open("w", encoding="utf-8") as f:
            json.dump(list(share_map.values()), f, indent=2)

        # Write concordance index & cloud sync payload
        concordance_path = self.intel_dir / "google_ai_session_concordance.json"
        with concordance_path.open("w", encoding="utf-8") as f:
            json.dump({
                "generatedAt": now_iso(),
                "totalSessions": len(convs),
                "syncedToTnf": synced_count,
                "sessions": cloud_payload_entries,
            }, f, indent=2)

        # Write markdown ecosystem state overview
        state_md_path = self.intel_dir / "google_ai_ecosystem_state.md"
        with state_md_path.open("w", encoding="utf-8") as f:
            f.write(f"# Google AI & Antigravity Ecosystem Concordance\n\n")
            f.write(f"- **Last Synchronized:** `{now_iso()}`\n")
            f.write(f"- **Active Google Account:** `{self.inspect_ecosystem().get('account', {}).get('active')}`\n")
            f.write(f"- **Total Indexed Conversations:** `{len(convs)}`\n")
            f.write(f"- **Total Session Brain Dirs:** `{len(list(self.brain_dir.glob('*')) if self.brain_dir.exists() else 0)}`\n")
            f.write(f"- **Synced Local TNF Registry:** [`{self.tnf_sessions_file}`](file://{self.tnf_sessions_file})\n")
            f.write(f"- **Synced Shared Store Index:** [`{self.local_share_index_file}`](file://{self.local_share_index_file})\n\n")
            f.write(f"## Recent Synced Sessions\n\n")
            f.write(f"| Session ID | Title | Steps | Last Active | Workspace |\n")
            f.write(f"|---|---|---|---|---|\n")
            for item in cloud_payload_entries[:25]:
                f.write(f"| `{item['sessionId']}` | {item['title'][:40]} | {item['stepCount']} | {item['lastActive'][:19]} | `{item['workspace'][:35]}` |\n")

        return synced_count, len(tnf_map)


def main() -> int:
    parser = argparse.ArgumentParser(description="TNF Google Gemini & Antigravity Personal Intelligence Bridge")
    parser.add_argument("--sync", action="store_true", help="Sync all conversations into TNF session registries")
    parser.add_argument("--status", action="store_true", help="Show Google AI ecosystem connection status")
    parser.add_argument("--json", action="store_true", help="Output status or sync result as JSON")
    args = parser.parse_args()

    bridge = GoogleAntigravityBridge()

    if args.status or (not args.sync):
        status = bridge.inspect_ecosystem()
        if args.json:
            print(json.dumps(status, indent=2))
        else:
            print("\n=======================================================")
            print("  TNF Google Gemini & Antigravity Intelligence Bridge")
            print("=======================================================\n")
            print(f"  Active Google Account:    {status['account'].get('active')}")
            print(f"  Conversation DB:          {'CONNECTED' if status['db_connected'] else 'NOT FOUND'} ({status['db_path']})")
            print(f"  Total Conversations:      {status['conversation_count']}")
            print(f"  Latest Conversation:      {status['latest_conversation_time']}")
            print(f"  Session Brain Folders:    {status['brain_sessions_count']}")
            print(f"  Mapped Projects:          {status['projects_count']}")
            print(f"  Intelligence Dropzone:    {status['intel_dir']}")
            print("\nRun with --sync to synchronize all sessions into TNF registries.\n")

    if args.sync:
        synced, total = bridge.sync_to_tnf_sessions()
        if args.json:
            print(json.dumps({"syncedCount": synced, "totalRegistered": total, "status": "success"}, indent=2))
        else:
            print(f"\n[SUCCESS] Synchronized {synced} Google Gemini / Antigravity conversations.")
            print(f"[SUCCESS] Total active TNF sessions in registry: {total}")
            print(f"[SUCCESS] Concordance index written to: {bridge.intel_dir / 'google_ai_session_concordance.json'}")
            print(f"[SUCCESS] Markdown overview written to: {bridge.intel_dir / 'google_ai_ecosystem_state.md'}\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())

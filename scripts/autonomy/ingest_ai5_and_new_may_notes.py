#!/usr/bin/env python3
"""
TNF source-specific ingestion batch for:
1) YouTube playlist "AI 5" metadata snapshot
2) Apple Notes folder "NEW- May-2026" content extraction

This script enforces TNF ingestion protocol by routing every item through:
  scripts/autonomy/tnf_intelligence_ingest.py
with strict source attribution and owner visibility gates.
"""

from __future__ import annotations

import argparse
import datetime as dt
import gzip
import json
import os
import re
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence
from urllib.parse import quote, urlparse, parse_qs


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PLAYLIST_JSON = ROOT / "data" / "ai-5-playlist.json"
DEFAULT_NOTES_DB = Path.home() / "Library" / "Group Containers" / "group.com.apple.notes" / "NoteStore.sqlite"
DEFAULT_NOTES_FOLDER = "NEW- May-2026"
DEFAULT_MANIFEST = ROOT / "data" / "ingestion-runs" / "ai5-new-may-2026-manifest.json"
DEFAULT_SCOUT_QUEUE = ROOT / "data" / "ingestion-runs" / "ai5-new-may-2026-scout-queue.json"
DEFAULT_ACTION_QUEUE = ROOT / "data" / "ingestion-runs" / "ai5-new-may-2026-action-queue.json"
DEFAULT_TRANSCRIPT_CACHE_DIR = ROOT / "data" / "transcripts"
DEFAULT_LEGACY_TRANSCRIPT_DIR = ROOT / "data" / "video-transcripts"
INGEST_SCRIPT = ROOT / "scripts" / "autonomy" / "tnf_intelligence_ingest.py"
ACTION_SCRIPT = ROOT / "scripts" / "autonomy" / "activate_intelligence_actions.py"
DISPATCH_SCRIPT = ROOT / "scripts" / "autonomy" / "dispatch_intelligence_tasks.py"


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def apple_time_to_iso(raw_value: Any) -> Optional[str]:
    if raw_value is None:
        return None
    try:
        base = dt.datetime(2001, 1, 1, tzinfo=dt.timezone.utc)
        return (base + dt.timedelta(seconds=float(raw_value))).isoformat().replace("+00:00", "Z")
    except Exception:
        return None


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def extract_playlist_id(video_url: str) -> str:
    try:
        parsed = urlparse(video_url)
        return parse_qs(parsed.query).get("list", ["unknown"])[0]
    except Exception:
        return "unknown"


def normalize_text_block(raw: str, max_chars: int) -> str:
    lines: List[str] = []
    for line in raw.splitlines():
        line = re.sub(r"<\d{2}:\d{2}:\d{2}\.\d{3}>", " ", line)
        line = re.sub(r"</?c>", " ", line)
        line = re.sub(r"<[^>]+>", " ", line)
        cleaned = re.sub(r"\s+", " ", line).strip()
        if not cleaned:
            continue
        if cleaned in {"WEBVTT", "Kind: captions", "Language: en"}:
            continue
        if re.match(r"^\d+$", cleaned):
            continue
        if re.match(r"^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}", cleaned):
            continue
        if re.match(r"^\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}\.\d{3}", cleaned):
            continue
        if lines and lines[-1] == cleaned:
            continue
        lines.append(cleaned)

    text = "\n".join(lines).strip()
    if len(text) > max_chars:
        return text[:max_chars].rstrip() + "\n[TRUNCATED]"
    return text


def load_cached_transcript(
    *,
    video_id: str,
    transcript_cache_dir: Path,
    legacy_transcript_dir: Path,
    max_chars: int,
) -> Optional[str]:
    candidates: List[Path] = []
    candidates.extend(
        [
            transcript_cache_dir / f"{video_id}.txt",
            transcript_cache_dir / f"{video_id}.en.txt",
            transcript_cache_dir / f"{video_id}.en.vtt",
        ]
    )
    if legacy_transcript_dir.exists():
        candidates.extend(sorted(legacy_transcript_dir.glob(f"*_{video_id}.txt")))
        candidates.extend(sorted(legacy_transcript_dir.glob(f"*_{video_id}.en.vtt")))

    for path in candidates:
        if not path.exists():
            continue
        try:
            raw = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        text = normalize_text_block(raw, max_chars=max_chars)
        if len(text) >= 200:
            return text
    return None


def fetch_transcript_with_ytdlp(
    *,
    video_url: str,
    video_id: str,
    transcript_cache_dir: Path,
    max_chars: int,
    timeout_sec: int,
) -> Optional[str]:
    transcript_cache_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="tnf-transcript-") as tmp_dir_raw:
        tmp_dir = Path(tmp_dir_raw)
        command = [
            "yt-dlp",
            "--skip-download",
            "--write-subs",
            "--write-auto-subs",
            "--sub-langs",
            "en.*,en",
            "--sub-format",
            "vtt",
            "--output",
            str(tmp_dir / "%(id)s.%(ext)s"),
            video_url,
        ]
        try:
            proc = subprocess.run(
                command,
                text=True,
                capture_output=True,
                cwd=str(ROOT),
                check=False,
                timeout=max(5, int(timeout_sec)),
            )
        except Exception:
            return None
        if proc.returncode != 0:
            return None

        vtt_files = sorted(tmp_dir.glob(f"{video_id}*.vtt"))
        if not vtt_files:
            return None
        vtt_path = max(vtt_files, key=lambda p: p.stat().st_size)
        try:
            raw = vtt_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return None

        transcript = normalize_text_block(raw, max_chars=max_chars)
        if len(transcript) < 200:
            return None

        out_path = transcript_cache_dir / f"{video_id}.txt"
        out_path.write_text(transcript + "\n", encoding="utf-8")
        return transcript


def resolve_video_transcript(
    *,
    video: Dict[str, Any],
    transcript_cache_dir: Path,
    legacy_transcript_dir: Path,
    max_chars: int,
    fetch_transcripts: bool,
    dry_run: bool,
    fetch_timeout_sec: int,
) -> Dict[str, Any]:
    video_id = str(video.get("videoId", "")).strip()
    if not video_id:
        return {"status": "missing_video_id", "text": ""}

    cached = load_cached_transcript(
        video_id=video_id,
        transcript_cache_dir=transcript_cache_dir,
        legacy_transcript_dir=legacy_transcript_dir,
        max_chars=max_chars,
    )
    if cached:
        return {"status": "cache_hit", "text": cached}

    if not fetch_transcripts or dry_run:
        return {"status": "cache_miss", "text": ""}

    fetched = fetch_transcript_with_ytdlp(
        video_url=str(video.get("url", "")),
        video_id=video_id,
        transcript_cache_dir=transcript_cache_dir,
        max_chars=max_chars,
        timeout_sec=fetch_timeout_sec,
    )
    if fetched:
        return {"status": "fetched", "text": fetched}
    return {"status": "fetch_failed", "text": ""}


def extract_note_text(blob: Optional[bytes]) -> str:
    if not blob:
        return ""

    raw = blob
    if len(raw) > 2 and raw[0] == 0x1F and raw[1] == 0x8B:
        try:
            raw = gzip.decompress(raw)
        except Exception:
            pass

    decoded = raw.decode("utf-8", errors="ignore")
    segments = re.findall(r"[ -~\t\n]{4,}", decoded)

    lines: List[str] = []
    for segment in segments:
        for line in segment.splitlines():
            cleaned = re.sub(r"\s+", " ", line).strip()
            if len(cleaned) < 2:
                continue
            if not lines or lines[-1] != cleaned:
                lines.append(cleaned)

    # Bound extremely long payloads while keeping substantial context.
    if len(lines) > 1200:
        lines = lines[:1200]
    return "\n".join(lines).strip()


def fetch_notes_from_folder(db_path: Path, folder_title: str) -> Dict[str, Any]:
    connection = sqlite3.connect(str(db_path))
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()

    folder_row = cursor.execute(
        """
        SELECT Z_PK
        FROM ZICCLOUDSYNCINGOBJECT
        WHERE Z_ENT = 14 AND ZTITLE2 = ?
        LIMIT 1
        """,
        (folder_title,),
    ).fetchone()
    if not folder_row:
        raise RuntimeError(f"Folder not found in Apple Notes DB: {folder_title}")

    folder_pk = int(folder_row["Z_PK"])
    note_rows = cursor.execute(
        """
        SELECT
          Z_PK,
          COALESCE(NULLIF(TRIM(ZTITLE1), ''), NULLIF(TRIM(ZTITLE2), ''), NULLIF(TRIM(ZTITLE), ''), '[Untitled]') AS title,
          COALESCE(NULLIF(TRIM(ZSNIPPET), ''), NULLIF(TRIM(ZSUMMARY), ''), '') AS snippet,
          ZCREATIONDATE1 AS created_raw,
          ZMODIFICATIONDATE1 AS modified_raw,
          ZNOTEDATA
        FROM ZICCLOUDSYNCINGOBJECT
        WHERE Z_ENT = 11
          AND ZFOLDER = ?
          AND COALESCE(ZMARKEDFORDELETION, 0) = 0
        ORDER BY ZMODIFICATIONDATE1 DESC
        """,
        (folder_pk,),
    ).fetchall()

    notes: List[Dict[str, Any]] = []
    for row in note_rows:
        note_data_pk = row["ZNOTEDATA"]
        blob: Optional[bytes] = None
        if note_data_pk is not None:
            note_data_row = cursor.execute(
                "SELECT ZDATA FROM ZICNOTEDATA WHERE Z_PK = ? LIMIT 1",
                (note_data_pk,),
            ).fetchone()
            if note_data_row is not None:
                blob = note_data_row["ZDATA"]

        extracted_text = extract_note_text(blob)
        snippet = (row["snippet"] or "").strip()
        if len(extracted_text) < 40:
            extracted_text = snippet

        notes.append(
            {
                "notePk": int(row["Z_PK"]),
                "title": row["title"],
                "snippet": snippet,
                "createdAt": apple_time_to_iso(row["created_raw"]),
                "modifiedAt": apple_time_to_iso(row["modified_raw"]),
                "content": extracted_text,
            }
        )

    connection.close()
    return {
        "folderPk": folder_pk,
        "folderTitle": folder_title,
        "count": len(notes),
        "notes": notes,
    }


def build_video_text(video: Dict[str, Any], playlist_id: str, transcript_text: str, transcript_status: str) -> str:
    transcript_section = transcript_text if transcript_text else "(Transcript unavailable in this run.)"
    return "\n".join(
        [
            "TNF Source Intake: YouTube Personal Sensor",
            f"Playlist: AI 5 ({playlist_id})",
            f"Video Index: {video.get('index', '')}",
            f"Video Title: {video.get('title', '')}",
            f"Video URL: {video.get('url', '')}",
            f"Video ID: {video.get('videoId', '')}",
            f"Transcript Status: {transcript_status}",
            "",
            "Transcript / Captions:",
            transcript_section,
            "",
            "TNF Extraction Constraint:",
            "Only classify and promote statements that are explicitly present in transcript text.",
        ]
    )


def build_note_text(note: Dict[str, Any]) -> str:
    body = note.get("content", "") or note.get("snippet", "")
    return "\n".join(
        [
            "TNF Source Intake: Apple Notes Personal Ledger",
            "Account: On My Mac",
            "Folder: NEW- May-2026",
            f"Note PK: {note.get('notePk')}",
            f"Title: {note.get('title', '')}",
            f"Modified At: {note.get('modifiedAt', '')}",
            "",
            "Extracted Content:",
            body,
        ]
    )


def parse_json_maybe(raw: str) -> Dict[str, Any]:
    try:
        return json.loads(raw)
    except Exception:
        start = raw.find("{")
        end = raw.rfind("}")
        if start >= 0 and end > start:
            candidate = raw[start : end + 1]
            try:
                return json.loads(candidate)
            except Exception:
                pass
        return {"raw": raw}


def run_tnf_ingest(
    *,
    source_id: str,
    source_type: str,
    source_uri: str,
    source_title: str,
    owner_principal_id: str,
    visibility: str,
    release_state: str,
    text_payload: str,
    dry_run: bool,
) -> Dict[str, Any]:
    command: List[str] = [
        sys.executable,
        str(INGEST_SCRIPT),
        "--source-id",
        source_id,
        "--source-type",
        source_type,
        "--source-uri",
        source_uri,
        "--source-title",
        source_title,
        "--owner-principal-id",
        owner_principal_id,
        "--visibility",
        visibility,
        "--release-state",
        release_state,
        "--stdin",
        "--json",
        "--markdown",
    ]
    if dry_run:
        command.append("--dry-run")

    proc = subprocess.run(
        command,
        input=text_payload,
        text=True,
        capture_output=True,
        cwd=str(ROOT),
        check=False,
    )
    output = parse_json_maybe(proc.stdout.strip())
    return {
        "ok": proc.returncode == 0,
        "returncode": proc.returncode,
        "result": output,
        "stderr": proc.stderr.strip(),
    }


def run_action_activation(
    *,
    manifest_path: Path,
    action_queue_path: Path,
    source_prefixes: str,
    dry_run: bool,
) -> Dict[str, Any]:
    if not ACTION_SCRIPT.exists():
        return {
            "ok": False,
            "returncode": 127,
            "stderr": f"Action activation script missing: {ACTION_SCRIPT}",
            "result": {},
        }

    command: List[str] = [
        sys.executable,
        str(ACTION_SCRIPT),
        "--manifest-path",
        str(manifest_path),
        "--out-path",
        str(action_queue_path),
        "--source-prefixes",
        source_prefixes,
        "--json",
    ]
    if dry_run:
        command.append("--dry-run")

    proc = subprocess.run(
        command,
        text=True,
        capture_output=True,
        cwd=str(ROOT),
        check=False,
    )
    return {
        "ok": proc.returncode == 0,
        "returncode": proc.returncode,
        "stderr": proc.stderr.strip(),
        "result": parse_json_maybe(proc.stdout.strip()),
    }


def run_dispatch(
    *,
    action_queue_path: Path,
    min_confidence: str,
    max_dispatch: int,
    dry_run: bool,
) -> Dict[str, Any]:
    if not DISPATCH_SCRIPT.exists():
        return {
            "ok": False,
            "returncode": 127,
            "stderr": f"Dispatch script missing: {DISPATCH_SCRIPT}",
            "result": {},
        }
    command: List[str] = [
        sys.executable,
        str(DISPATCH_SCRIPT),
        "--action-queue-path",
        str(action_queue_path),
        "--min-confidence",
        min_confidence,
        "--max-dispatch",
        str(max(0, int(max_dispatch))),
        "--json",
    ]
    if dry_run:
        command.append("--dry-run")
    proc = subprocess.run(
        command,
        text=True,
        capture_output=True,
        cwd=str(ROOT),
        check=False,
    )
    return {
        "ok": proc.returncode == 0,
        "returncode": proc.returncode,
        "stderr": proc.stderr.strip(),
        "result": parse_json_maybe(proc.stdout.strip()),
    }


def load_existing_processed_ids(manifest_path: Path) -> set[str]:
    if not manifest_path.exists():
        return set()
    try:
        payload = read_json(manifest_path)
    except Exception:
        return set()
    out: set[str] = set()
    for item in payload.get("items", []):
        if item.get("ok") and item.get("sourceId"):
            out.add(str(item["sourceId"]))
    return out


def parse_csv_filter(raw: str) -> set[str]:
    return {item.strip() for item in str(raw or "").split(",") if item.strip()}


def main(argv: Sequence[str]) -> int:
    parser = argparse.ArgumentParser(description="Ingest AI 5 playlist + NEW- May-2026 notes into TNF intelligence artifacts")
    parser.add_argument("--playlist-json", default=str(DEFAULT_PLAYLIST_JSON))
    parser.add_argument("--notes-db", default=str(DEFAULT_NOTES_DB))
    parser.add_argument("--notes-folder", default=DEFAULT_NOTES_FOLDER)
    parser.add_argument("--owner-principal-id", default="danielgoldberg")
    parser.add_argument("--visibility", default="private")
    parser.add_argument("--release-state", default="sealed")
    parser.add_argument("--manifest-path", default=str(DEFAULT_MANIFEST))
    parser.add_argument("--scout-queue-path", default=str(DEFAULT_SCOUT_QUEUE))
    parser.add_argument("--action-queue-path", default=str(DEFAULT_ACTION_QUEUE))
    parser.add_argument("--transcript-cache-dir", default=str(DEFAULT_TRANSCRIPT_CACHE_DIR))
    parser.add_argument("--legacy-transcript-dir", default=str(DEFAULT_LEGACY_TRANSCRIPT_DIR))
    parser.add_argument("--transcript-max-chars", type=int, default=30000)
    parser.add_argument("--transcript-fetch-timeout-sec", type=int, default=45)
    parser.add_argument("--skip-transcript-fetch", action="store_true")
    parser.add_argument("--skip-action-activation", action="store_true")
    parser.add_argument("--auto-dispatch", action="store_true", help="Dispatch execution candidates to TNF task queue")
    parser.add_argument("--dispatch-min-confidence", default="medium", choices=["low", "medium", "high"])
    parser.add_argument("--dispatch-max", type=int, default=25)
    parser.add_argument("--dispatch-dry-run", action="store_true")
    parser.add_argument(
        "--action-source-prefixes",
        default="yt-ai5-",
        help="Comma-separated source prefixes to promote into action queue",
    )
    parser.add_argument("--limit-videos", type=int, default=0, help="0 means no limit")
    parser.add_argument("--limit-notes", type=int, default=0, help="0 means no limit")
    parser.add_argument("--video-id-filter", default="", help="Comma-separated video IDs to ingest")
    parser.add_argument("--note-pk-filter", default="", help="Comma-separated Apple Note PK values to ingest")
    parser.add_argument("--skip-existing", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    playlist_path = Path(args.playlist_json).resolve()
    notes_db_path = Path(args.notes_db).expanduser().resolve()
    manifest_path = Path(args.manifest_path).resolve()
    scout_path = Path(args.scout_queue_path).resolve()
    action_queue_path = Path(args.action_queue_path).resolve()
    transcript_cache_dir = Path(args.transcript_cache_dir).expanduser().resolve()
    legacy_transcript_dir = Path(args.legacy_transcript_dir).expanduser().resolve()

    if not playlist_path.exists():
        raise FileNotFoundError(f"Playlist JSON missing: {playlist_path}")
    if not notes_db_path.exists():
        raise FileNotFoundError(f"Apple Notes DB missing: {notes_db_path}")
    if not INGEST_SCRIPT.exists():
        raise FileNotFoundError(f"TNF ingest script missing: {INGEST_SCRIPT}")

    playlist: List[Dict[str, Any]] = read_json(playlist_path)
    if not isinstance(playlist, list):
        raise RuntimeError("Playlist JSON must be an array")
    playlist_id = extract_playlist_id(playlist[0]["url"]) if playlist else "unknown"

    notes_data = fetch_notes_from_folder(notes_db_path, args.notes_folder)

    video_items = playlist[: args.limit_videos] if args.limit_videos > 0 else playlist
    note_items = notes_data["notes"][: args.limit_notes] if args.limit_notes > 0 else notes_data["notes"]
    video_filter = parse_csv_filter(args.video_id_filter)
    note_filter = parse_csv_filter(args.note_pk_filter)
    if video_filter:
        video_items = [video for video in video_items if str(video.get("videoId", "")).strip() in video_filter]
    if note_filter:
        note_items = [note for note in note_items if str(note.get("notePk", "")).strip() in note_filter]

    existing_manifest: Dict[str, Any] = {}
    existing_items_by_id: Dict[str, Dict[str, Any]] = {}
    if manifest_path.exists():
        try:
            existing_manifest = read_json(manifest_path)
            for item in existing_manifest.get("items", []):
                source_id = str(item.get("sourceId", "")).strip()
                if source_id:
                    existing_items_by_id[source_id] = item
        except Exception:
            existing_manifest = {}
            existing_items_by_id = {}

    processed_ids = set(existing_items_by_id.keys()) if args.skip_existing else set()
    existing_scout_by_id: Dict[str, Dict[str, Any]] = {}
    if scout_path.exists():
        try:
            existing_scout = read_json(scout_path)
            for entry in existing_scout.get("queue", []):
                source_id = str(entry.get("source_id", "")).strip()
                if source_id:
                    existing_scout_by_id[source_id] = entry
        except Exception:
            existing_scout_by_id = {}

    results: List[Dict[str, Any]] = []

    for video in video_items:
        source_id = f"yt-ai5-{video.get('videoId')}"
        if source_id in processed_ids:
            continue
        source_uri = video.get("url", "")
        source_title = video.get("title", "") or source_id
        transcript = resolve_video_transcript(
            video=video,
            transcript_cache_dir=transcript_cache_dir,
            legacy_transcript_dir=legacy_transcript_dir,
            max_chars=max(2000, int(args.transcript_max_chars)),
            fetch_transcripts=not args.skip_transcript_fetch,
            dry_run=args.dry_run,
            fetch_timeout_sec=max(5, int(args.transcript_fetch_timeout_sec)),
        )
        ingest_result = run_tnf_ingest(
            source_id=source_id,
            source_type="video",
            source_uri=source_uri,
            source_title=source_title,
            owner_principal_id=args.owner_principal_id,
            visibility=args.visibility,
            release_state=args.release_state,
            text_payload=build_video_text(
                video,
                playlist_id,
                transcript_text=str(transcript.get("text", "")),
                transcript_status=str(transcript.get("status", "unknown")),
            ),
            dry_run=args.dry_run,
        )
        
        # [NEW] Phase 4 Acceleration: Run V2 Extractor if transcript is available.
        if not args.dry_run and transcript.get("text") and len(str(transcript.get("text", ""))) > 200:
            print(f"🔥 [V2] Extracting implementation directives for {source_id}...")
            api_key = os.environ.get("GEMINI_API_KEY", "").strip()
            transcript_file = transcript_cache_dir / f"{video.get('videoId')}.txt"
            if not transcript_file.exists():
                transcript_file.write_text(str(transcript.get("text", "")) + "\n", encoding="utf-8")
            if not api_key:
                print(f"⚠️ [V2] Skipping {source_id}: GEMINI_API_KEY is not set")
            else:
                v2_cmd = [
                    sys.executable,
                    str(ROOT / "scripts" / "autonomy" / "procedural_extractor_v2.py"),
                    "--input", str(transcript_file),
                    "--source-id", source_id,
                    "--api-key", api_key,
                ]
                try:
                    subprocess.run(v2_cmd, check=False)
                except Exception as e:
                    print(f"⚠️ V2 Extraction failed for {source_id}: {e}")

        item_payload = {
            "sourceId": source_id,
            "sourceType": "video",
            "sourceUri": source_uri,
            "title": source_title,
            "transcriptStatus": transcript.get("status"),
            "artifactId": (
                ingest_result.get("result", {}).get("artifact_id")
                or ingest_result.get("result", {}).get("artifactId")
            ),
            **ingest_result,
        }
        results.append(item_payload)
        existing_items_by_id[source_id] = item_payload
        existing_scout_by_id[source_id] = {
            "source_id": source_id,
            "source_type": "video",
            "discovery_layer": "personal_sensor",
            "authority_scout_query": source_title,
            "priority": "medium",
        }

    for note in note_items:
        note_pk = note.get("notePk")
        source_id = f"apple-notes-new-may-2026-{note_pk}"
        if source_id in processed_ids:
            continue
        source_uri = f"apple-notes://on-my-mac/{quote(args.notes_folder)}/{note_pk}"
        source_title = note.get("title", "") or source_id
        ingest_result = run_tnf_ingest(
            source_id=source_id,
            source_type="note",
            source_uri=source_uri,
            source_title=source_title,
            owner_principal_id=args.owner_principal_id,
            visibility=args.visibility,
            release_state=args.release_state,
            text_payload=build_note_text(note),
            dry_run=args.dry_run,
        )
        item_payload = {
            "sourceId": source_id,
            "sourceType": "note",
            "sourceUri": source_uri,
            "title": source_title,
            "artifactId": (
                ingest_result.get("result", {}).get("artifact_id")
                or ingest_result.get("result", {}).get("artifactId")
            ),
            **ingest_result,
        }
        results.append(item_payload)
        existing_items_by_id[source_id] = item_payload
        existing_scout_by_id[source_id] = {
            "source_id": source_id,
            "source_type": "note",
            "discovery_layer": "personal_ledger",
            "authority_scout_query": source_title,
            "priority": "medium",
        }

    success_count = sum(1 for item in results if item.get("ok"))
    merged_items = [
        existing_items_by_id[source_id]
        for source_id in sorted(existing_items_by_id.keys())
    ]
    manifest_payload = {
        "generatedAt": now_iso(),
        "dryRun": args.dry_run,
        "playlist": {
            "path": str(playlist_path),
            "playlistId": playlist_id,
            "count": len(video_items),
        },
        "notes": {
            "dbPath": str(notes_db_path),
            "folderTitle": args.notes_folder,
            "folderPk": notes_data.get("folderPk"),
            "count": len(note_items),
        },
        "owner": args.owner_principal_id,
        "visibility": args.visibility,
        "releaseState": args.release_state,
        "previousTrackedCount": len(existing_manifest.get("items", [])),
        "summary": {
            "attemptedThisRun": len(results),
            "succeededThisRun": success_count,
            "failedThisRun": len(results) - success_count,
            "trackedTotal": len(merged_items),
        },
        "items": merged_items,
    }

    write_json(manifest_path, manifest_payload)
    merged_scout_queue = [
        existing_scout_by_id[source_id]
        for source_id in sorted(existing_scout_by_id.keys())
    ]
    write_json(
        scout_path,
        {
            "generatedAt": now_iso(),
            "seedSource": "ai5-and-new-may-2026-intake",
            "queue": merged_scout_queue,
        },
    )

    activation_result: Optional[Dict[str, Any]] = None
    dispatch_result: Optional[Dict[str, Any]] = None
    if not args.skip_action_activation:
        activation_result = run_action_activation(
            manifest_path=manifest_path,
            action_queue_path=action_queue_path,
            source_prefixes=str(args.action_source_prefixes),
            dry_run=args.dry_run,
        )
        if (
            args.auto_dispatch
            and activation_result.get("ok")
            and action_queue_path.exists()
        ):
            dispatch_result = run_dispatch(
                action_queue_path=action_queue_path,
                min_confidence=str(args.dispatch_min_confidence),
                max_dispatch=int(args.dispatch_max),
                dry_run=bool(args.dry_run or args.dispatch_dry_run),
            )

    print(
        json.dumps(
            {
                "manifest": str(manifest_path),
                "scoutQueue": str(scout_path),
                "actionQueue": str(action_queue_path),
                "attempted": len(results),
                "succeeded": success_count,
                "failed": len(results) - success_count,
                "activation": activation_result,
                "dispatch": dispatch_result,
            },
            indent=2,
        )
    )
    if success_count != len(results):
        return 2
    if activation_result and not activation_result.get("ok"):
        return 3
    if dispatch_result and not dispatch_result.get("ok"):
        return 4
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

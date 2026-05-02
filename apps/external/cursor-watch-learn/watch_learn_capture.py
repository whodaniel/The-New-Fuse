#!/usr/bin/env python3
"""Live desktop watch-and-learn capture loop."""

from __future__ import annotations

import argparse
import base64
import csv
import datetime as dt
import json
import math
import os
import platform
import queue
import shutil
import signal
import subprocess
import threading
import time
from collections import Counter, deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

try:
    from pynput import mouse
except ImportError:
    mouse = None  # type: ignore[assignment]

UTC = dt.timezone.utc


def now_iso(epoch_seconds: float | None = None) -> str:
    if epoch_seconds is None:
        epoch_seconds = time.time()
    return dt.datetime.fromtimestamp(epoch_seconds, tz=UTC).isoformat().replace("+00:00", "Z")


def require_mouse_dependency() -> None:
    if mouse is None:
        raise RuntimeError(
            "Missing dependency 'pynput'. Install with: pip install -r requirements.txt"
        )


def capture_screenshot(output_path: Path, system: str) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if system == "Darwin":
        cmd = ["screencapture", "-x", str(output_path)]
        subprocess.run(cmd, check=True)
        return

    if system == "Linux":
        if shutil.which("scrot"):
            cmd = ["scrot", str(output_path)]
        elif shutil.which("gnome-screenshot"):
            cmd = ["gnome-screenshot", "-f", str(output_path)]
        elif shutil.which("import"):
            cmd = ["import", "-window", "root", str(output_path)]
        else:
            raise RuntimeError("No Linux screenshot command found (scrot/gnome-screenshot/import).")
        subprocess.run(cmd, check=True)
        return

    if system == "Windows":
        escaped = str(output_path).replace("'", "''")
        script = (
            "Add-Type -AssemblyName System.Windows.Forms; "
            "Add-Type -AssemblyName System.Drawing; "
            "$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; "
            "$bmp = New-Object System.Drawing.Bitmap($bounds.Width,$bounds.Height); "
            "$g=[System.Drawing.Graphics]::FromImage($bmp); "
            "$g.CopyFromScreen($bounds.Location,[System.Drawing.Point]::Empty,$bounds.Size); "
            f"$bmp.Save('{escaped}'); "
            "$g.Dispose(); $bmp.Dispose();"
        )
        cmd = ["powershell", "-NoProfile", "-Command", script]
        subprocess.run(cmd, check=True)
        return

    raise RuntimeError(f"Unsupported platform: {system}")


def get_active_context(system: str, enabled: bool) -> dict[str, Any]:
    if not enabled:
        return {"app": None, "window": None, "source": "disabled"}

    if system != "Darwin":
        return {"app": None, "window": None, "source": "not_supported"}

    script = r'''
        tell application "System Events"
            set appName to ""
            set windowTitle to ""
            try
                set frontApp to first application process whose frontmost is true
                set appName to name of frontApp
                try
                    set windowTitle to name of front window of frontApp
                end try
            end try
            return appName & "||" & windowTitle
        end tell
    '''

    try:
        proc = subprocess.run(
            ["osascript", "-e", script],
            check=False,
            capture_output=True,
            text=True,
            timeout=1.2,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {
            "app": None,
            "window": None,
            "source": "osascript_error",
            "error": str(exc),
        }

    if proc.returncode != 0:
        err = (proc.stderr or "").strip() or (proc.stdout or "").strip() or "unknown_error"
        return {
            "app": None,
            "window": None,
            "source": "osascript_error",
            "error": err,
        }

    raw = (proc.stdout or "").strip()
    app, _, window = raw.partition("||")
    return {
        "app": app or None,
        "window": window or None,
        "source": "osascript",
    }


@dataclass
class SharedCursorState:
    lock: threading.Lock = field(default_factory=threading.Lock)
    cursor_x: float = 0.0
    cursor_y: float = 0.0
    last_move_x: float | None = None
    last_move_y: float | None = None
    pending_events: list[dict[str, Any]] = field(default_factory=list)
    last_event_epoch: float | None = None
    event_seq: int = 0

    def seed_cursor(self, x: float, y: float) -> None:
        with self.lock:
            self.cursor_x = x
            self.cursor_y = y
            self.last_move_x = x
            self.last_move_y = y

    def add_move(self, x: float, y: float) -> None:
        epoch = time.time()
        with self.lock:
            dx = 0.0
            dy = 0.0
            distance = 0.0
            if self.last_move_x is not None and self.last_move_y is not None:
                dx = float(x) - self.last_move_x
                dy = float(y) - self.last_move_y
                distance = math.hypot(dx, dy)

            self.last_move_x = float(x)
            self.last_move_y = float(y)
            self.cursor_x = float(x)
            self.cursor_y = float(y)
            self.event_seq += 1

            event = {
                "event_id": self.event_seq,
                "timestamp": now_iso(epoch),
                "ts_epoch": epoch,
                "event_type": "move",
                "x": round(float(x), 2),
                "y": round(float(y), 2),
                "dx": round(dx, 2),
                "dy": round(dy, 2),
                "distance_px": round(distance, 2),
            }
            self.pending_events.append(event)
            self.last_event_epoch = epoch

    def add_click(self, x: float, y: float, button: Any, pressed: bool) -> None:
        epoch = time.time()
        with self.lock:
            self.cursor_x = float(x)
            self.cursor_y = float(y)
            self.event_seq += 1
            event = {
                "event_id": self.event_seq,
                "timestamp": now_iso(epoch),
                "ts_epoch": epoch,
                "event_type": "click_down" if pressed else "click_up",
                "x": round(float(x), 2),
                "y": round(float(y), 2),
                "button": str(button),
            }
            self.pending_events.append(event)
            self.last_event_epoch = epoch

    def add_scroll(self, x: float, y: float, dx: float, dy: float) -> None:
        epoch = time.time()
        with self.lock:
            self.cursor_x = float(x)
            self.cursor_y = float(y)
            self.event_seq += 1
            event = {
                "event_id": self.event_seq,
                "timestamp": now_iso(epoch),
                "ts_epoch": epoch,
                "event_type": "scroll",
                "x": round(float(x), 2),
                "y": round(float(y), 2),
                "scroll_dx": round(float(dx), 2),
                "scroll_dy": round(float(dy), 2),
            }
            self.pending_events.append(event)
            self.last_event_epoch = epoch

    def snapshot_and_clear(self) -> tuple[dict[str, float], list[dict[str, Any]], float | None]:
        with self.lock:
            cursor = {
                "x": round(self.cursor_x, 2),
                "y": round(self.cursor_y, 2),
            }
            events = self.pending_events
            self.pending_events = []
            last_event_epoch = self.last_event_epoch
        return cursor, events, last_event_epoch


def start_mouse_listener(state: SharedCursorState) -> Any:
    require_mouse_dependency()

    def on_move(x: float, y: float) -> None:
        state.add_move(x, y)

    def on_click(x: float, y: float, button: Any, pressed: bool) -> None:
        state.add_click(x, y, button, pressed)

    def on_scroll(x: float, y: float, dx: float, dy: float) -> None:
        state.add_scroll(x, y, dx, dy)

    listener = mouse.Listener(on_move=on_move, on_click=on_click, on_scroll=on_scroll)
    listener.start()

    try:
        controller = mouse.Controller()
        x, y = controller.position
        state.seed_cursor(float(x), float(y))
    except Exception:
        # Some environments block initial position reads. Listener still updates state.
        pass

    return listener


def infer_intent(
    click_count: int,
    scroll_count: int,
    move_distance: float,
    event_count: int,
) -> str:
    if click_count > 0:
        return "click_interaction"
    if scroll_count > 0:
        return "scroll_navigation"
    if move_distance >= 160.0:
        return "cursor_navigation"
    if event_count == 0:
        return "idle"
    return "hover_or_positioning"


def classify_relationship(
    click_count: int,
    scroll_count: int,
    move_distance: float,
    cursor_to_last_action_distance: float | None,
) -> str:
    if click_count > 0 and cursor_to_last_action_distance is not None and cursor_to_last_action_distance <= 8:
        return "cursor_triggered_action"
    if scroll_count > 0:
        return "cursor_context_scroll"
    if move_distance > 160.0:
        return "cursor_navigation"
    return "cursor_idle_or_hover"


class RelationWorker(threading.Thread):
    def __init__(
        self,
        frame_queue: queue.Queue[Any],
        output_path: Path,
        llm_queue: queue.Queue[Any] | None = None,
        llm_frame_stride: int = 1,
        llm_backend: str | None = None,
    ) -> None:
        super().__init__(daemon=True)
        self.frame_queue = frame_queue
        self.output_path = output_path
        self.llm_queue = llm_queue
        self.llm_frame_stride = max(1, llm_frame_stride)
        self.llm_backend = llm_backend
        self.processed_frames = 0
        self.forwarded_to_llm = 0
        self.dropped_for_llm_backpressure = 0

    def run(self) -> None:
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        with self.output_path.open("a", encoding="utf-8", buffering=1) as handle:
            while True:
                item = self.frame_queue.get()
                if item is None:
                    if self.llm_queue is not None:
                        self.llm_queue.put(None)
                    break

                enriched = self._enrich(item)
                handle.write(json.dumps(enriched, ensure_ascii=True) + "\n")
                self.processed_frames += 1
                self._forward_to_llm(enriched)

    def _forward_to_llm(self, frame: dict[str, Any]) -> None:
        if self.llm_queue is None:
            return
        frame_id = as_int(frame.get("frame_id"))
        if frame_id % self.llm_frame_stride != 0:
            return

        payload: dict[str, Any] = {
            "frame_id": frame.get("frame_id"),
            "captured_at": frame.get("captured_at"),
            "window_start_at": frame.get("window_start_at"),
            "window_end_at": frame.get("window_end_at"),
            "screenshot_path": frame.get("screenshot_path"),
            "cursor": frame.get("cursor"),
            "active_context": frame.get("active_context"),
            "event_summary": frame.get("event_summary"),
            "action_events": frame.get("action_events"),
            "event_time_range": frame.get("event_time_range"),
        }
        if self.llm_backend == "openai_sdk":
            screenshot_path = Path(str(frame.get("screenshot_path", "")))
            try:
                raw_bytes = screenshot_path.read_bytes()
                payload["image_b64"] = base64.b64encode(raw_bytes).decode("ascii")
                payload["image_encoding"] = "base64_png"
            except OSError as exc:
                payload["image_b64"] = None
                payload["image_encoding"] = None
                payload["image_error"] = str(exc)

        try:
            self.llm_queue.put(payload, timeout=0.05)
            self.forwarded_to_llm += 1
        except queue.Full:
            self.dropped_for_llm_backpressure += 1

    @staticmethod
    def _enrich(frame: dict[str, Any]) -> dict[str, Any]:
        events: list[dict[str, Any]] = frame.pop("events")
        counts = Counter(event.get("event_type", "unknown") for event in events)
        move_distance = round(
            sum(float(event.get("distance_px", 0.0)) for event in events if event.get("event_type") == "move"),
            2,
        )

        click_count = int(counts.get("click_down", 0) + counts.get("click_up", 0))
        scroll_count = int(counts.get("scroll", 0))
        action_events = [event for event in events if event.get("event_type") != "move"]
        last_action = action_events[-1] if action_events else None

        cursor = frame.get("cursor", {"x": 0.0, "y": 0.0})
        cursor_to_last_action_distance = None
        if last_action is not None:
            ax = float(last_action.get("x", cursor.get("x", 0.0)))
            ay = float(last_action.get("y", cursor.get("y", 0.0)))
            cx = float(cursor.get("x", 0.0))
            cy = float(cursor.get("y", 0.0))
            cursor_to_last_action_distance = round(math.hypot(cx - ax, cy - ay), 2)

        captured_epoch = float(frame.get("captured_epoch", time.time()))
        last_event_epoch = frame.get("last_event_epoch")
        idle_ms = None
        if last_event_epoch is not None:
            idle_ms = round(max(0.0, (captured_epoch - float(last_event_epoch)) * 1000.0), 2)

        frame["event_summary"] = {
            "event_count": len(events),
            "move_count": int(counts.get("move", 0)),
            "click_count": click_count,
            "scroll_count": scroll_count,
            "move_distance_px": move_distance,
            "idle_ms_since_last_event": idle_ms,
            "cursor_to_last_action_distance_px": cursor_to_last_action_distance,
            "relationship_label": classify_relationship(
                click_count,
                scroll_count,
                move_distance,
                cursor_to_last_action_distance,
            ),
            "intent": infer_intent(click_count, scroll_count, move_distance, len(events)),
        }

        if action_events:
            frame["action_events"] = action_events[-10:]
        else:
            frame["action_events"] = []

        if events:
            frame["event_time_range"] = {
                "first_event_at": events[0].get("timestamp"),
                "last_event_at": events[-1].get("timestamp"),
                "first_event_epoch": events[0].get("ts_epoch"),
                "last_event_epoch": events[-1].get("ts_epoch"),
            }
        else:
            frame["event_time_range"] = {
                "first_event_at": None,
                "last_event_at": None,
                "first_event_epoch": None,
                "last_event_epoch": None,
            }

        return frame


class RetentionWorker(threading.Thread):
    def __init__(
        self,
        retention_queue: queue.Queue[Any],
        prune_log_path: Path,
        max_screenshots: int,
    ) -> None:
        super().__init__(daemon=True)
        self.retention_queue = retention_queue
        self.prune_log_path = prune_log_path
        self.max_screenshots = max_screenshots
        self.tracked: deque[dict[str, Any]] = deque()
        self.pruned = 0

    def run(self) -> None:
        self.prune_log_path.parent.mkdir(parents=True, exist_ok=True)
        with self.prune_log_path.open("a", encoding="utf-8", buffering=1) as handle:
            while True:
                item = self.retention_queue.get()
                if item is None:
                    break

                self.tracked.append(item)
                while len(self.tracked) > self.max_screenshots:
                    stale = self.tracked.popleft()
                    stale_path = Path(stale["screenshot_path"])
                    removed = False
                    error = None
                    try:
                        stale_path.unlink()
                        removed = True
                        self.pruned += 1
                    except FileNotFoundError:
                        error = "already_missing"
                    except OSError as exc:
                        error = str(exc)

                    record = {
                        "timestamp": now_iso(),
                        "reason": "max_screenshots_exceeded",
                        "max_screenshots": self.max_screenshots,
                        "removed": removed,
                        "error": error,
                        "removed_frame_id": stale.get("frame_id"),
                        "removed_screenshot_path": str(stale_path),
                        "newest_frame_id": item.get("frame_id"),
                    }
                    handle.write(json.dumps(record, ensure_ascii=True) + "\n")


class VisualLLMWorker(threading.Thread):
    def __init__(
        self,
        llm_queue: queue.Queue[Any],
        output_path: Path,
        model: str | None,
        backend: str,
        codex_workdir: Path,
        codex_add_dir: Path,
        codex_reasoning_effort: str = "low",
    ) -> None:
        super().__init__(daemon=True)
        self.llm_queue = llm_queue
        self.output_path = output_path
        self.model = model
        self.backend = backend
        self.codex_workdir = codex_workdir
        self.codex_add_dir = codex_add_dir
        self.codex_reasoning_effort = codex_reasoning_effort
        self.processed_frames = 0
        self.successful_frames = 0
        self.failed_frames = 0

    @staticmethod
    def _extract_text(response: Any) -> str:
        output_text = getattr(response, "output_text", None)
        if output_text:
            return str(output_text).strip()

        output_items = getattr(response, "output", None)
        if not output_items:
            return ""

        chunks: list[str] = []
        for item in output_items:
            contents = getattr(item, "content", None) or []
            for content in contents:
                maybe_text = getattr(content, "text", None)
                if maybe_text:
                    chunks.append(str(maybe_text))
                else:
                    maybe_value = getattr(content, "value", None)
                    if maybe_value:
                        chunks.append(str(maybe_value))
        return "\n".join(chunk.strip() for chunk in chunks if chunk and chunk.strip())

    def _prompt_for_frame(self, frame: dict[str, Any]) -> str:
        cursor = frame.get("cursor") or {}
        event_summary = frame.get("event_summary") or {}
        action_events = frame.get("action_events") or []
        active_context = frame.get("active_context") or {}
        return (
            "Interpret this screenshot with cursor telemetry for action-learning.\n"
            "Return only valid JSON with keys: "
            "element_under_cursor, cursor_activity_relationship, probable_user_intent, "
            "confidence, friction_or_opportunity, recommended_training_label.\n"
            f"frame_id={frame.get('frame_id')}\n"
            f"captured_at={frame.get('captured_at')}\n"
            f"window_start_at={frame.get('window_start_at')}\n"
            f"window_end_at={frame.get('window_end_at')}\n"
            f"cursor={json.dumps(cursor, ensure_ascii=True)}\n"
            f"event_summary={json.dumps(event_summary, ensure_ascii=True)}\n"
            f"action_events={json.dumps(action_events, ensure_ascii=True)}\n"
            f"active_context={json.dumps(active_context, ensure_ascii=True)}\n"
            "Describe the visual evidence for the cursor relationship in one sentence."
        )

    def _run_openai(self, client: Any, item: dict[str, Any], prompt: str) -> tuple[bool, dict[str, Any]]:
        image_b64 = item.get("image_b64")
        if not image_b64:
            return False, {"error": item.get("image_error") or "missing_image_payload"}

        response = client.responses.create(
            model=self.model,
            temperature=0,
            max_output_tokens=350,
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt},
                        {
                            "type": "input_image",
                            "image_url": f"data:image/png;base64,{image_b64}",
                        },
                    ],
                }
            ],
        )
        text = self._extract_text(response)
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            parsed = {"raw_text": text}
        return True, {"llm_output": parsed}

    def _run_codex_cli(self, item: dict[str, Any], prompt: str) -> tuple[bool, dict[str, Any]]:
        screenshot_path = Path(str(item.get("screenshot_path", "")))
        if not screenshot_path.exists():
            return False, {"error": f"screenshot_not_found: {screenshot_path}"}

        cmd = [
            "codex",
            "exec",
            "--json",
            "--skip-git-repo-check",
            "--disable",
            "apps",
            "-C",
            str(self.codex_workdir),
            "--add-dir",
            str(self.codex_add_dir),
            "-c",
            f'model_reasoning_effort="{self.codex_reasoning_effort}"',
        ]
        if self.model:
            cmd.extend(["--model", self.model])
        cmd.extend(["-i", str(screenshot_path), "--", prompt])

        try:
            proc = subprocess.run(
                cmd,
                check=False,
                capture_output=True,
                text=True,
                timeout=120,
            )
        except subprocess.TimeoutExpired:
            return False, {"error": "codex_exec_timeout"}
        except OSError as exc:
            return False, {"error": f"codex_exec_error: {exc}"}

        if proc.returncode != 0:
            err = (proc.stderr or "").strip() or (proc.stdout or "").strip() or f"exit_{proc.returncode}"
            return False, {"error": err}

        message_text = ""
        usage: dict[str, Any] = {}
        for raw_line in proc.stdout.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue

            event_type = str(event.get("type", ""))
            if event_type == "item.completed":
                item_obj = event.get("item") or {}
                if item_obj.get("type") == "agent_message":
                    message_text = str(item_obj.get("text") or "")
            elif event_type == "turn.completed":
                maybe_usage = event.get("usage")
                if isinstance(maybe_usage, dict):
                    usage = maybe_usage

        if not message_text:
            return False, {"error": "codex_exec_no_message"}

        try:
            parsed = json.loads(message_text)
        except json.JSONDecodeError:
            parsed = {"raw_text": message_text}

        return True, {"llm_output": parsed, "usage": usage}

    def run(self) -> None:
        client = None
        if self.backend == "openai_sdk":
            try:
                from openai import OpenAI
            except ImportError as exc:
                raise RuntimeError(
                    "OpenAI SDK missing. Install with: pip install openai"
                ) from exc
            client = OpenAI()

        self.output_path.parent.mkdir(parents=True, exist_ok=True)

        with self.output_path.open("a", encoding="utf-8", buffering=1) as handle:
            while True:
                item = self.llm_queue.get()
                if item is None:
                    break

                self.processed_frames += 1
                prompt = self._prompt_for_frame(item)
                result_record: dict[str, Any] = {
                    "frame_id": item.get("frame_id"),
                    "captured_at": item.get("captured_at"),
                    "screenshot_path": item.get("screenshot_path"),
                    "model": self.model,
                    "backend": self.backend,
                }

                try:
                    if self.backend == "openai_sdk":
                        ok, payload = self._run_openai(client, item, prompt)  # type: ignore[arg-type]
                    elif self.backend == "codex_cli":
                        ok, payload = self._run_codex_cli(item, prompt)
                    else:
                        ok, payload = False, {"error": f"unsupported_backend: {self.backend}"}

                    if ok:
                        self.successful_frames += 1
                        result_record.update({"status": "ok", **payload})
                    else:
                        self.failed_frames += 1
                        result_record.update({"status": "error", **payload})
                except Exception as exc:
                    self.failed_frames += 1
                    result_record.update({"status": "error", "error": str(exc)})

                handle.write(json.dumps(result_record, ensure_ascii=True) + "\n")


def as_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def as_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not path.exists():
        return rows
    with path.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return rows


def write_csv_rows(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def codex_oauth_available() -> bool:
    if not shutil.which("codex"):
        return False
    try:
        proc = subprocess.run(
            ["codex", "login", "status"],
            check=False,
            capture_output=True,
            text=True,
            timeout=5,
        )
    except (OSError, subprocess.TimeoutExpired):
        return False
    status_text = ((proc.stdout or "") + " " + (proc.stderr or "")).lower()
    return proc.returncode == 0 and "logged in" in status_text


def event_family(event_type: str) -> str:
    if event_type.startswith("click"):
        return "click"
    if event_type == "scroll":
        return "scroll"
    if event_type == "move":
        return "move"
    return "other"


def build_action_segments(events: list[dict[str, Any]], max_gap_seconds: float = 0.4) -> list[dict[str, Any]]:
    if not events:
        return []

    segments: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    segment_id = 0

    for event in events:
        event_type = str(event.get("event_type", "unknown"))
        family = event_family(event_type)
        ts = as_float(event.get("ts_epoch"))
        x = as_float(event.get("x"), default=float("nan"))
        y = as_float(event.get("y"), default=float("nan"))
        event_move_distance = as_float(event.get("distance_px"))

        needs_new_segment = (
            current is None
            or family != current["family"]
            or (ts - as_float(current["end_ts_epoch"])) > max_gap_seconds
        )

        if needs_new_segment:
            if current is not None:
                duration_ms = max(0.0, (as_float(current["end_ts_epoch"]) - as_float(current["start_ts_epoch"])) * 1000.0)
                samples = as_int(current["coord_samples"])
                current["duration_ms"] = round(duration_ms, 2)
                current["avg_x"] = round(as_float(current["x_sum"]) / samples, 2) if samples else None
                current["avg_y"] = round(as_float(current["y_sum"]) / samples, 2) if samples else None
                current["start_at"] = now_iso(as_float(current["start_ts_epoch"]))
                current["end_at"] = now_iso(as_float(current["end_ts_epoch"]))
                current.pop("x_sum", None)
                current.pop("y_sum", None)
                current.pop("coord_samples", None)
                segments.append(current)

            segment_id += 1
            current = {
                "segment_id": segment_id,
                "family": family,
                "start_ts_epoch": ts,
                "end_ts_epoch": ts,
                "event_count": 0,
                "move_distance_px": 0.0,
                "click_down_count": 0,
                "click_up_count": 0,
                "scroll_event_count": 0,
                "x_sum": 0.0,
                "y_sum": 0.0,
                "coord_samples": 0,
            }

        current["end_ts_epoch"] = ts
        current["event_count"] = as_int(current["event_count"]) + 1
        current["move_distance_px"] = round(as_float(current["move_distance_px"]) + event_move_distance, 2)

        if event_type == "click_down":
            current["click_down_count"] = as_int(current["click_down_count"]) + 1
        elif event_type == "click_up":
            current["click_up_count"] = as_int(current["click_up_count"]) + 1
        elif event_type == "scroll":
            current["scroll_event_count"] = as_int(current["scroll_event_count"]) + 1

        if not math.isnan(x) and not math.isnan(y):
            current["x_sum"] = as_float(current["x_sum"]) + x
            current["y_sum"] = as_float(current["y_sum"]) + y
            current["coord_samples"] = as_int(current["coord_samples"]) + 1

    if current is not None:
        duration_ms = max(0.0, (as_float(current["end_ts_epoch"]) - as_float(current["start_ts_epoch"])) * 1000.0)
        samples = as_int(current["coord_samples"])
        current["duration_ms"] = round(duration_ms, 2)
        current["avg_x"] = round(as_float(current["x_sum"]) / samples, 2) if samples else None
        current["avg_y"] = round(as_float(current["y_sum"]) / samples, 2) if samples else None
        current["start_at"] = now_iso(as_float(current["start_ts_epoch"]))
        current["end_at"] = now_iso(as_float(current["end_ts_epoch"]))
        current.pop("x_sum", None)
        current.pop("y_sum", None)
        current.pop("coord_samples", None)
        segments.append(current)

    return segments


def derive_findings(events: list[dict[str, Any]], segments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    if not events:
        return findings

    # Idle windows between adjacent events.
    for index in range(1, len(events)):
        prev_event = events[index - 1]
        event = events[index]
        gap_seconds = as_float(event.get("ts_epoch")) - as_float(prev_event.get("ts_epoch"))
        if gap_seconds >= 2.0:
            findings.append(
                {
                    "timestamp": event.get("timestamp"),
                    "ts_epoch": as_float(event.get("ts_epoch")),
                    "finding_type": "idle_gap",
                    "severity": "info",
                    "details": f"Idle gap of {gap_seconds:.2f}s before next activity.",
                    "action": "If this is unintended idle time, reduce pauses in repetitive flows.",
                }
            )

    # Repeated clicks in a tight area can indicate interface friction.
    click_downs = [event for event in events if event.get("event_type") == "click_down"]
    i = 0
    while i < len(click_downs):
        base = click_downs[i]
        base_t = as_float(base.get("ts_epoch"))
        base_x = as_float(base.get("x"))
        base_y = as_float(base.get("y"))
        cluster = [base]
        j = i + 1
        while j < len(click_downs):
            candidate = click_downs[j]
            if as_float(candidate.get("ts_epoch")) - base_t > 3.0:
                break
            distance = math.hypot(as_float(candidate.get("x")) - base_x, as_float(candidate.get("y")) - base_y)
            if distance <= 24.0:
                cluster.append(candidate)
            j += 1

        if len(cluster) >= 3:
            findings.append(
                {
                    "timestamp": base.get("timestamp"),
                    "ts_epoch": base_t,
                    "finding_type": "repeated_click_cluster",
                    "severity": "medium",
                    "details": f"{len(cluster)} click-down events within 3.0s around ({base_x:.0f}, {base_y:.0f}).",
                    "action": "Inspect target size and responsiveness around this screen region.",
                }
            )
            i = j
        else:
            i += 1

    # Scroll burst detection based on contiguous scroll segments.
    for segment in segments:
        if segment.get("family") != "scroll":
            continue
        scroll_count = as_int(segment.get("scroll_event_count"))
        duration_ms = as_float(segment.get("duration_ms"))
        if scroll_count < 12:
            continue
        duration_seconds = max(0.001, duration_ms / 1000.0)
        rate = round(scroll_count / duration_seconds, 2)
        findings.append(
            {
                "timestamp": segment.get("start_at"),
                "ts_epoch": as_float(segment.get("start_ts_epoch")),
                "finding_type": "scroll_burst",
                "severity": "info",
                "details": (
                    f"{scroll_count} scroll events in {duration_seconds:.2f}s "
                    f"({rate} events/s) from {segment.get('start_at')} to {segment.get('end_at')}."
                ),
                "action": "If this pattern repeats, add jump links or reduce content scanning overhead.",
            }
        )

    # Long cursor navigation bursts with no click follow-up suggest searching behavior.
    click_times = [as_float(event.get("ts_epoch")) for event in click_downs]
    for segment in segments:
        if segment.get("family") != "move":
            continue
        if as_float(segment.get("duration_ms")) < 1500.0:
            continue
        if as_float(segment.get("move_distance_px")) < 900.0:
            continue
        start_epoch = as_float(segment.get("start_ts_epoch"))
        end_epoch = as_float(segment.get("end_ts_epoch"))
        has_follow_up_click = any(start_epoch <= click_time <= (end_epoch + 1.0) for click_time in click_times)
        if not has_follow_up_click:
            findings.append(
                {
                    "timestamp": segment.get("start_at"),
                    "ts_epoch": start_epoch,
                    "finding_type": "navigation_without_commit",
                    "severity": "medium",
                    "details": (
                        f"Move segment {segment.get('segment_id')} lasted {as_float(segment.get('duration_ms')):.0f}ms "
                        f"with {as_float(segment.get('move_distance_px')):.0f}px travel and no click."
                    ),
                    "action": "Review layout clarity where users appear to search before committing.",
                }
            )

    findings.sort(key=lambda item: as_float(item.get("ts_epoch")))
    for finding in findings:
        finding.pop("ts_epoch", None)
    return findings


def build_interpretation_reports(
    run_dir: Path,
    events_path: Path,
    frames_path: Path,
    llm_output_path: Path | None,
    summary: dict[str, Any],
) -> dict[str, Any]:
    analysis_dir = run_dir / "analysis"
    analysis_dir.mkdir(parents=True, exist_ok=True)

    events = load_jsonl(events_path)
    frames = load_jsonl(frames_path)
    events.sort(key=lambda event: (as_float(event.get("ts_epoch")), as_int(event.get("event_id"))))
    frames.sort(key=lambda frame: as_int(frame.get("frame_id")))

    event_counts = Counter(str(event.get("event_type", "unknown")) for event in events)
    first_event_epoch = as_float(events[0].get("ts_epoch")) if events else None
    last_event_epoch = as_float(events[-1].get("ts_epoch")) if events else None
    event_span_seconds = (
        round(max(0.0, last_event_epoch - first_event_epoch), 3)
        if first_event_epoch is not None and last_event_epoch is not None
        else 0.0
    )
    total_move_distance_px = round(
        sum(as_float(event.get("distance_px")) for event in events if event.get("event_type") == "move"),
        2,
    )
    average_event_rate_per_sec = round((len(events) / event_span_seconds), 2) if event_span_seconds > 0 else 0.0

    timeline_events_path = analysis_dir / "timeline_events.csv"
    timeline_rows: list[dict[str, Any]] = []
    previous_epoch: float | None = None
    for event in events:
        ts_epoch = as_float(event.get("ts_epoch"))
        delta_ms = "" if previous_epoch is None else round((ts_epoch - previous_epoch) * 1000.0, 2)
        timeline_rows.append(
            {
                "event_id": as_int(event.get("event_id")),
                "timestamp": event.get("timestamp", ""),
                "ts_epoch": ts_epoch,
                "delta_ms_prev": delta_ms,
                "event_type": event.get("event_type", ""),
                "x": event.get("x", ""),
                "y": event.get("y", ""),
                "dx": event.get("dx", ""),
                "dy": event.get("dy", ""),
                "distance_px": event.get("distance_px", ""),
                "scroll_dx": event.get("scroll_dx", ""),
                "scroll_dy": event.get("scroll_dy", ""),
                "button": event.get("button", ""),
            }
        )
        previous_epoch = ts_epoch
    write_csv_rows(
        timeline_events_path,
        [
            "event_id",
            "timestamp",
            "ts_epoch",
            "delta_ms_prev",
            "event_type",
            "x",
            "y",
            "dx",
            "dy",
            "distance_px",
            "scroll_dx",
            "scroll_dy",
            "button",
        ],
        timeline_rows,
    )

    frame_timeline_path = analysis_dir / "frame_timeline.csv"
    frame_rows: list[dict[str, Any]] = []
    for frame in frames:
        event_summary = frame.get("event_summary") or {}
        active_context = frame.get("active_context") or {}
        screenshot_path = Path(str(frame.get("screenshot_path", "")))
        frame_rows.append(
            {
                "frame_id": as_int(frame.get("frame_id")),
                "captured_at": frame.get("captured_at", ""),
                "window_start_at": frame.get("window_start_at", ""),
                "window_end_at": frame.get("window_end_at", ""),
                "event_count": as_int(event_summary.get("event_count")),
                "intent": event_summary.get("intent", ""),
                "relationship_label": event_summary.get("relationship_label", ""),
                "cursor_x": (frame.get("cursor") or {}).get("x", ""),
                "cursor_y": (frame.get("cursor") or {}).get("y", ""),
                "app": active_context.get("app", ""),
                "window": active_context.get("window", ""),
                "screenshot_path": str(screenshot_path),
                "screenshot_exists": screenshot_path.exists(),
            }
        )
    write_csv_rows(
        frame_timeline_path,
        [
            "frame_id",
            "captured_at",
            "window_start_at",
            "window_end_at",
            "event_count",
            "intent",
            "relationship_label",
            "cursor_x",
            "cursor_y",
            "app",
            "window",
            "screenshot_path",
            "screenshot_exists",
        ],
        frame_rows,
    )

    frame_event_counts = [as_int(row.get("event_count")) for row in frame_rows]
    active_frames = sum(1 for count in frame_event_counts if count > 0)
    idle_frames = len(frame_event_counts) - active_frames
    average_events_per_frame = round((sum(frame_event_counts) / len(frame_event_counts)), 2) if frame_event_counts else 0.0
    peak_frame: dict[str, Any] | None = None
    if frame_rows:
        peak_frame = max(frame_rows, key=lambda row: as_int(row.get("event_count")))
    intent_counts = Counter(str((frame.get("event_summary") or {}).get("intent", "unknown")) for frame in frames)
    relationship_counts = Counter(
        str((frame.get("event_summary") or {}).get("relationship_label", "unknown")) for frame in frames
    )

    segments = build_action_segments(events)
    segments_path = analysis_dir / "action_segments.csv"
    write_csv_rows(
        segments_path,
        [
            "segment_id",
            "family",
            "start_at",
            "end_at",
            "start_ts_epoch",
            "end_ts_epoch",
            "duration_ms",
            "event_count",
            "move_distance_px",
            "click_down_count",
            "click_up_count",
            "scroll_event_count",
            "avg_x",
            "avg_y",
        ],
        segments,
    )

    hotspot_counter: Counter[tuple[int, int]] = Counter()
    for event in events:
        x = event.get("x")
        y = event.get("y")
        if x is None or y is None:
            continue
        x_f = as_float(x)
        y_f = as_float(y)
        cell_x = int(x_f // 120) * 120
        cell_y = int(y_f // 120) * 120
        hotspot_counter[(cell_x, cell_y)] += 1
    hotspot_rows: list[dict[str, Any]] = []
    for rank, ((cell_x, cell_y), count) in enumerate(hotspot_counter.most_common(10), start=1):
        hotspot_rows.append(
            {
                "rank": rank,
                "cell_origin_x": cell_x,
                "cell_origin_y": cell_y,
                "events": count,
            }
        )
    hotspots_path = analysis_dir / "hotspots.csv"
    write_csv_rows(hotspots_path, ["rank", "cell_origin_x", "cell_origin_y", "events"], hotspot_rows)

    findings = derive_findings(events, segments)
    findings_path = analysis_dir / "findings.json"
    findings_path.write_text(json.dumps(findings, indent=2), encoding="utf-8")
    finding_type_counts = Counter(str(finding.get("finding_type", "unknown")) for finding in findings)
    finding_severity_counts = Counter(str(finding.get("severity", "unknown")) for finding in findings)

    llm_rows = load_jsonl(llm_output_path) if llm_output_path is not None else []
    llm_success = [row for row in llm_rows if row.get("status") == "ok"]
    llm_errors = [row for row in llm_rows if row.get("status") != "ok"]
    llm_intent_counts: Counter[str] = Counter()
    llm_label_counts: Counter[str] = Counter()
    llm_actionables: list[str] = []
    for row in llm_success:
        output = row.get("llm_output")
        if not isinstance(output, dict):
            continue
        intent = output.get("probable_user_intent")
        if isinstance(intent, str) and intent.strip():
            llm_intent_counts[intent.strip()] += 1
        label = output.get("recommended_training_label")
        if isinstance(label, str) and label.strip():
            llm_label_counts[label.strip()] += 1
        action_text = output.get("friction_or_opportunity")
        if isinstance(action_text, str) and action_text.strip():
            llm_actionables.append(action_text.strip())

    top_hotspot = hotspot_rows[0] if hotspot_rows else None
    top_intent = intent_counts.most_common(1)[0] if intent_counts else ("unknown", 0)
    top_relationship = relationship_counts.most_common(1)[0] if relationship_counts else ("unknown", 0)
    top_finding_type = finding_type_counts.most_common(1)[0] if finding_type_counts else ("none", 0)
    top_llm_intent = llm_intent_counts.most_common(1)[0] if llm_intent_counts else ("none", 0)
    top_llm_label = llm_label_counts.most_common(1)[0] if llm_label_counts else ("none", 0)

    plain_language_lines = [
        "Overall Interpretation",
        "",
        (
            f"This run captured {len(events)} events across {len(frames)} frames over "
            f"{event_span_seconds:.3f}s."
        ),
        (
            f"Activity level: {active_frames} active frames and {idle_frames} idle frames "
            f"(average {average_events_per_frame} events/frame)."
        ),
        (
            f"Dominant behavior: intent '{top_intent[0]}' ({top_intent[1]} frames) and "
            f"relationship '{top_relationship[0]}' ({top_relationship[1]} frames)."
        ),
        (
            f"Input mix: "
            + ", ".join(f"{k}={v}" for k, v in sorted(event_counts.items()))
            if event_counts
            else "Input mix: no recorded events."
        ),
        (
            f"Cursor movement totaled {total_move_distance_px} px at an average event rate of "
            f"{average_event_rate_per_sec} events/s."
        ),
        (
            f"Top hotspot: ({top_hotspot.get('cell_origin_x')}, {top_hotspot.get('cell_origin_y')}) "
            f"with {top_hotspot.get('events')} events."
            if top_hotspot
            else "Top hotspot: none."
        ),
        (
            f"Detected findings: {len(findings)} total; primary type '{top_finding_type[0]}' "
            f"({top_finding_type[1]})."
        ),
        (
            f"LLM visual interpretation processed {len(llm_rows)} frames "
            f"(ok={len(llm_success)}, error={len(llm_errors)})."
        ),
        (
            f"Top LLM intent: '{top_llm_intent[0]}' ({top_llm_intent[1]})."
            if llm_rows
            else "Top LLM intent: none (LLM disabled or no frames routed)."
        ),
        (
            f"Top recommended training label: '{top_llm_label[0]}' ({top_llm_label[1]})."
            if llm_rows
            else "Top recommended training label: none."
        ),
    ]
    plain_language_summary_text = "\n".join(plain_language_lines) + "\n"
    plain_language_summary_path = analysis_dir / "plain_language_summary.txt"
    plain_language_summary_path.write_text(plain_language_summary_text, encoding="utf-8")

    full_summation = {
        "generated_at": now_iso(),
        "run_dir": str(run_dir),
        "capture": {
            "frames_written": summary.get("frames_written"),
            "interval_seconds": summary.get("interval_seconds"),
            "duration_seconds": summary.get("duration_seconds"),
            "screenshots_retained": summary.get("screenshots_remaining"),
            "screenshots_pruned": summary.get("screenshots_pruned"),
        },
        "event_summary": {
            "total_events": len(events),
            "event_span_seconds": event_span_seconds,
            "average_event_rate_per_sec": average_event_rate_per_sec,
            "total_move_distance_px": total_move_distance_px,
            "event_counts_by_type": dict(event_counts),
        },
        "frame_summary": {
            "frame_count": len(frames),
            "active_frames": active_frames,
            "idle_frames": idle_frames,
            "active_frame_ratio": round((active_frames / len(frames)), 4) if frames else 0.0,
            "average_events_per_frame": average_events_per_frame,
            "peak_frame": {
                "frame_id": peak_frame.get("frame_id") if peak_frame else None,
                "captured_at": peak_frame.get("captured_at") if peak_frame else None,
                "event_count": peak_frame.get("event_count") if peak_frame else None,
                "app": peak_frame.get("app") if peak_frame else None,
            },
            "intent_counts": dict(intent_counts),
            "relationship_counts": dict(relationship_counts),
        },
        "finding_summary": {
            "total_findings": len(findings),
            "finding_type_counts": dict(finding_type_counts),
            "severity_counts": dict(finding_severity_counts),
            "top_findings_sample": findings[:10],
        },
        "llm_summary": {
            "frames_total": len(llm_rows),
            "frames_success": len(llm_success),
            "frames_error": len(llm_errors),
            "intent_counts": dict(llm_intent_counts),
            "recommended_training_label_counts": dict(llm_label_counts),
            "friction_or_opportunity_sample": llm_actionables[:10],
        },
        "hotspot_summary": {
            "top_hotspot": top_hotspot,
            "top_10_hotspots": hotspot_rows,
        },
        "plain_language_summary": plain_language_summary_text,
    }
    full_summation_path = analysis_dir / "full_summation.json"
    full_summation_path.write_text(json.dumps(full_summation, indent=2), encoding="utf-8")

    interpretation = {
        "generated_at": now_iso(),
        "event_count_total": len(events),
        "event_counts_by_type": dict(event_counts),
        "event_span_seconds": event_span_seconds,
        "average_event_rate_per_sec": average_event_rate_per_sec,
        "total_move_distance_px": total_move_distance_px,
        "frame_count": len(frames),
        "active_frames": active_frames,
        "idle_frames": idle_frames,
        "average_events_per_frame": average_events_per_frame,
        "peak_frame": {
            "frame_id": peak_frame.get("frame_id") if peak_frame else None,
            "captured_at": peak_frame.get("captured_at") if peak_frame else None,
            "event_count": peak_frame.get("event_count") if peak_frame else None,
        },
        "intent_counts": dict(intent_counts),
        "relationship_counts": dict(relationship_counts),
        "segment_count": len(segments),
        "finding_count": len(findings),
        "finding_type_counts": dict(finding_type_counts),
        "finding_severity_counts": dict(finding_severity_counts),
        "timeline_events_csv": str(timeline_events_path),
        "frame_timeline_csv": str(frame_timeline_path),
        "action_segments_csv": str(segments_path),
        "hotspots_csv": str(hotspots_path),
        "findings_json": str(findings_path),
        "full_summation_json": str(full_summation_path),
        "plain_language_summary_txt": str(plain_language_summary_path),
        "llm_output_jsonl": str(llm_output_path) if llm_output_path else None,
        "llm_frames_total": len(llm_rows),
        "llm_frames_success": len(llm_success),
        "llm_frames_error": len(llm_errors),
        "llm_intent_counts": dict(llm_intent_counts),
        "llm_recommended_training_label_counts": dict(llm_label_counts),
    }

    interpretation_path = analysis_dir / "interpretation.json"
    interpretation_path.write_text(json.dumps(interpretation, indent=2), encoding="utf-8")

    report_path = analysis_dir / "actionable_report.md"
    report_lines = [
        "# Actionable Cursor Activity Report",
        "",
        f"- Generated at: {interpretation['generated_at']}",
        f"- Run directory: {run_dir}",
        f"- Frames captured: {summary.get('frames_written')}",
        f"- Events captured: {interpretation['event_count_total']}",
        f"- Event span: {interpretation['event_span_seconds']}s",
        f"- Screenshots retained: {summary.get('screenshots_remaining')} (max {summary.get('max_screenshots')})",
        "",
        "## Exact Tracking Artifacts",
        f"- Timeline (event-by-event): `{timeline_events_path}`",
        f"- Frame timeline: `{frame_timeline_path}`",
        f"- Action segments: `{segments_path}`",
        f"- Hotspots: `{hotspots_path}`",
        f"- Findings JSON: `{findings_path}`",
        f"- Full summation JSON: `{full_summation_path}`",
        f"- Plain language summary: `{plain_language_summary_path}`",
        f"- LLM interpretations: `{llm_output_path}`" if llm_output_path else "- LLM interpretations: disabled",
        "",
        "## Full Summation",
        f"- Active frames: {active_frames}/{len(frames)}",
        f"- Idle frames: {idle_frames}/{len(frames)}",
        f"- Average events per frame: {average_events_per_frame}",
        f"- Average event rate: {average_event_rate_per_sec} events/s",
        f"- Total cursor move distance: {total_move_distance_px} px",
        (
            f"- Peak frame: id={peak_frame.get('frame_id')} events={peak_frame.get('event_count')} "
            f"at {peak_frame.get('captured_at')}"
            if peak_frame
            else "- Peak frame: none"
        ),
        (
            f"- Top hotspot: ({top_hotspot.get('cell_origin_x')}, {top_hotspot.get('cell_origin_y')}) "
            f"events={top_hotspot.get('events')}"
            if top_hotspot
            else "- Top hotspot: none"
        ),
        "",
        "## Event Counts",
    ]
    for event_type, count in sorted(event_counts.items()):
        report_lines.append(f"- {event_type}: {count}")

    report_lines.extend(["", "## Finding Summary"])
    report_lines.append(f"- Total findings: {len(findings)}")
    if finding_type_counts:
        for finding_type, count in finding_type_counts.most_common():
            report_lines.append(f"- type::{finding_type} -> {count}")
    if finding_severity_counts:
        for severity, count in finding_severity_counts.most_common():
            report_lines.append(f"- severity::{severity} -> {count}")

    report_lines.extend(["", "## Actionable Findings (Top 25)"])
    if findings:
        findings_limit = 25
        for index, finding in enumerate(findings[:findings_limit], start=1):
            report_lines.append(
                f"{index}. [{finding.get('timestamp')}] {finding.get('finding_type')}: "
                f"{finding.get('details')} Action: {finding.get('action')}"
            )
        if len(findings) > findings_limit:
            report_lines.append(f"- ... plus {len(findings) - findings_limit} more in `{findings_path}`")
    else:
        report_lines.append("1. No notable friction patterns detected in this run.")

    report_lines.extend(["", "## LLM Visual Findings"])
    if llm_output_path:
        report_lines.append(
            f"- Processed frames: {len(llm_rows)} (ok={len(llm_success)}, error={len(llm_errors)})"
        )
        if llm_intent_counts:
            for intent, count in llm_intent_counts.most_common():
                report_lines.append(f"- intent::{intent} -> {count}")
        if llm_label_counts:
            for label, count in llm_label_counts.most_common():
                report_lines.append(f"- training_label::{label} -> {count}")
        if llm_actionables:
            for index, text in enumerate(llm_actionables[:8], start=1):
                report_lines.append(f"{index}. {text}")
        else:
            report_lines.append("1. No LLM friction/opportunity notes were returned.")
    else:
        report_lines.append("1. LLM interpretation was disabled for this run.")

    report_path.write_text("\n".join(report_lines) + "\n", encoding="utf-8")

    interpretation["interpretation_json"] = str(interpretation_path)
    interpretation["actionable_report_md"] = str(report_path)
    return interpretation


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Capture desktop screenshots and cursor activity for watch-and-learn training.",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=1.0,
        help="Seconds between screenshots (default: 1.0).",
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=None,
        help="Optional total run time in seconds. Omit to run until Ctrl+C.",
    )
    parser.add_argument(
        "--max-screenshots",
        type=int,
        default=20,
        help="Maximum screenshots to keep on disk before deleting oldest (default: 20).",
    )
    parser.add_argument(
        "--output-root",
        default=str(Path(__file__).resolve().parent / "output"),
        help="Root output directory for capture runs.",
    )
    parser.add_argument(
        "--run-name",
        default=None,
        help="Optional run folder name. Defaults to run-YYYYMMDD-HHMMSS.",
    )
    parser.add_argument(
        "--no-active-context",
        action="store_true",
        help="Disable frontmost app/window lookup.",
    )
    parser.add_argument(
        "--llm-interpretation",
        choices=["required", "auto", "off"],
        default="auto",
        help=(
            "Visual interpretation mode: required=must run via either OPENAI_API_KEY "
            "(OpenAI SDK) or Codex OAuth CLI, auto=best available backend, off=disable."
        ),
    )
    parser.add_argument(
        "--llm-model",
        default="auto",
        help=(
            "Model used by visual interpretation. "
            "Use 'auto' to pick backend-specific default "
            "(OpenAI SDK: gpt-4.1-mini, Codex OAuth: your Codex default model)."
        ),
    )
    parser.add_argument(
        "--llm-frame-stride",
        type=int,
        default=0,
        help=(
            "Send every Nth frame to the LLM worker. "
            "0 means auto (OpenAI SDK: 1, Codex OAuth: 10)."
        ),
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Reduce console output.",
    )
    return parser


def run_session(args: argparse.Namespace) -> dict[str, Any]:
    if args.interval <= 0:
        raise ValueError("--interval must be > 0")
    if args.max_screenshots <= 0:
        raise ValueError("--max-screenshots must be > 0")
    if args.duration is not None and args.duration <= 0:
        raise ValueError("--duration must be > 0 when provided")
    if args.llm_frame_stride < 0:
        raise ValueError("--llm-frame-stride must be >= 0")

    require_mouse_dependency()

    run_name = args.run_name or dt.datetime.now(tz=UTC).strftime("run-%Y%m%d-%H%M%S")
    run_dir = Path(args.output_root).expanduser().resolve() / run_name
    screenshots_dir = run_dir / "screenshots"
    screenshots_dir.mkdir(parents=True, exist_ok=True)

    events_path = run_dir / "events.jsonl"
    frames_path = run_dir / "frames.jsonl"
    prune_path = run_dir / "prune.jsonl"
    llm_output_path = run_dir / "llm_interpretation.jsonl"
    session_path = run_dir / "session.json"

    frame_queue: queue.Queue[Any] = queue.Queue()
    retention_queue: queue.Queue[Any] = queue.Queue()
    llm_queue: queue.Queue[Any] | None = None

    llm_enabled = False
    llm_backend: str | None = None
    llm_model: str | None = None
    effective_llm_frame_stride = args.llm_frame_stride
    llm_disabled_reason: str | None = None
    if args.llm_interpretation != "off":
        has_api_key = bool(os.environ.get("OPENAI_API_KEY"))
        openai_available = False
        if has_api_key:
            try:
                import openai  # noqa: F401
            except ImportError:
                openai_available = False
            else:
                openai_available = True

        codex_available = codex_oauth_available()

        if openai_available:
            llm_backend = "openai_sdk"
            llm_model = "gpt-4.1-mini" if args.llm_model == "auto" else args.llm_model
        elif codex_available:
            llm_backend = "codex_cli"
            llm_model = None if args.llm_model == "auto" else args.llm_model
        else:
            llm_disabled_reason = "no_openai_key_and_no_codex_oauth"

        if llm_backend is not None:
            llm_enabled = True
            llm_queue = queue.Queue(maxsize=4 if llm_backend == "codex_cli" else 8)
            if effective_llm_frame_stride == 0:
                effective_llm_frame_stride = 10 if llm_backend == "codex_cli" else 1
        elif args.llm_interpretation == "required":
            raise RuntimeError(
                "LLM interpretation is required, but neither OPENAI_API_KEY (with openai SDK) "
                "nor Codex OAuth login is available."
            )
    else:
        llm_disabled_reason = "disabled_by_flag"

    if effective_llm_frame_stride == 0:
        effective_llm_frame_stride = 1

    relation_worker = RelationWorker(
        frame_queue=frame_queue,
        output_path=frames_path,
        llm_queue=llm_queue,
        llm_frame_stride=effective_llm_frame_stride,
        llm_backend=llm_backend,
    )
    retention_worker = RetentionWorker(
        retention_queue=retention_queue,
        prune_log_path=prune_path,
        max_screenshots=args.max_screenshots,
    )
    llm_worker = (
        VisualLLMWorker(
            llm_queue=llm_queue,
            output_path=llm_output_path,
            model=llm_model,
            backend=llm_backend or "openai_sdk",
            codex_workdir=Path("/tmp"),
            codex_add_dir=Path(args.output_root).expanduser().resolve(),
        )
        if llm_queue is not None
        else None
    )

    state = SharedCursorState()
    listener = start_mouse_listener(state)

    relation_worker.start()
    retention_worker.start()
    if llm_worker is not None:
        llm_worker.start()

    stop_event = threading.Event()

    def _request_stop(_signum: int, _frame: Any) -> None:
        stop_event.set()

    signal.signal(signal.SIGINT, _request_stop)
    signal.signal(signal.SIGTERM, _request_stop)

    system = platform.system()
    started_epoch = time.time()
    started_at = now_iso(started_epoch)
    frame_id = 0
    capture_errors = 0
    next_tick = time.monotonic()
    window_start_epoch = started_epoch

    if not args.quiet:
        print(f"Run directory: {run_dir}", flush=True)
        print(
            f"Capturing every {args.interval:.3f}s (max screenshots kept: {args.max_screenshots}). "
            "Press Ctrl+C to stop.",
            flush=True,
        )
        if llm_enabled:
            print(
                f"LLM visual interpretation enabled (backend={llm_backend}, "
                f"model={llm_model or 'codex_default'}, frame_stride={effective_llm_frame_stride}).",
                flush=True,
            )
        else:
            print(f"LLM visual interpretation disabled ({llm_disabled_reason}).", flush=True)

    with events_path.open("a", encoding="utf-8", buffering=1) as events_file:
        try:
            while not stop_event.is_set():
                if args.duration is not None and (time.time() - started_epoch) >= args.duration:
                    break

                wait_for = next_tick - time.monotonic()
                if wait_for > 0:
                    time.sleep(min(wait_for, 0.05))
                    continue

                frame_id += 1
                frame_epoch = time.time()
                stamp = dt.datetime.fromtimestamp(frame_epoch, tz=UTC).strftime("%Y%m%d-%H%M%S-%f")
                screenshot_path = screenshots_dir / f"frame-{frame_id:06d}-{stamp}.png"

                try:
                    capture_screenshot(screenshot_path, system=system)
                except Exception as exc:
                    capture_errors += 1
                    print(f"[frame {frame_id:04d}] screenshot failed: {exc}", flush=True)
                    if capture_errors >= 3:
                        print("Stopping after 3 capture failures.", flush=True)
                        break
                    next_tick += args.interval
                    continue

                cursor, events, last_event_epoch = state.snapshot_and_clear()
                for event in events:
                    events_file.write(json.dumps(event, ensure_ascii=True) + "\n")

                active_context = get_active_context(system, enabled=not args.no_active_context)

                frame_payload = {
                    "frame_id": frame_id,
                    "captured_at": now_iso(frame_epoch),
                    "captured_epoch": frame_epoch,
                    "window_start_at": now_iso(window_start_epoch),
                    "window_end_at": now_iso(frame_epoch),
                    "screenshot_path": str(screenshot_path),
                    "cursor": cursor,
                    "active_context": active_context,
                    "event_count_in_window": len(events),
                    "events": events,
                    "last_event_epoch": last_event_epoch,
                }

                frame_queue.put(frame_payload)
                retention_queue.put(
                    {
                        "frame_id": frame_id,
                        "captured_at": frame_payload["captured_at"],
                        "screenshot_path": str(screenshot_path),
                    }
                )

                if not args.quiet:
                    app = active_context.get("app") or "unknown"
                    window = active_context.get("window") or ""
                    window_info = f" window={window}" if window else ""
                    print(
                        f"[frame {frame_id:04d}] cursor=({cursor['x']:.0f},{cursor['y']:.0f}) "
                        f"events={len(events):3d} app={app}{window_info}",
                        flush=True,
                    )

                next_tick += args.interval
                if next_tick < time.monotonic() - args.interval:
                    next_tick = time.monotonic() + args.interval
                window_start_epoch = frame_epoch

        finally:
            stop_event.set()
            listener.stop()
            listener.join(timeout=2.0)

            frame_queue.put(None)
            retention_queue.put(None)

            relation_worker.join(timeout=20.0)
            retention_worker.join(timeout=5.0)
            if llm_worker is not None:
                llm_worker.join(timeout=120.0)

    ended_epoch = time.time()
    ended_at = now_iso(ended_epoch)

    screenshots_remaining = len(list(screenshots_dir.glob("*.png")))
    summary = {
        "run_dir": str(run_dir),
        "started_at": started_at,
        "ended_at": ended_at,
        "duration_seconds": round(ended_epoch - started_epoch, 3),
        "interval_seconds": args.interval,
        "frames_attempted": frame_id,
        "frames_written": relation_worker.processed_frames,
        "max_screenshots": args.max_screenshots,
        "screenshots_remaining": screenshots_remaining,
        "screenshots_pruned": retention_worker.pruned,
        "llm_mode": args.llm_interpretation,
        "llm_enabled": llm_enabled,
        "llm_backend": llm_backend,
        "llm_disabled_reason": llm_disabled_reason,
        "llm_model": llm_model if llm_enabled else None,
        "llm_frame_stride": effective_llm_frame_stride if llm_enabled else None,
        "llm_output_log": str(llm_output_path) if llm_enabled else None,
        "frames_forwarded_to_llm": relation_worker.forwarded_to_llm,
        "frames_dropped_llm_backpressure": relation_worker.dropped_for_llm_backpressure,
        "llm_frames_processed": llm_worker.processed_frames if llm_worker is not None else 0,
        "llm_frames_successful": llm_worker.successful_frames if llm_worker is not None else 0,
        "llm_frames_failed": llm_worker.failed_frames if llm_worker is not None else 0,
        "events_log": str(events_path),
        "frames_log": str(frames_path),
        "prune_log": str(prune_path),
    }

    try:
        interpretation = build_interpretation_reports(
            run_dir=run_dir,
            events_path=events_path,
            frames_path=frames_path,
            llm_output_path=llm_output_path if llm_enabled else None,
            summary=summary,
        )
        summary["interpretation"] = interpretation
    except Exception as exc:
        summary["interpretation_error"] = str(exc)

    session_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    return summary


def print_console_summation(summary: dict[str, Any]) -> None:
    interpretation = summary.get("interpretation")
    if not isinstance(interpretation, dict):
        return

    print("Findings summary:")
    print(f"- frames_written: {summary.get('frames_written')}")
    print(f"- events_total: {interpretation.get('event_count_total')}")
    print(f"- active_frames: {interpretation.get('active_frames')}")
    print(f"- idle_frames: {interpretation.get('idle_frames')}")
    print(f"- findings_total: {interpretation.get('finding_count')}")

    finding_type_counts = interpretation.get("finding_type_counts")
    if isinstance(finding_type_counts, dict) and finding_type_counts:
        sorted_types = sorted(finding_type_counts.items(), key=lambda item: int(item[1]), reverse=True)
        top_pairs = ", ".join(f"{name}={count}" for name, count in sorted_types[:5])
        print(f"- finding_types_top: {top_pairs}")

    llm_labels = interpretation.get("llm_recommended_training_label_counts")
    if isinstance(llm_labels, dict) and llm_labels:
        sorted_labels = sorted(llm_labels.items(), key=lambda item: int(item[1]), reverse=True)
        top_labels = ", ".join(f"{name}={count}" for name, count in sorted_labels[:5])
        print(f"- llm_training_labels_top: {top_labels}")

    print(f"- full_summation_json: {interpretation.get('full_summation_json')}")
    print(f"- actionable_report_md: {interpretation.get('actionable_report_md')}")


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    try:
        summary = run_session(args)
    except Exception as exc:
        print(f"Error: {exc}")
        return 1

    print("Session complete.")
    print_console_summation(summary)
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

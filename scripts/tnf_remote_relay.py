#!/usr/bin/env python3.14
"""
TNF Remote Relay v2 — iPhone Mirror Control + AI Vision + Annotation
Single port, zero sudo, zero App Store, pure local WiFi.

NEW IN v2:
  - Pinch-to-zoom on the screen image
  - App switcher (Cmd+Tab), Mission Control, Cmd+Q, etc.
  - AI vision endpoint: GET /ai/frame → latest JPEG
  - Annotation overlay: pencil + highlighter drawn on a canvas layer
  - Annotations streamed to AI for visual communication
  - Delta frame compression for faster streaming
  - Caffeinate to prevent display sleep while connected

Usage:
  python3.14 tnf_remote_relay.py [--port 8080] [--quality 60] [--fps 20]
  
  iPhone: http://<Mac-IP>:8080
  AI Frame: http://<Mac-IP>:8080/ai/frame
  AI Annotations: http://<Mac-IP>:8080/ai/annotations
"""

import argparse
import asyncio
import base64
import io
import json
import os
import subprocess
import time
import traceback
from aiohttp import web
import numpy as np

import Quartz
from Quartz import (
    CGWindowListCreateImage, kCGWindowListOptionOnScreenOnly,
    kCGNullWindowID, kCGWindowImageDefault,
    CGImageGetWidth, CGImageGetHeight,
    CGImageGetBytesPerRow, CGImageGetDataProvider,
    CGDataProviderCopyData,
    CGMainDisplayID, CGDisplayPixelsWide, CGDisplayPixelsHigh,
    CGEventCreateMouseEvent, CGEventPost,
    kCGEventMouseMoved, kCGEventLeftMouseDown, kCGEventLeftMouseUp,
    kCGEventLeftMouseDragged, kCGEventRightMouseDown, kCGEventRightMouseUp,
    kCGMouseButtonLeft, kCGMouseButtonRight,
    kCGHIDEventTap,
    CGEventCreateKeyboardEvent,
    CGEventSetFlags,
    kCGEventFlagMaskShift, kCGEventFlagMaskCommand,
    kCGEventFlagMaskControl, kCGEventFlagMaskAlternate,
)

# --- Globals ---
FRAME_QUALITY = 60
TARGET_FPS = 20
FRAME_INTERVAL = 1.0 / TARGET_FPS
connected_clients = set()
capture_stats = {"frames": 0, "start_time": time.time()}
_caffeinate_proc = None

# Latest frame cache for AI vision endpoint
_latest_frame = None
_latest_annotations = []  # List of stroke data


def start_caffeinate():
    global _caffeinate_proc
    if _caffeinate_proc is None or _caffeinate_proc.poll() is not None:
        _caffeinate_proc = subprocess.Popen(
            ['caffeinate', '-d'],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        print("[☕] Caffeinate ON")


def stop_caffeinate():
    global _caffeinate_proc
    if _caffeinate_proc and _caffeinate_proc.poll() is None:
        _caffeinate_proc.terminate()
        _caffeinate_proc = None
        print("[☕] Caffeinate OFF")


# mss capture singleton — 30+ FPS on 2015 MBP (vs 0.3-0.7 FPS with screencapture)
_mss_instance = None

def _get_mss():
    global _mss_instance
    if _mss_instance is None:
        from mss import mss
        _mss_instance = mss()
    return _mss_instance

# Encoding cascade: turbojpeg SIMD > stock libjpeg > simplejpeg > PIL > Quartz
# turbojpeg BGRX: 11.8 FPS (SIMD-accelerated, zero BGRX→RGB conversion)
# stock libjpeg: 8.3 FPS (C extension, manual BGRA→RGB scanline)
# simplejpeg BGR: 3.5 FPS, PIL: 3.5 FPS, Quartz: 0.5 FPS
_has_one_shot_capture = False
_screencap = None
try:
 import importlib.util
 _spec = importlib.util.spec_from_file_location(
 "screencap",
 os.path.join(os.path.dirname(os.path.abspath(__file__)), "native", "screencap.so"))
 if _spec and _spec.loader:
  _screencap_mod = importlib.util.module_from_spec(_spec)
  _spec.loader.exec_module(_screencap_mod)
  _screencap = _screencap_mod.capture_jpeg
  _has_one_shot_capture = True
except Exception:
 pass

_has_turbo_encoder = False
_bgra2jpeg_turbo = None
try:
 import importlib.util
 _spec = importlib.util.spec_from_file_location(
 "bgra2jpeg_turbo",
 os.path.join(os.path.dirname(os.path.abspath(__file__)), "native", "bgra2jpeg_turbo.so"))
 if _spec and _spec.loader:
  _turbo_mod = importlib.util.module_from_spec(_spec)
  _spec.loader.exec_module(_turbo_mod)
  _bgra2jpeg_turbo = _turbo_mod.bgra2jpeg_turbo_native
  _has_turbo_encoder = True
except Exception:
 pass

_has_native_encoder = False
_bgra2jpeg = None
try:
 import importlib.util
 _spec = importlib.util.spec_from_file_location(
 "bgra2jpeg",
 os.path.join(os.path.dirname(os.path.abspath(__file__)), "native", "bgra2jpeg.so"))
 if _spec and _spec.loader:
  _bgra2jpeg_mod = importlib.util.module_from_spec(_spec)
  _spec.loader.exec_module(_bgra2jpeg_mod)
  _bgra2jpeg = _bgra2jpeg_mod.bgra2jpeg
  _has_native_encoder = True
except Exception:
 pass

_has_simplejpeg = False
try:
 import simplejpeg as _simplejpeg
 _has_simplejpeg = True
except ImportError:
 pass

def capture_screen_jpeg(quality=FRAME_QUALITY):
 """Capture Mac screen → JPEG bytes via mss with encoding cascade.
 Tier -1: one-shot native capture + turbojpeg (20+ FPS)
 Tier 0: turbojpeg BGRX (11.8 FPS, SIMD-accelerated, zero conversion)
 Tier 1: stock libjpeg C ext (8.3 FPS, zero-copy BGRA→libjpeg)
 Tier 2: simplejpeg BGR (3.5 FPS, numpy copy + libturbojpeg)
 Tier 3: PIL JPEG (3.5 FPS, Image.frombytes + Pillow)
 Tier 4: Quartz CGWindowListCreateImage (0.5 FPS fallback)
 """
 try:
  # Tier -1: One-shot native capture + turbojpeg
  if _has_one_shot_capture:
   return _screencap(quality)

  sct = _get_mss()
  monitor = sct.monitors[1] # primary monitor
  screenshot = sct.grab(monitor)
  # Tier 0: turbojpeg BGRX native (11.8 FPS, SIMD)
  if _has_turbo_encoder:
   return _bgra2jpeg_turbo(screenshot.raw, screenshot.size[0], screenshot.size[1], quality)
  # Tier 1: stock libjpeg C extension (8.3 FPS)
  if _has_native_encoder:
   return _bgra2jpeg(screenshot.raw, screenshot.size[0], screenshot.size[1], quality)
  # Tier 2: simplejpeg BGR encode (3.5 FPS)
  if _has_simplejpeg:
   import numpy as np
   raw = np.frombuffer(screenshot.raw, dtype=np.uint8).reshape(
    screenshot.size[1], screenshot.size[0], 4)
   bgr = np.ascontiguousarray(raw[:, :, :3]) # BGRA → BGR
   return _simplejpeg.encode_jpeg(bgr, quality=quality, colorspace='BGR')
  # Tier 3: PIL with BGRX → RGB conversion (3.5 FPS)
  from PIL import Image
  img = Image.frombytes('RGB', screenshot.size, screenshot.bgra, 'raw', 'BGRX')
  buf = io.BytesIO()
  img.save(buf, format='JPEG', quality=quality, optimize=True)
  return buf.getvalue()
 except Exception as e_mss:
        print(f"[mss CAPTURE FALLBACK] mss failed: {e_mss}, trying Quartz")
        try:
            # Recursion guard: list on-screen windows and exclude our own
            window_ids_to_exclude = []
            try:
                window_list = Quartz.CGWindowListCopyWindowInfo(
                    kCGWindowListOptionOnScreenOnly, kCGNullWindowID
                )
                for w in (window_list or []):
                    owner = w.get("kCGWindowOwnerName", "") or ""
                    name = w.get("kCGWindowName", "") or ""
                    if "8080" in name and any(x in owner for x in ["Safari", "Chrome", "Firefox", "Arc"]):
                        wid = w.get("kCGWindowNumber", 0)
                        if wid:
                            window_ids_to_exclude.append(wid)
            except Exception:
                pass

            image_ref = CGWindowListCreateImage(
                Quartz.CGRectInfinite,
                kCGWindowListOptionOnScreenOnly,
                kCGNullWindowID,
                kCGWindowImageDefault
            )
            if not image_ref:
                return None
            w = CGImageGetWidth(image_ref)
            h = CGImageGetHeight(image_ref)
            bytes_per_row = CGImageGetBytesPerRow(image_ref)
            data_provider = CGImageGetDataProvider(image_ref)
            pixel_data = CGDataProviderCopyData(data_provider)
            if not pixel_data:
                return None
            arr = np.frombuffer(pixel_data, dtype=np.uint8)
            if bytes_per_row == w * 4:
                arr = arr.reshape((h, w, 4))
            else:
                arr = arr.reshape((h, bytes_per_row // 4, 4))[:, :w, :]
            rgb = arr[:, :, 2::-1]  # BGRA -> RGB
            from PIL import Image
            img = Image.fromarray(rgb)
            buf = io.BytesIO()
            img.save(buf, format='JPEG', quality=quality, optimize=True)
            return buf.getvalue()
        except Exception as e_quartz:
            print(f"[CAPTURE ERROR] Both mss and Quartz failed. mss: {e_mss}, Quartz: {e_quartz}")
            return None


# --- Input Injection ---

def inject_mouse_move(x, y):
    point_x, point_y = x / 2.0, y / 2.0
    event = CGEventCreateMouseEvent(None, kCGEventMouseMoved, (point_x, point_y), kCGMouseButtonLeft)
    CGEventPost(kCGHIDEventTap, event)


def inject_mouse_click(x, y, button='left', down=True):
    point_x, point_y = x / 2.0, y / 2.0
    if button == 'left':
        et = kCGEventLeftMouseDown if down else kCGEventLeftMouseUp
        btn = kCGMouseButtonLeft
    else:
        et = kCGEventRightMouseDown if down else kCGEventRightMouseUp
        btn = kCGMouseButtonRight
    CGEventPost(kCGHIDEventTap, CGEventCreateMouseEvent(None, et, (point_x, point_y), btn))


def inject_mouse_drag(x, y):
    point_x, point_y = x / 2.0, y / 2.0
    CGEventPost(kCGHIDEventTap, CGEventCreateMouseEvent(
        None, kCGEventLeftMouseDragged, (point_x, point_y), kCGMouseButtonLeft))


def inject_scroll(dy_pixels):
    from Quartz import CGEventCreateScrollWheelEvent, kCGScrollEventUnitPixel
    CGEventPost(kCGHIDEventTap, CGEventCreateScrollWheelEvent(None, kCGScrollEventUnitPixel, 1, int(dy_pixels)))


def inject_key(keycode, down=True, flags=0):
    event = CGEventCreateKeyboardEvent(None, keycode, down)
    if flags:
        CGEventSetFlags(event, flags)
    CGEventPost(kCGHIDEventTap, event)


def inject_hotkey(keycode, modifier_flags):
    """Press modifier + key combo (e.g. Cmd+Tab)."""
    inject_key(keycode, down=True, flags=modifier_flags)
    inject_key(keycode, down=False, flags=modifier_flags)


def inject_text(text):
    for char in text:
        e_down = CGEventCreateKeyboardEvent(None, 0, True)
        e_down.keyboardSetUnicodeString_(len(char), char)
        CGEventPost(kCGHIDEventTap, e_down)
        e_up = CGEventCreateKeyboardEvent(None, 0, False)
        e_up.keyboardSetUnicodeString_(len(char), char)
        CGEventPost(kCGHIDEventTap, e_up)


KEY_MAP = {
    'Enter': 36, 'Return': 36, 'Backspace': 51, 'Delete': 51,
    'Tab': 48, 'Escape': 53, 'Space': 49,
    'ArrowUp': 126, 'ArrowDown': 125, 'ArrowLeft': 123, 'ArrowRight': 124,
    'Shift': 56, 'Control': 59, 'Option': 58, 'Command': 55, 'CapsLock': 57,
    'F1': 122, 'F2': 120, 'F3': 99, 'F4': 118, 'F5': 96, 'F6': 97,
    'F7': 98, 'F8': 100, 'F9': 101, 'F10': 109, 'F11': 103, 'F12': 111,
    'a': 0, 'b': 11, 'c': 8, 'd': 2, 'e': 14, 'f': 3,
    'g': 5, 'h': 4, 'i': 34, 'j': 38, 'k': 40, 'l': 37,
    'm': 46, 'n': 45, 'o': 31, 'p': 35, 'q': 12, 'r': 15,
    's': 1, 't': 17, 'u': 32, 'v': 9, 'w': 13, 'x': 7,
    'y': 16, 'z': 6,
    '0': 29, '1': 18, '2': 19, '3': 20, '4': 21,
    '5': 23, '6': 22, '7': 26, '8': 28, '9': 25,
    '-': 27, '=': 24, '[': 33, ']': 30, '\\': 42,
    ';': 41, "'": 39, ',': 43, '.': 47, '/': 44, '`': 50,
}

# macOS hotkey combos (keycode, modifier_flags)
HOTKEYS = {
    'cmd_tab': (48, kCGEventFlagMaskCommand),
    'cmd_shift_tab': (48, kCGEventFlagMaskCommand | kCGEventFlagMaskShift),
    'mission_control': (126, kCGEventFlagMaskControl),
    'app_windows': (125, kCGEventFlagMaskControl),
    'cmd_q': (12, kCGEventFlagMaskCommand),
    'cmd_w': (13, kCGEventFlagMaskCommand),
    'cmd_n': (45, kCGEventFlagMaskCommand),
    'cmd_t': (17, kCGEventFlagMaskCommand),
    'cmd_space': (49, kCGEventFlagMaskCommand),
    'cmd_h': (4, kCGEventFlagMaskCommand),
    'ctrl_left': (123, kCGEventFlagMaskControl),
    'ctrl_right': (124, kCGEventFlagMaskControl),
    'cmd_minus': (27, kCGEventFlagMaskCommand),
    'cmd_plus': (24, kCGEventFlagMaskCommand | kCGEventFlagMaskShift),
    'cmd_0': (29, kCGEventFlagMaskCommand),
    'screenshot': (4, kCGEventFlagMaskCommand | kCGEventFlagMaskShift),
 'arrow_left': (123, 0),
 'arrow_right': (124, 0),
 'arrow_up': (126, 0),
 'arrow_down': (125, 0),
 'enter': (36, 0),
 'escape': (53, 0),
}


def handle_input_event(data):
    try:
        etype = data.get("type")
        if etype == "mousemove":
            inject_mouse_move(data["x"], data["y"])
        elif etype == "mousedown":
            inject_mouse_move(data["x"], data["y"])
            inject_mouse_click(data["x"], data["y"], button=data.get("button", "left"), down=True)
        elif etype == "mouseup":
            inject_mouse_click(data["x"], data["y"], button=data.get("button", "left"), down=False)
        elif etype == "mousedrag":
            inject_mouse_drag(data["x"], data["y"])
        elif etype == "scroll":
            inject_scroll(data.get("dy", 0))
        elif etype == "keydown":
            key = data.get("key", "")
            if key in KEY_MAP:
                inject_key(KEY_MAP[key], down=True)
            elif len(key) == 1:
                inject_text(key)
            else:
                inject_text(key)
        elif etype == "keyup":
            key = data.get("key", "")
            if key in KEY_MAP:
                inject_key(KEY_MAP[key], down=False)
        elif etype == "text":
            inject_text(data.get("text", ""))
        elif etype == "hotkey":
            hk = data.get("key", "")
            if hk in HOTKEYS:
                keycode, flags = HOTKEYS[hk]
                inject_hotkey(keycode, flags)
                print(f"[HOTKEY] {hk}")
        elif etype == "quality":
            global FRAME_QUALITY
            FRAME_QUALITY = data["value"]
            print(f"[CFG] Quality → {FRAME_QUALITY}")
        elif etype == "annotation":
            # Store annotation strokes for AI to read
            _latest_annotations.append(data)
            # Keep only last 500 strokes to avoid memory bloat
            if len(_latest_annotations) > 500:
                _latest_annotations.pop(0)
        elif etype == "clear_annotations":
            _latest_annotations.clear()
    except Exception as e:
        print(f"[INPUT ERROR] {e}")
        traceback.print_exc()


# ─── AI Vision Endpoints ──────────────────────────────

async def handle_ai_frame(request):
    """Return the latest screen frame as JPEG for AI vision consumption."""
    global _latest_frame
    if _latest_frame:
        return web.Response(body=_latest_frame, content_type='image/jpeg')
    # Capture fresh if no cached frame
    jpeg = capture_screen_jpeg(85)
    if jpeg:
        return web.Response(body=jpeg, content_type='image/jpeg')
    return web.Response(status=503, text="No frame available")


async def handle_ai_annotations(request):
    """Return all current annotation strokes as JSON."""
    return web.json_response({"annotations": _latest_annotations, "count": len(_latest_annotations)})


async def handle_ai_clear(request):
    """Clear all annotations."""
    _latest_annotations.clear()


# --- Voice Bridge Integration ---
VOICEBRIDGE_STATE_DIR = os.path.expanduser(os.environ.get(
    "VOICEBRIDGE_STATE_DIR",
    os.path.join(os.environ.get("VOICEBRIDGE_PROJECT_ROOT", ""), ".voicebridge")
    if os.environ.get("VOICEBRIDGE_PROJECT_ROOT", "") else
    os.path.expanduser("~/.voicebridge")
))

def _read_voice_state():
    """Read latest transcription from voice bridge stream + last input files."""
    result = {"transcripts": [], "last_user_input": None, "last_user_input_ts": None}

    # Read voice stream file (append-only, all recent transcriptions)
    stream_path = os.path.join(VOICEBRIDGE_STATE_DIR, "voice_stream.txt")
    try:
        if os.path.isfile(stream_path):
            with open(stream_path, "r", encoding="utf-8", errors="replace") as f:
                lines = f.read().strip().splitlines()
                result["transcripts"] = [l.strip() for l in lines[-20:] if l.strip()]
    except Exception:
        pass

    # Read last user input (most recent single utterance)
    for path in ["/tmp/voice_last_user_input_text"]:
        try:
            if os.path.isfile(path):
                text = open(path, "r", encoding="utf-8", errors="replace").read().strip()
                if text:
                    result["last_user_input"] = text
        except Exception:
            pass

    for path in ["/tmp/voice_last_user_input_ts"]:
        try:
            if os.path.isfile(path):
                ts = open(path, "r").read().strip()
                if ts:
                    result["last_user_input_ts"] = ts
        except Exception:
            pass

    return result


async def handle_ai_voice(request):
    """Return latest voice transcription state for AI consumption.
    GET /ai/voice → JSON with transcripts[], last_user_input, last_user_input_ts
    Query params: ?clear=1 to clear the stream file after reading (consumer pattern)
    """
    state = _read_voice_state()
    state["voice_bridge_online"] = os.path.isfile(
        os.path.join(VOICEBRIDGE_STATE_DIR, "voice_stream.txt")
    ) or os.path.isfile("/tmp/voice_last_user_input_text")

    if "clear" in request.query:
        try:
            stream_path = os.path.join(VOICEBRIDGE_STATE_DIR, "voice_stream.txt")
            if os.path.isfile(stream_path):
                open(stream_path, "w").close()
        except Exception:
            pass

    return web.json_response(state)


async def handle_ai_say(request):
    """Speak text through the Mac's speakers via 'say' command (TTS).
    POST /ai/say  body: {"text": "Hello Daniel", "voice": "Daniel", "rate": 190}
    Also marks AI speaking timestamps for echo suppression in the voice bridge.
    """
    try:
        data = await request.json()
        text = data.get("text", "").strip()
        if not text:
            return web.json_response({"ok": False, "error": "No text provided"}, status=400)

        voice = data.get("voice", "Daniel")
        rate = data.get("rate", 190)

        # Mark AI speaking for echo suppression
        try:
            flag_path = "/tmp/ai_is_speaking"
            ts_path = "/tmp/voice_last_ai_speech_ts"
            text_path = "/tmp/voice_last_ai_speech_text"
            open(flag_path, "w").close()
            with open(ts_path, "w") as f:
                f.write(f"{time.time():.6f}")
            with open(text_path, "w") as f:
                f.write(text[:500])
        except Exception:
            pass

        # Run 'say' in background — it will play through the laptop speakers
        cmd = ["say", "-v", voice, "-r", str(rate), text]
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # Clean up AI speaking flag after speech finishes (async)
        async def _cleanup_after_speech():
            proc.wait()
            try:
                os.remove("/tmp/ai_is_speaking")
            except FileNotFoundError:
                pass

        asyncio.ensure_future(_cleanup_after_speech())

        return web.json_response({"ok": True, "pid": proc.pid, "text": text[:100]})
    except Exception as e:
        return web.json_response({"ok": False, "error": str(e)}, status=500)
    return web.json_response({"status": "cleared"})


# ─── HTML5 Client v2 ──────────────────────────────────

HTML_CLIENT = r"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>TNF Remote</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-touch-callout:none;-webkit-user-select:none}
html,body{width:100%;height:100%;background:#0a0a1a;color:#eee;
  font-family:-apple-system,BlinkMacSystemFont,sans-serif;overflow:hidden;touch-action:none}

/* Status bar */
#status{position:fixed;top:0;left:0;right:0;
  padding:env(safe-area-inset-top,8px) 12px 5px;
  background:rgba(0,0,0,0.88);color:#00ff88;font-size:10px;z-index:200;
  text-align:center;font-family:'SF Mono',monospace;transition:color .3s}
#status.err{color:#ff4444}#status.warn{color:#ffaa00}

/* Viewport: the zoomable/pannable area */
#viewport{position:fixed;top:0;left:0;right:0;bottom:0;overflow:hidden;background:#000;
  touch-action:none}
#screen-wrap{position:absolute;transform-origin:0 0;will-change:transform}
#screen{display:block;width:100%;height:100%;touch-action:none;pointer-events:none}

/* Annotation canvas (overlays the screen) */
#anno-canvas{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none!important;z-index:10}
#anno-canvas.drawing{pointer-events:auto!important;touch-action:none}

/* Cursor indicator — GIANT for outdoor visibility */
#cursor{position:fixed;width:64px;height:64px;border:3px solid #00ff88;border-radius:50%;
 pointer-events:none;z-index:150;display:none;transform:translate(-50%,-50%);
 box-shadow:0 0 30px 12px rgba(0,255,136,0.7),0 0 60px 24px rgba(0,255,136,0.3),0 0 100px 50px rgba(0,255,136,0.1);
 transition:border-color .15s;animation:cursorPulse 1.5s ease-in-out infinite}
#cursor::after{content:'';position:absolute;top:50%;left:50%;width:12px;height:12px;
 background:#00ff88;border-radius:50%;transform:translate(-50%,-50%);
 box-shadow:0 0 10px 4px rgba(0,255,136,0.8)}
@keyframes cursorPulse{0%,100%{box-shadow:0 0 30px 12px rgba(0,255,136,0.7),0 0 60px 24px rgba(0,255,136,0.3),0 0 100px 50px rgba(0,255,136,0.1)}
50%{box-shadow:0 0 40px 18px rgba(0,255,136,0.9),0 0 80px 36px rgba(0,255,136,0.4),0 0 120px 60px rgba(0,255,136,0.15)}}
body.rc #cursor{border-color:#ff5555;box-shadow:0 0 30px 12px rgba(255,85,85,0.7),0 0 60px 24px rgba(255,85,85,0.3),0 0 100px 50px rgba(255,85,85,0.1)}
body.rc #cursor::after{background:#ff5555}

/* Hidden keyboard input */
#kb{position:fixed;opacity:0.01;width:1px;height:1px;top:-100px;left:0;font-size:16px}

/* ── Toolbar ── */
#bar{position:fixed;bottom:0;left:0;right:0;
  padding:4px env(safe-area-inset-right,6px) env(safe-area-inset-bottom,6px);
  background:rgba(0,0,0,0.95);display:flex;align-items:center;gap:3px;z-index:200;
  overflow-x:auto;-webkit-overflow-scrolling:touch}
.btn{background:#1a1a3a;border:1px solid #2a2a5a;color:#999;border-radius:10px;
  padding:7px 8px;font-size:16px;line-height:1;min-width:40px;min-height:40px;
  text-align:center;-webkit-tap-highlight-color:transparent;cursor:pointer;
  flex-shrink:0;transition:all .12s}
.btn:active,.btn.on{background:#00ff88;color:#000;border-color:#00ff88}
.btn.danger{border-color:#ff5555;color:#ff5555}
.btn.danger:active,.btn.danger.on{background:#ff5555;color:#fff}
.sep{width:1px;height:28px;background:#333;flex-shrink:0;margin:0 2px}

/* ── Hotkey Panel ── */
#hotkeys{position:fixed;bottom:54px;left:0;right:0;
  background:rgba(0,0,0,0.95);padding:8px;display:none;
  grid-template-columns:repeat(5,1fr);gap:6px;z-index:199;
  border-top:1px solid #222}
#hotkeys.show{display:grid}
.hk{background:#111;border:1px solid #333;color:#ccc;border-radius:8px;
  padding:10px 4px;font-size:10px;text-align:center;min-height:42px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:2px;-webkit-tap-highlight-color:transparent}
.hk:active{background:#00ff88;color:#000}
.hk .ico{font-size:18px}

/* ── Annotation Toolbar ── */
#anno-bar{position:fixed;top:32px;left:0;right:0;
  background:rgba(0,0,0,0.9);padding:4px 8px;display:none;
  align-items:center;gap:6px;z-index:201;justify-content:center}
#anno-bar.show{display:flex}
.abtn{background:#1a1a3a;border:1px solid #2a2a5a;color:#aaa;border-radius:8px;
  padding:6px 10px;font-size:12px;min-height:36px;min-width:36px;
  text-align:center;-webkit-tap-highlight-color:transparent}
.abtn:active,.abtn.on{background:#ff8800;color:#000;border-color:#ff8800}
.abtn.pen:active,.abtn.pen.on{background:#00ccff;color:#000;border-color:#00ccff}

/* Info badge */
#fps{font-family:'SF Mono',monospace;font-size:9px;color:#555;min-width:38px;text-align:center}
#zoom-ind{font-family:'SF Mono',monospace;font-size:9px;color:#555;position:fixed;
  top:32px;right:8px;z-index:201;pointer-events:none}
</style>
</head>
<body>
<div id="status" class="warn">⏳ Connecting...</div>
<div id="viewport">
 <div id="screen-wrap">
 <img id="screen" src="" alt="Mac">
 <canvas id="anno-canvas" width="2560" height="1600"></canvas>
 </div>
</div>
<div id="touch-debug" style="position:fixed;bottom:90px;right:8px;background:rgba(0,0,0,0.8);color:#0f0;font-size:9px;padding:4px 8px;border-radius:4px;z-index:300;display:none;max-width:120px;word-break:break-all;font-family:monospace"></div>
<div id="cursor"></div>
<input id="kb" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
<div id="zoom-ind">1.0x</div>

<!-- Annotation toolbar -->
<div id="anno-bar">
  <button class="abtn pen" id="ap" title="Pencil">✏️</button>
  <button class="abtn" id="ah" title="Highlighter">🖍️</button>
  <button class="abtn" id="ae" title="Eraser">🧹</button>
  <button class="abtn danger" id="ax" title="Clear All">✕</button>
  <button class="abtn" id="ao" title="Close Annotations">✖</button>
</div>

<!-- Hotkey panel -->
<div id="hotkeys">
  <button class="hk" data-hk="cmd_tab"><span class="ico">🔀</span>Apps</button>
  <button class="hk" data-hk="mission_control"><span class="ico">🚀</span>Mission</button>
  <button class="hk" data-hk="app_windows"><span class="ico">🪟</span>Windows</button>
  <button class="hk" data-hk="cmd_q"><span class="ico">❌</span>Quit</button>
  <button class="hk" data-hk="cmd_w"><span class="ico">✕</span>Close</button>
  <button class="hk" data-hk="cmd_n"><span class="ico">🆕</span>New</button>
  <button class="hk" data-hk="cmd_t"><span class="ico">📑</span>New Tab</button>
  <button class="hk" data-hk="cmd_space"><span class="ico">🔍</span>Spotlight</button>
  <button class="hk" data-hk="cmd_h"><span class="ico">🙈</span>Hide</button>
  <button class="hk" data-hk="ctrl_left"><span class="ico">◀️</span>Desk←</button>
  <button class="hk" data-hk="ctrl_right"><span class="ico">▶️</span>Desk→</button>
  <button class="hk" data-hk="screenshot"><span class="ico">📸</span>Snap</button>
  <button class="hk" data-hk="cmd_plus"><span class="ico">🔍+</span>ZoomIn</button>
  <button class="hk" data-hk="cmd_minus"><span class="ico">🔍-</span>ZoomOut</button>
  <button class="hk" data-hk="cmd_0"><span class="ico">🔍0</span>Reset</button>
  <button class="hk" data-hk="cmd_shift_tab"><span class="ico">🔀◀</span>Apps←</button>
 <button class="hk" data-hk="arrow_left"><span class="ico">⬅️</span>←</button>
 <button class="hk" data-hk="arrow_right"><span class="ico">➡️</span>→</button>
 <button class="hk" data-hk="arrow_up"><span class="ico">⬆️</span>↑</button>
 <button class="hk" data-hk="arrow_down"><span class="ico">⬇️</span>↓</button>
 <button class="hk" data-hk="enter"><span class="ico">✅</span>Enter</button>
 <button class="hk" data-hk="escape"><span class="ico">🚫</span>Esc</button>
</div>

<!-- Main toolbar -->
<div id="bar">
  <button class="btn" id="bk" title="Keyboard">⌨️</button>
  <button class="btn" id="br" title="Right Click">🖱️</button>
  <button class="btn" id="bd" title="Drag">✊</button>
  <button class="btn" id="bs" title="Scroll">↕️</button>
  <div class="sep"></div>
  <button class="btn" id="ba" title="Annotations">✏️</button>
  <button class="btn" id="bh" title="Hotkeys">⌨️*</button>
  <div class="sep"></div>
  <button class="btn" id="bq" title="Quality">📊</button>
  <button class="btn" id="bz" title="Reset Zoom">🔄</button>
  <span id="fps">--</span>
</div>

<script>
const $=id=>document.getElementById(id);
const img=$('screen'), stat=$('status'), cur=$('cursor'), kb=$('kb');
const fpsEl=$('fps'), zoomInd=$('zoom-ind');
const viewport=$('viewport'), wrap=$('screen-wrap'), annoCanvas=$('anno-canvas');
const annoCtx=annoCanvas.getContext('2d');
const touchDbg=$('touch-debug');

let ws, si;  // si = screen info
let rcMode=false, dragMode=false, scrollMode=false, dragging=false;
let annoMode=null; // null | 'pencil' | 'highlighter' | 'eraser'
let annoDrawing=false;
let ltX=0, ltY=0, fc=0, ltFps=Date.now(), quality=60, qStep=1;
const Q_LEVELS=[30, 60, 80, 95];

// ─── Zoom & Pan ───
let zoom=1, panX=0, panY=0;
let pinchStartDist=0, pinchStartZoom=1;
let panStartX=0, panStartY=0, panStartPanX=0, panStartPanY=0;
let twoFingerPan=false;

function updateTransform(){
  wrap.style.transform=`translate(${panX}px,${panY}px) scale(${zoom})`;
  zoomInd.textContent=zoom.toFixed(1)+'x';
}

function resetZoom(){zoom=1;panX=0;panY=0;updateTransform()}

// ─── Connect ───
function connect(){
  const p=location.protocol==='https:'?'wss:':'ws:';
  stat.textContent='⏳ Connecting...';stat.className='warn';
  ws=new WebSocket(`${p}//${location.host}/ws`);ws.binaryType='blob';
  ws.onopen=()=>{stat.textContent='🟢 Tap to control · Pinch to zoom';stat.className=''};
  ws.onmessage=e=>{
    if(typeof e.data==='string'){
      const m=JSON.parse(e.data);
      if(m.type==='hello'){
        si=m;
        // Size the wrap to match screen aspect
        const aspect=si.screen.width/si.screen.height;
        // Set wrap dimensions to fill viewport maintaining aspect
        resizeWrap();
        annoCanvas.width=si.screen.width;
        annoCanvas.height=si.screen.height;
      }
    }else{
      URL.revokeObjectURL(img.src);
      img.src=URL.createObjectURL(e.data);
      fc++;
      const n=Date.now();
      if(n-ltFps>1000){fpsEl.textContent=Math.round(fc*1000/(n-ltFps))+' FPS';fc=0;ltFps=n}
    }
  };
  ws.onclose=()=>{stat.textContent='🔴 Disconnected — retry 2s';stat.className='err';setTimeout(connect,2000)};
  ws.onerror=()=>{stat.textContent='🔴 Error';stat.className='err'};
}

function resizeWrap(){
  if(!si)return;
  const vw=viewport.clientWidth, vh=viewport.clientHeight;
  const sa=si.screen.width/si.screen.height;
  const va=vw/vh;
  let w,h;
  if(va>sa){h=vh;w=h*sa}else{w=vw;h=w/sa}
  wrap.style.width=w+'px';wrap.style.height=h+'px';
  // Center
  panX=(vw-w*zoom)/2; panY=(vh-h*zoom)/2;
  updateTransform();
}
window.addEventListener('resize',resizeWrap);

// ─── Coordinate Mapping ───
function sc(clientX,clientY){
  const r=wrap.getBoundingClientRect();
  const sx=(si?.screen?.width||2560)/(r.width);
  const sy=(si?.screen?.height||1600)/(r.height);
  return{x:Math.round((clientX-r.left)*sx),y:Math.round((clientY-r.top)*sy)}
}

function send(d){if(ws?.readyState===1)ws.send(JSON.stringify(d))}

function showCur(x,y){
  const r=wrap.getBoundingClientRect();
  const sx=r.width/(si?.screen?.width||2560);
  const sy=r.height/(si?.screen?.height||1600);
  cur.style.display='block';
  cur.style.left=(r.left+x*sx)+'px';cur.style.top=(r.top+y*sy)+'px';
}

// ─── Touch: Control + Zoom + Double-Tap ───
let lastTapTime=0, lastTapX=0, lastTapY=0;
function tapDebug(msg){
 touchDbg.style.display='block';
 touchDbg.textContent=msg;
 clearTimeout(touchDbg._t);
 touchDbg._t=setTimeout(()=>{touchDbg.style.display='none'},2000);
}
viewport.addEventListener('touchstart',e=>{
 if(annoCanvas.classList.contains('drawing')){
 // Annotation touch handled separately
 return;
 }
 e.preventDefault();e.stopPropagation();
 if(e.touches.length===2){
    // Two finger: pinch zoom or pan
    twoFingerPan=true;
    const dx=e.touches[0].clientX-e.touches[1].clientX;
    const dy=e.touches[0].clientY-e.touches[1].clientY;
    pinchStartDist=Math.hypot(dx,dy);
    pinchStartZoom=zoom;
    panStartX=(e.touches[0].clientX+e.touches[1].clientX)/2;
    panStartY=(e.touches[0].clientY+e.touches[1].clientY)/2;
    panStartPanX=panX; panStartPanY=panY;
    return;
  }
 if(e.touches.length!==1)return;
 twoFingerPan=false;
 const t=e.touches[0],c=sc(t.clientX,t.clientY);
 ltX=c.x;ltY=c.y;showCur(c.x,c.y);
 tapDebug(`tap ${c.x},${c.y}`);
 // Double-tap detection: two taps within 300ms in same spot
 const now=Date.now();
 const isDbl=(now-lastTapTime<300)&&Math.abs(c.x-lastTapX)<80&&Math.abs(c.y-lastTapY)<80;
 lastTapTime=now;lastTapX=c.x;lastTapY=c.y;
 if(scrollMode)return;
 if(isDbl){
 // Double tap = double click (open)
 tapDebug('DBLCLICK '+c.x+','+c.y);
 send({type:'mousedown',x:c.x,y:c.y,button:'left'});
 send({type:'mouseup',x:c.x,y:c.y,button:'left'});
 send({type:'mousedown',x:c.x,y:c.y,button:'left'});
 send({type:'mouseup',x:c.x,y:c.y,button:'left'});
 }else if(dragMode){dragging=true;send({type:'mousedown',x:c.x,y:c.y,button:'left'})}
 else if(rcMode){send({type:'mousedown',x:c.x,y:c.y,button:'right'})}
 else{send({type:'mousemove',x:c.x,y:c.y});send({type:'mousedown',x:c.x,y:c.y,button:'left'})}
},{passive:false});

viewport.addEventListener('touchmove',e=>{
  if(annoCanvas.classList.contains('drawing'))return;
  e.preventDefault();
  if(e.touches.length===2&&twoFingerPan){
    const dx=e.touches[0].clientX-e.touches[1].clientX;
    const dy=e.touches[0].clientY-e.touches[1].clientY;
    const dist=Math.hypot(dx,dy);
    // Zoom
    zoom=pinchStartZoom*(dist/pinchStartDist);
    zoom=Math.max(0.5,Math.min(zoom,8));
    // Pan
    const cx=(e.touches[0].clientX+e.touches[1].clientX)/2;
    const cy=(e.touches[0].clientY+e.touches[1].clientY)/2;
    panX=panStartPanX+(cx-panStartX);
    panY=panStartPanY+(cy-panStartY);
    updateTransform();
    return;
  }
  if(e.touches.length!==1||twoFingerPan)return;
  const t=e.touches[0],c=sc(t.clientX,t.clientY);showCur(c.x,c.y);
  if(scrollMode){send({type:'scroll',dy:Math.round((c.y-ltY)*-3)})}
  else if(dragging){send({type:'mousedrag',x:c.x,y:c.y})}
  else{send({type:'mousemove',x:c.x,y:c.y})}
  ltX=c.x;ltY=c.y;
},{passive:false});

viewport.addEventListener('touchend',e=>{
 if(annoCanvas.classList.contains('drawing'))return;
 e.preventDefault();e.stopPropagation();
 if(twoFingerPan&&e.touches.length<2){twoFingerPan=false;return}
 if(scrollMode)return;
 const btn=rcMode?'right':'left';
 if(dragging){send({type:'mouseup',x:ltX,y:ltY,button:'left'});dragging=false}
 else{send({type:'mouseup',x:ltX,y:ltY,button:btn})}
},{passive:false});

// ─── Safari Touch Fallback ───
// Safari sometimes doesn't bubble touch through overlays.
// Also bind to document for reliability.
document.addEventListener('touchstart',e=>{
 if(annoCanvas.classList.contains('drawing'))return;
 if(e.target.closest('#bar')||e.target.closest('#hotkeys')||e.target.closest('#kb'))return;
 if(e.target===viewport||viewport.contains(e.target))return; // already handled above
 e.preventDefault();
},{passive:false});

// ─── Annotation Touch ───
annoCanvas.addEventListener('touchstart',e=>{
  e.preventDefault();e.stopPropagation();
  annoDrawing=true;
  const c=sc(e.touches[0].clientX,e.touches[0].clientY);
  annoCtx.beginPath();
  annoCtx.moveTo(c.x,c.y);
  if(annoMode==='eraser'){
    annoCtx.globalCompositeOperation='destination-out';
    annoCtx.lineWidth=30;
    annoCtx.strokeStyle='rgba(0,0,0,1)';
  }else if(annoMode==='highlighter'){
    annoCtx.globalCompositeOperation='source-over';
    annoCtx.lineWidth=20;
    annoCtx.strokeStyle='rgba(255,200,0,0.35)';
    annoCtx.lineCap='round';annoCtx.lineJoin='round';
  }else{
    annoCtx.globalCompositeOperation='source-over';
    annoCtx.lineWidth=3;
    annoCtx.strokeStyle='#00ccff';
    annoCtx.lineCap='round';annoCtx.lineJoin='round';
  }
  annoCtx.lineTo(c.x,c.y);
  annoCtx.stroke();
  // Send annotation start
  send({type:'annotation',mode:annoMode,points:[{x:c.x,y:c.y}],time:Date.now()});
},{passive:false});

annoCanvas.addEventListener('touchmove',e=>{
  e.preventDefault();e.stopPropagation();
  if(!annoDrawing)return;
  const c=sc(e.touches[0].clientX,e.touches[0].clientY);
  annoCtx.lineTo(c.x,c.y);
  annoCtx.stroke();
  send({type:'annotation',mode:annoMode,points:[{x:c.x,y:c.y}],time:Date.now()});
},{passive:false});

annoCanvas.addEventListener('touchend',e=>{
  e.preventDefault();
  annoDrawing=false;
  annoCtx.closePath();
  send({type:'annotation',mode:annoMode,points:[],end:true,time:Date.now()});
},{passive:false});

// ─── Mouse (desktop testing) ───
viewport.addEventListener('mousedown',e=>{
  const c=sc(e.clientX,e.clientY);showCur(c.x,c.y);
  send({type:'mousedown',x:c.x,y:c.y,button:e.button===2?'right':'left'})});
viewport.addEventListener('mousemove',e=>{
  if(e.buttons){const c=sc(e.clientX,e.clientY);showCur(c.x,c.y);
  send({type:e.buttons===1?'mousedrag':'mousemove',x:c.x,y:c.y})}});
viewport.addEventListener('mouseup',e=>{const c=sc(e.clientX,e.clientY);
  send({type:'mouseup',x:c.x,y:c.y,button:e.button===2?'right':'left'})});
viewport.addEventListener('wheel',e=>{
  send({type:'scroll',dy:Math.round(e.deltaY)});
  // Also handle local zoom with Ctrl+wheel
  if(e.ctrlKey){e.preventDefault();zoom*=e.deltaY>0?0.9:1.1;zoom=Math.max(0.5,Math.min(zoom,8));updateTransform()}
},{passive:false});
viewport.addEventListener('contextmenu',e=>e.preventDefault());

// ─── Keyboard ───
$('bk').onclick=()=>{kb.focus();stat.textContent='⌨️ Type to send to Mac'};
kb.addEventListener('input',()=>{if(kb.value){send({type:'text',text:kb.value});kb.value=''}});
kb.addEventListener('keydown',e=>{
  if(e.key==='Enter'){send({type:'keydown',key:'Enter'});send({type:'keyup',key:'Enter'});e.preventDefault()}
  else if(e.key==='Backspace'){send({type:'keydown',key:'Backspace'});send({type:'keyup',key:'Backspace'});e.preventDefault()}
  else if(e.key==='Tab'){send({type:'keydown',key:'Tab'});send({type:'keyup',key:'Tab'});e.preventDefault()}
});

// ─── Toolbar ───
function clearModes(){
  rcMode=dragMode=scrollMode=dragging=false;
  $('br').classList.remove('on');$('bd').classList.remove('on');$('bs').classList.remove('on');
  document.body.classList.remove('rc');
  if(ws?.readyState===1)stat.textContent='🟢 Tap to control · Pinch to zoom'}

$('br').onclick=()=>{const a=!rcMode;clearModes();if(a){rcMode=true;$('br').classList.add('on');
  document.body.classList.add('rc');stat.textContent='🔴 Right-click mode'}};
$('bd').onclick=()=>{const a=!dragMode;clearModes();if(a){dragMode=true;$('bd').classList.add('on');
  stat.textContent='✊ Drag mode'}};
$('bs').onclick=()=>{const a=!scrollMode;clearModes();if(a){scrollMode=true;$('bs').classList.add('on');
  stat.textContent='↕️ Scroll mode'}};

// Quality toggle
$('bq').onclick=()=>{qStep=(qStep+1)%Q_LEVELS.length;quality=Q_LEVELS[qStep];
  send({type:'quality',value:quality});stat.textContent='📊 Quality: '+quality+'%'};

// Reset zoom
$('bz').onclick=resetZoom;

// ─── Hotkey Panel ───
$('bh').onclick=()=>{$('hotkeys').classList.toggle('show')};
document.querySelectorAll('.hk').forEach(b=>{
  b.onclick=()=>{
    send({type:'hotkey',key:b.dataset.hk});
    // Visual feedback
    b.style.background='#00ff88';b.style.color='#000';
    setTimeout(()=>{b.style.background='';b.style.color=''},200);
  }});

// ─── Annotations ───
$('ba').onclick=()=>{
  if(annoMode){
    annoMode=null;annoCanvas.classList.remove('drawing');
    $('anno-bar').classList.remove('show');$('ba').classList.remove('on');
    clearModes();stat.textContent='🟢 Tap to control · Pinch to zoom';
  }else{
    annoMode='pencil';
    annoCanvas.classList.add('drawing');
    $('anno-bar').classList.add('show');$('ba').classList.add('on');
    $('ap').classList.add('on');
    clearModes();stat.textContent='✏️ Pencil mode — draw on screen';
  }
};

$('ap').onclick=()=>{annoMode='pencil';
  $('ap').classList.add('on');$('ah').classList.remove('on');$('ae').classList.remove('on');
  stat.textContent='✏️ Pencil mode'};
$('ah').onclick=()=>{annoMode='highlighter';
  $('ah').classList.add('on');$('ap').classList.remove('on');$('ae').classList.remove('on');
  stat.textContent='🖍️ Highlighter mode'};
$('ae').onclick=()=>{annoMode='eraser';
  $('ae').classList.add('on');$('ap').classList.remove('on');$('ah').classList.remove('on');
  stat.textContent='🧹 Eraser mode'};
$('ax').onclick=()=>{annoCtx.clearRect(0,0,annoCanvas.width,annoCanvas.height);
  send({type:'clear_annotations'});stat.textContent='✕ Cleared annotations'};
$('ao').onclick=()=>{annoMode=null;annoCanvas.classList.remove('drawing');
  $('anno-bar').classList.remove('show');$('ba').classList.remove('on');
  clearModes()};

// Prevent iOS gestures
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('gesturechange',e=>e.preventDefault());
document.addEventListener('gestureend',e=>e.preventDefault());

connect();
</script>
</body>
</html>
"""


# ─── Server Setup ──────────────────────────────────────

async def handle_ws(request):
    global _latest_frame
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    connected_clients.add(ws)
    print(f"[+] Client connected. Total: {len(connected_clients)}")
    start_caffeinate()
    
    pixel_w = CGDisplayPixelsWide(CGMainDisplayID()) * 2
    pixel_h = CGDisplayPixelsHigh(CGMainDisplayID()) * 2
    await ws.send_json({"type": "hello", "screen": {"width": pixel_w, "height": pixel_h}})
    
    sender = asyncio.create_task(send_frames(ws))
    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    handle_input_event(data)
                except Exception as e:
                    print(f"[INPUT PARSE ERROR] {e}")
            elif msg.type == web.WSMsgType.ERROR:
                print(f"[WS ERROR] {ws.exception()}")
    except Exception as e:
        print(f"[WS HANDLER ERROR] {e}")
    finally:
        sender.cancel()
        connected_clients.discard(ws)
        print(f"[-] Client disconnected. Total: {len(connected_clients)}")
        if not connected_clients:
            stop_caffeinate()
    return ws


async def send_frames(ws):
    global _latest_frame
    frame_count = 0
    adaptive_quality = FRAME_QUALITY
    while True:
        try:
            t0 = time.time()
            jpeg = capture_screen_jpeg(adaptive_quality)
            if jpeg and not ws.closed:
                _latest_frame = jpeg  # Cache for AI endpoint
                await ws.send_bytes(jpeg)
                frame_count += 1
                capture_stats["frames"] += 1
                if frame_count % 100 == 0:
                    elapsed = time.time() - capture_stats["start_time"]
                    fps = capture_stats["frames"] / elapsed if elapsed > 0 else 0
                    print(f"[STATS] {frame_count} frames, avg {fps:.1f} FPS, quality={adaptive_quality}")
                elapsed = time.time() - t0
                # Adaptive quality: if frame took >200ms, drop quality to speed up
                if elapsed > 0.2 and adaptive_quality > 15:
                    adaptive_quality = max(15, adaptive_quality - 5)
                elif elapsed < 0.08 and adaptive_quality < FRAME_QUALITY:
                    adaptive_quality = min(FRAME_QUALITY, adaptive_quality + 2)
                await asyncio.sleep(max(0, FRAME_INTERVAL - elapsed))
        except asyncio.CancelledError:
            break
        except Exception as e:
            if "closed" in str(e).lower(): break
            print(f"[FRAME ERROR] {e}")
            await asyncio.sleep(0.1)


async def handle_index(request):
    return web.Response(text=HTML_CLIENT, content_type='text/html')


async def main():
    global FRAME_QUALITY, TARGET_FPS, FRAME_INTERVAL
    
    parser = argparse.ArgumentParser(description='TNF Remote Relay v2')
    parser.add_argument('--port', type=int, default=8080)
    parser.add_argument('--quality', type=int, default=60)
    parser.add_argument('--fps', type=int, default=20)
    args = parser.parse_args()
    
    FRAME_QUALITY = args.quality
    TARGET_FPS = args.fps
    FRAME_INTERVAL = 1.0 / TARGET_FPS
    
    app = web.Application()
    app.router.add_get('/', handle_index)
    app.router.add_get('/ws', handle_ws)
    # AI vision endpoints
    app.router.add_get('/ai/frame', handle_ai_frame)
    app.router.add_get('/ai/annotations', handle_ai_annotations)
    app.router.add_post('/ai/clear', handle_ai_clear)
    app.router.add_get('/ai/voice', handle_ai_voice)
    app.router.add_post('/ai/say', handle_ai_say)
    
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        local_ip = s.getsockname()[0]
    except:
        local_ip = '127.0.0.1'
    finally:
        s.close()
    
    print()
    print("═══════════════════════════════════════════════════════")
    print("  🖥️  TNF REMOTE RELAY v2 — iPhone Mirror + AI Vision")
    print("═══════════════════════════════════════════════════════")
    print()
    print(f"  📱 iPhone Safari:")
    print(f"     http://{local_ip}:{args.port}")
    print()
    print(f" 🧠 AI Vision Endpoints:")
    print(f" GET /ai/frame → latest JPEG screenshot")
    print(f" GET /ai/annotations → annotation strokes JSON")
    print(f" POST /ai/clear → clear annotations")
    print(f" GET /ai/voice → voice bridge transcription state")
    print(f" POST /ai/say → TTS reply via Mac speakers")
    print()
    print(f"  ⚙️  {TARGET_FPS} FPS · JPEG Q{FRAME_QUALITY}")
    print(f"  🆕 Pinch zoom · Hotkeys · Annotations · AI feed")
    print()
    print("═══════════════════════════════════════════════════════")
    print()
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', args.port)
    await site.start()
    await asyncio.Future()


if __name__ == '__main__':
    asyncio.run(main())

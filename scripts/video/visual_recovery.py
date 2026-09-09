#!/usr/bin/env python3
"""TNF visual recovery for modality gaps (EXPANDED_VIDEO_INTELLIGENCE_SPEC.md).

Consumes the gap set produced by `modality_gap_pass.py` and attempts evidence
recovery for `visual` gaps whose status is `unresolved`:

  1. Resolve the source video (local file, or download via yt-dlp).
  2. For each gap timestamp, extract frames at [t-2s, t, t+2s] with ffmpeg.
  3. Dedupe frames (identical-content md5 after normalization size).
  4. Optional OCR if tesseract is available (--ocr).
  5. Optional vision-model description via a user-supplied command
     (--vision-cmd 'some-cli {frame}'); the command must print a
     one-paragraph description to stdout.

Status transitions:
  - no artifact recovered           -> stays "unresolved"
  - frames extracted (no content)   -> stays "unresolved", frames attached
  - OCR text or vision description  -> "resolved" (confidence raised) when it
                                       yields non-trivial content, else stays
                                       "unresolved" with the artifact noted.

Every artifact path and description is appended to the gap record under
`recoveryArtifacts`, preserving full attribution.

Usage:
  python3 scripts/video/visual_recovery.py \
      --gaps gaps.json --video-url 'https://www.youtube.com/watch?v=...' \
      --out-dir data/video-frames/<video-id> [--ocr] [--max-gaps 10]

Classification (Turn Zero V2): oss_runtime / product_state / public.
Downloaded media and extracted frames are bounded working state; keep
operator-private outputs under User-Data/<user>/ and out of source control.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
from typing import List, Optional

FRAME_OFFSETS = (-2.0, 0.0, 2.0)
MIN_OCR_CHARS = 15  # below this OCR output is treated as no content


def run(cmd: List[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def have_tool(name: str) -> bool:
    return shutil.which(name) is not None


def resolve_video(url: Optional[str], local: Optional[str], workdir: str) -> str:
    if local:
        if not os.path.isfile(local):
            raise SystemExit(f"video file not found: {local}")
        return local
    if not url:
        raise SystemExit("provide --video-url or --video-file")
    if not have_tool("yt-dlp"):
        raise SystemExit("yt-dlp not installed; provide --video-file instead")
    out_tmpl = os.path.join(workdir, "%(id)s.%(ext)s")
    # Low-res is sufficient for UI/text capture and far cheaper to move around.
    cmd = ["yt-dlp", "-f", "bv*[height<=720][ext=mp4]/bv*[height<=720]/b",
           "--no-playlist", "-o", out_tmpl]
    # YouTube increasingly requires a JS runtime to resolve formats (403 without one).
    js_rt = next((rt for rt in ("deno", "node") if have_tool(rt)), None)
    if js_rt:
        cmd += ["--js-runtimes", js_rt]
    # Default clients increasingly return 403/SABR-only; android client works.
    cmd += ["--extractor-args", "youtube:player_client=android,web"]
    cmd.append(url)
    proc = run(cmd)
    if proc.returncode != 0:
        raise SystemExit(f"yt-dlp failed:\n{proc.stderr[-2000:]}")
    for name in os.listdir(workdir):
        if name.rsplit(".", 1)[-1] in ("mp4", "mkv", "webm", "m4v", "mov"):
            return os.path.join(workdir, name)
    raise SystemExit("yt-dlp reported success but no video file appeared")


def extract_frames(video: str, t: float, out_dir: str, tag: str) -> List[str]:
    frames: List[str] = []
    for off in FRAME_OFFSETS:
        ts = max(0.0, t + off)
        dest = os.path.join(out_dir, f"{tag}_{ts:012.3f}.jpg")
        proc = run([
            "ffmpeg", "-y", "-ss", f"{ts:.3f}", "-i", video,
            "-frames:v", "1", "-q:v", "3", "-vf", "scale=1280:-1", dest,
        ])
        if proc.returncode == 0 and os.path.isfile(dest) and os.path.getsize(dest):
            frames.append(dest)
    return frames


def dedupe_frames(paths: List[str]) -> List[str]:
    """Drop byte-identical frames; adjacent static-screen shots collapse."""
    seen = set()
    unique: List[str] = []
    for p in paths:
        with open(p, "rb") as fh:
            digest = hashlib.md5(fh.read()).hexdigest()
        if digest in seen:
            os.remove(p)
            continue
        seen.add(digest)
        unique.append(p)
    return unique


def ocr_frame(path: str) -> Optional[str]:
    if not have_tool("tesseract"):
        return None
    proc = run(["tesseract", path, "stdout", "--psm", "6"])
    if proc.returncode != 0:
        return None
    text = re.sub(r"\s+", " ", proc.stdout).strip()
    return text if len(text) >= MIN_OCR_CHARS else None


def describe_frame(path: str, vision_cmd: Optional[str]) -> Optional[str]:
    if not vision_cmd:
        return None
    # Vision agents run with their own cwd; a relative path invites the agent
    # to "helpfully" search the filesystem for a file it cannot find. Always
    # hand over an absolute, verified path.
    abs_path = os.path.abspath(path)
    if not os.path.isfile(abs_path):
        return None
    cmd = [part.replace("{frame}", abs_path) for part in shlex.split(vision_cmd)]
    try:
        proc = run(cmd, timeout=180)
    except subprocess.TimeoutExpired:
        return None
    if proc.returncode != 0:
        return None
    text = proc.stdout.strip()
    return text or None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--video-url")
    src.add_argument("--video-file")
    ap.add_argument("--gaps", required=True, help="gaps JSON from modality_gap_pass")
    ap.add_argument("--out-dir", required=True, help="frame/artifact output dir")
    ap.add_argument("--output", help="where to write updated gaps (default: in-place)")
    ap.add_argument("--max-gaps", type=int, default=25)
    ap.add_argument("--ocr", action="store_true")
    ap.add_argument("--vision-cmd",
                    help="command template with {frame}; stdout = description")
    args = ap.parse_args()

    with open(args.gaps, "r", encoding="utf-8") as fh:
        payload = json.load(fh)
    gaps = payload.get("gaps", payload if isinstance(payload, list) else [])

    targets = [g for g in gaps
               if g.get("modality") == "visual"
               and g.get("status") == "unresolved"
               and isinstance(g.get("timestamp"), (int, float))]
    targets = targets[: args.max_gaps]
    if not targets:
        print("no unresolved timestamped visual gaps; nothing to recover")
        return 0

    os.makedirs(args.out_dir, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="tnf-vrec-") as tmp:
        video = resolve_video(args.video_url, args.video_file, tmp)
        print(f"video resolved: {os.path.basename(video)}")

        for i, gap in enumerate(targets):
            tag = f"gap{i:03d}"
            frames = dedupe_frames(extract_frames(video, gap["timestamp"], args.out_dir, tag))
            artifacts = gap.setdefault("recoveryArtifacts", [])

            recovered_text: Optional[str] = None
            for frame in frames:
                artifacts.append({"type": "frame", "path": frame})
            described_frame = None
            # Cheapest-first escalation: OCR all frames; if nothing contentful,
            # describe the middle (on-cue) frame, then neighbours as fallback.
            if args.ocr:
                for frame in frames:
                    text = ocr_frame(frame)
                    if text:
                        recovered_text = text
                        described_frame = frame
                        break
            if not recovered_text:
                ordered = frames[1:2] + frames[:1] + frames[2:]
                for frame in ordered:
                    text = describe_frame(frame, args.vision_cmd)
                    if text:
                        recovered_text = text
                        described_frame = frame
                        break
            if described_frame:
                for entry in artifacts:
                    if entry["path"] == described_frame:
                        entry["description"] = recovered_text
                        break

            if recovered_text:
                gap["recoveredContext"] = recovered_text
                gap["status"] = "resolved"
                gap["confidence"] = min(1.0, gap.get("confidence", 0) * 0.5 + 0.5)
            elif frames:
                gap["recoveryPlan"] = (gap.get("recoveryPlan", "frame")
                                       + " [frames extracted; content review pending]")

    out = args.output or args.gaps
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)

    resolved = sum(1 for g in gaps if g.get("status") == "resolved")
    print(f"processed={len(targets)} resolved_total={resolved} -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

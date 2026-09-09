#!/usr/bin/env python3
"""TNF modality-gap pass (EXPANDED_VIDEO_INTELLIGENCE_SPEC.md §4).

Scans a timestamped video transcript and emits one record per suspected
modality gap, using the schema mandated by the spec:

    {
      "timestamp": 123,
      "modality": "visual|audio|external-artifact|transcript-loss",
      "cue": "the attributed phrase or detected discontinuity",
      "missingContext": "what cannot be established from transcript alone",
      "recoveryPlan": "frame, clip, OCR, audio analysis, linked source, or manual review",
      "status": "resolved|unresolved|not-material",
      "confidence": 0.0
    }

Input formats understood:
  - WebVTT (.vtt), as produced by `yt-dlp --write-auto-subs --sub-format vtt`
  - Bracketed plain text: lines starting with [HH:MM:SS], HH:MM:SS., etc.
  - Plain text without timestamps (timestamp:null, lower confidence)

Usage:
  python3 scripts/video/modality_gap_pass.py --input transcript.vtt \
      --output gaps.json [--markdown gaps.md] [--min-confidence 0.5]

Classification (Turn Zero V2): oss_runtime / product_state / public.
Operator-private transcripts must never be committed; pass them via
User-Data/<user>/ paths, which live outside source control.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from typing import List, Optional

# ---------------------------------------------------------------------------
# Cue model: (compiled pattern, modality, missing-context template,
#             recovery plan, base confidence)
# Confidence encodes "probability that transcript alone is insufficient".
# Classify, don't justify: fixed pattern classes with fixed scores.
# ---------------------------------------------------------------------------

CueSpec = tuple  # (regex, modality, missing_context, recovery, confidence)

VISUAL_CUES: List[CueSpec] = [
    (r"\bas you can see\b", "visual",
     "Referred-to on-screen content not present in words",
     "frame", 0.95),
    (r"\b(?:look|looking) at (?:this|here|the screen)\b", "visual",
     "Visual focus of attention unspecified by narration",
     "frame", 0.9),
    (r"\bright here\b", "visual",
     "Deictic location reference without named referent",
     "frame", 0.8),
    (r"\bover here\b", "visual",
     "Deictic location reference without named referent",
     "frame", 0.8),
    (r"\bon (?:the|my|your) screen\b", "visual",
     "Screen content referenced but not transcribed",
     "frame", 0.95),
    (r"\bthis (?:diagram|chart|graph|plot|figure|image|screenshot|slide)\b",
     "visual", "Named visual artifact not available as text",
     "frame", 0.95),
    (r"\bthis (?:button|menu|dropdown|tab|icon|window|panel|dialog)\b",
     "visual", "UI element identity/position only visible on screen",
     "frame", 0.9),
    (r"\bclick(?:ing)? (?:on )?(?:this|here)\b", "visual",
     "Click target unnamed in narration",
     "frame", 0.9),
    (r"\b(?:drag|hover|highlight|select)ing?\b", "visual",
     "Pointer interaction whose target is visual-only",
     "frame", 0.75),
    (r"\bzoom(?:ing)? in\b", "visual",
     "Zoom focuses attention on unnamed screen region",
     "frame", 0.85),
    (r"\b(?:top|bottom) (?:left|right)\b", "visual",
     "Spatial anchor to unnamed screen region",
     "frame", 0.85),
    (r"\byou(?:'ll| will) (?:see|notice)\b", "visual",
     "Promised visual evidence not captured in narration",
     "frame", 0.85),
    (r"\btyping (?:this|in)\b", "visual",
     "Typed content may only be legible on screen (verify against captions)",
     "frame", 0.6),
    (r"\bconfiguration (?:file|page)|config (?:file|page)\b", "visual",
     "Configuration values often shown but not read aloud",
     "frame", 0.7),
]

AUDIO_CUES: List[CueSpec] = [
    (r"\blisten (?:to )?(?:this|the|how)\b", "audio",
     "Audio characteristic not derivable from transcript text",
     "audio analysis", 0.9),
    (r"\b(?:as you )?can hear\b", "audio",
     "Audio evidence referenced but not textual",
     "audio analysis", 0.95),
    (r"\bsounds? like\b", "audio",
     "Auditory comparison without textual ground truth",
     "audio analysis", 0.7),
]

EXTERNAL_CUES: List[CueSpec] = [
    (r"\blink in the description\b", "external-artifact",
     "External resource named only via description link",
     "linked source", 0.9),
    (r"\b(?:the|my|this) (?:github )?repo\b", "external-artifact",
     "Repository referenced; exact URL may be absent from narration",
     "linked source", 0.8),
    (r"\bi(?:'ll| will) (?:put|post|share)\b", "external-artifact",
     "Deferred external sharing; artifact location unknown from transcript",
     "linked source", 0.7),
]

LOSS_CUES: List[CueSpec] = [
    (r"\[(?:music|applause|laughter)\]", "transcript-loss",
     "Non-speech interval; possible silent demonstration",
     "clip", 0.5),
    (r"\[(?:inaudible|unintelligible|crosstalk)\]", "transcript-loss",
     "Speech present but not transcribed",
     "clip", 0.9),
    (r"_{2,}", "transcript-loss",
     "Caption placeholder for untranscribed content",
     "clip", 0.85),
]

ALL_CUES = VISUAL_CUES + AUDIO_CUES + EXTERNAL_CUES + LOSS_CUES
COMPILED: List[tuple] = [
    (re.compile(p, re.IGNORECASE), *rest) for p, *rest in ALL_CUES
]

# A silent gap this long between cues implies possible silent demonstration.
SILENT_GAP_SECONDS = 8.0


@dataclass
class Segment:
    start: float
    end: float
    text: str


def _ts_to_seconds(ts: str) -> float:
    parts = [float(p) for p in ts.replace(",", ".").split(":")]
    while len(parts) < 3:
        parts.insert(0, 0.0)
    return parts[0] * 3600 + parts[1] * 60 + parts[2]


VTT_TS = re.compile(
    r"(\d{1,2}:\d{2}:\d{2}[.,]\d{3})\s+-->\s+(\d{1,2}:\d{2}:\d{2}[.,]\d{3})"
)
BRACKET_TS = re.compile(r"^\s*\[?(\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d+)?)\]?\s+(.*)$")


def parse_vtt(raw: str) -> List[Segment]:
    segs: List[Segment] = []
    block: List[str] = []
    start = end = None

    def flush():
        if start is None or not block:
            return
        text = re.sub(r"<[^>]+>", "", " ".join(block)).strip()
        if text:
            segs.append(Segment(start=start, end=end or start, text=text))

    for line in raw.splitlines() + ["-->"]:  # sentinel flushes last block
        m = VTT_TS.search(line)
        if m:
            flush()
            block = []
            start, end = _ts_to_seconds(m.group(1)), _ts_to_seconds(m.group(2))
        elif line.strip() and start is not None:
            block.append(line.strip())
    # VTT auto-captions repeat overlapping lines; dedupe consecutive text.
    deduped: List[Segment] = []
    for s in segs:
        if not deduped or deduped[-1].text != s.text:
            deduped.append(s)
    return deduped


def parse_bracketed(raw: str) -> List[Segment]:
    segs: List[Segment] = []
    for line in raw.splitlines():
        m = BRACKET_TS.match(line)
        if m and m.group(2).strip():
            ts = _ts_to_seconds(m.group(1))
            segs.append(Segment(start=ts, end=ts, text=m.group(2).strip()))
    for prev, cur in zip(segs, segs[1:]):
        prev.end = cur.start
    return segs


def parse_plain(raw: str) -> List[Segment]:
    text = re.sub(r"\s+", " ", raw).strip()
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [Segment(start=-1, end=-1, text=s) for s in sentences if s]


def load_segments(path: str) -> List[Segment]:
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        raw = fh.read()
    if "-->" in raw:
        return parse_vtt(raw)
    segs = parse_bracketed(raw)
    if segs:
        return segs
    return parse_plain(raw)


def detect_gaps(segments: List[Segment], min_confidence: float) -> List[dict]:
    gaps: List[dict] = []
    for seg in segments:
        for rx, modality, missing, recovery, conf in COMPILED:
            if conf < min_confidence:
                continue
            m = rx.search(seg.text)
            if not m:
                continue
            ts: Optional[float] = None if seg.start < 0 else round(seg.start)
            gaps.append({
                "timestamp": ts,
                "modality": modality,
                "cue": m.group(0),
                "missingContext": missing,
                "recoveryPlan": recovery,
                "status": "unresolved",
                "confidence": conf,
                "context": seg.text[:240],
            })
    # Silent-gap detection only makes sense with real timestamps.
    timed = [s for s in segments if s.start >= 0]
    for prev, cur in zip(timed, timed[1:]):
        delta = cur.start - prev.end
        if delta >= SILENT_GAP_SECONDS:
            gaps.append({
                "timestamp": round(prev.end),
                "modality": "transcript-loss",
                "cue": f"silence {delta:.0f}s between captions",
                "missingContext": "Long caption-free interval; possible silent screen demonstration",
                "recoveryPlan": "clip",
                "status": "unresolved",
                "confidence": 0.6,
                "context": prev.text[:120],
            })
    # VTT sliding-window captions emit the same cue every ~2s; collapse
    # same-modality/same-cue hits within 5 seconds into one record.
    collapsed: List[dict] = []
    for g in sorted(gaps, key=lambda g: (g["modality"], g["cue"],
                                         g["timestamp"] if g["timestamp"] is not None else 1e12)):
        last = collapsed[-1] if collapsed else None
        if (last and last["modality"] == g["modality"] and last["cue"] == g["cue"]
                and last["timestamp"] is not None and g["timestamp"] is not None
                and g["timestamp"] - last["timestamp"] <= 5.0):
            continue
        collapsed.append(g)
    gaps = collapsed
    gaps.sort(key=lambda g: (g["timestamp"] if g["timestamp"] is not None else 1e12))
    return gaps


def render_markdown(gaps: List[dict], source: str) -> str:
    lines = [
        f"# Modality-Gap Pass — {source}",
        "",
        f"Total gaps: **{len(gaps)}** "
        f"(visual: {sum(1 for g in gaps if g['modality']=='visual')}, "
        f"audio: {sum(1 for g in gaps if g['modality']=='audio')}, "
        f"external: {sum(1 for g in gaps if g['modality']=='external-artifact')}, "
        f"loss: {sum(1 for g in gaps if g['modality']=='transcript-loss')})",
        "",
        "| ts | modality | cue | confidence | recovery | status |",
        "|---|---|---|---|---|---|",
    ]
    for g in gaps:
        ts = g["timestamp"] if g["timestamp"] is not None else "—"
        lines.append(
            f"| {ts} | {g['modality']} | {g['cue']} | {g['confidence']} | "
            f"{g['recoveryPlan']} | {g['status']} |"
        )
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--input", required=True, help="transcript (.vtt or text)")
    ap.add_argument("--output", required=True, help="gaps JSON output path")
    ap.add_argument("--markdown", help="optional human-readable markdown report")
    ap.add_argument("--min-confidence", type=float, default=0.5)
    args = ap.parse_args()

    segments = load_segments(args.input)
    gaps = detect_gaps(segments, args.min_confidence)

    with open(args.output, "w", encoding="utf-8") as fh:
        json.dump({"source": args.input, "segmentCount": len(segments),
                   "gapCount": len(gaps), "gaps": gaps}, fh, indent=2)
    if args.markdown:
        with open(args.markdown, "w", encoding="utf-8") as fh:
            fh.write(render_markdown(gaps, args.input))

    print(f"segments={len(segments)} gaps={len(gaps)} -> {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

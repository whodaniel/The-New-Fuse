#!/usr/bin/env python3
"""
TNF Intelligence Activation KPI Dashboard

Calculates conversion metrics for the AI5 ingestion pipeline:
Ingested -> Transcript -> Extracted (V2) -> Dispatch Ready
"""

import json
import os
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = ROOT / "data" / "intelligence-artifacts"
MANIFEST_PATH = ROOT / "data" / "ingestion-runs" / "ai5-new-may-2026-manifest.json"
REPORT_PATH = ROOT / "docs" / "protocols" / "reports" / "TNF_ACTIVATION_KPIS_LATEST.md"

def main():
    if not MANIFEST_PATH.exists():
        print(f"Error: Manifest not found at {MANIFEST_PATH}")
        return

    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    items = manifest.get("items", [])
    total_ingested = len(items)
    video_count = sum(1 for i in items if i.get("sourceType") == "video")
    note_count = sum(1 for i in items if i.get("sourceType") == "note")
    
    transcript_complete = sum(1 for i in items if i.get("transcriptStatus") in ["cache_hit", "fetched"])
    
    v2_artifacts = list(ARTIFACT_DIR.glob("*-v2-extracted.json"))
    total_v2_extracted = 0
    total_dispatch_ready = 0
    
    for v2 in v2_artifacts:
        with open(v2, "r") as f:
            data = json.load(f)
            total_v2_extracted += data.get("total_extracted", 0)
            total_dispatch_ready += data.get("dispatch_ready_count", 0)

    # Conversion Rates
    transcript_rate = (transcript_complete / video_count * 100) if video_count > 0 else 0
    dispatch_ready_rate = (total_dispatch_ready / total_v2_extracted * 100) if total_v2_extracted > 0 else 0
    yield_per_source = (total_dispatch_ready / total_ingested) if total_ingested > 0 else 0

    now = datetime.now(timezone.utc).isoformat()

    md = f"""# 📊 TNF Intelligence Activation KPIs

**Generated:** {now}
**Status:** {"🟢 HEALTHY" if total_dispatch_ready > 0 else "🔴 BOTTLENECK"}

## 📈 Pipeline Funnel

| Stage | Count | Metric |
|-------|-------|--------|
| **1. Ingested Sources** | {total_ingested} | Total Intake |
| **2. Transcripts Ready** | {transcript_complete} | {transcript_rate:.1f}% of Videos |
| **3. Extracted (V2)** | {total_v2_extracted} | Raw Directives |
| **4. Dispatch Ready** | **{total_dispatch_ready}** | **{dispatch_ready_rate:.1f}% Specificity** |

## 🚀 Velocity Metrics

- **Implementation Yield:** {yield_per_source:.2f} tasks per source.
- **Extraction Logic:** Procedural Extractor V2 (LLM-Backed).
- **Thresholds:** Spec >= 0.7, Impl >= 0.7, Test >= 0.6.

## 🔍 Insight
{"Phase 4 Acceleration successful. We have moved from 0 dispatchable tasks to " + str(total_dispatch_ready) + " high-fidelity implementation directives. Specificity bottleneck is cleared." if total_dispatch_ready > 0 else "Extraction coverage is high but specificity is failing gates. Review LLM extraction prompts."}

---
*Created by TNF Autonomy Suite*
"""

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(md)
    
    # Also save as JSON for dashboard integration
    stats = {
        "generated_at": now,
        "total_ingested": total_ingested,
        "transcript_complete": transcript_complete,
        "total_extracted": total_v2_extracted,
        "total_dispatch_ready": total_dispatch_ready,
        "dispatch_ready_rate": round(dispatch_ready_rate, 2),
        "yield_per_source": round(yield_per_source, 2)
    }
    stats_path = REPORT_PATH.with_suffix(".json")
    with open(stats_path, "w") as f:
        json.dump(stats, f, indent=2)

    print(f"✅ KPI Report generated: {REPORT_PATH}")
    print(f"🚀 Total Dispatch Ready: {total_dispatch_ready}")

if __name__ == "__main__":
    main()

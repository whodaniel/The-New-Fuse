#!/usr/bin/env python3
"""
TNF AI5 Batch Reprocessor (V2)

Runs the Procedural Extractor V2 on all ingested AI5 transcripts
to generate implementation-grade directives.
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRANSCRIPT_DIR = ROOT / "data" / "transcripts"
EXTRACTOR_SCRIPT = ROOT / "scripts" / "autonomy" / "procedural_extractor_v2.py"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def main():
    if not GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY environment variable not set.")
        return
    if not TRANSCRIPT_DIR.exists():
        print(f"Error: Transcript directory not found: {TRANSCRIPT_DIR}")
        return

    transcripts = list(TRANSCRIPT_DIR.glob("*.txt"))
    print(f"🚀 Found {len(transcripts)} transcripts. Starting batch V2 extraction...")

    for i, t in enumerate(transcripts):
        print(f"\n[{i+1}/{len(transcripts)}] Reprocessing: {t.name}")
        command = [
            sys.executable,
            str(EXTRACTOR_SCRIPT),
            "--input", str(t),
            "--api-key", GEMINI_API_KEY
        ]
        
        try:
            subprocess.run(command, check=True)
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to reprocess {t.name}: {e}")
            
    print("\n✅ Batch reprocessing complete.")

if __name__ == "__main__":
    main()

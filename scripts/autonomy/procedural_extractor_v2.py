#!/usr/bin/env python3
"""
TNF Procedural Extractor V2 (LLM-Backed)

Reconstructs implementation-grade directives from transcript chunks.
Features:
- Imperative step reconstruction (sequence of actions)
- Implementation target mapping (file/module)
- Dispatch-ready classification (specificity + implementability + testability)
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = ROOT / "data" / "intelligence-artifacts"
DEFAULT_MODEL = "gemini-2.5-flash"

# Hard thresholds for dispatch-ready classification
SPECIFICITY_THRESHOLD = 0.7
IMPLEMENTABILITY_THRESHOLD = 0.7
TESTABILITY_THRESHOLD = 0.6

class ProceduralExtractorV2:
    def __init__(self, api_key: str, model_name: str = DEFAULT_MODEL):
        if not HAS_GENAI:
            raise ImportError("google-generativeai is required for ProceduralExtractorV2")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)

    def chunk_text(self, text: str, chunk_size: int = 4000, overlap: int = 500) -> List[str]:
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start = end - overlap
        return chunks

    def extract_from_chunk(self, chunk: str) -> List[Dict[str, Any]]:
        prompt = f"""
SYSTEM: You are a TNF Senior Engineer. Extract IMPLEMENTATION-GRADE DIRECTIVES from this transcript chunk.
Implementation-grade means the directive provides enough detail for an autonomous agent to execute it.

CONSTRAINTS:
- Do not extract vague ideas or "fragments".
- Reconstruct full imperative sequences of actions.
- Identify the likely target (file path, module, or system component).
- If the chunk contains no concrete procedural steps, return an empty list [].

OUTPUT FORMAT:
JSON list of objects with this schema:
{{
  "title": "Concise name of the task",
  "steps": ["Step 1...", "Step 2..."],
  "target": "Likely file or module",
  "metrics": {{
    "specificity": 0.0-1.0,
    "implementability": 0.0-1.0,
    "testability": 0.0-1.0
  }},
  "rationale": "Brief reason why this is implementable"
}}

TRANSCRIPT CHUNK:
\"\"\"
{chunk}
\"\"\"
"""
        try:
            response = self.model.generate_content(prompt)
            # Find JSON block
            text = response.text
            match = re.search(r"\[.*\]", text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return []
        except Exception as e:
            print(f"Error during extraction: {e}", file=sys.stderr)
            return []

    def classify_and_filter(self, directives: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        ready = []
        for d in directives:
            m = d.get("metrics", {})
            spec = m.get("specificity", 0)
            impl = m.get("implementability", 0)
            test = m.get("testability", 0)
            
            d["dispatch_ready"] = (
                spec >= SPECIFICITY_THRESHOLD and
                impl >= IMPLEMENTABILITY_THRESHOLD and
                test >= TESTABILITY_THRESHOLD
            )
            ready.append(d)
        return ready

def main():
    parser = argparse.ArgumentParser(description="Extract implementation-ready directives using LLM V2")
    parser.add_argument("--input", required=True, help="Path to transcript text file")
    parser.add_argument("--out-dir", default=str(ARTIFACT_DIR), help="Output directory for results")
    parser.add_argument("--source-id", default="", help="Optional stable source ID for output filename")
    parser.add_argument("--api-key", help="Gemini API Key (env: GEMINI_API_KEY)")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Model to use")
    
    args = parser.parse_args()
    
    api_key = args.api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY required.", file=sys.stderr)
        sys.exit(1)
        
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)
        
    text = input_path.read_text(encoding="utf-8")
    extractor = ProceduralExtractorV2(api_key, model_name=args.model)
    
    print(f"Processing {len(text)} chars from {input_path.name}...")
    chunks = extractor.chunk_text(text)
    all_directives = []
    
    for i, chunk in enumerate(chunks):
        print(f" - Processing chunk {i+1}/{len(chunks)}...")
        directives = extractor.extract_from_chunk(chunk)
        all_directives.extend(extractor.classify_and_filter(directives))
        
    # Deduplicate by title
    seen_titles = set()
    unique_directives = []
    for d in all_directives:
        if d["title"] not in seen_titles:
            unique_directives.append(d)
            seen_titles.add(d["title"])
            
    # Save output
    source_id = str(args.source_id).strip() or input_path.stem
    output_payload = {
        "source_id": source_id,
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "total_extracted": len(unique_directives),
        "dispatch_ready_count": sum(1 for d in unique_directives if d["dispatch_ready"]),
        "directives": unique_directives
    }
    
    out_path = Path(args.out_dir) / f"{source_id}-v2-extracted.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2)
        
    print(f"✅ Success! Saved {len(unique_directives)} directives to {out_path}")
    print(f"🚀 Dispatch Ready: {output_payload['dispatch_ready_count']}")

if __name__ == "__main__":
    import datetime as dt
    main()

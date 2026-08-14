#!/usr/bin/env uv run
# /// script
# requires-python = ">=3.10"
# ///
import argparse
import json
import subprocess
import sys
import os

def append_gaps(target_file, gaps):
    if not os.path.exists(target_file):
        print(f"Error: Target file {target_file} does not exist.")
        sys.exit(1)
        
    with open(target_file, 'r') as f:
        content = f.read()
        
    # Check if section exists, if not, append it
    section_header = "## Gap Checks for Future Sweeps\n\n"
    if "Gap Checks for Future Sweeps" not in content:
        content += f"\n\n---\n\n{section_header}"
        
    # Append gaps
    appendix = ""
    for idx, gap in enumerate(gaps, 1):
        appendix += f"{idx}. **Gap Area**: {gap.get('area', 'Unknown')}\n"
        appendix += f"   - **Location**: {gap.get('location', 'Unknown')}\n"
        appendix += f"   - **Drift Risk**: {gap.get('risk', 'Unknown')}\n"
        
    with open(target_file, 'a') as f:
        if "Gap Checks for Future Sweeps" not in content:
            f.write(f"\n\n---\n\n{section_header}{appendix}")
        else:
            f.write(f"\n{appendix}")
            
    print(f"Successfully appended {len(gaps)} gaps to {target_file}")

def emit_handoff():
    print("Emitting session handoff...")
    try:
        subprocess.run(['pnpm', '-w', 'run', 'handoff:emit'], check=True)
        print("Handoff emitted successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Failed to emit handoff: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="TNF Protocol Gap Registrar")
    parser.add_argument("--gaps", required=True, help="Path to JSON file containing gaps array")
    parser.add_argument("--target", required=True, help="Path to target markdown file")
    
    args = parser.parse_args()
    
    try:
        with open(args.gaps, 'r') as f:
            gaps = json.load(f)
    except Exception as e:
        print(f"Error reading gaps file: {e}")
        sys.exit(1)
        
    append_gaps(args.target, gaps)
    emit_handoff()

if __name__ == "__main__":
    main()

#!/usr/bin/env uv run
# /// script
# requires-python = ">=3.10"
# ///
import argparse
import json
import subprocess
import sys
import os

def run_git_command(cmd, cwd=None):
    try:
        result = subprocess.run(cmd, cwd=cwd, check=True, capture_output=True, text=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return None

def scan_history(filepath, limit=10):
    cmd = ['git', 'log', f'-n{limit}', '--format=%H|%an|%ad|%s', '--numstat', '--', filepath]
    output = run_git_command(cmd)
    if not output:
        return []
        
    results = []
    lines = output.strip().split('\n')
    current_commit = None
    
    for line in lines:
        if not line:
            continue
        if '|' in line and len(line.split('|')) == 4:
            parts = line.split('|')
            current_commit = {
                'hash': parts[0],
                'author': parts[1],
                'date': parts[2],
                'message': parts[3],
                'additions': 0,
                'deletions': 0,
                'is_hallucination': False
            }
            results.append(current_commit)
        elif current_commit and '\t' in line:
            stats = line.split('\t')
            if len(stats) >= 2:
                try:
                    adds = int(stats[0]) if stats[0] != '-' else 0
                    dels = int(stats[1]) if stats[1] != '-' else 0
                    current_commit['additions'] += adds
                    current_commit['deletions'] += dels
                    
                    # Heuristic: Massive deletions (e.g. over 100 lines deleted, and deletions > 3x additions)
                    if dels > 100 and dels > (adds * 3):
                        current_commit['is_hallucination'] = True
                except ValueError:
                    pass
                    
    return results

def cmd_scan(args):
    history = scan_history(args.file, args.limit)
    out = {
        'file': args.file,
        'analyzed_commits': len(history),
        'hallucinations_detected': [c for c in history if c['is_hallucination']],
        'history': history
    }
    with open(args.output, 'w') as f:
        json.dump(out, f, indent=2)
    print(f"Success! Scan results written to: {args.output}")

def cmd_restore(args):
    # Restore the file to the commit *before* the provided hash
    cmd = ['git', 'checkout', f'{args.commit}^1', '--', args.file]
    
    out = {'file': args.file, 'target_commit_before': f'{args.commit}^1', 'success': False, 'error': None}
    
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        out['success'] = True
    except subprocess.CalledProcessError as e:
        out['error'] = e.stderr
        
    with open(args.output, 'w') as f:
        json.dump(out, f, indent=2)
        
    if out['success']:
        print(f"Success! Restored {args.file} and results written to: {args.output}")
    else:
        print(f"Failed to restore {args.file}. Results written to: {args.output}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="TNF Hallucination Hunter")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    scan_parser = subparsers.add_parser("scan", help="Scan git history for massive deletions")
    scan_parser.add_argument("file", help="File to scan")
    scan_parser.add_argument("--limit", type=int, required=True, help="Number of commits to check")
    scan_parser.add_argument("--output", required=True, help="Output JSON file")
    
    restore_parser = subparsers.add_parser("restore", help="Restore file to the commit before the hallucination")
    restore_parser.add_argument("file", help="File to restore")
    restore_parser.add_argument("commit", help="Commit hash where the hallucination occurred")
    restore_parser.add_argument("--output", required=True, help="Output JSON file")
    
    args = parser.parse_args()
    
    if args.command == "scan":
        cmd_scan(args)
    elif args.command == "restore":
        cmd_restore(args)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Jules Batch Task Submitter
Submit multiple tasks from the .jules/tasks directory in parallel.

Usage:
    python3 batch_submit.py                    # Submit all tasks
    python3 batch_submit.py --tasks 01 02 03   # Submit specific tasks
    python3 batch_submit.py --parallel 8       # Max parallel sessions
    python3 batch_submit.py --dry-run          # Preview without submitting
"""
import subprocess
import sys
import argparse
import os
import glob
import time
from concurrent.futures import ThreadPoolExecutor, as_completed


def find_task_files(tasks_dir: str, specific_ids: list = None) -> list:
    """Find task files in the tasks directory."""
    pattern = os.path.join(tasks_dir, "JULES_TASK_*.md")
    files = sorted(glob.glob(pattern))

    if specific_ids:
        filtered = []
        for task_id in specific_ids:
            for f in files:
                if f"JULES_TASK_{task_id.zfill(2)}" in f:
                    filtered.append(f)
                    break
        return filtered

    return files


def submit_single_task(task_file: str, repo: str = None) -> dict:
    """Submit a single task and return result."""
    with open(task_file, 'r') as f:
        content = f.read()

    task_name = os.path.basename(task_file)

    cmd = ['jules', 'new']
    if repo:
        cmd.extend(['--repo', repo])
    cmd.append(content)

    start_time = time.time()
    result = subprocess.run(cmd, capture_output=True, text=True)
    elapsed = time.time() - start_time

    return {
        "file": task_name,
        "success": result.returncode == 0,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "elapsed": elapsed
    }


def main():
    parser = argparse.ArgumentParser(description='Submit multiple tasks to Jules')
    parser.add_argument('--tasks', '-t', nargs='+',
                       help='Specific task IDs to submit (e.g., 01 02 03)')
    parser.add_argument('--tasks-dir', default='.jules/tasks',
                       help='Directory containing task files')
    parser.add_argument('--repo', '-r', help='Repository (owner/repo)')
    parser.add_argument('--parallel', '-p', type=int, default=4,
                       help='Maximum parallel submissions')
    parser.add_argument('--dry-run', '-n', action='store_true',
                       help='Preview without submitting')

    args = parser.parse_args()

    # Find task files
    task_files = find_task_files(args.tasks_dir, args.tasks)

    if not task_files:
        print(f"❌ No task files found in {args.tasks_dir}")
        sys.exit(1)

    print("=" * 60)
    print("Jules Batch Task Submitter")
    print("=" * 60)
    print(f"Tasks found: {len(task_files)}")
    print(f"Max parallel: {args.parallel}")
    print(f"Repository: {args.repo or 'current directory'}")
    print(f"Dry run: {args.dry_run}")
    print()

    # List tasks
    print("Tasks to submit:")
    for i, f in enumerate(task_files, 1):
        print(f"  {i}. {os.path.basename(f)}")
    print()

    if args.dry_run:
        print("🔍 DRY RUN - No tasks submitted")
        return

    # Submit tasks in parallel
    print("📤 Submitting tasks...")
    print()

    results = {
        "submitted": 0,
        "failed": 0,
        "tasks": []
    }

    with ThreadPoolExecutor(max_workers=args.parallel) as executor:
        futures = {
            executor.submit(submit_single_task, f, args.repo): f
            for f in task_files
        }

        for future in as_completed(futures):
            task_file = futures[future]
            try:
                result = future.result()
                results["tasks"].append(result)

                if result["success"]:
                    results["submitted"] += 1
                    print(f"  ✅ {result['file']} ({result['elapsed']:.1f}s)")
                else:
                    results["failed"] += 1
                    print(f"  ❌ {result['file']}: {result['stderr'][:50]}")
            except Exception as e:
                results["failed"] += 1
                print(f"  ❌ {os.path.basename(task_file)}: {e}")

    # Summary
    print()
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"  Submitted: {results['submitted']}")
    print(f"  Failed: {results['failed']}")
    print(f"  Total: {len(task_files)}")
    print()
    print("📊 Next steps:")
    print("   • Monitor: jules remote list --session")
    print("   • Or run: jules (interactive TUI)")

    sys.exit(0 if results["failed"] == 0 else 1)


if __name__ == "__main__":
    main()

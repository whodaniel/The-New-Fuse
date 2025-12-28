#!/usr/bin/env python3
"""
Jules Task Submitter
Submits a task to Jules and tracks the session.

Usage:
    python3 submit_task.py "Your task description"
    python3 submit_task.py --file task.md
    python3 submit_task.py --repo owner/name "Task description"
    python3 submit_task.py --parallel 4 "Task description"
"""
import subprocess
import sys
import argparse
import os


def submit_task(task: str, repo: str = None, parallel: int = 1) -> tuple:
    """Submit a task to Jules."""
    cmd = ['jules', 'new']

    if repo:
        cmd.extend(['--repo', repo])

    if parallel > 1:
        cmd.extend(['--parallel', str(parallel)])

    cmd.append(task)

    # Show task preview
    preview = task[:200] + "..." if len(task) > 200 else task
    print(f"📤 Submitting task to Jules...")
    print(f"   Repository: {repo or 'current directory'}")
    print(f"   Parallel: {parallel}")
    print(f"   Task preview: {preview[:100]}...")
    print()

    result = subprocess.run(cmd, capture_output=True, text=True)

    return result.returncode == 0, result.stdout, result.stderr


def main():
    parser = argparse.ArgumentParser(
        description='Submit a coding task to Jules AI agent',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "Add unit tests for AuthService"
  %(prog)s --file .jules/tasks/JULES_TASK_01_drizzle_user_repository.md
  %(prog)s --repo myorg/myrepo "Fix authentication bug"
  %(prog)s --parallel 4 "Add error handling to all API endpoints"
        """
    )
    parser.add_argument('task', help='Task description or path to task file')
    parser.add_argument('--repo', '-r', help='Repository in format owner/repo')
    parser.add_argument('--parallel', '-p', type=int, default=1,
                       help='Number of parallel sessions (1-16)')
    parser.add_argument('--file', '-f', action='store_true',
                       help='Read task from file instead of command line')
    parser.add_argument('--dry-run', '-n', action='store_true',
                       help='Show what would be submitted without submitting')

    args = parser.parse_args()

    # Get task content
    task = args.task
    if args.file:
        if not os.path.exists(args.task):
            print(f"❌ Error: File not found: {args.task}")
            sys.exit(1)
        with open(args.task, 'r') as f:
            task = f.read()

    # Validate parallel count
    if args.parallel < 1 or args.parallel > 16:
        print("❌ Error: Parallel must be between 1 and 16")
        sys.exit(1)

    # Dry run mode
    if args.dry_run:
        print("🔍 DRY RUN MODE - Not actually submitting")
        print("=" * 50)
        print(f"Repository: {args.repo or 'current directory'}")
        print(f"Parallel: {args.parallel}")
        print(f"Task length: {len(task)} characters")
        print("=" * 50)
        print("Task content:")
        print(task[:500])
        if len(task) > 500:
            print(f"... ({len(task) - 500} more characters)")
        return

    # Submit task
    success, stdout, stderr = submit_task(task, args.repo, args.parallel)

    if success:
        print("✅ Task submitted successfully!")
        if stdout:
            print(stdout)
        print()
        print("📊 Next steps:")
        print("   • Monitor: jules remote list --session")
        print("   • Pull when done: jules remote pull --session <ID> --apply")
    else:
        print("❌ Task submission failed")
        if stderr:
            print(f"Error: {stderr}")
        sys.exit(1)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import subprocess
import sys

def is_chrome_running():
    """Check if Chrome browser is currently running"""
    try:
        result = subprocess.run(
            ['pgrep', '-i', 'chrome'],
            capture_output=True,
            text=True
        )
        return result.returncode == 0
    except FileNotFoundError:
        # pgrep not available, fallback to ps
        result = subprocess.run(
            ['ps', 'aux'],
            capture_output=True,
            text=True
        )
        return 'chrome' in result.stdout.lower()

def main():
    if is_chrome_running():
        print("✅ CHROME_ACTIVE")
        sys.exit(0)
    else:
        print("❌ CHROME_NOT_RUNNING")
        print("ACTION REQUIRED: Open Chrome browser first")
        sys.exit(1)

if __name__ == "__main__":
    main()

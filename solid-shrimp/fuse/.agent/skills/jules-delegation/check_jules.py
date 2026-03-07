#!/usr/bin/env python3
"""
Jules CLI Status Checker
Verifies Jules is installed, available, and user is authenticated.

Usage:
    python3 check_jules.py          # Human-readable output
    python3 check_jules.py --json   # JSON output for programmatic use
"""
import subprocess
import sys
import json
import re


def run_command(cmd: list) -> tuple:
    """Execute command and return success status and output."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, "", "Command timed out"
    except FileNotFoundError:
        return False, "", "Command not found"


def check_jules_installed() -> tuple:
    """Check if Jules CLI is installed."""
    success, stdout, stderr = run_command(['jules', 'version'])
    if success:
        return True, stdout
    return False, stderr


def check_jules_authenticated() -> bool:
    """Check if user is logged in to Jules."""
    success, _, _ = run_command(['jules', 'remote', 'list', '--session'])
    return success


def get_current_repo() -> str:
    """Get current repository from git remote."""
    success, output, _ = run_command(['git', 'remote', 'get-url', 'origin'])
    if success:
        # Extract owner/repo from URL
        match = re.search(r'[:/]([^/]+/[^/.]+)(?:\.git)?$', output)
        if match:
            return match.group(1)
    return None


def main():
    """Run all Jules checks."""
    json_output = "--json" in sys.argv

    if not json_output:
        print("=" * 50)
        print("Jules CLI Status Check")
        print("=" * 50)

    status = {
        "installed": False,
        "version": None,
        "authenticated": False,
        "repository": None,
        "ready": False
    }

    # Check installation
    installed, version = check_jules_installed()
    status["installed"] = installed
    status["version"] = version if installed else None

    if not json_output:
        if installed:
            print(f"✅ Jules CLI installed: {version}")
        else:
            print("❌ Jules CLI not installed")
            print("   Install from: https://jules.google/cli")

    # Check authentication (only if installed)
    if installed:
        status["authenticated"] = check_jules_authenticated()

        if not json_output:
            if status["authenticated"]:
                print("✅ Jules authenticated")
            else:
                print("❌ Jules not authenticated")
                print("   Run: jules login")

    # Check repository
    status["repository"] = get_current_repo()

    if not json_output:
        if status["repository"]:
            print(f"✅ Repository detected: {status['repository']}")
        else:
            print("⚠️  No git repository detected")

    # Determine overall readiness
    status["ready"] = status["installed"] and status["authenticated"]

    if not json_output:
        print("=" * 50)
        if status["ready"]:
            print("STATUS: ✅ READY")
        else:
            print("STATUS: ❌ NOT READY")
        print("=" * 50)

    # Output JSON if requested
    if json_output:
        print(json.dumps(status, indent=2))

    # Exit with appropriate code
    sys.exit(0 if status["ready"] else 1)


if __name__ == "__main__":
    main()

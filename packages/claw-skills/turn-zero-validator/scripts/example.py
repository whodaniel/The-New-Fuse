#!/usr/bin/env python3
"""Placeholder deterministic script.

Replace this file with real procedural code, or delete it if your skill
doesn't need scripts. Scripts in this directory are intended to be invoked
verbatim by the agent — keep them parameter-driven and side-effect-free
unless ergonomics demand otherwise.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Scaffold placeholder.")
    parser.add_argument(
        "--name",
        default=Path(__file__).resolve().parent.parent.name,
        help="Skill name to greet (defaults to the parent skill directory).",
    )
    args = parser.parse_args()
    print(f"tnf-scaffold: hello from {args.name} — replace or delete this script.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

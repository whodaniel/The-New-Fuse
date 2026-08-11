#!/usr/bin/env python3
"""
Example script shipped with the tnf-scaffold skill.

This is a no-op placeholder: it prints one line, exits 0. Replace it with
the deterministic logic your skill actually needs (data fetches, file
transforms, validators).

Run: python3 scripts/example.py
Exit codes: 0 on success, non-zero on failure.
"""
from __future__ import annotations

import sys


def main() -> int:
    print("tnf-scaffold example script — replace me with real logic.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

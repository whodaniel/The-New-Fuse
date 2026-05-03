#!/usr/bin/env python3
"""Compare TNF CLI help surfaces to a reference CLI.

This script compares root commands/options and optional subcommand help.
It is intentionally heuristic but stable for Commander-style help output.
"""

from __future__ import annotations

import argparse
import json
import re
import shlex
import subprocess
import sys
from dataclasses import dataclass
from typing import Dict, List, Set


@dataclass
class HelpSurface:
    commands: Set[str]
    options: Set[str]


def run_help(command: str, subcommand: str | None = None, timeout_seconds: int = 45) -> str:
    args = shlex.split(command)
    if subcommand:
        args.extend(shlex.split(subcommand))
    args.append("--help")

    try:
        proc = subprocess.run(
            args,
            capture_output=True,
            text=True,
            check=False,
            timeout=timeout_seconds,
        )
    except FileNotFoundError as exc:
        raise RuntimeError(f"Command not found: {args[0]}") from exc
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(
            f"Help command timed out after {timeout_seconds}s: {' '.join(args)}"
        ) from exc

    output = (proc.stdout or "") + ("\n" + proc.stderr if proc.stderr else "")
    if not output.strip():
        raise RuntimeError(f"No help output for: {' '.join(args)}")
    if proc.returncode != 0:
        snippet = "\n".join(output.strip().splitlines()[:12])
        raise RuntimeError(
            f"Help command failed (exit {proc.returncode}) for: {' '.join(args)}\n{snippet}"
        )
    return output


def parse_help(text: str) -> HelpSurface:
    # Strip ANSI escape sequences to keep parser stable across colorful CLIs.
    text = re.sub(r"\x1B\[[0-?]*[ -/]*[@-~]", "", text)

    commands: Set[str] = set()
    options: Set[str] = set()

    section = ""
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped:
            continue

        header_match = re.match(r"^([A-Za-z][A-Za-z ]+):$", stripped)
        if header_match:
            section = header_match.group(1).lower()
            continue

        if section not in {"commands", "options"}:
            continue

        if not line.startswith(" "):
            continue

        spec = re.split(r"\s{2,}", stripped, maxsplit=1)[0]
        if not spec:
            continue

        if section == "commands":
            first = spec.split()[0]
            for alias in first.split("|"):
                alias = alias.strip().lower()
                if not alias:
                    continue
                if alias.startswith("<") or alias.startswith("["):
                    continue
                if alias in {"command", "commands"}:
                    continue
                commands.add(alias)
            continue

        longs = [m.lower() for m in re.findall(r"--[a-zA-Z0-9][a-zA-Z0-9-]*", spec)]
        shorts = [m.lower() for m in re.findall(r"(?:^|[ ,])(-[a-zA-Z0-9])(?=[, ]|$)", spec)]

        if longs:
            options.update(longs)
        else:
            options.update(shorts)

    return HelpSurface(commands=commands, options=options)


def sorted_list(values: Set[str]) -> List[str]:
    return sorted(values)


def compare_surfaces(target: HelpSurface, reference: HelpSurface) -> Dict[str, List[str]]:
    return {
        "missing_commands": sorted_list(reference.commands - target.commands),
        "extra_commands": sorted_list(target.commands - reference.commands),
        "missing_options": sorted_list(reference.options - target.options),
        "extra_options": sorted_list(target.options - reference.options),
    }


def print_section(title: str, data: Dict[str, List[str]]) -> None:
    print(f"\n{title}")
    for key in ["missing_commands", "missing_options", "extra_commands", "extra_options"]:
        values = data.get(key, [])
        print(f"- {key}: {', '.join(values) if values else 'none'}")


def apply_ignores(surface: HelpSurface, ignore_commands: Set[str], ignore_options: Set[str]) -> HelpSurface:
    return HelpSurface(
        commands={c for c in surface.commands if c not in ignore_commands},
        options={o for o in surface.options if o not in ignore_options},
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit CLI help parity between TNF and a reference CLI")
    parser.add_argument("--target", default="tnf", help="Target CLI command (default: tnf)")
    parser.add_argument("--reference", default="opencode", help="Reference CLI command (default: opencode)")
    parser.add_argument(
        "--subcommand",
        action="append",
        default=[],
        help="Subcommand to compare (repeatable, e.g. --subcommand run)",
    )
    parser.add_argument("--ignore-command", action="append", default=[], help="Ignore command name")
    parser.add_argument("--ignore-option", action="append", default=[], help="Ignore option flag")
    parser.add_argument("--timeout", type=int, default=45, help="Per-help command timeout in seconds")
    parser.add_argument("--json", action="store_true", help="Print JSON output")
    parser.add_argument("--out", help="Write JSON output to file")
    args = parser.parse_args()

    ignore_commands = {v.strip().lower() for v in args.ignore_command if v.strip()}
    ignore_options = {v.strip().lower() for v in args.ignore_option if v.strip()}

    try:
        target_root = parse_help(run_help(args.target, timeout_seconds=args.timeout))
        reference_root = parse_help(run_help(args.reference, timeout_seconds=args.timeout))
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    target_root = apply_ignores(target_root, ignore_commands, ignore_options)
    reference_root = apply_ignores(reference_root, ignore_commands, ignore_options)

    result: Dict[str, object] = {
        "target": args.target,
        "reference": args.reference,
        "root": compare_surfaces(target_root, reference_root),
        "subcommands": {},
    }

    for subcmd in args.subcommand:
        key = subcmd.strip()
        if not key:
            continue
        try:
            target_sub = parse_help(run_help(args.target, key, timeout_seconds=args.timeout))
            reference_sub = parse_help(run_help(args.reference, key, timeout_seconds=args.timeout))
        except RuntimeError as exc:
            result["subcommands"][key] = {"error": str(exc)}
            continue

        target_sub = apply_ignores(target_sub, ignore_commands, ignore_options)
        reference_sub = apply_ignores(reference_sub, ignore_commands, ignore_options)
        result["subcommands"][key] = compare_surfaces(target_sub, reference_sub)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as handle:
            json.dump(result, handle, indent=2)
            handle.write("\n")

    if args.json:
        print(json.dumps(result, indent=2))
        return 0

    print(f"Target: {args.target}")
    print(f"Reference: {args.reference}")
    print_section("Root", result["root"])

    subcommands = result.get("subcommands", {})
    if isinstance(subcommands, dict):
        for subcmd, data in subcommands.items():
            if isinstance(data, dict) and "error" in data:
                print(f"\nSubcommand: {subcmd}\n- error: {data['error']}")
                continue
            print_section(f"Subcommand: {subcmd}", data)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

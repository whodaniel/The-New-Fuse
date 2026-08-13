#!/usr/bin/env python3
"""Audit CLI help-surface differences between TNF and any reference agent CLI."""

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
                if not alias or alias.startswith("<") or alias.startswith("["):
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


def compare(target: HelpSurface, reference: HelpSurface) -> Dict[str, List[str]]:
    return {
        "missing_commands": sorted(reference.commands - target.commands),
        "extra_commands": sorted(target.commands - reference.commands),
        "missing_options": sorted(reference.options - target.options),
        "extra_options": sorted(target.options - reference.options),
    }


def filter_surface(surface: HelpSurface, ignore_cmds: Set[str], ignore_opts: Set[str]) -> HelpSurface:
    return HelpSurface(
        commands={v for v in surface.commands if v not in ignore_cmds},
        options={v for v in surface.options if v not in ignore_opts},
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit TNF CLI surface against any reference agent CLI")
    parser.add_argument("--target", default="tnf", help="Target command (default: tnf)")
    parser.add_argument("--reference", required=True, help="Reference command (for example: opencode)")
    parser.add_argument("--subcommand", action="append", default=[], help="Repeatable subcommand")
    parser.add_argument("--ignore-command", action="append", default=[], help="Ignore command token")
    parser.add_argument("--ignore-option", action="append", default=[], help="Ignore option token")
    parser.add_argument("--timeout", type=int, default=45, help="Per-help timeout in seconds")
    parser.add_argument("--json", action="store_true", help="Emit JSON")
    parser.add_argument("--out", help="Write JSON to file")
    args = parser.parse_args()

    ignore_cmds = {v.strip().lower() for v in args.ignore_command if v.strip()}
    ignore_opts = {v.strip().lower() for v in args.ignore_option if v.strip()}

    try:
        target_root = parse_help(run_help(args.target, timeout_seconds=args.timeout))
        ref_root = parse_help(run_help(args.reference, timeout_seconds=args.timeout))
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    target_root = filter_surface(target_root, ignore_cmds, ignore_opts)
    ref_root = filter_surface(ref_root, ignore_cmds, ignore_opts)

    output: Dict[str, object] = {
        "target": args.target,
        "reference": args.reference,
        "root": compare(target_root, ref_root),
        "subcommands": {},
    }

    for subcmd in args.subcommand:
        key = subcmd.strip()
        if not key:
            continue
        try:
            t_sub = parse_help(run_help(args.target, key, timeout_seconds=args.timeout))
            r_sub = parse_help(run_help(args.reference, key, timeout_seconds=args.timeout))
        except RuntimeError as exc:
            output["subcommands"][key] = {"error": str(exc)}
            continue

        t_sub = filter_surface(t_sub, ignore_cmds, ignore_opts)
        r_sub = filter_surface(r_sub, ignore_cmds, ignore_opts)
        output["subcommands"][key] = compare(t_sub, r_sub)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump(output, fh, indent=2)
            fh.write("\n")

    if args.json:
        print(json.dumps(output, indent=2))
        return 0

    print(f"Target: {args.target}")
    print(f"Reference: {args.reference}")

    def show(title: str, data: Dict[str, List[str]]) -> None:
        print(f"\n{title}")
        for key in ["missing_commands", "missing_options", "extra_commands", "extra_options"]:
            values = data.get(key, [])
            print(f"- {key}: {', '.join(values) if values else 'none'}")

    show("Root", output["root"])

    for name, data in output["subcommands"].items():
        if isinstance(data, dict) and "error" in data:
            print(f"\nSubcommand: {name}\n- error: {data['error']}")
            continue
        show(f"Subcommand: {name}", data)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
import argparse
import json
import os
import time
import subprocess
import sys
import urllib.parse
import urllib.request

BASE_URL = "https://wry-manatee-359.convex.site/api/v1/skills"
WEB_BASE = "https://clawhub.ai"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build a ClawHub shortlist and optionally open/install it."
    )
    parser.add_argument("--query", default="", help="Optional text query.")
    parser.add_argument("--sort", default="downloads", help="Sort key.")
    parser.add_argument("--non-suspicious", default="true", choices=["true", "false"])
    parser.add_argument("--limit", type=int, default=5, help="Number of skills.")
    parser.add_argument(
        "--open",
        action="store_true",
        help="Open each shortlisted skill page in the default browser.",
    )
    parser.add_argument(
        "--install-template",
        default="",
        help=(
            "Command template to execute per skill. Use placeholders "
            "{owner}, {slug}, {owner_slug}. Example: "
            "'openclaw skills add {owner_slug}'"
        ),
    )
    parser.add_argument(
        "--installer",
        default="",
        choices=["", "clawhub-pnpm"],
        help=(
            "Built-in installer preset. 'clawhub-pnpm' runs "
            "'pnpm dlx clawhub install {slug}'."
        ),
    )
    parser.add_argument(
        "--workdir",
        default="",
        help=(
            "Optional workdir passed to clawhub installer preset. "
            "Useful with Railway: '/app' or project root."
        ),
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Execute --install-template commands. Without this flag, commands are printed only.",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=1,
        help="Retries per install command when --apply is set.",
    )
    parser.add_argument(
        "--retry-delay",
        type=int,
        default=12,
        help="Seconds to wait between retries.",
    )
    parser.add_argument(
        "--skip-installed",
        action="store_true",
        default=True,
        help="Skip commands when target skill folder already exists (clawhub preset).",
    )
    return parser.parse_args()


def fetch_list(query: str, sort: str, non_suspicious: str) -> list[dict]:
    params: dict[str, str] = {"sort": sort, "nonSuspicious": non_suspicious}
    if query.strip():
        params["q"] = query.strip()
    url = f"{BASE_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    items = payload.get("items", [])
    if not isinstance(items, list):
        raise RuntimeError("Invalid list response: items is not a list")
    return items


def fetch_owner(slug: str) -> str:
    url = f"{BASE_URL}/{urllib.parse.quote(slug)}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    owner = payload.get("owner") or {}
    handle = owner.get("handle") or owner.get("userId") or "unknown"
    return str(handle)


def run_shell(cmd: str) -> int:
    proc = subprocess.run(cmd, shell=True)
    return proc.returncode


def run_with_retries(cmd: str, retries: int, retry_delay: int) -> int:
    attempts = max(retries, 0) + 1
    for attempt in range(1, attempts + 1):
        rc = run_shell(cmd)
        if rc == 0:
            return 0
        if attempt < attempts:
            print(
                f"Command failed ({rc}), retrying in {retry_delay}s "
                f"({attempt}/{attempts - 1})...",
                file=sys.stderr,
            )
            time.sleep(max(retry_delay, 0))
    return rc


def build_installer_command(
    installer: str, install_template: str, owner: str, slug: str, owner_slug: str, workdir: str
) -> str:
    if install_template:
        return install_template.format(owner=owner, slug=slug, owner_slug=owner_slug)
    if installer == "clawhub-pnpm":
        if workdir:
            return f"pnpm dlx clawhub --workdir '{workdir}' install {slug}"
        return f"pnpm dlx clawhub install {slug}"
    return ""


def is_installed(workdir: str, slug: str) -> bool:
    if not workdir:
        return False
    target = os.path.join(workdir, "skills", slug)
    return os.path.isdir(target)


def main() -> int:
    args = parse_args()
    items = fetch_list(args.query, args.sort, args.non_suspicious)[: max(args.limit, 0)]
    if not items:
        print("No skills found.")
        return 0

    print("rank\tskill\towner\turl")
    plans: list[tuple[str, str, str, str]] = []
    for i, item in enumerate(items, start=1):
        slug = str(item.get("slug", "")).strip()
        if not slug:
            continue
        owner = fetch_owner(slug)
        owner_slug = f"{owner}/{slug}"
        url = f"{WEB_BASE}/{urllib.parse.quote(owner)}/{urllib.parse.quote(slug)}"
        plans.append((slug, owner, owner_slug, url))
        print(f"{i}\t{slug}\t{owner}\t{url}")

    if args.open:
        for _, _, _, url in plans:
            rc = run_shell(f"open '{url}'")
            if rc != 0:
                print(f"Failed to open: {url}", file=sys.stderr)

    if args.install_template or args.installer:
        print("\ninstall_commands")
        for slug, owner, owner_slug, _ in plans:
            cmd = build_installer_command(
                args.installer, args.install_template, owner, slug, owner_slug, args.workdir
            )
            if not cmd:
                continue
            if args.skip_installed and args.installer == "clawhub-pnpm" and is_installed(args.workdir, slug):
                print(f"# skip (already installed): {slug}")
                continue
            print(cmd)
            if args.apply:
                rc = run_with_retries(cmd, args.retries, args.retry_delay)
                if rc != 0:
                    print(f"Command failed ({rc}): {cmd}", file=sys.stderr)
                    return rc

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

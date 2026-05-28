#!/usr/bin/env python3
import argparse
import json
import urllib.parse
import urllib.request

BASE_URL = "https://wry-manatee-359.convex.site/api/v1/skills"
VALID_SORTS = {"downloads", "installs", "stars", "updated", "newest", "name", "relevance"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="List ClawHub skills by filter/sort.")
    parser.add_argument("--query", default="", help="Optional text query.")
    parser.add_argument("--sort", default="downloads", choices=sorted(VALID_SORTS))
    parser.add_argument("--non-suspicious", default="true", choices=["true", "false"])
    parser.add_argument("--highlighted", default="false", choices=["true", "false"])
    parser.add_argument("--limit", type=int, default=10, help="Number of rows to print.")
    return parser.parse_args()


def fetch_skills(args: argparse.Namespace) -> list[dict]:
    params = {
        "sort": args.sort,
        "nonSuspicious": args.non_suspicious,
        "highlighted": args.highlighted,
    }
    if args.query.strip():
        params["q"] = args.query.strip()
    url = f"{BASE_URL}?{urllib.parse.urlencode(params)}"

    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    items = payload.get("items", [])
    if not isinstance(items, list):
        raise RuntimeError("Invalid response: items is not a list")
    return items


def text(value: object) -> str:
    if value is None:
        return ""
    return str(value).replace("\n", " ").strip()


def main() -> int:
    args = parse_args()
    items = fetch_skills(args)[: max(args.limit, 0)]

    if not items:
        print("No skills found.")
        return 0

    print("rank\tslug\tdownloads\tstars\tinstalls\tlatest\tdisplay_name\tsummary")
    for i, item in enumerate(items, start=1):
        stats = item.get("stats", {}) or {}
        latest = (item.get("latestVersion", {}) or {}).get("version", "")
        row = [
            str(i),
            text(item.get("slug", "")),
            str(stats.get("downloads", 0)),
            str(stats.get("stars", 0)),
            str(stats.get("installsAllTime", 0)),
            text(latest),
            text(item.get("displayName", "")),
            text(item.get("summary", "")),
        ]
        print("\t".join(row))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())


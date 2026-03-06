#!/usr/bin/env python3
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = "https://wry-manatee-359.convex.site/api/v1/skills"


def main() -> int:
    params = urllib.parse.urlencode(
        {
            "sort": "downloads",
            "nonSuspicious": "true",
        }
    )
    url = f"{BASE_URL}?{params}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        print(f"API check failed: {exc}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as exc:
        print(f"API returned non-JSON payload: {exc}", file=sys.stderr)
        return 1

    items = payload.get("items", [])
    if not isinstance(items, list):
        print("API check failed: 'items' is not a list", file=sys.stderr)
        return 1

    print(f"API OK: {url}")
    print(f"Items returned: {len(items)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

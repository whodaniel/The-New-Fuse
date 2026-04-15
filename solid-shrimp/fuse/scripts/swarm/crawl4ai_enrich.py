#!/usr/bin/env python3
import asyncio
import json
import os
import re
import sys
from typing import Any, Dict, List, Optional


def _clean_text(value: Any, max_chars: int) -> str:
    text = str(value or "")
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > max_chars:
        return text[: max_chars - 3].rstrip() + "..."
    return text


def _extract_result_text(result: Any, max_chars: int) -> str:
    candidates = [
        getattr(result, "fit_markdown", None),
        getattr(result, "cleaned_markdown", None),
        getattr(result, "markdown", None),
        getattr(result, "text", None),
        getattr(result, "cleaned_html", None),
        getattr(result, "html", None),
    ]
    for candidate in candidates:
        if candidate is None:
            continue
        # Some crawl4ai fields can be rich objects; prefer raw_markdown if present.
        if hasattr(candidate, "raw_markdown"):
            candidate = getattr(candidate, "raw_markdown")
        text = _clean_text(candidate, max_chars)
        if len(text) >= 80:
            return text
    return ""


async def _crawl_urls(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    try:
        from crawl4ai import AsyncWebCrawler  # type: ignore
    except Exception as exc:
        raise RuntimeError(f"crawl4ai import failed: {exc}") from exc

    max_chars = int(os.getenv("CRAWL4AI_MAX_CHARS", "2000"))
    timeout_ms = int(os.getenv("CRAWL4AI_TIMEOUT_MS", "25000"))

    enriched = []
    async with AsyncWebCrawler() as crawler:
        for item in items:
            out = dict(item)
            url = item.get("link")
            if not url:
                enriched.append(out)
                continue

            try:
                result = await crawler.arun(url=url, timeout=timeout_ms)
                extracted = _extract_result_text(result, max_chars)
                if extracted:
                    out["details"] = extracted
            except Exception:
                # Keep original details when crawling fails for a URL.
                pass

            enriched.append(out)

    return enriched


def main() -> int:
    raw = sys.stdin.read().strip()
    if not raw:
        print("[]")
        return 0

    try:
        items = json.loads(raw)
        if not isinstance(items, list):
            raise ValueError("input must be JSON array")
    except Exception as exc:
        sys.stderr.write(f"invalid input: {exc}\n")
        return 2

    try:
        enriched = asyncio.run(_crawl_urls(items))
    except Exception as exc:
        sys.stderr.write(f"{exc}\n")
        return 3

    sys.stdout.write(json.dumps(enriched))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

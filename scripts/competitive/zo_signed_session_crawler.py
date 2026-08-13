#!/usr/bin/env python3
"""Crawl Zo pages from an already-authenticated Chrome session.

Usage:
  python scripts/competitive/zo_signed_session_crawler.py \
    --start-url "https://whodaniel.zo.computer/?chat=new_ftjvdq" \
    --output-dir /tmp/zo-session-crawl
"""

from __future__ import annotations

import argparse
import base64
import json
import re
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import parse_qs, urlparse, urlunparse


@dataclass
class CrawlStats:
    total_pages: int = 0
    errors: int = 0


def run_osascript(script: str, timeout: float = 20) -> str:
    proc = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=timeout)
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "osascript failed").strip())
    return proc.stdout.rstrip("\n")


def chrome_exec_js(js: str, timeout: float = 25) -> str:
    script = f'''
    tell application "Google Chrome"
      if (count of windows) = 0 then error "No Chrome windows are open"
      set t to active tab of front window
      return execute t javascript {json.dumps(js)}
    end tell
    '''
    return run_osascript(script, timeout=timeout)


def chrome_open_new_tab(url: str) -> None:
    script = f'''
    tell application "Google Chrome"
      if (count of windows) = 0 then error "No Chrome windows are open"
      tell front window
        make new tab with properties {{URL:{json.dumps(url)}}}
        set active tab index to (count of tabs)
      end tell
      activate
    end tell
    '''
    run_osascript(script, timeout=10)


def chrome_set_url(url: str) -> None:
    script = f'''
    tell application "Google Chrome"
      set URL of active tab of front window to {json.dumps(url)}
      activate
    end tell
    '''
    run_osascript(script, timeout=10)


def chrome_close_active_tab() -> None:
    script = '''
    tell application "Google Chrome"
      tell front window
        close active tab
      end tell
    end tell
    '''
    run_osascript(script, timeout=10)


def normalize_url(url: str) -> str | None:
    try:
        parsed = urlparse(url)
    except Exception:
        return None
    if parsed.scheme not in {"http", "https"}:
        return None
    parsed = parsed._replace(fragment="")
    return urlunparse(parsed)


def in_scope(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return host.endswith(".zo.computer") or host.endswith(".zo.space") or host in {
        "zo.computer",
        "www.zo.computer",
    }


def sanitize(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", value).strip("_")
    return cleaned or "page"


def extract_payload() -> dict:
    js = r'''
(() => {
  const abs = (u) => { try { return new URL(u, location.href).href; } catch { return null; } };
  const links = Array.from(document.querySelectorAll('a[href]')).map((a) => ({
    text: (a.innerText || a.textContent || '').trim(),
    href: abs(a.getAttribute('href') || a.href || ''),
    rel: a.getAttribute('rel') || '',
    target: a.getAttribute('target') || ''
  })).filter((x) => !!x.href);

  const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')).map((el) => ({
    tag: (el.tagName || '').toLowerCase(),
    id: el.id || '',
    role: el.getAttribute('role') || '',
    ariaLabel: el.getAttribute('aria-label') || '',
    text: (el.innerText || el.textContent || el.value || '').trim(),
    classes: el.className || ''
  }));

  const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map((el) => ({
    tag: (el.tagName || '').toLowerCase(),
    type: el.getAttribute('type') || '',
    id: el.id || '',
    name: el.getAttribute('name') || '',
    placeholder: el.getAttribute('placeholder') || ''
  }));

  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => ({
    level: (h.tagName || '').toLowerCase(),
    text: (h.innerText || h.textContent || '').trim()
  }));

  const html = document.documentElement ? document.documentElement.outerHTML : '';
  const text = document.body ? (document.body.innerText || '').trim() : '';

  return JSON.stringify({
    capturedAt: new Date().toISOString(),
    url: location.href,
    title: document.title,
    htmlBase64: btoa(unescape(encodeURIComponent(html))),
    textBase64: btoa(unescape(encodeURIComponent(text))),
    links,
    buttons,
    inputs,
    headings
  });
})();
'''
    raw = chrome_exec_js(js, timeout=30)
    return json.loads(raw)


def save_page(page: dict, output_dir: Path, index: int, action: str) -> dict:
    url = page.get("url", "")
    parsed = urlparse(url)
    slug = sanitize(f"{index:03d}_{action}_{parsed.netloc}_{parsed.path or 'root'}_{parsed.query}")
    page_dir = output_dir / "pages" / slug
    page_dir.mkdir(parents=True, exist_ok=True)

    html = base64.b64decode(page.get("htmlBase64", "")).decode("utf-8", errors="replace")
    text = base64.b64decode(page.get("textBase64", "")).decode("utf-8", errors="replace")

    (page_dir / "page.html").write_text(html, encoding="utf-8")
    (page_dir / "page.txt").write_text(text, encoding="utf-8")

    metadata = {k: v for k, v in page.items() if k not in {"htmlBase64", "textBase64"}}
    metadata["captureAction"] = action
    (page_dir / "page.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    return {
        "slug": slug,
        "url": url,
        "title": page.get("title", ""),
        "action": action,
        "links": len(page.get("links", [])),
        "buttons": len(page.get("buttons", [])),
        "inputs": len(page.get("inputs", [])),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Authenticated Zo crawler using active Chrome session")
    parser.add_argument("--start-url", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--max-pages", type=int, default=150)
    parser.add_argument(
        "--nav-labels",
        default="Home,Files,Chats,Automations,Space,Skills,More,Hosting,Datasets,System,Terminal,Billing,Resources,Bookmarks,Settings",
        help="Comma-separated list of UI labels to click before link crawling",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    nav_labels = [label.strip() for label in args.nav_labels.split(",") if label.strip()]

    summary = {
        "startUrl": args.start_url,
        "startedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "pages": [],
        "navAttempts": [],
        "errors": [],
    }

    discovered_links: set[str] = set()
    visited: set[str] = set()

    try:
        chrome_open_new_tab(args.start_url)

        # Initial capture
        time.sleep(2.5)
        page = extract_payload()
        summary["pages"].append(save_page(page, output_dir, len(summary["pages"]), "initial"))

        # Click navigation labels to expose feature surfaces.
        for label in nav_labels:
            try:
                click_js = f'''
(() => {{
  const label = {json.dumps(label)};
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim().toLowerCase();
  const targetNorm = norm(label);
  const candidates = Array.from(document.querySelectorAll('button,[role="button"],a[role="button"]'));
  const target = candidates.find((el) => norm(el.innerText || el.textContent) === targetNorm || norm(el.getAttribute('aria-label')) === targetNorm)
    || candidates.find((el) => norm(el.innerText || el.textContent).includes(targetNorm) || norm(el.getAttribute('aria-label')).includes(targetNorm));
  if (!target) return JSON.stringify({{ok:false,label}});
  target.click();
  return JSON.stringify({{ok:true,label}});
}})();
'''
                click_result = json.loads(chrome_exec_js(click_js, timeout=20))
                summary["navAttempts"].append(click_result)
                time.sleep(2.5)
                page = extract_payload()
                summary["pages"].append(
                    save_page(page, output_dir, len(summary["pages"]), f"click_{label}")
                )
            except Exception as exc:
                summary["errors"].append({"stage": f"click:{label}", "error": str(exc)})

        # Build crawl queue from captured links.
        for saved in summary["pages"]:
            norm = normalize_url(saved.get("url", ""))
            if norm:
                visited.add(norm)
            page_json = output_dir / "pages" / saved["slug"] / "page.json"
            if not page_json.exists():
                continue
            data = json.loads(page_json.read_text())
            for link in data.get("links", []):
                href = normalize_url(link.get("href", ""))
                if href and in_scope(href):
                    discovered_links.add(href)

        queue = [url for url in sorted(discovered_links) if url not in visited]

        while queue and len(visited) < args.max_pages:
            url = queue.pop(0)
            if not url or url in visited or not in_scope(url):
                continue

            try:
                chrome_set_url(url)
                time.sleep(3)
                page = extract_payload()
                norm = normalize_url(page.get("url", url)) or url
                if norm in visited:
                    continue

                visited.add(norm)
                summary["pages"].append(
                    save_page(page, output_dir, len(summary["pages"]), "link_crawl")
                )

                for link in page.get("links", []):
                    href = normalize_url(link.get("href", ""))
                    if href and in_scope(href) and href not in visited and href not in queue:
                        queue.append(href)
            except Exception as exc:
                summary["errors"].append({"stage": "link_crawl", "url": url, "error": str(exc)})

    finally:
        try:
            chrome_close_active_tab()
        except Exception:
            pass

    summary["finishedAt"] = time.strftime("%Y-%m-%dT%H:%M:%S%z")
    summary["pageCount"] = len(summary["pages"])
    summary["errorCount"] = len(summary["errors"])

    (output_dir / "crawl-summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

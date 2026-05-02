#!/usr/bin/env python3
import asyncio
import json
import sqlite3
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, urlunparse

from crawl4ai import AsyncWebCrawler

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "instruction_research.sqlite"
SUMMARY_PATH = ROOT / "skills_sh_mirror_summary.json"
HTML_PATH = ROOT / "skills_sh_mirror.html"

SEED_URL = "https://skills.sh/"
MAX_SEED_LINKS = 500
MAX_CRAWL_PAGES = 120
MAX_DEPTH = 2


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS skill_marketplace_entries (
          id INTEGER PRIMARY KEY,
          source TEXT NOT NULL,
          entry_url TEXT NOT NULL,
          title TEXT,
          brief TEXT,
          tags TEXT,
          discovered_at TEXT NOT NULL,
          UNIQUE(source, entry_url)
        );
        """
    )


def upsert_entry(
    conn: sqlite3.Connection,
    source: str,
    entry_url: str,
    title: str,
    brief: str,
    tags: str,
) -> None:
    conn.execute(
        """
        INSERT INTO skill_marketplace_entries(source, entry_url, title, brief, tags, discovered_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(source, entry_url) DO UPDATE SET
          title=excluded.title,
          brief=excluded.brief,
          tags=excluded.tags,
          discovered_at=excluded.discovered_at
        """,
        (
            source,
            entry_url[:2000],
            (title or "")[:500],
            (brief or "")[:2000],
            (tags or "")[:500],
            now_iso(),
        ),
    )


def infer_tags(url: str) -> str:
    p = urlparse(url).path.strip("/")
    if not p:
        return "root"
    parts = [s for s in p.split("/") if s]
    tags = []
    if "trending" in parts:
        tags.append("trending")
    if "hot" in parts:
        tags.append("hot")
    if "docs" in parts:
        tags.append("docs")
    if len(parts) >= 3:
        tags.append("skill-detail")
    elif len(parts) == 2:
        tags.append("namespace")
    if not tags:
        tags.append("index")
    return ",".join(tags)


def normalize_skills_url(url: str) -> str:
    p = urlparse(url)
    if p.scheme not in ("http", "https"):
        return ""
    if p.netloc != "skills.sh":
        return ""
    clean_path = p.path or "/"
    if not clean_path.startswith("/"):
        clean_path = "/" + clean_path
    return urlunparse(("https", "skills.sh", clean_path, "", "", ""))


def page_brief(meta: dict, markdown: str, fallback_url: str) -> tuple[str, str]:
    title = meta.get("title") or fallback_url
    brief = meta.get("description") or markdown[:450].replace("\n", " ") or "No description"
    return title, brief


async def crawl() -> dict:
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)

    crawl_targets = {
        normalize_skills_url(SEED_URL),
        normalize_skills_url(f"{SEED_URL}trending"),
        normalize_skills_url(f"{SEED_URL}hot"),
        normalize_skills_url(f"{SEED_URL}docs"),
    }
    crawled = 0
    failed = 0

    async with AsyncWebCrawler(verbose=False) as crawler:
        seed = await crawler.arun(url=SEED_URL)
        if seed.success:
            links = (seed.links or {}).get("internal") or []
            for ln in links[:MAX_SEED_LINKS]:
                href = (ln or {}).get("href")
                if not href:
                    continue
                normalized = normalize_skills_url(href)
                if normalized:
                    crawl_targets.add(normalized)

        queue = deque((u, 0) for u in sorted(crawl_targets) if u)
        visited = set()
        while queue and len(visited) < MAX_CRAWL_PAGES:
            url, depth = queue.popleft()
            if not url or url in visited:
                continue
            visited.add(url)
            try:
                res = await crawler.arun(url=url)
            except Exception:
                failed += 1
                continue
            if not res.success:
                failed += 1
                continue
            crawled += 1
            md = (res.markdown or "").strip()
            meta = res.metadata or {}
            title, brief = page_brief(meta, md, url)
            upsert_entry(
                conn=conn,
                source="skills.sh",
                entry_url=url,
                title=title,
                brief=brief,
                tags=infer_tags(url),
            )

            if depth < MAX_DEPTH:
                internal = (res.links or {}).get("internal") or []
                for ln in internal:
                    href = (ln or {}).get("href")
                    normalized = normalize_skills_url(href or "")
                    if normalized and normalized not in visited:
                        queue.append((normalized, depth + 1))

    conn.commit()
    total = conn.execute(
        "SELECT COUNT(*) FROM skill_marketplace_entries WHERE source='skills.sh'"
    ).fetchone()[0]

    top = conn.execute(
        """
        SELECT entry_url, title, brief, tags
        FROM skill_marketplace_entries
        WHERE source='skills.sh'
        ORDER BY discovered_at DESC
        LIMIT 50
        """
    ).fetchall()
    conn.close()

    out = {
        "generated_at": now_iso(),
        "source": "skills.sh",
        "crawled_pages": crawled,
        "failed_pages": failed,
        "mirrored_entries_total": int(total),
        "sample_entries": [
            {"url": u, "title": t, "brief": b, "tags": tg} for (u, t, b, tg) in top[:20]
        ],
    }
    SUMMARY_PATH.write_text(json.dumps(out, indent=2), encoding="utf-8")

    html = [
        "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>",
        "<title>skills.sh Mirror Snapshot</title>",
        "<style>body{font-family:ui-sans-serif,system-ui;padding:24px;background:#f8fafc;color:#0f172a}a{color:#0f766e;text-decoration:none}a:hover{text-decoration:underline}.card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin:10px 0}.muted{color:#475569;font-size:14px}</style>",
        "</head><body>",
        "<h1>skills.sh Mirror Snapshot</h1>",
        f"<p class='muted'>Entries mirrored: {total} | Crawled: {crawled} | Failed: {failed} | Generated: {out['generated_at']}</p>",
    ]
    for u, t, b, tg in top:
        html.append(
            f"<div class='card'><a href='{u}' target='_blank' rel='noreferrer'><strong>{(t or '').replace('<','&lt;')}</strong></a><p class='muted'>{(b or '').replace('<','&lt;')}</p><p class='muted'>tags: {(tg or '').replace('<','&lt;')}</p></div>"
        )
    html.append("</body></html>")
    HTML_PATH.write_text("".join(html), encoding="utf-8")

    return out


if __name__ == "__main__":
    result = asyncio.run(crawl())
    print(json.dumps(result, indent=2))

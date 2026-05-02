#!/usr/bin/env python3
import argparse
import hashlib
import json
import re
import sqlite3
import time
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from html import unescape
from typing import Dict, Iterable, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse, urldefrag

import requests
from bs4 import BeautifulSoup

USER_AGENT = "InstructionResearchBot/1.0 (+academic research; contact: local-run)"

PROMPT_PATTERNS = [
    re.compile(r"\bact as\b", re.I),
    re.compile(r"\byou are\b", re.I),
    re.compile(r"\bprompt\s*[:\-]", re.I),
    re.compile(r"\b/system\b", re.I),
    re.compile(r"\b/imagine\b", re.I),
    re.compile(r"\bchain of thought\b", re.I),
    re.compile(r"\brole\s*:\s*", re.I),
]

SEED_SOURCES = [
    ("Commercial Marketplaces", "PromptBase", "https://promptbase.com"),
    ("Commercial Marketplaces", "PromptHero", "https://prompthero.com"),
    ("Commercial Marketplaces", "FlowGPT", "https://flowgpt.com"),
    ("Commercial Marketplaces", "AIPRM", "https://www.aiprm.com"),
    ("Commercial Marketplaces", "Promptrr", "https://promptrr.io"),
    ("Commercial Marketplaces", "PromptSea", "https://www.promptsea.io"),
    ("Commercial Marketplaces", "God of Prompt", "https://www.godofprompt.ai"),
    ("Commercial Marketplaces", "TopFreePrompts", "https://topfreeprompts.com"),
    ("Commercial Marketplaces", "Writesonic Chatsonic Prompt Library", "https://writesonic.com/chatsonic"),

    ("Enterprise Prompt Infrastructure", "Maxim AI", "https://www.getmaxim.ai"),
    ("Enterprise Prompt Infrastructure", "LangSmith", "https://www.langchain.com/langsmith"),
    ("Enterprise Prompt Infrastructure", "LangChain Hub (LangChain docs)", "https://python.langchain.com/docs/langsmith"),
    ("Enterprise Prompt Infrastructure", "Arize AX", "https://arize.com"),
    ("Enterprise Prompt Infrastructure", "Arize Phoenix", "https://phoenix.arize.com"),
    ("Enterprise Prompt Infrastructure", "PromptLayer", "https://www.promptlayer.com"),
    ("Enterprise Prompt Infrastructure", "Humanloop", "https://humanloop.com"),
    ("Enterprise Prompt Infrastructure", "PromptingMagic", "https://promptingmagic.ai"),

    ("Open Source & Community", "awesome-chatgpt-prompts", "https://github.com/f/awesome-chatgpt-prompts"),
    ("Open Source & Community", "awesome-claude-prompts", "https://github.com/langgptai/awesome-claude-prompts"),
    ("Open Source & Community", "Prompt Engineering Guide", "https://github.com/dair-ai/Prompt-Engineering-Guide"),
    ("Open Source & Community", "system-prompts", "https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools"),
    ("Open Source & Community", "vibe-coding-playbook", "https://github.com"),

    ("Forums & Community R&D", "Reddit PromptEngineering", "https://www.reddit.com/r/PromptEngineering/"),
    ("Forums & Community R&D", "Reddit ChatGPTPro", "https://www.reddit.com/r/ChatGPTPro/"),
    ("Forums & Community R&D", "Reddit ChatGPTPromptGenius", "https://www.reddit.com/r/ChatGPTPromptGenius/"),
    ("Forums & Community R&D", "Reddit VibeCoding", "https://www.reddit.com/r/VibeCoding/"),
    ("Forums & Community R&D", "Discord OpenAI", "https://discord.com/invite/openai"),
    ("Forums & Community R&D", "Discord Midjourney", "https://discord.com/invite/midjourney"),
    ("Forums & Community R&D", "Discord Hugging Face", "https://discord.com/invite/hugging-face-879548962464493619"),
    ("Forums & Community R&D", "Discord Mistral AI", "https://discord.com/invite/mistralai"),

    ("Visual & Multimodal", "Civitai", "https://civitai.com"),
    ("Visual & Multimodal", "SeaArt", "https://www.seaart.ai"),
    ("Visual & Multimodal", "Lexica", "https://lexica.art"),
    ("Visual & Multimodal", "OpenArt", "https://openart.ai"),
    ("Visual & Multimodal", "Midjourney Docs", "https://docs.midjourney.com"),
    ("Visual & Multimodal", "Hugging Face Models", "https://huggingface.co/models"),

    ("Academic & Benchmarks", "Hugging Face Datasets", "https://huggingface.co/datasets"),
    ("Academic & Benchmarks", "OpenReview", "https://openreview.net"),
    ("Academic & Benchmarks", "GAIR DatasetResearch", "https://huggingface.co/datasets/GAIR/DatasetResearch"),

    ("Vendor Documentation", "Anthropic Prompt Engineering", "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering"),
    ("Vendor Documentation", "Anthropic Prompt Tutorial GitHub", "https://github.com/anthropics/prompt-eng-interactive-tutorial"),
    ("Vendor Documentation", "OpenAI Cookbook", "https://cookbook.openai.com"),
    ("Vendor Documentation", "OpenAI Platform Docs", "https://platform.openai.com/docs"),
    ("Vendor Documentation", "Mistral Docs", "https://docs.mistral.ai"),

    ("Vibe Coding", "Lovable", "https://lovable.dev"),
    ("Vibe Coding", "Bolt.new", "https://bolt.new"),
    ("Vibe Coding", "Wasp", "https://wasp-lang.dev"),
    ("Vibe Coding", "Stanford DSPy", "https://github.com/stanfordnlp/dspy"),
]


@dataclass
class PageData:
    url: str
    final_url: str
    domain: str
    status: int
    content_type: str
    title: str
    brief: str
    text: str
    html: str


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        PRAGMA journal_mode=WAL;

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sources (
            id INTEGER PRIMARY KEY,
            category_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            seed_url TEXT NOT NULL,
            domain TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(name, seed_url),
            FOREIGN KEY(category_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY,
            source_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            final_url TEXT NOT NULL,
            domain TEXT NOT NULL,
            status_code INTEGER,
            content_type TEXT,
            title TEXT,
            brief TEXT,
            text_content TEXT,
            html_content TEXT,
            fetched_at TEXT NOT NULL,
            content_hash TEXT,
            UNIQUE(source_id, final_url),
            FOREIGN KEY(source_id) REFERENCES sources(id)
        );

        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY,
            page_id INTEGER NOT NULL,
            link_url TEXT NOT NULL,
            anchor_text TEXT,
            UNIQUE(page_id, link_url),
            FOREIGN KEY(page_id) REFERENCES pages(id)
        );

        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY,
            page_id INTEGER NOT NULL,
            prompt_text TEXT NOT NULL,
            extraction_method TEXT NOT NULL,
            score REAL NOT NULL,
            UNIQUE(page_id, prompt_text),
            FOREIGN KEY(page_id) REFERENCES pages(id)
        );

        CREATE TABLE IF NOT EXISTS crawl_errors (
            id INTEGER PRIMARY KEY,
            source_id INTEGER,
            url TEXT NOT NULL,
            error_message TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """
    )
    conn.commit()


def domain_of(url: str) -> str:
    return urlparse(url).netloc.lower()


def normalize_url(url: str) -> str:
    clean, _ = urldefrag(url.strip())
    return clean


def extract_text_from_html(html: str) -> Tuple[str, str, str]:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg", "canvas"]):
        tag.decompose()

    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()

    description = ""
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc and meta_desc.get("content"):
        description = meta_desc.get("content").strip()

    paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p") if p.get_text(strip=True)]
    if not description and paragraphs:
        description = paragraphs[0][:500]

    text = soup.get_text("\n", strip=True)
    return title, description, text


def extract_prompt_candidates(html: str, text: str) -> List[Tuple[str, str, float]]:
    soup = BeautifulSoup(html, "html.parser")
    candidates: List[Tuple[str, str, float]] = []

    def maybe_add(raw: str, method: str) -> None:
        cleaned = unescape(raw or "").strip()
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        if len(cleaned) < 40 or len(cleaned) > 5000:
            return
        score = 0.0
        for patt in PROMPT_PATTERNS:
            if patt.search(cleaned):
                score += 1.0
        if cleaned.count("?") >= 2:
            score += 0.4
        if cleaned.lower().startswith(("you are", "act as", "system:")):
            score += 0.8
        if score >= 1.0:
            candidates.append((cleaned, method, score))

    for tag in soup.find_all(["pre", "code", "blockquote"]):
        maybe_add(tag.get_text("\n", strip=True), "code_or_quote_block")

    for li in soup.find_all("li"):
        txt = li.get_text(" ", strip=True)
        if len(txt) > 80:
            maybe_add(txt, "list_item")

    # markdown-ish sections from plain text
    for block in re.split(r"\n\s*\n", text):
        if len(block) > 80:
            maybe_add(block, "text_block")

    # de-duplicate
    uniq = {}
    for prompt, method, score in candidates:
        key = prompt.lower()
        if key not in uniq or uniq[key][2] < score:
            uniq[key] = (prompt, method, score)

    return sorted(uniq.values(), key=lambda x: x[2], reverse=True)[:200]


def fetch_url(session: requests.Session, url: str, timeout: int = 20) -> PageData:
    response = session.get(url, timeout=timeout, allow_redirects=True)
    content_type = response.headers.get("content-type", "")
    final_url = normalize_url(response.url)

    if "text" not in content_type and "json" not in content_type and "xml" not in content_type and "markdown" not in content_type:
        return PageData(
            url=url,
            final_url=final_url,
            domain=domain_of(final_url),
            status=response.status_code,
            content_type=content_type,
            title="",
            brief="",
            text="",
            html="",
        )

    body = response.text
    if "html" in content_type.lower():
        title, brief, text = extract_text_from_html(body)
        html = body
    else:
        text = body
        brief = body.strip().splitlines()[0][:500] if body.strip() else ""
        title = final_url
        html = f"<html><body><pre>{body}</pre></body></html>"

    return PageData(
        url=url,
        final_url=final_url,
        domain=domain_of(final_url),
        status=response.status_code,
        content_type=content_type,
        title=title[:1000],
        brief=brief[:2000],
        text=text[:1000000],
        html=html[:1000000],
    )


def ensure_category(conn: sqlite3.Connection, name: str) -> int:
    conn.execute("INSERT OR IGNORE INTO categories(name) VALUES (?)", (name,))
    row = conn.execute("SELECT id FROM categories WHERE name = ?", (name,)).fetchone()
    return int(row[0])


def ensure_source(conn: sqlite3.Connection, category_id: int, name: str, seed_url: str) -> int:
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """
        INSERT OR IGNORE INTO sources(category_id, name, seed_url, domain, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (category_id, name, seed_url, domain_of(seed_url), now),
    )
    row = conn.execute(
        "SELECT id FROM sources WHERE name = ? AND seed_url = ?",
        (name, seed_url),
    ).fetchone()
    return int(row[0])


def save_page(conn: sqlite3.Connection, source_id: int, page: PageData) -> int:
    now = datetime.now(timezone.utc).isoformat()
    h = hashlib.sha256((page.text or "").encode("utf-8", errors="ignore")).hexdigest()
    conn.execute(
        """
        INSERT INTO pages(source_id, url, final_url, domain, status_code, content_type, title, brief,
                          text_content, html_content, fetched_at, content_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(source_id, final_url) DO UPDATE SET
            url=excluded.url,
            status_code=excluded.status_code,
            content_type=excluded.content_type,
            title=excluded.title,
            brief=excluded.brief,
            text_content=excluded.text_content,
            html_content=excluded.html_content,
            fetched_at=excluded.fetched_at,
            content_hash=excluded.content_hash
        """,
        (
            source_id,
            page.url,
            page.final_url,
            page.domain,
            page.status,
            page.content_type,
            page.title,
            page.brief,
            page.text,
            page.html,
            now,
            h,
        ),
    )
    row = conn.execute(
        "SELECT id FROM pages WHERE source_id = ? AND final_url = ?",
        (source_id, page.final_url),
    ).fetchone()
    return int(row[0])


def save_links(conn: sqlite3.Connection, page_id: int, links: Iterable[Tuple[str, str]]) -> None:
    for link_url, anchor in links:
        conn.execute(
            "INSERT OR IGNORE INTO links(page_id, link_url, anchor_text) VALUES (?, ?, ?)",
            (page_id, link_url, anchor[:500] if anchor else ""),
        )


def save_prompts(conn: sqlite3.Connection, page_id: int, prompts: Iterable[Tuple[str, str, float]]) -> None:
    for prompt_text, method, score in prompts:
        conn.execute(
            "INSERT OR IGNORE INTO prompts(page_id, prompt_text, extraction_method, score) VALUES (?, ?, ?, ?)",
            (page_id, prompt_text, method, score),
        )


def crawl_source(
    conn: sqlite3.Connection,
    session: requests.Session,
    source_id: int,
    seed_url: str,
    max_pages_per_source: int,
    delay_s: float,
) -> None:
    seed_url = normalize_url(seed_url)
    base_domain = domain_of(seed_url)
    visited: Set[str] = set()
    queue: deque[Tuple[str, int]] = deque([(seed_url, 0)])

    while queue and len(visited) < max_pages_per_source:
        url, depth = queue.popleft()
        url = normalize_url(url)
        if not url or url in visited:
            continue
        visited.add(url)

        try:
            page = fetch_url(session, url)
        except Exception as exc:
            conn.execute(
                "INSERT INTO crawl_errors(source_id, url, error_message, created_at) VALUES (?, ?, ?, ?)",
                (source_id, url, str(exc), datetime.now(timezone.utc).isoformat()),
            )
            conn.commit()
            continue

        page_id = save_page(conn, source_id, page)

        if page.html:
            soup = BeautifulSoup(page.html, "html.parser")
            found_links: List[Tuple[str, str]] = []
            for a in soup.find_all("a", href=True):
                href = normalize_url(urljoin(page.final_url, a.get("href")))
                if not href.startswith("http"):
                    continue
                found_links.append((href, a.get_text(" ", strip=True)))
            save_links(conn, page_id, found_links)

            prompts = extract_prompt_candidates(page.html, page.text)
            save_prompts(conn, page_id, prompts)

            if depth < 1:
                for href, _ in found_links:
                    parsed = urlparse(href)
                    if parsed.netloc.lower().endswith(base_domain) and href not in visited:
                        queue.append((href, depth + 1))

        conn.commit()
        time.sleep(delay_s)


def export_summary(conn: sqlite3.Connection, output_json: str) -> None:
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "counts": {
            "categories": conn.execute("SELECT COUNT(*) FROM categories").fetchone()[0],
            "sources": conn.execute("SELECT COUNT(*) FROM sources").fetchone()[0],
            "pages": conn.execute("SELECT COUNT(*) FROM pages").fetchone()[0],
            "links": conn.execute("SELECT COUNT(*) FROM links").fetchone()[0],
            "prompts": conn.execute("SELECT COUNT(*) FROM prompts").fetchone()[0],
            "errors": conn.execute("SELECT COUNT(*) FROM crawl_errors").fetchone()[0],
        },
        "top_sources_by_prompts": [
            {
                "source": row[0],
                "seed_url": row[1],
                "prompt_count": row[2],
            }
            for row in conn.execute(
                """
                SELECT s.name, s.seed_url, COUNT(p.id) AS prompt_count
                FROM sources s
                JOIN pages pg ON pg.source_id = s.id
                JOIN prompts p ON p.page_id = pg.id
                GROUP BY s.id
                ORDER BY prompt_count DESC
                LIMIT 30
                """
            ).fetchall()
        ],
    }

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape AI instruction-engineering sources and store in SQLite")
    parser.add_argument("--db", default="instruction_research.sqlite", help="Path to SQLite database")
    parser.add_argument("--max-pages-per-source", type=int, default=12)
    parser.add_argument("--delay", type=float, default=0.25)
    parser.add_argument("--summary", default="summary.json")
    args = parser.parse_args()

    conn = sqlite3.connect(args.db)
    init_db(conn)

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    for category_name, source_name, seed_url in SEED_SOURCES:
        cat_id = ensure_category(conn, category_name)
        src_id = ensure_source(conn, cat_id, source_name, seed_url)
        conn.commit()
        crawl_source(
            conn=conn,
            session=session,
            source_id=src_id,
            seed_url=seed_url,
            max_pages_per_source=args.max_pages_per_source,
            delay_s=args.delay,
        )

    export_summary(conn, args.summary)
    conn.close()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import asyncio
import csv
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple
from urllib.parse import urljoin, urlparse

import requests
from crawl4ai import AsyncWebCrawler

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "instruction_research.sqlite"

csv.field_size_limit(10_000_000)

CATEGORY_DEFS = [
    ("Commercial Marketplaces", "Prompt marketplaces and commercial libraries"),
    ("Enterprise Prompt Management", "Versioning, evals, observability, gateways"),
    ("Framework Hubs and SDK Ecosystems", "LangChain/LangSmith and SDK-integrated hubs"),
    ("Forums and Community R&D", "Reddit/Discord/community experimentation"),
    ("Open-Source Prompt Repositories", "GitHub awesome lists and system prompt repos"),
    ("Visual and Multimodal Prompting", "Image/video prompting ecosystems, LoRAs, checkpoints"),
    ("Academic Benchmarks and Datasets", "Research datasets and benchmark suites"),
    ("Vendor Official Documentation", "OpenAI/Anthropic and provider docs"),
    ("Vibe Coding and Orchestration", "AI coding workflows, tools, agentic engineering"),
    ("Methodologies and Architectures", "Circular prompting, meta-prompting, multi-agent design"),
]

SEED_SOURCES = [
    ("Commercial Marketplaces", "PromptBase", "https://promptbase.com"),
    ("Commercial Marketplaces", "PromptHero", "https://prompthero.com"),
    ("Commercial Marketplaces", "FlowGPT", "https://flowgpt.com"),
    ("Commercial Marketplaces", "AIPRM", "https://www.aiprm.com"),
    ("Commercial Marketplaces", "God of Prompt", "https://www.godofprompt.ai"),
    ("Commercial Marketplaces", "TopFreePrompts", "https://topfreeprompts.com"),
    ("Commercial Marketplaces", "Promptrr", "https://promptrr.io"),
    ("Commercial Marketplaces", "PromptSea", "https://www.promptsea.io"),
    ("Commercial Marketplaces", "Writesonic Chatsonic", "https://writesonic.com/chatsonic"),
    ("Enterprise Prompt Management", "Maxim AI", "https://www.getmaxim.ai"),
    ("Enterprise Prompt Management", "Bifrost by Maxim", "https://getmax.im/bifrost"),
    ("Enterprise Prompt Management", "LangSmith", "https://www.langchain.com/langsmith"),
    ("Enterprise Prompt Management", "Arize", "https://arize.com"),
    ("Enterprise Prompt Management", "Arize Phoenix", "https://phoenix.arize.com"),
    ("Enterprise Prompt Management", "PromptLayer", "https://www.promptlayer.com"),
    ("Enterprise Prompt Management", "Humanloop", "https://humanloop.com"),
    ("Framework Hubs and SDK Ecosystems", "LangChain Docs", "https://python.langchain.com/docs/introduction/"),
    ("Framework Hubs and SDK Ecosystems", "LangSmith Docs", "https://docs.smith.langchain.com"),
    ("Forums and Community R&D", "Reddit PromptEngineering", "https://www.reddit.com/r/PromptEngineering/"),
    ("Forums and Community R&D", "Reddit ChatGPTPro", "https://www.reddit.com/r/ChatGPTPro/"),
    ("Forums and Community R&D", "Reddit ChatGPTPromptGenius", "https://www.reddit.com/r/ChatGPTPromptGenius/"),
    ("Forums and Community R&D", "Reddit VibeCoding", "https://www.reddit.com/r/VibeCoding/"),
    ("Forums and Community R&D", "OpenAI Discord Invite", "https://discord.com/invite/openai"),
    ("Forums and Community R&D", "Midjourney Discord Invite", "https://discord.com/invite/midjourney"),
    ("Forums and Community R&D", "Hugging Face Discord Invite", "https://discord.com/invite/hugging-face-879548962464493619"),
    ("Forums and Community R&D", "Mistral Discord Invite", "https://discord.com/invite/mistralai"),
    ("Open-Source Prompt Repositories", "prompts.chat (formerly awesome-chatgpt-prompts)", "https://github.com/f/awesome-chatgpt-prompts"),
    ("Open-Source Prompt Repositories", "awesome-claude-prompts", "https://github.com/langgptai/awesome-claude-prompts"),
    ("Open-Source Prompt Repositories", "Prompt-Engineering-Guide", "https://github.com/dair-ai/Prompt-Engineering-Guide"),
    ("Open-Source Prompt Repositories", "system-prompts-and-models-of-ai-tools", "https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools"),
    ("Visual and Multimodal Prompting", "Civitai", "https://civitai.com"),
    ("Visual and Multimodal Prompting", "OpenArt", "https://openart.ai"),
    ("Visual and Multimodal Prompting", "Lexica", "https://lexica.art"),
    ("Visual and Multimodal Prompting", "SeaArt", "https://www.seaart.ai"),
    ("Visual and Multimodal Prompting", "Midjourney Docs", "https://docs.midjourney.com"),
    ("Academic Benchmarks and Datasets", "DeepResearch Bench", "https://deepresearch-bench.github.io/"),
    ("Academic Benchmarks and Datasets", "DeepResearch Bench II", "https://agentresearchlab.com/benchmarks/deepresearch-bench-ii/index.html"),
    ("Academic Benchmarks and Datasets", "IDRBench arXiv", "https://arxiv.org/abs/2601.06676"),
    ("Academic Benchmarks and Datasets", "GAIR DatasetResearch", "https://huggingface.co/datasets/GAIR/DatasetResearch"),
    ("Academic Benchmarks and Datasets", "Hugging Face Datasets", "https://huggingface.co/datasets"),
    ("Vendor Official Documentation", "Anthropic Prompting Best Practices", "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering"),
    ("Vendor Official Documentation", "Anthropic Prompt Tutorial", "https://github.com/anthropics/prompt-eng-interactive-tutorial"),
    ("Vendor Official Documentation", "OpenAI Cookbook", "https://cookbook.openai.com"),
    ("Vendor Official Documentation", "OpenAI Prompt Engineering Guide", "https://platform.openai.com/docs/guides/prompt-engineering"),
    ("Vendor Official Documentation", "OpenAI Reasoning Best Practices", "https://developers.openai.com/api/docs/guides/reasoning-best-practices/"),
    ("Vendor Official Documentation", "Mistral Docs", "https://docs.mistral.ai"),
    ("Vibe Coding and Orchestration", "Lovable", "https://lovable.dev"),
    ("Vibe Coding and Orchestration", "Bolt.new", "https://bolt.new"),
    ("Vibe Coding and Orchestration", "Wasp", "https://wasp-lang.dev"),
    ("Vibe Coding and Orchestration", "DSPy", "https://github.com/stanfordnlp/dspy"),
    ("Methodologies and Architectures", "PromptingGuide Techniques", "https://www.promptingguide.ai/techniques"),
    ("Methodologies and Architectures", "PromptingGuide Meta Prompting", "https://www.promptingguide.ai/techniques/meta-prompting"),
]

PROMPT_PATTERNS = [
    re.compile(r"\bI want you to act as\b", re.I),
    re.compile(r"\bYou are\b", re.I),
    re.compile(r"\bPrompt\b", re.I),
    re.compile(r"\b/imagine\b", re.I),
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sources (
            id INTEGER PRIMARY KEY,
            category_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            title TEXT,
            brief TEXT,
            source_type TEXT NOT NULL DEFAULT 'crawl4ai',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(name, url),
            FOREIGN KEY(category_id) REFERENCES categories(id)
        );
        CREATE TABLE IF NOT EXISTS source_links (
            id INTEGER PRIMARY KEY,
            source_id INTEGER NOT NULL,
            link_url TEXT NOT NULL,
            anchor TEXT,
            UNIQUE(source_id, link_url),
            FOREIGN KEY(source_id) REFERENCES sources(id)
        );
        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY,
            source_id INTEGER NOT NULL,
            title TEXT,
            prompt_text TEXT NOT NULL,
            url TEXT,
            license TEXT,
            tags TEXT,
            created_at TEXT NOT NULL,
            UNIQUE(source_id, prompt_text),
            FOREIGN KEY(source_id) REFERENCES sources(id)
        );
        """
    )


def upsert_category(conn: sqlite3.Connection, name: str, description: str) -> int:
    conn.execute("INSERT INTO categories(name, description) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET description=excluded.description", (name, description))
    return conn.execute("SELECT id FROM categories WHERE name=?", (name,)).fetchone()[0]


def upsert_source(conn: sqlite3.Connection, category_id: int, name: str, url: str, title: str, brief: str) -> int:
    now = now_iso()
    conn.execute(
        """
        INSERT INTO sources(category_id, name, url, title, brief, source_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'crawl4ai', ?, ?)
        ON CONFLICT(name, url) DO UPDATE SET
          category_id=excluded.category_id,
          title=excluded.title,
          brief=excluded.brief,
          updated_at=excluded.updated_at
        """,
        (category_id, name, url, title[:500], brief[:2000], now, now),
    )
    return conn.execute("SELECT id FROM sources WHERE name=? AND url=?", (name, url)).fetchone()[0]


def add_link(conn: sqlite3.Connection, source_id: int, link_url: str, anchor: str = "") -> None:
    conn.execute("INSERT OR IGNORE INTO source_links(source_id, link_url, anchor) VALUES (?, ?, ?)", (source_id, link_url[:2000], (anchor or "")[:500]))


def looks_like_prompt(text: str) -> bool:
    t = text.strip()
    if len(t) < 60 or len(t) > 50000:
        return False
    return any(p.search(t) for p in PROMPT_PATTERNS)


def save_prompt(conn: sqlite3.Connection, source_id: int, title: str, prompt_text: str, url: str = "", license_name: str = "", tags: str = "") -> None:
    conn.execute(
        "INSERT OR IGNORE INTO prompts(source_id, title, prompt_text, url, license, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (source_id, title[:500], prompt_text.strip(), url, license_name, tags, now_iso()),
    )


def extract_prompt_like_blocks(markdown_text: str) -> List[str]:
    blocks = []
    for b in re.findall(r"```(?:[\w+-]*)\n(.*?)```", markdown_text, flags=re.S):
        txt = b.strip()
        if looks_like_prompt(txt):
            blocks.append(txt)

    for part in re.split(r"\n\s*\n", markdown_text):
        txt = part.strip()
        if looks_like_prompt(txt):
            blocks.append(txt)

    # dedupe keep order
    seen = set()
    out = []
    for b in blocks:
        k = b.lower()
        if k not in seen:
            seen.add(k)
            out.append(b)
    return out[:80]


async def crawl_all(conn: sqlite3.Connection, cat_id_by_name: Dict[str, int]) -> Dict[str, int]:
    source_ids = {}

    async with AsyncWebCrawler(verbose=False) as crawler:
        for category_name, source_name, source_url in SEED_SOURCES:
            title, brief = source_url, "crawl failed"
            try:
                result = await crawler.arun(url=source_url)
                if result.success:
                    md = result.markdown or ""
                    meta = result.metadata or {}
                    title = meta.get("title") or result.url or source_url
                    brief = meta.get("description") or (md[:400].replace("\n", " ") if md else "No description")
                else:
                    brief = result.error_message or "crawl failed"
            except Exception as exc:
                brief = f"crawl exception: {exc}"
                md = ""
                result = None

            source_id = upsert_source(conn, cat_id_by_name[category_name], source_name, source_url, title, brief)
            source_ids[source_name] = source_id

            if result and result.success:
                links = result.links or {}
                all_links = (links.get("internal") or []) + (links.get("external") or [])
                for ln in all_links[:120]:
                    href = ln.get("href") if isinstance(ln, dict) else ""
                    if not href:
                        continue
                    abs_href = urljoin(source_url, href)
                    add_link(conn, source_id, abs_href, ln.get("text", "") if isinstance(ln, dict) else "")

                for i, ptxt in enumerate(extract_prompt_like_blocks(result.markdown or ""), 1):
                    save_prompt(conn, source_id, f"crawl4ai extracted prompt {i}", ptxt, url=source_url, tags="crawl4ai_markdown")

            conn.commit()

    return source_ids


def _is_probably_crawlable(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False
    bad_ext = (
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico",
        ".pdf", ".zip", ".tar", ".gz", ".mp4", ".mp3", ".mov",
        ".woff", ".woff2", ".ttf", ".eot", ".css", ".js", ".map",
    )
    return not parsed.path.lower().endswith(bad_ext)


async def expand_internal_depth_1(conn: sqlite3.Connection, max_pages_per_source: int = 8) -> int:
    """
    Crawl first-level internal links for each source and store:
    - expanded source_links
    - additional prompt records extracted from markdown
    """
    sources = conn.execute("SELECT id, url FROM sources ORDER BY id").fetchall()
    added_prompts = 0

    async with AsyncWebCrawler(verbose=False) as crawler:
        for source_id, seed_url in sources:
            seed_domain = urlparse(seed_url).netloc.lower()
            links = conn.execute(
                "SELECT link_url FROM source_links WHERE source_id=? LIMIT 500",
                (source_id,),
            ).fetchall()
            candidates = []
            seen = set()
            for (u,) in links:
                if not u or u in seen:
                    continue
                seen.add(u)
                parsed = urlparse(u)
                if parsed.netloc.lower() != seed_domain:
                    continue
                if not _is_probably_crawlable(u):
                    continue
                candidates.append(u)
                if len(candidates) >= max_pages_per_source:
                    break

            for page_url in candidates:
                try:
                    result = await crawler.arun(url=page_url)
                except Exception:
                    continue
                if not result or not result.success:
                    continue

                page_links = result.links or {}
                all_links = (page_links.get("internal") or []) + (page_links.get("external") or [])
                for ln in all_links[:120]:
                    href = ln.get("href") if isinstance(ln, dict) else ""
                    if not href:
                        continue
                    abs_href = urljoin(page_url, href)
                    add_link(conn, source_id, abs_href, ln.get("text", "") if isinstance(ln, dict) else "")

                for i, ptxt in enumerate(extract_prompt_like_blocks(result.markdown or ""), 1):
                    before = conn.total_changes
                    save_prompt(
                        conn,
                        source_id,
                        f"depth1 extracted prompt {i}",
                        ptxt,
                        url=page_url,
                        tags="crawl4ai_depth1_markdown",
                    )
                    if conn.total_changes > before:
                        added_prompts += 1
            conn.commit()

    return added_prompts


def ingest_public_prompt_repos(conn: sqlite3.Connection, source_ids: Dict[str, int]) -> None:
    # prompts.chat CSV (high-yield complete prompts)
    csv_url = "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv"
    resp = requests.get(csv_url, timeout=30)
    resp.raise_for_status()
    rows = list(csv.DictReader(resp.text.splitlines()))
    sid = source_ids.get("prompts.chat (formerly awesome-chatgpt-prompts)")
    if sid:
        for row in rows:
            prompt = (row.get("prompt") or "").strip()
            if prompt:
                save_prompt(
                    conn,
                    sid,
                    title=row.get("act") or "prompt",
                    prompt_text=prompt,
                    url="https://github.com/f/awesome-chatgpt-prompts",
                    license_name="CC0-1.0 (repo declared)",
                    tags=f"type={row.get('type','')}|for_devs={row.get('for_devs','')}",
                )

    # awesome-claude README code blocks
    sid = source_ids.get("awesome-claude-prompts")
    if sid:
        readme = requests.get("https://raw.githubusercontent.com/langgptai/awesome-claude-prompts/main/README.md", timeout=30).text
        for i, block in enumerate(re.findall(r"```(?:[\w+-]*)\n(.*?)```", readme, flags=re.S), 1):
            b = block.strip()
            if looks_like_prompt(b):
                save_prompt(conn, sid, f"README prompt block {i}", b, url="https://github.com/langgptai/awesome-claude-prompts", license_name="MIT (repo declared)")

    # system prompts repo raw readme fallback
    sid = source_ids.get("system-prompts-and-models-of-ai-tools")
    if sid:
        readme = requests.get("https://raw.githubusercontent.com/x1xhlol/system-prompts-and-models-of-ai-tools/main/README.md", timeout=30).text
        for i, block in enumerate(re.findall(r"```(?:[\w+-]*)\n(.*?)```", readme, flags=re.S), 1):
            b = block.strip()
            if looks_like_prompt(b):
                save_prompt(conn, sid, f"README prompt block {i}", b, url="https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools")

    conn.commit()


def generate_html(conn: sqlite3.Connection) -> None:
    cat_rows = conn.execute("SELECT id, name, description FROM categories ORDER BY name").fetchall()
    source_count = conn.execute("SELECT COUNT(*) FROM sources").fetchone()[0]
    link_count = conn.execute("SELECT COUNT(*) FROM source_links").fetchone()[0]
    prompt_count = conn.execute("SELECT COUNT(*) FROM prompts").fetchone()[0]

    lines = [
        "<!doctype html>",
        "<html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>",
        "<title>AI Instruction Engineering Repository Map</title>",
        "<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;margin:0;background:#f4f5f7;color:#111}main{max-width:1100px;margin:0 auto;padding:24px}h1{margin:0 0 8px}.sub{color:#555}.kpi{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.k{background:#fff;border:1px solid #ddd;border-radius:10px;padding:10px 12px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}.card{background:#fff;border:1px solid #ddd;border-radius:10px;padding:12px}ul{padding-left:18px}a{text-decoration:none;color:#0a4}a:hover{text-decoration:underline}</style></head><body><main>",
        "<h1>Archetypal Repositories and Orchestration Architectures</h1>",
        "<div class='sub'>Built with Crawl4AI crawling + repository prompt extraction to SQLite.</div>",
        f"<div class='kpi'><div class='k'><strong>Sources</strong><div>{source_count}</div></div><div class='k'><strong>Links</strong><div>{link_count}</div></div><div class='k'><strong>Prompts</strong><div>{prompt_count}</div></div></div>",
        "<div class='grid'>",
    ]

    for cid, name, desc in cat_rows:
        lines.append(f"<section class='card'><h2>{name}</h2><div>{desc}</div><ul>")
        for sname, surl in conn.execute("SELECT name,url FROM sources WHERE category_id=? ORDER BY name", (cid,)).fetchall():
            lines.append(f"<li><a href='{surl}' target='_blank' rel='noopener'>{sname}</a></li>")
        lines.append("</ul></section>")

    lines.extend(["</div>", f"<p>Generated: {now_iso()}</p>", "</main></body></html>"])
    (ROOT / "index.html").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)

    cat_id_by_name = {n: upsert_category(conn, n, d) for n, d in CATEGORY_DEFS}
    conn.commit()

    source_ids = asyncio.run(crawl_all(conn, cat_id_by_name))
    asyncio.run(expand_internal_depth_1(conn, max_pages_per_source=8))
    ingest_public_prompt_repos(conn, source_ids)
    generate_html(conn)

    summary = {
        "generated_at": now_iso(),
        "sources": conn.execute("SELECT COUNT(*) FROM sources").fetchone()[0],
        "links": conn.execute("SELECT COUNT(*) FROM source_links").fetchone()[0],
        "prompts": conn.execute("SELECT COUNT(*) FROM prompts").fetchone()[0],
        "db": str(DB_PATH),
        "html": str(ROOT / "index.html"),
    }

    import json
    (ROOT / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    conn.close()


if __name__ == "__main__":
    main()

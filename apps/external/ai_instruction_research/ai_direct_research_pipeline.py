#!/usr/bin/env python3
import csv
import glob
import os
import re
import sqlite3
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
TMP_DIR = ROOT / "tmp_prompt_repos"
DB_PATH = ROOT / "instruction_research.sqlite"

# prompts.csv can contain very large fields
csv.field_size_limit(10_000_000)

HEADERS = {"User-Agent": "AI-Instruction-Research/1.0 (Academic)"}

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
    # Commercial
    ("Commercial Marketplaces", "PromptBase", "https://promptbase.com"),
    ("Commercial Marketplaces", "PromptHero", "https://prompthero.com"),
    ("Commercial Marketplaces", "FlowGPT", "https://flowgpt.com"),
    ("Commercial Marketplaces", "AIPRM", "https://www.aiprm.com"),
    ("Commercial Marketplaces", "God of Prompt", "https://www.godofprompt.ai"),
    ("Commercial Marketplaces", "TopFreePrompts", "https://topfreeprompts.com"),
    ("Commercial Marketplaces", "Promptrr", "https://promptrr.io"),
    ("Commercial Marketplaces", "PromptSea", "https://www.promptsea.io"),
    ("Commercial Marketplaces", "Writesonic Chatsonic", "https://writesonic.com/chatsonic"),

    # Enterprise
    ("Enterprise Prompt Management", "Maxim AI", "https://www.getmaxim.ai"),
    ("Enterprise Prompt Management", "Bifrost by Maxim", "https://getmax.im/bifrost"),
    ("Enterprise Prompt Management", "LangSmith", "https://www.langchain.com/langsmith"),
    ("Enterprise Prompt Management", "Arize", "https://arize.com"),
    ("Enterprise Prompt Management", "Arize Phoenix", "https://phoenix.arize.com"),
    ("Enterprise Prompt Management", "PromptLayer", "https://www.promptlayer.com"),
    ("Enterprise Prompt Management", "Humanloop", "https://humanloop.com"),

    # Frameworks
    ("Framework Hubs and SDK Ecosystems", "LangChain Docs", "https://python.langchain.com/docs/introduction/"),
    ("Framework Hubs and SDK Ecosystems", "LangSmith Docs", "https://docs.smith.langchain.com"),

    # Community
    ("Forums and Community R&D", "Reddit PromptEngineering", "https://www.reddit.com/r/PromptEngineering/"),
    ("Forums and Community R&D", "Reddit ChatGPTPro", "https://www.reddit.com/r/ChatGPTPro/"),
    ("Forums and Community R&D", "Reddit ChatGPTPromptGenius", "https://www.reddit.com/r/ChatGPTPromptGenius/"),
    ("Forums and Community R&D", "Reddit VibeCoding", "https://www.reddit.com/r/VibeCoding/"),
    ("Forums and Community R&D", "OpenAI Discord Invite", "https://discord.com/invite/openai"),
    ("Forums and Community R&D", "Midjourney Discord Invite", "https://discord.com/invite/midjourney"),
    ("Forums and Community R&D", "Hugging Face Discord Invite", "https://discord.com/invite/hugging-face-879548962464493619"),
    ("Forums and Community R&D", "Mistral Discord Invite", "https://discord.com/invite/mistralai"),

    # Open Source
    ("Open-Source Prompt Repositories", "prompts.chat (formerly awesome-chatgpt-prompts)", "https://github.com/f/awesome-chatgpt-prompts"),
    ("Open-Source Prompt Repositories", "awesome-claude-prompts", "https://github.com/langgptai/awesome-claude-prompts"),
    ("Open-Source Prompt Repositories", "Prompt-Engineering-Guide", "https://github.com/dair-ai/Prompt-Engineering-Guide"),
    ("Open-Source Prompt Repositories", "system-prompts-and-models-of-ai-tools", "https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools"),

    # Visual
    ("Visual and Multimodal Prompting", "Civitai", "https://civitai.com"),
    ("Visual and Multimodal Prompting", "OpenArt", "https://openart.ai"),
    ("Visual and Multimodal Prompting", "Lexica", "https://lexica.art"),
    ("Visual and Multimodal Prompting", "SeaArt", "https://www.seaart.ai"),
    ("Visual and Multimodal Prompting", "Midjourney Docs", "https://docs.midjourney.com"),

    # Academic
    ("Academic Benchmarks and Datasets", "DeepResearch Bench", "https://deepresearch-bench.github.io/"),
    ("Academic Benchmarks and Datasets", "DeepResearch Bench II", "https://agentresearchlab.com/benchmarks/deepresearch-bench-ii/index.html"),
    ("Academic Benchmarks and Datasets", "IDRBench arXiv", "https://arxiv.org/abs/2601.06676"),
    ("Academic Benchmarks and Datasets", "GAIR DatasetResearch", "https://huggingface.co/datasets/GAIR/DatasetResearch"),
    ("Academic Benchmarks and Datasets", "Hugging Face Datasets", "https://huggingface.co/datasets"),

    # Vendor docs
    ("Vendor Official Documentation", "Anthropic Prompting Best Practices", "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering"),
    ("Vendor Official Documentation", "Anthropic Prompt Tutorial", "https://github.com/anthropics/prompt-eng-interactive-tutorial"),
    ("Vendor Official Documentation", "OpenAI Cookbook", "https://cookbook.openai.com"),
    ("Vendor Official Documentation", "OpenAI Prompt Engineering Guide", "https://platform.openai.com/docs/guides/prompt-engineering"),
    ("Vendor Official Documentation", "OpenAI Reasoning Best Practices", "https://developers.openai.com/api/docs/guides/reasoning-best-practices/"),
    ("Vendor Official Documentation", "Mistral Docs", "https://docs.mistral.ai"),

    # Vibe coding
    ("Vibe Coding and Orchestration", "Lovable", "https://lovable.dev"),
    ("Vibe Coding and Orchestration", "Bolt.new", "https://bolt.new"),
    ("Vibe Coding and Orchestration", "Wasp", "https://wasp-lang.dev"),
    ("Vibe Coding and Orchestration", "DSPy", "https://github.com/stanfordnlp/dspy"),

    # methodologies
    ("Methodologies and Architectures", "Prompt Engineering Guide - Techniques", "https://www.promptingguide.ai/techniques"),
    ("Methodologies and Architectures", "PromptingGuide Meta Prompting", "https://www.promptingguide.ai/techniques/meta-prompting"),
]

PROMPT_REGEXES = [
    re.compile(r"\bI want you to act as\b", re.I),
    re.compile(r"\bYou are\b"),
    re.compile(r"\bSystem Prompt\b", re.I),
    re.compile(r"\b/imagine\b", re.I),
    re.compile(r"\bPrompt\b", re.I),
]


@dataclass
class SourceMeta:
    title: str
    brief: str


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
            source_type TEXT NOT NULL DEFAULT 'web',
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


def fetch_meta(url: str) -> SourceMeta:
    try:
        r = requests.get(url, timeout=8, headers=HEADERS)
        ctype = r.headers.get("content-type", "")
        if "text" not in ctype and "html" not in ctype:
            return SourceMeta(title=url, brief="Non-text response")
        html = r.text
        soup = BeautifulSoup(html, "html.parser")
        title = soup.title.get_text(strip=True)[:500] if soup.title else url
        meta_desc = soup.find("meta", attrs={"name": "description"})
        brief = ""
        if meta_desc and meta_desc.get("content"):
            brief = meta_desc.get("content").strip()
        if not brief:
            p = soup.find("p")
            brief = p.get_text(" ", strip=True) if p else ""
        if not brief:
            brief = "No description found"
        return SourceMeta(title=title, brief=brief[:2000])
    except Exception as e:
        return SourceMeta(title=url, brief=f"Fetch failed: {e}")


def upsert_category(conn: sqlite3.Connection, name: str, description: str) -> int:
    conn.execute(
        "INSERT INTO categories(name, description) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET description=excluded.description",
        (name, description),
    )
    return conn.execute("SELECT id FROM categories WHERE name=?", (name,)).fetchone()[0]


def upsert_source(conn: sqlite3.Connection, category_id: int, name: str, url: str, title: str, brief: str, source_type: str = "web") -> int:
    now = now_iso()
    conn.execute(
        """
        INSERT INTO sources(category_id, name, url, title, brief, source_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(name, url) DO UPDATE SET
          category_id=excluded.category_id,
          title=excluded.title,
          brief=excluded.brief,
          updated_at=excluded.updated_at
        """,
        (category_id, name, url, title, brief, source_type, now, now),
    )
    return conn.execute("SELECT id FROM sources WHERE name=? AND url=?", (name, url)).fetchone()[0]


def store_outbound_links(conn: sqlite3.Connection, source_id: int, url: str) -> None:
    lower = url.lower()
    if any(x in lower for x in ["reddit.com", "discord.com", "arxiv.org"]):
        return
    try:
        r = requests.get(url, timeout=8, headers=HEADERS)
        soup = BeautifulSoup(r.text, "html.parser")
        count = 0
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if href.startswith("/"):
                continue
            if not href.startswith("http"):
                continue
            anchor = a.get_text(" ", strip=True)[:400]
            conn.execute(
                "INSERT OR IGNORE INTO source_links(source_id, link_url, anchor) VALUES (?, ?, ?)",
                (source_id, href[:2000], anchor),
            )
            count += 1
            if count >= 80:
                break
    except Exception:
        pass


def looks_like_prompt(text: str) -> bool:
    t = text.strip()
    if len(t) < 60 or len(t) > 50000:
        return False
    hits = sum(bool(p.search(t)) for p in PROMPT_REGEXES)
    return hits >= 1


def save_prompt(conn: sqlite3.Connection, source_id: int, title: str, prompt_text: str, url: Optional[str] = None, license_name: Optional[str] = None, tags: Optional[str] = None) -> None:
    conn.execute(
        """
        INSERT OR IGNORE INTO prompts(source_id, title, prompt_text, url, license, tags, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (source_id, title[:500] if title else None, prompt_text.strip(), url, license_name, tags, now_iso()),
    )


def extract_prompts_from_prompts_csv(conn: sqlite3.Connection, source_id: int) -> int:
    url = "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv"
    r = requests.get(url, timeout=30, headers=HEADERS)
    r.raise_for_status()
    rows = list(csv.DictReader(r.text.splitlines()))
    n = 0
    for row in rows:
        prompt = (row.get("prompt") or "").strip()
        if not prompt:
            continue
        save_prompt(
            conn,
            source_id,
            title=row.get("act") or "Prompt",
            prompt_text=prompt,
            url="https://github.com/f/awesome-chatgpt-prompts",
            license_name="CC0-1.0 (repo declared)",
            tags=f"type={row.get('type','')}|for_devs={row.get('for_devs','')}",
        )
        n += 1
    return n


def extract_markdown_code_blocks(md_text: str) -> List[str]:
    blocks = re.findall(r"```(?:[a-zA-Z0-9_+-]*)\n(.*?)```", md_text, flags=re.S)
    return [b.strip() for b in blocks if b.strip()]


def extract_prompts_from_awesome_claude(conn: sqlite3.Connection, source_id: int) -> int:
    readme_url = "https://raw.githubusercontent.com/langgptai/awesome-claude-prompts/main/README.md"
    r = requests.get(readme_url, timeout=30, headers=HEADERS)
    r.raise_for_status()
    md = r.text

    n = 0
    for b in extract_markdown_code_blocks(md):
        if looks_like_prompt(b):
            save_prompt(conn, source_id, "awesome-claude code block", b, url="https://github.com/langgptai/awesome-claude-prompts", license_name="MIT (repo declared)")
            n += 1

    # Try also markdown sections that begin with headings and contain role instructions.
    for part in re.split(r"\n## ", md):
        text = part.strip()
        if looks_like_prompt(text):
            title_line = text.splitlines()[0][:200]
            save_prompt(conn, source_id, title_line, text[:12000], url="https://github.com/langgptai/awesome-claude-prompts", license_name="MIT (repo declared)")
            n += 1
    return n


def ensure_repo(path: Path, git_url: str) -> None:
    if path.exists():
        return
    subprocess.run(["git", "clone", "--depth", "1", git_url, str(path)], check=True)


def extract_prompts_from_system_prompts_repo(conn: sqlite3.Connection, source_id: int, repo_dir: Path) -> int:
    n = 0
    for fp in repo_dir.rglob("*.txt"):
        if fp.stat().st_size > 350_000:
            continue
        text = fp.read_text(encoding="utf-8", errors="ignore").strip()
        if looks_like_prompt(text):
            save_prompt(conn, source_id, fp.stem, text, url="https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools", license_name="See upstream repository", tags=str(fp.relative_to(repo_dir)))
            n += 1

    for fp in repo_dir.rglob("*.md"):
        if fp.stat().st_size > 350_000:
            continue
        text = fp.read_text(encoding="utf-8", errors="ignore")
        for block in extract_markdown_code_blocks(text):
            if looks_like_prompt(block):
                save_prompt(conn, source_id, f"{fp.stem} code block", block, url="https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools", license_name="See upstream repository", tags=str(fp.relative_to(repo_dir)))
                n += 1
    return n


def extract_prompts_from_prompt_engineering_guide(conn: sqlite3.Connection, source_id: int, repo_dir: Path) -> int:
    n = 0
    for fp in glob.glob(str(repo_dir / "guides" / "prompts-*.md")):
        p = Path(fp)
        text = p.read_text(encoding="utf-8", errors="ignore")
        for block in extract_markdown_code_blocks(text):
            if looks_like_prompt(block):
                save_prompt(conn, source_id, p.stem, block, url="https://github.com/dair-ai/Prompt-Engineering-Guide", license_name="See upstream repository", tags="guide")
                n += 1
    return n


def generate_html(conn: sqlite3.Connection, out_file: Path) -> None:
    cat_rows = conn.execute("SELECT id, name, description FROM categories ORDER BY name").fetchall()
    counts = conn.execute("SELECT COUNT(*), (SELECT COUNT(*) FROM prompts), (SELECT COUNT(*) FROM source_links) FROM sources").fetchone()

    html_parts = []
    html_parts.append("""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>AI Instruction Engineering Repository Map</title>
  <style>
    :root { --bg:#f7f7f5; --card:#ffffff; --ink:#111; --muted:#555; --line:#ddd; --accent:#0a5; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif; background:var(--bg); color:var(--ink); }
    main { max-width: 1100px; margin: 0 auto; padding: 28px 18px 48px; }
    h1 { margin:0 0 6px; font-size: 30px; }
    .sub { color:var(--muted); margin-bottom: 20px; }
    .kpis { display:flex; gap:12px; flex-wrap: wrap; margin-bottom: 20px; }
    .kpi { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:12px 14px; min-width:170px; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
    .card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px; }
    .card h2 { margin:0 0 5px; font-size:18px; }
    .muted { color:var(--muted); font-size:13px; }
    ul { padding-left: 18px; margin: 8px 0 0; }
    a { color:#0645ad; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .foot { margin-top: 22px; font-size: 12px; color:var(--muted); }
  </style>
</head>
<body>
  <main>
    <h1>Archetypal Repositories and Orchestration Architectures</h1>
    <div class=\"sub\">Category-complete map + live source index + prompt corpus references (SQLite-backed).</div>
""")
    html_parts.append(
        f"<div class='kpis'><div class='kpi'><strong>Sources</strong><div>{counts[0]}</div></div>"
        f"<div class='kpi'><strong>Prompt Records</strong><div>{counts[1]}</div></div>"
        f"<div class='kpi'><strong>Outbound Links</strong><div>{counts[2]}</div></div></div>"
    )

    html_parts.append("<div class='grid'>")
    for cat_id, cat_name, cat_desc in cat_rows:
        html_parts.append(f"<section class='card'><h2>{cat_name}</h2><div class='muted'>{cat_desc}</div><ul>")
        srcs = conn.execute(
            "SELECT name, url FROM sources WHERE category_id=? ORDER BY name", (cat_id,)
        ).fetchall()
        for n, u in srcs[:22]:
            html_parts.append(f"<li><a href='{u}' target='_blank' rel='noopener'>{n}</a></li>")
        if len(srcs) > 22:
            html_parts.append(f"<li class='muted'>+ {len(srcs)-22} more in database</li>")
        html_parts.append("</ul></section>")
    html_parts.append("</div>")

    html_parts.append(f"<div class='foot'>Generated {now_iso()} | Database: instruction_research.sqlite</div>")
    html_parts.append("</main></body></html>")

    out_file.write_text("\n".join(html_parts), encoding="utf-8")


def main() -> None:
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    init_db(conn)

    cat_id_by_name = {}
    for name, desc in CATEGORY_DEFS:
        cat_id_by_name[name] = upsert_category(conn, name, desc)

    source_id_map = {}
    for category_name, source_name, source_url in SEED_SOURCES:
        meta = fetch_meta(source_url)
        source_id = upsert_source(
            conn,
            category_id=cat_id_by_name[category_name],
            name=source_name,
            url=source_url,
            title=meta.title,
            brief=meta.brief,
        )
        source_id_map[source_name] = source_id
        store_outbound_links(conn, source_id, source_url)
        conn.commit()

    # AI-direct high-yield prompt extraction from public repositories.
    prompts_count = 0

    prompts_count += extract_prompts_from_prompts_csv(conn, source_id_map["prompts.chat (formerly awesome-chatgpt-prompts)"])

    prompts_count += extract_prompts_from_awesome_claude(conn, source_id_map["awesome-claude-prompts"])

    peg_repo = TMP_DIR / "Prompt-Engineering-Guide"
    claude_repo = TMP_DIR / "awesome-claude-prompts"
    system_repo = TMP_DIR / "system-prompts-and-models-of-ai-tools"

    ensure_repo(peg_repo, "https://github.com/dair-ai/Prompt-Engineering-Guide.git")
    ensure_repo(claude_repo, "https://github.com/langgptai/awesome-claude-prompts.git")
    ensure_repo(system_repo, "https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools.git")

    prompts_count += extract_prompts_from_prompt_engineering_guide(conn, source_id_map["Prompt-Engineering-Guide"], peg_repo)
    prompts_count += extract_prompts_from_system_prompts_repo(conn, source_id_map["system-prompts-and-models-of-ai-tools"], system_repo)

    conn.commit()
    generate_html(conn, ROOT / "index.html")

    # summary
    src_count = conn.execute("SELECT COUNT(*) FROM sources").fetchone()[0]
    link_count = conn.execute("SELECT COUNT(*) FROM source_links").fetchone()[0]
    prompt_count = conn.execute("SELECT COUNT(*) FROM prompts").fetchone()[0]

    summary = {
        "generated_at": now_iso(),
        "sources": src_count,
        "links": link_count,
        "prompts": prompt_count,
        "prompts_inserted_this_run_estimate": prompts_count,
        "db": str(DB_PATH),
        "html": str(ROOT / "index.html"),
    }
    (ROOT / "summary.json").write_text(__import__("json").dumps(summary, indent=2), encoding="utf-8")

    conn.close()


if __name__ == "__main__":
    main()

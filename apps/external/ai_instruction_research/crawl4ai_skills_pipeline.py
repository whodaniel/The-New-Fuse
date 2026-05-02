#!/usr/bin/env python3
import asyncio
import hashlib
import io
import json
import re
import sqlite3
import subprocess
import tarfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse

from crawl4ai import AsyncWebCrawler

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "instruction_research.sqlite"
TMP_REPOS = ROOT / "tmp_skill_repos"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


CATEGORY_DEFS = [
    ("Framework Orchestration", "Frameworks and SDKs for agent skill orchestration"),
    ("MCP Protocol and Servers", "Model Context Protocol docs, servers, and registries"),
    ("Skill Repositories", "Open-source repositories containing skill files and manifests"),
    ("Marketplaces and Directories", "Centralized/decentralized skill marketplaces and indexes"),
    ("Community and Forum Sources", "Reddit and community discussions on skills"),
    ("Evaluation and Benchmarks", "SkillsBench and related evaluation artifacts"),
    ("Security and Governance", "Skill supply-chain and risk analysis"),
    ("Embodied and Experimental", "Voyager-style and research-oriented skill systems"),
]


SEED_SOURCES = [
    ("Evaluation and Benchmarks", "SkillsBench arXiv", "https://arxiv.org/abs/2509.24082"),
    (
        "MCP Protocol and Servers",
        "Model Context Protocol Docs",
        "https://modelcontextprotocol.io/docs/learn/server-concepts",
    ),
    (
        "MCP Protocol and Servers",
        "MCP Servers (Official)",
        "https://github.com/modelcontextprotocol/servers",
    ),
    (
        "MCP Protocol and Servers",
        "Awesome MCP Servers",
        "https://github.com/punkpeye/awesome-mcp-servers",
    ),
    ("Skill Repositories", "Awesome Agent Skills", "https://github.com/skillmatic-ai/awesome-agent-skills"),
    ("Skill Repositories", "Awesome Claude Skills", "https://github.com/travisvn/awesome-claude-skills"),
    ("Skill Repositories", "VoltAgent Awesome Agent Skills", "https://github.com/VoltAgent/awesome-agent-skills"),
    ("Skill Repositories", "VoltAgent Awesome OpenClaw Skills", "https://github.com/VoltAgent/awesome-openclaw-skills"),
    ("Skill Repositories", "AISkillStore Marketplace", "https://github.com/aiskillstore/marketplace"),
    ("Framework Orchestration", "Agentica", "https://github.com/wrtnlabs/agentica"),
    ("Framework Orchestration", "NAIL", "https://github.com/watari-ai/nail"),
    ("Evaluation and Benchmarks", "SkillsBench Repo", "https://github.com/benchflow-ai/skillsbench"),
    ("Embodied and Experimental", "Voyager", "https://github.com/MineDojo/Voyager"),
    ("Embodied and Experimental", "Co-voyager", "https://github.com/Itakello/Co-voyager"),
    ("Marketplaces and Directories", "Skills.sh", "https://www.skills.sh"),
    ("Marketplaces and Directories", "Skillstore", "https://skill.store"),
    ("Marketplaces and Directories", "MCP Server Finder", "https://mcpserverfinder.com"),
    ("Marketplaces and Directories", "MCP Servers Directory", "https://mcpservers.org"),
    ("Security and Governance", "MCP Security Hub", "https://mcp.backslash.security"),
    (
        "Security and Governance",
        "AI Agent Skills Supply Chain Risk",
        "https://prplbx.com/ai-agent-skills-the-hidden-supply-chain-risk-in-2026/",
    ),
    (
        "Community and Forum Sources",
        "Reddit - Stop keeping Agent Skills in local files",
        "https://www.reddit.com/r/LocalLLaMA/comments/1m4bajz/stop_keeping_your_agent_skills_in_local_files_if/",
    ),
    (
        "Community and Forum Sources",
        "Reddit - Architecture is just list and while loop",
        "https://www.reddit.com/r/LocalLLaMA/comments/1ky8rxv/the_entire_ai_agent_architecture_is_just_a_list/",
    ),
]


GITHUB_REPO_RE = re.compile(r"https?://github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)")
SKILL_FILE_RE = re.compile(
    r"(?:^|/)(SKILL\.md|skill\.md|skills?\.ya?ml|skills?\.json|agent[-_ ]?skills?\.md|skill[-_ ]?manifest\.ya?ml)$",
    re.I,
)
SKILL_CONTENT_HINT_RE = re.compile(
    r"(model context protocol|mcp server|skill(?:s)?\s*:|use when|trigger rules|tools?:|workflow|capabilit(?:y|ies))",
    re.I,
)
MAX_REPOS = 100


REPO_ALLOWLIST = {
    "modelcontextprotocol/servers",
    "punkpeye/awesome-mcp-servers",
    "skillmatic-ai/awesome-agent-skills",
    "travisvn/awesome-claude-skills",
    "voltagent/awesome-agent-skills",
    "voltagent/awesome-openclaw-skills",
    "aiskillstore/marketplace",
    "wrtnlabs/agentica",
    "watari-ai/nail",
    "benchflow-ai/skillsbench",
    "minedojo/voyager",
    "itakello/co-voyager",
}


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        PRAGMA journal_mode=WAL;

        CREATE TABLE IF NOT EXISTS skill_categories (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS skill_sources (
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
            FOREIGN KEY(category_id) REFERENCES skill_categories(id)
        );

        CREATE TABLE IF NOT EXISTS skill_links (
            id INTEGER PRIMARY KEY,
            source_id INTEGER NOT NULL,
            link_url TEXT NOT NULL,
            anchor TEXT,
            UNIQUE(source_id, link_url),
            FOREIGN KEY(source_id) REFERENCES skill_sources(id)
        );

        CREATE TABLE IF NOT EXISTS skill_files (
            id INTEGER PRIMARY KEY,
            source_id INTEGER NOT NULL,
            repo_url TEXT,
            file_url TEXT NOT NULL,
            file_path TEXT,
            title TEXT,
            content TEXT NOT NULL,
            content_sha256 TEXT NOT NULL,
            license TEXT,
            tags TEXT,
            created_at TEXT NOT NULL,
            UNIQUE(file_url, content_sha256),
            FOREIGN KEY(source_id) REFERENCES skill_sources(id)
        );
        """
    )


def upsert_category(conn: sqlite3.Connection, name: str, description: str) -> int:
    conn.execute(
        "INSERT INTO skill_categories(name, description) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET description=excluded.description",
        (name, description),
    )
    return conn.execute("SELECT id FROM skill_categories WHERE name=?", (name,)).fetchone()[0]


def upsert_source(
    conn: sqlite3.Connection,
    category_id: int,
    name: str,
    url: str,
    title: str,
    brief: str,
    source_type: str = "crawl4ai",
) -> int:
    now = now_iso()
    conn.execute(
        """
        INSERT INTO skill_sources(category_id, name, url, title, brief, source_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(name, url) DO UPDATE SET
            category_id=excluded.category_id,
            title=excluded.title,
            brief=excluded.brief,
            source_type=excluded.source_type,
            updated_at=excluded.updated_at
        """,
        (category_id, name, url, title[:500], brief[:2000], source_type, now, now),
    )
    row = conn.execute("SELECT id FROM skill_sources WHERE name=? AND url=?", (name, url)).fetchone()
    return int(row[0])


def add_link(conn: sqlite3.Connection, source_id: int, link_url: str, anchor: str = "") -> None:
    conn.execute(
        "INSERT OR IGNORE INTO skill_links(source_id, link_url, anchor) VALUES (?, ?, ?)",
        (source_id, link_url[:2000], (anchor or "")[:500]),
    )


def save_skill_file(
    conn: sqlite3.Connection,
    source_id: int,
    repo_url: str,
    file_url: str,
    file_path: str,
    title: str,
    content: str,
    license_name: str = "",
    tags: str = "",
) -> None:
    payload = content.strip()
    if not payload:
        return
    sha = hashlib.sha256(payload.encode("utf-8", errors="ignore")).hexdigest()
    conn.execute(
        """
        INSERT OR IGNORE INTO skill_files(
            source_id, repo_url, file_url, file_path, title, content, content_sha256, license, tags, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            source_id,
            repo_url[:1000],
            file_url[:2000],
            file_path[:1000],
            title[:500],
            payload,
            sha,
            (license_name or "")[:200],
            (tags or "")[:500],
            now_iso(),
        ),
    )


def normalize_repo(url: str) -> Optional[str]:
    m = GITHUB_REPO_RE.match(url)
    if not m:
        return None
    owner, repo = m.group(1), m.group(2)
    repo = repo.removesuffix(".git")
    return f"https://github.com/{owner}/{repo}"


def repo_is_relevant(repo_url: str) -> bool:
    parsed = urlparse(repo_url)
    path = parsed.path.strip("/").lower()
    if path in REPO_ALLOWLIST:
        return True
    keywords = ("skill", "skills", "mcp", "openclaw", "agentica", "voyager", "nail", "autogen")
    return any(k in path for k in keywords)


def repo_priority(repo_url: str) -> Tuple[int, str]:
    path = urlparse(repo_url).path.strip("/").lower()
    score = 0
    if path in REPO_ALLOWLIST:
        score += 100
    if "skills" in path:
        score += 35
    if "skill" in path:
        score += 20
    if "awesome" in path:
        score += 10
    if "mcp" in path:
        score += 6
    if "agent" in path:
        score += 4
    return (-score, path)


def repo_dir(repo_url: str) -> Path:
    m = GITHUB_REPO_RE.match(repo_url)
    if not m:
        raise ValueError(f"not a github repo url: {repo_url}")
    owner, repo = m.group(1), m.group(2).removesuffix(".git")
    return TMP_REPOS / f"{owner}__{repo}"


def run_cmd(cmd: List[str], cwd: Optional[Path] = None, timeout: int = 45) -> Tuple[int, str]:
    proc = subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=timeout,
    )
    return proc.returncode, proc.stdout


def run_cmd_bytes(cmd: List[str], cwd: Optional[Path] = None, timeout: int = 45) -> Tuple[int, bytes]:
    proc = subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=timeout,
    )
    return proc.returncode, proc.stdout


def looks_like_skill_file(path: Path, content: str) -> bool:
    p = str(path).replace("\\", "/")
    if SKILL_FILE_RE.search(p):
        return True
    if "SKILL.md" in p:
        return True
    return bool(SKILL_CONTENT_HINT_RE.search(content))


def looks_like_skill_path(path: str, content: str) -> bool:
    p = path.replace("\\", "/")
    low = p.lower()
    if low.endswith(("agents.md", "claude.md", "codex.md")):
        return True
    if "/.claude/skills/" in low or "/.codex/skills/" in low:
        return True
    if "/skills/" in low and low.endswith((".md", ".txt", ".yaml", ".yml", ".json")):
        return True
    if SKILL_FILE_RE.search(p):
        return True
    if "SKILL.md" in p:
        return True
    return bool(SKILL_CONTENT_HINT_RE.search(content))


def extract_repo_skill_files(
    conn: sqlite3.Connection,
    source_id: int,
    repo_url: str,
    repo_path: Path,
    max_files: int = 300,
) -> int:
    code, out = run_cmd(["rg", "--files", str(repo_path)])
    if code != 0:
        return 0

    files: List[Path] = []
    for line in out.splitlines():
        fp = Path(line.strip())
        lname = fp.name.lower()
        if lname in {"skill.md", "skills.md", "skill.yaml", "skill.yml", "skill.json"}:
            files.append(fp)
            continue
        if "skill" in lname and fp.suffix.lower() in {".md", ".txt", ".yaml", ".yml", ".json"}:
            files.append(fp)
            continue
        if "skills" in str(fp).lower() and fp.suffix.lower() in {".md", ".yaml", ".yml", ".json"}:
            files.append(fp)

    seen = set()
    selected: List[Path] = []
    for fp in files:
        if fp in seen:
            continue
        seen.add(fp)
        selected.append(fp)
    selected = selected[:max_files]

    inserted = 0
    for fp in selected:
        try:
            text = fp.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if len(text) < 60:
            continue
        if not looks_like_skill_file(fp, text):
            continue

        rel = str(fp.relative_to(repo_path)).replace("\\", "/")
        file_url = f"{repo_url}/blob/main/{rel}"
        save_skill_file(
            conn=conn,
            source_id=source_id,
            repo_url=repo_url,
            file_url=file_url,
            file_path=rel,
            title=fp.name,
            content=text[:120_000],
            license_name="See upstream repository",
            tags="repo_skill_file",
        )
        inserted += 1
    return inserted


def extract_repo_skill_files_from_archive(
    conn: sqlite3.Connection,
    source_id: int,
    repo_url: str,
    max_files: int = 220,
    timeout: int = 12,
) -> int:
    m = GITHUB_REPO_RE.match(repo_url)
    if not m:
        return 0
    owner, repo = m.group(1), m.group(2).removesuffix(".git")
    branches = ("main", "master")

    for branch in branches:
        archive_url = f"https://codeload.github.com/{owner}/{repo}/tar.gz/refs/heads/{branch}"
        try:
            code, payload = run_cmd_bytes(
                [
                    "curl",
                    "-LfsS",
                    "--max-time",
                    str(timeout),
                    "-H",
                    "User-Agent: crawl4ai-skills-pipeline/1.0",
                    archive_url,
                ],
                timeout=timeout + 3,
            )
            if code != 0 or not payload:
                continue
        except Exception:
            continue

        try:
            tf = tarfile.open(fileobj=io.BytesIO(payload), mode="r:gz")
        except Exception:
            continue

        inserted = 0
        with tf:
            for member in tf.getmembers():
                if inserted >= max_files:
                    break
                if not member.isfile():
                    continue
                if member.size <= 60 or member.size > 350_000:
                    continue
                low = member.name.lower()
                if not (
                    "skill" in low
                    or "agents.md" in low
                    or "claude.md" in low
                    or "codex.md" in low
                    or "/.claude/" in low
                    or "/.codex/" in low
                    or "/mcp/" in low
                    or low.endswith((".md", ".txt", ".json", ".yaml", ".yml"))
                ):
                    continue
                if not (
                    SKILL_FILE_RE.search(low)
                    or "skill" in low
                    or "agents.md" in low
                    or "claude.md" in low
                    or "codex.md" in low
                    or "/.claude/skills/" in low
                    or "/.codex/skills/" in low
                ):
                    continue

                try:
                    ex = tf.extractfile(member)
                    if ex is None:
                        continue
                    text = ex.read().decode("utf-8", errors="ignore")
                except Exception:
                    continue
                if len(text) < 60:
                    continue
                if not looks_like_skill_path(member.name, text):
                    continue

                rel = member.name.split("/", 1)[1] if "/" in member.name else member.name
                file_url = f"{repo_url}/blob/{branch}/{rel}"
                save_skill_file(
                    conn=conn,
                    source_id=source_id,
                    repo_url=repo_url,
                    file_url=file_url,
                    file_path=rel,
                    title=Path(rel).name,
                    content=text[:120_000],
                    license_name="See upstream repository",
                    tags="repo_skill_file_archive",
                )
                inserted += 1
        return inserted
    return 0


async def crawl_seeds(conn: sqlite3.Connection, cat_ids: Dict[str, int]) -> Set[str]:
    repo_candidates: Set[str] = set()

    async with AsyncWebCrawler(verbose=False) as crawler:
        for category_name, source_name, source_url in SEED_SOURCES:
            title = source_url
            brief = "crawl failed"
            source_id = None
            markdown = ""
            try:
                result = await crawler.arun(url=source_url)
                if result.success:
                    markdown = result.markdown or ""
                    meta = result.metadata or {}
                    title = meta.get("title") or result.url or source_url
                    brief = meta.get("description") or markdown[:400].replace("\n", " ") or "No description"
                else:
                    brief = result.error_message or "crawl failed"
            except Exception as exc:
                brief = f"crawl exception: {exc}"
                result = None

            source_id = upsert_source(
                conn,
                cat_ids[category_name],
                source_name,
                source_url,
                title,
                brief,
                source_type="crawl4ai",
            )

            direct_repo = normalize_repo(source_url)
            if direct_repo and repo_is_relevant(direct_repo):
                repo_candidates.add(direct_repo)

            if result and result.success:
                links = result.links or {}
                all_links = (links.get("internal") or []) + (links.get("external") or [])
                for ln in all_links[:250]:
                    href = ln.get("href") if isinstance(ln, dict) else ""
                    if not href:
                        continue
                    abs_href = urljoin(source_url, href)
                    anchor = ln.get("text", "") if isinstance(ln, dict) else ""
                    add_link(conn, source_id, abs_href, anchor)
                    repo_url = normalize_repo(abs_href)
                    if repo_url and repo_is_relevant(repo_url):
                        repo_candidates.add(repo_url)

                # Store inline "skill-like" code blocks from non-repo sources
                code_blocks = re.findall(r"```(?:[\w+-]*)\n(.*?)```", markdown, flags=re.S)
                idx = 0
                for block in code_blocks:
                    txt = block.strip()
                    if len(txt) < 100:
                        continue
                    if not SKILL_CONTENT_HINT_RE.search(txt):
                        continue
                    idx += 1
                    save_skill_file(
                        conn=conn,
                        source_id=source_id,
                        repo_url=source_url,
                        file_url=f"{source_url}#inline-skill-block-{idx}",
                        file_path=f"inline/skill_block_{idx}.md",
                        title=f"Inline skill block {idx}",
                        content=txt[:120_000],
                        tags="inline_markdown_skill_block",
                    )

            conn.commit()
    return repo_candidates


def build_html(conn: sqlite3.Connection, out_file: Path) -> None:
    counts = {
        "categories": conn.execute("SELECT COUNT(*) FROM skill_categories").fetchone()[0],
        "sources": conn.execute("SELECT COUNT(*) FROM skill_sources").fetchone()[0],
        "links": conn.execute("SELECT COUNT(*) FROM skill_links").fetchone()[0],
        "files": conn.execute("SELECT COUNT(*) FROM skill_files").fetchone()[0],
    }

    rows = conn.execute(
        """
        SELECT c.name, s.name, s.url, COALESCE(s.brief, '')
        FROM skill_sources s
        JOIN skill_categories c ON c.id = s.category_id
        ORDER BY c.name, s.name
        """
    ).fetchall()

    by_cat: Dict[str, List[Tuple[str, str, str]]] = {}
    for c, s_name, s_url, brief in rows:
        by_cat.setdefault(c, []).append((s_name, s_url, brief))

    top_sources = conn.execute(
        """
        SELECT s.name, s.url, COUNT(f.id) AS n
        FROM skill_sources s
        LEFT JOIN skill_files f ON f.source_id = s.id
        GROUP BY s.id
        ORDER BY n DESC, s.name
        LIMIT 30
        """
    ).fetchall()

    parts = [
        "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>",
        "<title>AI Agent Skills Landscape - Crawl4AI Corpus</title>",
        "<style>body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;padding:24px;line-height:1.45;color:#0f172a;background:#f8fafc}h1,h2,h3{margin:.4em 0}a{color:#0f766e;text-decoration:none}a:hover{text-decoration:underline}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px}.muted{color:#475569;font-size:14px}ul{padding-left:18px}.row{display:flex;gap:8px;flex-wrap:wrap}.pill{display:inline-block;padding:2px 8px;border-radius:999px;background:#e2e8f0;font-size:12px}</style>",
        "</head><body>",
        "<h1>The Global Landscape of AI Agent Skills</h1>",
        "<p class='muted'>Generated with Crawl4AI + repository skill-file extraction. This dataset is attribution-first and intended for research.</p>",
        "<div class='grid'>",
        f"<div class='card'><h3>{counts['categories']}</h3><div class='muted'>categories</div></div>",
        f"<div class='card'><h3>{counts['sources']}</h3><div class='muted'>sources</div></div>",
        f"<div class='card'><h3>{counts['links']}</h3><div class='muted'>discovered links</div></div>",
        f"<div class='card'><h3>{counts['files']}</h3><div class='muted'>skill files</div></div>",
        "</div>",
        "<h2>Categories and Sources</h2>",
    ]

    for cat in sorted(by_cat):
        parts.append(f"<h3>{cat}</h3><ul>")
        for name, url, brief in by_cat[cat]:
            parts.append(
                f"<li><a href='{url}' target='_blank' rel='noreferrer'>{name}</a>"
                f"<div class='muted'>{(brief or '').replace('<', '&lt;')[:260]}</div></li>"
            )
        parts.append("</ul>")

    parts.append("<h2>Top Sources by Skill Files</h2><ul>")
    for name, url, n in top_sources:
        parts.append(f"<li><span class='pill'>{n} files</span> <a href='{url}' target='_blank' rel='noreferrer'>{name}</a></li>")
    parts.append("</ul>")

    parts.append(f"<p class='muted'>Generated at {now_iso()} | Database: instruction_research.sqlite</p>")
    parts.append("</body></html>")

    out_file.write_text("".join(parts), encoding="utf-8")


def write_summary(conn: sqlite3.Connection, out_file: Path, repo_candidates: int, inserted_files: int) -> None:
    summary = {
        "generated_at": now_iso(),
        "counts": {
            "skill_categories": conn.execute("SELECT COUNT(*) FROM skill_categories").fetchone()[0],
            "skill_sources": conn.execute("SELECT COUNT(*) FROM skill_sources").fetchone()[0],
            "skill_links": conn.execute("SELECT COUNT(*) FROM skill_links").fetchone()[0],
            "skill_files": conn.execute("SELECT COUNT(*) FROM skill_files").fetchone()[0],
        },
        "run_stats": {
            "repo_candidates": repo_candidates,
            "skill_files_inserted_this_run_estimate": inserted_files,
        },
        "top_sources_by_skill_files": [
            {"name": n, "url": u, "skill_files": c}
            for (n, u, c) in conn.execute(
                """
                SELECT s.name, s.url, COUNT(f.id) AS n
                FROM skill_sources s
                LEFT JOIN skill_files f ON f.source_id = s.id
                GROUP BY s.id
                ORDER BY n DESC, s.name
                LIMIT 20
                """
            ).fetchall()
        ],
    }
    out_file.write_text(json.dumps(summary, indent=2), encoding="utf-8")


async def main() -> None:
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    conn.execute("DELETE FROM skill_files")
    conn.execute("DELETE FROM skill_links")
    conn.execute("DELETE FROM skill_sources")
    conn.execute("DELETE FROM skill_categories")
    conn.commit()

    cat_ids: Dict[str, int] = {}
    for name, desc in CATEGORY_DEFS:
        cat_ids[name] = upsert_category(conn, name, desc)
    conn.commit()

    repo_candidates = await crawl_seeds(conn, cat_ids)

    inserted_files = 0
    repo_category_id = cat_ids["Skill Repositories"]
    prioritized = sorted(repo_candidates, key=repo_priority)
    for idx, repo in enumerate(prioritized[:MAX_REPOS], start=1):
        # Ensure a skill source row exists for each discovered repo
        repo_name = repo.removeprefix("https://github.com/")
        src_id = upsert_source(
            conn,
            repo_category_id,
            repo_name,
            repo,
            repo_name,
            "Discovered GitHub repository candidate for skill-file extraction",
            source_type="github_repo",
        )
        inserted = extract_repo_skill_files_from_archive(conn, src_id, repo)
        inserted_files += inserted
        if idx % 10 == 0:
            print(f"[REPO] {idx}/{min(len(prioritized), MAX_REPOS)} processed, +{inserted} files ({repo})")
        conn.commit()

    build_html(conn, ROOT / "skills_index.html")
    write_summary(
        conn,
        ROOT / "skills_summary.json",
        repo_candidates=len(repo_candidates),
        inserted_files=inserted_files,
    )

    print(
        json.dumps(
            {
                "ok": True,
                "db": str(DB_PATH),
                "skills_index_html": str(ROOT / "skills_index.html"),
                "skills_summary_json": str(ROOT / "skills_summary.json"),
                "counts": {
                    "skill_categories": conn.execute("SELECT COUNT(*) FROM skill_categories").fetchone()[0],
                    "skill_sources": conn.execute("SELECT COUNT(*) FROM skill_sources").fetchone()[0],
                    "skill_links": conn.execute("SELECT COUNT(*) FROM skill_links").fetchone()[0],
                    "skill_files": conn.execute("SELECT COUNT(*) FROM skill_files").fetchone()[0],
                },
            },
            indent=2,
        )
    )
    conn.close()


if __name__ == "__main__":
    asyncio.run(main())

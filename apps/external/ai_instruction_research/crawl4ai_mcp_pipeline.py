#!/usr/bin/env python3
import asyncio
import io
import json
import re
import sqlite3
import subprocess
import tarfile
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse, urlunparse

from crawl4ai import AsyncWebCrawler

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "instruction_research.sqlite"
SUMMARY_PATH = ROOT / "mcp_summary.json"
HTML_PATH = ROOT / "mcp_index.html"

MAX_REPOS = 400
MAX_LINKS_PER_PAGE = 350
MAX_DEPTH_PER_SOURCE = 1
MAX_PAGES_PER_SOURCE = 3
SEED_LIMIT = 9999

CATEGORIES = [
    ("Protocol + Specs", "Core MCP protocol docs, architecture, registry, and extension specs"),
    ("SDKs + Frameworks", "Official SDKs and implementation framework references"),
    ("Registries + Discovery", "Official/community MCP registries and discovery layers"),
    ("DevOps + Enterprise", "Observability, infrastructure, and enterprise MCP integrations"),
    ("Databases + Data", "Database-centric MCP servers and data infra connectors"),
    ("Creative + Engineering", "3D, game dev, design, and engineering MCP implementations"),
    ("Security + Testing", "Inspector, scanner, validation, and governance tooling"),
    ("Community + Analysis", "Reddit, HN, blogs, and ecosystem meta-analysis"),
]

SEEDS = [
    ("Protocol + Specs", "MCP Architecture Overview", "https://modelcontextprotocol.io/docs/learn/architecture"),
    ("Protocol + Specs", "MCP Registry Docs", "https://modelcontextprotocol.io/docs/learn/registry"),
    ("Protocol + Specs", "MCP Extensions Overview", "https://modelcontextprotocol.io/docs/learn/extensions"),
    ("Protocol + Specs", "Official MCP Registry", "https://registry.modelcontextprotocol.io"),
    ("SDKs + Frameworks", "Official MCP TS SDK", "https://github.com/modelcontextprotocol/typescript-sdk"),
    ("SDKs + Frameworks", "Build MCP Server Docs", "https://modelcontextprotocol.io/docs/learn/build-server"),
    ("SDKs + Frameworks", "Go MCP SDK Blog", "https://devblogs.microsoft.com/blog/build-ai-tooling-in-go-with-the-mcp-sdk-connecting-ai-apps-to-databases/"),
    ("SDKs + Frameworks", "Stainless SDK Comparison", "https://stainless.com/mcp-sdk-comparison-python-vs-typescript-vs-go-implementations"),
    ("Registries + Discovery", "GitHub MCP Registry Announcement", "https://github.blog/news-insights/product-news/meet-the-github-mcp-registry-the-fastest-way-to-discover-mcp-servers/"),
    ("Registries + Discovery", "Smithery", "https://smithery.ai"),
    ("Registries + Discovery", "SkillsPlayground MCP List", "https://skillsplayground.com/model-context-protocol-mcp-server-list"),
    ("Registries + Discovery", "MCPServers.org", "https://mcpservers.org"),
    ("Registries + Discovery", "MCP Market", "https://mcpmarket.com"),
    ("Registries + Discovery", "Glama MCP Registry", "https://glama.ai/mcp/servers"),
    ("Registries + Discovery", "MCP.SO", "https://mcp.so"),
    ("Registries + Discovery", "Awesome MCP Servers", "https://github.com/punkpeye/awesome-mcp-servers"),
    ("Registries + Discovery", "Awesome MCP Servers (appcypher)", "https://github.com/appcypher/awesome-mcp-servers"),
    ("Registries + Discovery", "Official MCP Servers Repo", "https://github.com/modelcontextprotocol/servers"),
    ("DevOps + Enterprise", "Argo CD MCP", "https://github.com/argoproj-labs/argocd-mcp"),
    ("DevOps + Enterprise", "Grafana MCP", "https://github.com/grafana/mcp-grafana"),
    ("DevOps + Enterprise", "Sentry MCP", "https://github.com/getsentry/sentry-mcp"),
    ("DevOps + Enterprise", "Azure DevOps MCP", "https://learn.microsoft.com/azure/devops/mcp/enable-ai-assistance-with-azure-devops-mcp-server"),
    ("Databases + Data", "Neo4j MCP Integrations", "https://neo4j.com/developer/genai/model-context-protocol-mcp/"),
    ("Databases + Data", "Composio MCP", "https://mcp.composio.dev"),
    ("Databases + Data", "MindsDB MCP", "https://docs.mindsdb.com/integrations/ai/mcp"),
    ("Creative + Engineering", "Unity MCP Reddit Thread", "https://www.reddit.com/r/mcp/comments/1l6zqtm/i_built_an_mcp_server_with_147_tools_that/"),
    ("Creative + Engineering", "Manim MCP Thread", "https://www.reddit.com/r/LangChain/comments/1l2h0r3/just_tried_combining_manim_with_mcp_model_context/"),
    ("Security + Testing", "MCP Inspector", "https://github.com/modelcontextprotocol/inspector"),
    ("Security + Testing", "Testomat MCP Testing Tools", "https://testomat.io/blog/best-mcp-server-testing-tools/"),
    ("Security + Testing", "MCP Security Hub", "https://mcp.backslash.security"),
    ("Security + Testing", "Cisco MCP Scanner", "https://github.com/CiscoCXSecurity/mcp-scan"),
    ("Community + Analysis", "MCP Intro Guide", "https://michaelwapp.medium.com/model-context-protocol-mcp-an-introduction-guide-6f7cf9b4e79f"),
    ("Community + Analysis", "HN: MCP Universal Plugin System", "https://news.ycombinator.com/item?id=42129773"),
    ("Community + Analysis", "Reddit: MCP vs Tool Calling", "https://www.reddit.com/r/mcp/comments/1kj5n8h/i_am_still_confused_on_the_difference_between/"),
    ("Community + Analysis", "Reddit: Current state of MCP", "https://www.reddit.com/r/ClaudeAI/comments/1ls2rb7/current_state_of_mcp/"),
    ("Community + Analysis", "HN: MCP context reduction 98%", "https://news.ycombinator.com/item?id=44440841"),
    ("Community + Analysis", "arXiv: MCP Tool Descriptions Are Smelly", "https://arxiv.org/abs/2502.11566"),
]

GITHUB_REPO_RE = re.compile(r"https?://github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)")
LINK_RE = re.compile(r"\[([^\]]+)\]\((https?://[^)]+)\)")
MCP_HINT_RE = re.compile(
    r"(model context protocol|mcp server|json-rpc|tools|resources|prompts|stdio|streamable http|sse)",
    re.I,
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def run_cmd_bytes(cmd: List[str], timeout: int = 25) -> Tuple[int, bytes]:
    proc = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=timeout,
    )
    return proc.returncode, proc.stdout


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS mcp_categories (
          id INTEGER PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          description TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS mcp_sources (
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
          FOREIGN KEY(category_id) REFERENCES mcp_categories(id)
        );

        CREATE TABLE IF NOT EXISTS mcp_links (
          id INTEGER PRIMARY KEY,
          source_id INTEGER NOT NULL,
          link_url TEXT NOT NULL,
          anchor TEXT,
          UNIQUE(source_id, link_url),
          FOREIGN KEY(source_id) REFERENCES mcp_sources(id)
        );

        CREATE TABLE IF NOT EXISTS mcp_servers (
          id INTEGER PRIMARY KEY,
          source_id INTEGER,
          server_name TEXT NOT NULL,
          server_url TEXT,
          repo_url TEXT,
          description TEXT,
          tags TEXT,
          maintainer TEXT,
          stars INTEGER,
          license TEXT,
          transport TEXT,
          created_at TEXT NOT NULL,
          UNIQUE(server_url, repo_url)
        );
        """
    )


def upsert_category(conn: sqlite3.Connection, name: str, description: str) -> int:
    conn.execute(
        "INSERT INTO mcp_categories(name, description) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET description=excluded.description",
        (name, description),
    )
    return int(conn.execute("SELECT id FROM mcp_categories WHERE name=?", (name,)).fetchone()[0])


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
        INSERT INTO mcp_sources(category_id, name, url, title, brief, source_type, created_at, updated_at)
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
    return int(conn.execute("SELECT id FROM mcp_sources WHERE name=? AND url=?", (name, url)).fetchone()[0])


def add_link(conn: sqlite3.Connection, source_id: int, link_url: str, anchor: str = "") -> None:
    conn.execute(
        "INSERT OR IGNORE INTO mcp_links(source_id, link_url, anchor) VALUES (?, ?, ?)",
        (source_id, link_url[:2000], (anchor or "")[:500]),
    )


def add_server(
    conn: sqlite3.Connection,
    source_id: Optional[int],
    server_name: str,
    server_url: str,
    repo_url: str,
    description: str,
    tags: str,
    maintainer: str,
    stars: Optional[int] = None,
    license_name: str = "",
    transport: str = "",
) -> None:
    conn.execute(
        """
        INSERT OR IGNORE INTO mcp_servers(
          source_id, server_name, server_url, repo_url, description, tags, maintainer, stars, license, transport, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            source_id,
            (server_name or "MCP Server")[:300],
            (server_url or "")[:2000],
            (repo_url or "")[:2000],
            (description or "")[:3000],
            (tags or "")[:500],
            (maintainer or "")[:300],
            stars if stars is not None else None,
            (license_name or "")[:200],
            (transport or "")[:100],
            now_iso(),
        ),
    )


def normalize_repo(url: str) -> Optional[str]:
    m = GITHUB_REPO_RE.match(url)
    if not m:
        return None
    owner, repo = m.group(1), m.group(2).removesuffix(".git")
    return f"https://github.com/{owner}/{repo}"


def repo_priority(repo_url: str) -> Tuple[int, str]:
    p = urlparse(repo_url).path.strip("/").lower()
    score = 0
    if "modelcontextprotocol/servers" in p:
        score += 100
    if "awesome-mcp-servers" in p:
        score += 90
    if "mcp" in p:
        score += 30
    if "server" in p:
        score += 15
    if "registry" in p:
        score += 10
    return (-score, p)


def infer_transport(text: str) -> str:
    t = text.lower()
    if "streamable http" in t or "sse" in t:
        return "streamable_http"
    if "websocket" in t:
        return "websocket"
    if "stdio" in t:
        return "stdio"
    return ""


def normalize_url(url: str) -> str:
    p = urlparse(url)
    if p.scheme not in ("http", "https") or not p.netloc:
        return ""
    return urlunparse((p.scheme, p.netloc, p.path or "/", "", "", ""))


def same_host(a: str, b: str) -> bool:
    return urlparse(a).netloc.lower() == urlparse(b).netloc.lower()


def should_skip_internal_url(seed_url: str, candidate_url: str) -> bool:
    seed_host = urlparse(seed_url).netloc.lower()
    parsed = urlparse(candidate_url)
    path = (parsed.path or "/").lower()
    if parsed.netloc.lower() != seed_host:
        return True

    if seed_host == "github.com":
        # Keep repository-level paths, skip global/profile/nav pages.
        parts = [p for p in path.split("/") if p]
        if len(parts) < 2:
            return True
        reserved = {
            "features",
            "pricing",
            "explore",
            "marketplace",
            "security",
            "sponsors",
            "topics",
            "collections",
            "events",
            "settings",
            "enterprise",
            "organizations",
            "orgs",
            "users",
            "login",
            "signup",
            "join",
            "mcp",
        }
        if parts and parts[0] in reserved:
            return True
        skip_prefixes = (
            "/login",
            "/signup",
            "/join",
            "/why-github",
            "/features",
            "/pricing",
            "/marketplace",
            "/security",
            "/explore",
            "/collections",
            "/topics",
            "/trending",
            "/events",
            "/sponsors",
            "/orgs/",
            "/organizations/",
            "/users/",
            "/settings",
        )
        if path in ("/", "") or path.startswith(skip_prefixes):
            return True

    if seed_host.endswith("reddit.com"):
        # Keep only the same subreddit as the seed to avoid unrelated crawl drift.
        seed_parts = [p for p in urlparse(seed_url).path.lower().split("/") if p]
        seed_sub = seed_parts[1] if len(seed_parts) > 1 and seed_parts[0] == "r" else ""
        cand_parts = [p for p in path.split("/") if p]
        cand_sub = cand_parts[1] if len(cand_parts) > 1 and cand_parts[0] == "r" else ""
        if not seed_sub or seed_sub != cand_sub:
            return True

    return False


def extract_repo_metadata(repo_url: str, timeout: int = 12) -> Optional[Dict[str, str]]:
    m = GITHUB_REPO_RE.match(repo_url)
    if not m:
        return None
    owner, repo = m.group(1), m.group(2).removesuffix(".git")
    branches = ("main", "master")
    readme_text = ""
    license_text = ""
    for branch in branches:
        archive_url = f"https://codeload.github.com/{owner}/{repo}/tar.gz/refs/heads/{branch}"
        code, payload = run_cmd_bytes(
            [
                "curl",
                "-LfsS",
                "--max-time",
                str(timeout),
                "-H",
                "User-Agent: crawl4ai-mcp-pipeline/1.0",
                archive_url,
            ],
            timeout=timeout + 3,
        )
        if code != 0 or not payload:
            continue
        try:
            tf = tarfile.open(fileobj=io.BytesIO(payload), mode="r:gz")
        except Exception:
            continue
        with tf:
            for member in tf.getmembers():
                if not member.isfile() or member.size > 400_000:
                    continue
                low = member.name.lower()
                if readme_text == "" and "/readme" in low:
                    ex = tf.extractfile(member)
                    if ex:
                        readme_text = ex.read().decode("utf-8", errors="ignore")
                if license_text == "" and low.endswith("/license"):
                    ex = tf.extractfile(member)
                    if ex:
                        license_text = ex.read().decode("utf-8", errors="ignore")
                if readme_text and license_text:
                    break
        if readme_text:
            break

    if not readme_text and "mcp" not in repo.lower():
        return None
    if readme_text and not MCP_HINT_RE.search(readme_text) and "mcp" not in repo.lower():
        return None

    desc_line = ""
    for line in (readme_text or "").splitlines():
        s = line.strip().lstrip("#").strip()
        if len(s) > 30 and not s.lower().startswith("table of contents"):
            desc_line = s
            break
    description = desc_line[:500] if desc_line else f"MCP server repository: {owner}/{repo}"
    license_name = license_text.splitlines()[0].strip()[:120] if license_text else ""
    maintainer = owner
    tags = []
    txt = (readme_text or "").lower()
    for k in ("devops", "database", "security", "browser", "kubernetes", "github", "search"):
        if k in txt:
            tags.append(k)
    if "mcp" not in tags:
        tags.insert(0, "mcp")
    return {
        "server_name": repo,
        "server_url": repo_url,
        "repo_url": repo_url,
        "description": description,
        "tags": ",".join(tags[:8]),
        "maintainer": maintainer,
        "license": license_name,
        "transport": infer_transport(readme_text or ""),
    }


def extract_markdown_server_links(md: str) -> List[Tuple[str, str]]:
    out: List[Tuple[str, str]] = []
    for label, url in LINK_RE.findall(md or ""):
        lu = url.lower()
        ll = label.lower()
        if "mcp" in lu or "model context protocol" in ll or "mcp server" in ll:
            out.append((label.strip(), url.strip()))
    return out


async def run_pipeline() -> Dict[str, object]:
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    conn.execute("DELETE FROM mcp_servers")
    conn.execute("DELETE FROM mcp_links")
    conn.execute("DELETE FROM mcp_sources")
    conn.execute("DELETE FROM mcp_categories")
    conn.commit()

    cat_ids: Dict[str, int] = {name: upsert_category(conn, name, desc) for name, desc in CATEGORIES}
    conn.commit()

    repo_candidates: Set[str] = set()

    async with AsyncWebCrawler(verbose=False) as crawler:
        for cat_name, source_name, source_url in SEEDS[:SEED_LIMIT]:
            title = source_url
            brief = "crawl failed"
            markdown = ""

            source_id = upsert_source(
                conn=conn,
                category_id=cat_ids[cat_name],
                name=source_name,
                url=source_url,
                title=title,
                brief=brief,
                source_type="crawl4ai",
            )

            seed_norm = normalize_url(source_url)
            direct_repo = normalize_repo(seed_norm)
            if direct_repo:
                repo_candidates.add(direct_repo)

            queue = deque([(seed_norm, 0)])
            visited = set()
            first_success_page = None
            while queue and len(visited) < MAX_PAGES_PER_SOURCE:
                page_url, depth = queue.popleft()
                if not page_url or page_url in visited:
                    continue
                visited.add(page_url)

                page_markdown = ""
                page_links = {"internal": [], "external": []}
                page_title = page_url
                page_brief = "crawl failed"
                try:
                    result = await crawler.arun(url=page_url)
                    if result.success:
                        meta = result.metadata or {}
                        page_markdown = result.markdown or ""
                        page_links = result.links or page_links
                        page_title = meta.get("title") or page_url
                        page_brief = (
                            meta.get("description")
                            or page_markdown[:450].replace("\n", " ")
                            or "No description"
                        )
                        if first_success_page is None:
                            first_success_page = (page_title, page_brief, page_markdown)
                    else:
                        page_brief = result.error_message or "crawl failed"
                except Exception as exc:
                    page_brief = f"crawl exception: {exc}"

                add_link(conn, source_id, page_url, page_title)

                all_links = (page_links.get("internal") or []) + (page_links.get("external") or [])
                for ln in all_links[:MAX_LINKS_PER_PAGE]:
                    href = (ln or {}).get("href")
                    if not href:
                        continue
                    anchor = (ln or {}).get("text", "")
                    abs_href = normalize_url(urljoin(page_url, href))
                    if not abs_href:
                        continue
                    add_link(conn, source_id, abs_href, anchor)
                    repo = normalize_repo(abs_href)
                    if repo:
                        repo_candidates.add(repo)
                    if (
                        depth < MAX_DEPTH_PER_SOURCE
                        and same_host(seed_norm, abs_href)
                        and not should_skip_internal_url(seed_norm, abs_href)
                    ):
                        queue.append((abs_href, depth + 1))

                for label, url in extract_markdown_server_links(page_markdown):
                    normalized_target = normalize_url(url)
                    repo = normalize_repo(normalized_target or url)
                    if repo:
                        repo_candidates.add(repo)
                    elif normalized_target:
                        add_server(
                            conn=conn,
                            source_id=source_id,
                            server_name=label or "MCP server",
                            server_url=normalized_target,
                            repo_url="",
                            description=f"MCP listing reference from {source_name}",
                            tags="mcp,directory",
                            maintainer=urlparse(normalized_target).netloc,
                        )

            if first_success_page:
                title, brief, markdown = first_success_page
            else:
                title = source_url
                brief = "crawl failed"

            upsert_source(
                conn=conn,
                category_id=cat_ids[cat_name],
                name=source_name,
                url=source_url,
                title=title,
                brief=brief,
                source_type="crawl4ai",
            )
            conn.commit()

    prioritized = sorted(repo_candidates, key=repo_priority)
    inserted_repo_servers = 0
    for idx, repo_url in enumerate(prioritized[:MAX_REPOS], start=1):
        owner_repo = repo_url.removeprefix("https://github.com/")
        source_id = upsert_source(
            conn=conn,
            category_id=cat_ids["Registries + Discovery"],
            name=owner_repo,
            url=repo_url,
            title=owner_repo,
            brief="Discovered GitHub repository candidate for MCP server metadata extraction",
            source_type="github_repo",
        )
        meta = extract_repo_metadata(repo_url)
        if meta:
            add_server(
                conn=conn,
                source_id=source_id,
                server_name=meta["server_name"],
                server_url=meta["server_url"],
                repo_url=meta["repo_url"],
                description=meta["description"],
                tags=meta["tags"],
                maintainer=meta["maintainer"],
                license_name=meta["license"],
                transport=meta["transport"],
            )
            inserted_repo_servers += 1
        if idx % 20 == 0:
            print(f"[MCP_REPO] {idx}/{min(MAX_REPOS, len(prioritized))} processed")
        conn.commit()

    counts = {
        "mcp_categories": int(conn.execute("SELECT COUNT(*) FROM mcp_categories").fetchone()[0]),
        "mcp_sources": int(conn.execute("SELECT COUNT(*) FROM mcp_sources").fetchone()[0]),
        "mcp_links": int(conn.execute("SELECT COUNT(*) FROM mcp_links").fetchone()[0]),
        "mcp_servers": int(conn.execute("SELECT COUNT(*) FROM mcp_servers").fetchone()[0]),
    }

    top_servers = conn.execute(
        """
        SELECT server_name, coalesce(server_url,''), coalesce(repo_url,''), coalesce(tags,''), coalesce(maintainer,'')
        FROM mcp_servers
        ORDER BY id DESC
        LIMIT 60
        """
    ).fetchall()

    summary = {
        "generated_at": now_iso(),
        "counts": counts,
        "run_stats": {
            "repo_candidates": len(repo_candidates),
            "repo_servers_inserted_estimate": inserted_repo_servers,
        },
        "latest_servers_sample": [
            {
                "server_name": n,
                "server_url": su,
                "repo_url": ru,
                "tags": tg,
                "maintainer": mt,
            }
            for (n, su, ru, tg, mt) in top_servers[:30]
        ],
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    html = [
        "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>",
        "<title>MCP Ecosystem Corpus</title>",
        "<style>body{font-family:ui-sans-serif,system-ui;padding:24px;background:#f8fafc;color:#0f172a}a{color:#0f766e;text-decoration:none}a:hover{text-decoration:underline}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px}.muted{color:#475569;font-size:14px}ul{padding-left:18px}</style>",
        "</head><body>",
        "<h1>MCP Ecosystem Corpus</h1>",
        "<div class='grid'>",
        f"<div class='card'><h3>{counts['mcp_categories']}</h3><div class='muted'>categories</div></div>",
        f"<div class='card'><h3>{counts['mcp_sources']}</h3><div class='muted'>sources</div></div>",
        f"<div class='card'><h3>{counts['mcp_links']}</h3><div class='muted'>discovered links</div></div>",
        f"<div class='card'><h3>{counts['mcp_servers']}</h3><div class='muted'>server records</div></div>",
        "</div>",
        "<h2>Latest MCP Server Records</h2><ul>",
    ]
    for n, su, ru, tg, mt in top_servers[:40]:
        href = su or ru
        html.append(
            f"<li><a href='{href}' target='_blank' rel='noreferrer'>{(n or '').replace('<','&lt;')}</a> <span class='muted'>[{(tg or '').replace('<','&lt;')}] maintainer: {(mt or '').replace('<','&lt;')}</span></li>"
        )
    html.append(f"</ul><p class='muted'>Generated at {summary['generated_at']}</p></body></html>")
    HTML_PATH.write_text("".join(html), encoding="utf-8")

    conn.close()
    return summary


if __name__ == "__main__":
    out = asyncio.run(run_pipeline())
    print(json.dumps(out, indent=2))

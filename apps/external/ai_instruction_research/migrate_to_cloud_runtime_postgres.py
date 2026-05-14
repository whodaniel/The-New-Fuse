#!/usr/bin/env python3
import argparse
import json
import os
import sqlite3
import hashlib
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parent
SQLITE_PATH = ROOT / "instruction_research.sqlite"


def ensure_schema(pg):
    with pg.cursor() as cur:
        cur.execute("CREATE SCHEMA IF NOT EXISTS ai_assets_marketplace")
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_assets_marketplace.categories (
              id INTEGER PRIMARY KEY,
              name TEXT UNIQUE NOT NULL,
              description TEXT NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_assets_marketplace.sources (
              id INTEGER PRIMARY KEY,
              category_id INTEGER NOT NULL,
              name TEXT NOT NULL,
              url TEXT NOT NULL,
              title TEXT,
              brief TEXT,
              source_type TEXT,
              created_at TEXT,
              updated_at TEXT,
              UNIQUE(name, url)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_assets_marketplace.source_links (
              id INTEGER PRIMARY KEY,
              source_id INTEGER NOT NULL,
              link_url TEXT NOT NULL,
              anchor TEXT,
              UNIQUE(source_id, link_url)
            )
            """
        )
        # Recreate prompts table to avoid oversized unique index rows on very long prompt_text values.
        cur.execute("DROP TABLE IF EXISTS ai_assets_marketplace.prompts")
        cur.execute(
            """
            CREATE TABLE ai_assets_marketplace.prompts (
              id INTEGER PRIMARY KEY,
              source_id INTEGER NOT NULL,
              title TEXT,
              prompt_text TEXT NOT NULL,
              prompt_hash TEXT NOT NULL,
              url TEXT,
              license TEXT,
              tags TEXT,
              created_at TEXT,
              UNIQUE(source_id, prompt_hash)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_assets_marketplace.artifacts (
              filename TEXT PRIMARY KEY,
              content_type TEXT NOT NULL,
              content_text TEXT,
              content_bytea BYTEA,
              uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_assets_marketplace.skill_categories (
              id INTEGER PRIMARY KEY,
              name TEXT UNIQUE NOT NULL,
              description TEXT NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_assets_marketplace.skill_sources (
              id INTEGER PRIMARY KEY,
              category_id INTEGER NOT NULL,
              name TEXT NOT NULL,
              url TEXT NOT NULL,
              title TEXT,
              brief TEXT,
              source_type TEXT,
              created_at TEXT,
              updated_at TEXT,
              UNIQUE(name, url)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_assets_marketplace.skill_links (
              id INTEGER PRIMARY KEY,
              source_id INTEGER NOT NULL,
              link_url TEXT NOT NULL,
              anchor TEXT,
              UNIQUE(source_id, link_url)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_assets_marketplace.skill_files (
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
              created_at TEXT,
              UNIQUE(file_url, content_sha256)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_assets_marketplace.skill_marketplace_entries (
              id INTEGER PRIMARY KEY,
              source TEXT NOT NULL,
              entry_url TEXT NOT NULL,
              title TEXT,
              brief TEXT,
              tags TEXT,
              discovered_at TEXT NOT NULL,
              UNIQUE(source, entry_url)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_assets_marketplace.mcp_categories (
              id INTEGER PRIMARY KEY,
              name TEXT UNIQUE NOT NULL,
              description TEXT NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_assets_marketplace.mcp_sources (
              id INTEGER PRIMARY KEY,
              category_id INTEGER NOT NULL,
              name TEXT NOT NULL,
              url TEXT NOT NULL,
              title TEXT,
              brief TEXT,
              source_type TEXT,
              created_at TEXT,
              updated_at TEXT,
              UNIQUE(name, url)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_assets_marketplace.mcp_links (
              id INTEGER PRIMARY KEY,
              source_id INTEGER NOT NULL,
              link_url TEXT NOT NULL,
              anchor TEXT,
              UNIQUE(source_id, link_url)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_assets_marketplace.mcp_servers (
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
            )
            """
        )


def truncate(pg):
    with pg.cursor() as cur:
        cur.execute("TRUNCATE TABLE ai_assets_marketplace.prompts")
        cur.execute("TRUNCATE TABLE ai_assets_marketplace.source_links")
        cur.execute("TRUNCATE TABLE ai_assets_marketplace.sources")
        cur.execute("TRUNCATE TABLE ai_assets_marketplace.categories")
        cur.execute("TRUNCATE TABLE ai_assets_marketplace.skill_files")
        cur.execute("TRUNCATE TABLE ai_assets_marketplace.skill_links")
        cur.execute("TRUNCATE TABLE ai_assets_marketplace.skill_sources")
        cur.execute("TRUNCATE TABLE ai_assets_marketplace.skill_categories")
        cur.execute("TRUNCATE TABLE ai_assets_marketplace.skill_marketplace_entries")
        cur.execute("TRUNCATE TABLE ai_assets_marketplace.mcp_servers")
        cur.execute("TRUNCATE TABLE ai_assets_marketplace.mcp_links")
        cur.execute("TRUNCATE TABLE ai_assets_marketplace.mcp_sources")
        cur.execute("TRUNCATE TABLE ai_assets_marketplace.mcp_categories")


def copy_table(sqlite_conn, pg_conn, src_table: str, columns: list[str]):
    s_cur = sqlite_conn.cursor()
    p_cur = pg_conn.cursor()
    rows = s_cur.execute(f"SELECT {', '.join(columns)} FROM {src_table}").fetchall()
    if not rows:
        return 0
    placeholders = ", ".join(["%s"] * len(columns))
    cols = ", ".join(columns)
    p_cur.executemany(
        f"INSERT INTO ai_assets_marketplace.{src_table} ({cols}) VALUES ({placeholders}) ON CONFLICT DO NOTHING",
        rows,
    )
    return len(rows)


def sqlite_table_exists(sqlite_conn, table_name: str) -> bool:
    cur = sqlite_conn.cursor()
    row = cur.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name = ?",
        (table_name,),
    ).fetchone()
    return bool(row)


def copy_prompts(sqlite_conn, pg_conn):
    s_cur = sqlite_conn.cursor()
    p_cur = pg_conn.cursor()
    rows = s_cur.execute(
        "SELECT id, source_id, title, prompt_text, url, license, tags, created_at FROM prompts"
    ).fetchall()
    if not rows:
        return 0

    out = []
    for row in rows:
        prompt_text = row[3] or ""
        prompt_hash = hashlib.md5(prompt_text.encode("utf-8", errors="ignore")).hexdigest()
        out.append((row[0], row[1], row[2], prompt_text, prompt_hash, row[4], row[5], row[6], row[7]))

    p_cur.executemany(
        """
        INSERT INTO ai_assets_marketplace.prompts
        (id, source_id, title, prompt_text, prompt_hash, url, license, tags, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT DO NOTHING
        """,
        out,
    )
    return len(out)


def upload_artifacts(pg_conn):
    artifacts = [
        ("index.html", "text/html", True),
        ("summary.json", "application/json", True),
        ("skills_index.html", "text/html", True),
        ("skills_summary.json", "application/json", True),
        ("skills_sh_mirror.html", "text/html", True),
        ("skills_sh_mirror_summary.json", "application/json", True),
        ("mcp_index.html", "text/html", True),
        ("mcp_summary.json", "application/json", True),
        ("crawl4ai_research_pipeline.py", "text/x-python", True),
        ("crawl4ai_skills_pipeline.py", "text/x-python", True),
        ("crawl4ai_skills_sh_mirror.py", "text/x-python", True),
        ("crawl4ai_mcp_pipeline.py", "text/x-python", True),
        ("migrate_to_cloud_runtime_postgres.py", "text/x-python", True),
        ("instruction_research.sqlite", "application/x-sqlite3", False),
    ]
    with pg_conn.cursor() as cur:
        for filename, content_type, as_text in artifacts:
            path = ROOT / filename
            if not path.exists():
                continue
            if as_text:
                text = path.read_text(encoding="utf-8", errors="ignore")
                cur.execute(
                    """
                    INSERT INTO ai_assets_marketplace.artifacts(filename, content_type, content_text, content_bytea)
                    VALUES (%s, %s, %s, NULL)
                    ON CONFLICT(filename) DO UPDATE SET
                      content_type = EXCLUDED.content_type,
                      content_text = EXCLUDED.content_text,
                      content_bytea = NULL,
                      uploaded_at = now()
                    """,
                    (filename, content_type, text),
                )
            else:
                blob = path.read_bytes()
                cur.execute(
                    """
                    INSERT INTO ai_assets_marketplace.artifacts(filename, content_type, content_text, content_bytea)
                    VALUES (%s, %s, NULL, %s)
                    ON CONFLICT(filename) DO UPDATE SET
                      content_type = EXCLUDED.content_type,
                      content_text = NULL,
                      content_bytea = EXCLUDED.content_bytea,
                      uploaded_at = now()
                    """,
                    (filename, content_type, blob),
                )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pg-url", default=os.environ.get("CLOUD_RUNTIME_DATABASE_PUBLIC_URL") or os.environ.get("DATABASE_PUBLIC_URL"))
    parser.add_argument("--sqlite", default=str(SQLITE_PATH))
    parser.add_argument("--truncate", action="store_true", default=True)
    args = parser.parse_args()

    if not args.pg_url:
        raise SystemExit("Missing --pg-url or DATABASE_PUBLIC_URL")

    sqlite_conn = sqlite3.connect(args.sqlite)
    pg_conn = psycopg.connect(args.pg_url)

    ensure_schema(pg_conn)
    if args.truncate:
        truncate(pg_conn)

    stats = {}
    stats["categories"] = copy_table(sqlite_conn, pg_conn, "categories", ["id", "name", "description"])
    stats["sources"] = copy_table(sqlite_conn, pg_conn, "sources", ["id", "category_id", "name", "url", "title", "brief", "source_type", "created_at", "updated_at"])
    stats["source_links"] = copy_table(sqlite_conn, pg_conn, "source_links", ["id", "source_id", "link_url", "anchor"])
    stats["prompts"] = copy_prompts(sqlite_conn, pg_conn)
    if sqlite_table_exists(sqlite_conn, "skill_categories"):
        stats["skill_categories"] = copy_table(
            sqlite_conn, pg_conn, "skill_categories", ["id", "name", "description"]
        )
    if sqlite_table_exists(sqlite_conn, "skill_sources"):
        stats["skill_sources"] = copy_table(
            sqlite_conn,
            pg_conn,
            "skill_sources",
            [
                "id",
                "category_id",
                "name",
                "url",
                "title",
                "brief",
                "source_type",
                "created_at",
                "updated_at",
            ],
        )
    if sqlite_table_exists(sqlite_conn, "skill_links"):
        stats["skill_links"] = copy_table(
            sqlite_conn, pg_conn, "skill_links", ["id", "source_id", "link_url", "anchor"]
        )
    if sqlite_table_exists(sqlite_conn, "skill_files"):
        stats["skill_files"] = copy_table(
            sqlite_conn,
            pg_conn,
            "skill_files",
            [
                "id",
                "source_id",
                "repo_url",
                "file_url",
                "file_path",
                "title",
                "content",
                "content_sha256",
                "license",
                "tags",
                "created_at",
            ],
        )
    if sqlite_table_exists(sqlite_conn, "skill_marketplace_entries"):
        stats["skill_marketplace_entries"] = copy_table(
            sqlite_conn,
            pg_conn,
            "skill_marketplace_entries",
            ["id", "source", "entry_url", "title", "brief", "tags", "discovered_at"],
        )
    if sqlite_table_exists(sqlite_conn, "mcp_categories"):
        stats["mcp_categories"] = copy_table(
            sqlite_conn, pg_conn, "mcp_categories", ["id", "name", "description"]
        )
    if sqlite_table_exists(sqlite_conn, "mcp_sources"):
        stats["mcp_sources"] = copy_table(
            sqlite_conn,
            pg_conn,
            "mcp_sources",
            [
                "id",
                "category_id",
                "name",
                "url",
                "title",
                "brief",
                "source_type",
                "created_at",
                "updated_at",
            ],
        )
    if sqlite_table_exists(sqlite_conn, "mcp_links"):
        stats["mcp_links"] = copy_table(
            sqlite_conn, pg_conn, "mcp_links", ["id", "source_id", "link_url", "anchor"]
        )
    if sqlite_table_exists(sqlite_conn, "mcp_servers"):
        stats["mcp_servers"] = copy_table(
            sqlite_conn,
            pg_conn,
            "mcp_servers",
            [
                "id",
                "source_id",
                "server_name",
                "server_url",
                "repo_url",
                "description",
                "tags",
                "maintainer",
                "stars",
                "license",
                "transport",
                "created_at",
            ],
        )

    upload_artifacts(pg_conn)

    pg_conn.commit()
    sqlite_conn.close()
    pg_conn.close()

    print(json.dumps({"migrated": stats}, indent=2))


if __name__ == "__main__":
    main()

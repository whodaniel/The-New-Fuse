#!/usr/bin/env python3
import os
from typing import Any

import psycopg
from fastapi import FastAPI, HTTPException, Query

app = FastAPI(title="AI Assets Marketplace Data API", version="1.0.0")


def get_conn():
    db_url = os.environ.get("DATABASE_URL") or os.environ.get("DATABASE_PUBLIC_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL/DATABASE_PUBLIC_URL not configured")
    return psycopg.connect(db_url)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/counts")
def counts() -> dict[str, int]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            out = {}
            for t in ["categories", "sources", "source_links", "prompts", "artifacts"]:
                cur.execute(f"select count(*) from ai_assets_marketplace.{t}")
                out[t] = cur.fetchone()[0]
    return out


@app.get("/sources")
def sources(limit: int = Query(default=100, ge=1, le=1000)) -> list[dict[str, Any]]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select s.id, s.name, s.url, s.title, s.brief, c.name as category
                from ai_assets_marketplace.sources s
                join ai_assets_marketplace.categories c on c.id = s.category_id
                order by s.id
                limit %s
                """,
                (limit,),
            )
            rows = cur.fetchall()
    return [
        {"id": r[0], "name": r[1], "url": r[2], "title": r[3], "brief": r[4], "category": r[5]}
        for r in rows
    ]


@app.get("/prompts/search")
def prompts_search(
    q: str = Query(default=""),
    limit: int = Query(default=50, ge=1, le=500),
) -> list[dict[str, Any]]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            if q.strip():
                cur.execute(
                    """
                    select p.id, s.name, p.title, p.url, p.tags, left(p.prompt_text, 800)
                    from ai_assets_marketplace.prompts p
                    join ai_assets_marketplace.sources s on s.id = p.source_id
                    where p.prompt_text ilike %s
                    order by p.id desc
                    limit %s
                    """,
                    (f"%{q}%", limit),
                )
            else:
                cur.execute(
                    """
                    select p.id, s.name, p.title, p.url, p.tags, left(p.prompt_text, 800)
                    from ai_assets_marketplace.prompts p
                    join ai_assets_marketplace.sources s on s.id = p.source_id
                    order by p.id desc
                    limit %s
                    """,
                    (limit,),
                )
            rows = cur.fetchall()
    return [
        {
            "id": r[0],
            "source": r[1],
            "title": r[2],
            "url": r[3],
            "tags": r[4],
            "prompt_preview": r[5],
        }
        for r in rows
    ]


@app.get("/artifacts/{filename}")
def artifact(filename: str) -> dict[str, Any]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select filename, content_type, left(content_text, 60000),
                       case when content_bytea is null then 0 else octet_length(content_bytea) end
                from ai_assets_marketplace.artifacts
                where filename = %s
                """,
                (filename,),
            )
            row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="artifact not found")
    return {
        "filename": row[0],
        "content_type": row[1],
        "content_text_preview": row[2],
        "binary_size": row[3],
    }

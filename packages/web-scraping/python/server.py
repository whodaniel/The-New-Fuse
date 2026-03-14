from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import asyncio
import os
import re
from crawl4ai import AsyncWebCrawler

app = FastAPI(title="TNF Crawl4AI Engine")

class ScrapeRequest(BaseModel):
    url: str
    max_chars: Optional[int] = 2000
    timeout_ms: Optional[int] = 25000
    main_content_only: Optional[bool] = True

class ScrapeResponse(BaseModel):
    success: bool
    url: str
    title: Optional[str] = None
    text: Optional[str] = None
    markdown: Optional[str] = None
    error: Optional[str] = None

def _clean_text(value: Any, max_chars: int) -> str:
    text = str(value or "")
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > max_chars:
        return text[: max_chars - 3].rstrip() + "..."
    return text

@app.post("/scrape", response_model=ScrapeResponse)
async def scrape(request: ScrapeRequest):
    try:
        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(
                url=request.url, 
                timeout=request.timeout_ms
            )
            
            # Prefer fit_markdown or cleaned_markdown for AI readability
            markdown = (
                getattr(result, "fit_markdown", None) or 
                getattr(result, "cleaned_markdown", None) or 
                getattr(result, "markdown", None)
            )
            
            # If it's an object (sometimes happens in newer crawl4ai), get the raw string
            if hasattr(markdown, "raw_markdown"):
                markdown = markdown.raw_markdown

            return ScrapeResponse(
                success=True,
                url=request.url,
                title=getattr(result, "metadata", {}).get("title", ""),
                text=_clean_text(markdown, request.max_chars),
                markdown=markdown
            )
    except Exception as e:
        return ScrapeResponse(
            success=False,
            url=request.url,
            error=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import FastAPI
from typing import Any
import sys
import re
from pathlib import Path
from crawl4ai import AsyncWebCrawler

CONTRACTS_PY_ROOT = (
    Path(__file__).resolve().parents[3]
    / "packages"
    / "protocol-contracts"
    / "generated"
    / "python"
)

if str(CONTRACTS_PY_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTRACTS_PY_ROOT))

from tnf_contracts.scrape_request import ScrapeRequest
from tnf_contracts.scrape_response import ScrapeResponse

app = FastAPI(title="TNF Crawl4AI Engine")

def _clean_text(value: Any, max_chars: int) -> str:
    text = str(value or "")
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > max_chars:
        return text[: max_chars - 3].rstrip() + "..."
    return text

@app.post("/scrape", response_model=ScrapeResponse)
async def scrape(request: ScrapeRequest):
    try:
        timeout_ms = request.timeout_ms or 25000
        max_chars = request.max_chars or 2000
        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(
                url=request.url, 
                timeout=timeout_ms
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
                url=str(request.url),
                title=getattr(result, "metadata", {}).get("title", ""),
                text=_clean_text(markdown, max_chars),
                markdown=markdown
            )
    except Exception as e:
        return ScrapeResponse(
            success=False,
            url=str(request.url),
            error=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

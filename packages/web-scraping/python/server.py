from fastapi import FastAPI
from typing import Any
import sys
import re
import ctypes
from pathlib import Path
from crawl4ai import AsyncWebCrawler

# Integration with TNF Forge
SCRIPTS_ROOT = Path(__file__).resolve().parents[3] / "scripts"
if str(SCRIPTS_ROOT) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_ROOT))

try:
    from tnf_forge import ForgeCompiler
    from python_accelerator import PythonAccelerator
    FORGE_AVAILABLE = True
except ImportError:
    FORGE_AVAILABLE = False

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

# Setup Acceleration
if FORGE_AVAILABLE:
    forge = ForgeCompiler(output_dir="bin/forged")
    accel = PythonAccelerator(forge)
else:
    accel = None

def _clean_text_impl(value: Any, max_chars: int) -> str:
    """Slow Python implementation (fallback)."""
    text = str(value or "")
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > max_chars:
        return text[: max_chars - 3].rstrip() + "..."
    return text

# Apply wrapper
if accel:
    _clean_text = accel.wrap(_clean_text_impl)
else:
    _clean_text = _clean_text_impl

@app.on_event("startup")
async def startup_event():
    """Attempt to forge native accelerators on startup."""
    if accel:
        c_code = """
        #include <stdlib.h>
        #include <string.h>
        #include <ctype.h>
        
        char* _clean_text_impl(const char* input, int max_chars) {
            if (!input) return NULL;
            size_t len = strlen(input);
            char* output = (char*)malloc(len + 1);
            if (!output) return NULL;
            int out_idx = 0;
            int in_whitespace = 0;
            int first_char = 1;
            for (size_t i = 0; i < len; i++) {
                if (isspace(input[i])) {
                    if (!in_whitespace && !first_char) {
                        output[out_idx++] = ' ';
                        in_whitespace = 1;
                    }
                } else {
                    output[out_idx++] = input[i];
                    in_whitespace = 0;
                    first_char = 0;
                }
                if (out_idx >= max_chars) break;
            }
            if (out_idx > 0 && output[out_idx - 1] == ' ') out_idx--;
            if (out_idx >= max_chars - 3 && len > (size_t)out_idx) {
                if (out_idx > max_chars - 3) out_idx = max_chars - 3;
                output[out_idx++] = '.';
                output[out_idx++] = '.';
                output[out_idx++] = '.';
            }
            output[out_idx] = '\\0';
            return output;
        }
        
        void free_string(char* ptr) { free(ptr); }
        """
        try:
            accel.accelerate(
                c_code, 
                "_clean_text_impl", 
                argtypes=[ctypes.c_char_p, ctypes.c_int], 
                restype=ctypes.c_void_p,
                free_func_name="free_string"
            )
        except Exception as e:
            print(f"Forge acceleration failed (falling back to Python): {e}")

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

import re
import time
import sys
from typing import Any

def _clean_text_python(value: Any, max_chars: int) -> str:
    text = str(value or "")
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > max_chars:
        return text[: max_chars - 3].rstrip() + "..."
    return text

# Generate a large dummy markdown blob (1MB)
dummy_text = "This is some dummy markdown content. " * 20000
max_chars = 2000

print(f"Benchmarking Python implementation with {len(dummy_text)} chars...")
start = time.perf_counter()
for _ in range(100):
    _clean_text_python(dummy_text, max_chars)
duration = time.perf_counter() - start
print(f"Python took: {duration:.4f}s total ({duration/100:.6f}s per call)")

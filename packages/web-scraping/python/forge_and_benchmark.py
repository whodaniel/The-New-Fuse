import os
import sys
import time
import ctypes
from pathlib import Path

# Add scripts directory to path
SCRIPTS_ROOT = Path(__file__).resolve().parents[3] / "scripts"
if str(SCRIPTS_ROOT) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_ROOT))

from tnf_forge import ForgeCompiler

def benchmark_forged():
    forge = ForgeCompiler(output_dir="bin/forged")
    
    # Read the C code
    c_source = Path("/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/web-scraping/python/clean_text.c").read_text()
    
    print("Forging native text cleaner...")
    lib_path = forge.compile_c(c_source, "clean_text", shared=True)
    
    # Load and configure ctypes
    native_lib = ctypes.CDLL(lib_path)
    native_lib.clean_text_native.argtypes = [ctypes.c_char_p, ctypes.c_int]
    native_lib.clean_text_native.restype = ctypes.c_void_p  # We'll cast to string later
    
    native_lib.free_string.argtypes = [ctypes.c_void_p]
    native_lib.free_string.restype = None

    def _clean_text_native(text: str, max_chars: int) -> str:
        # Convert Python string to bytes
        b_text = text.encode('utf-8')
        # Call native function
        res_ptr = native_lib.clean_text_native(b_text, max_chars)
        if not res_ptr:
            return ""
        # Get string value and convert back to Python
        res_bytes = ctypes.string_at(res_ptr)
        res_str = res_bytes.decode('utf-8')
        # Free C memory
        native_lib.free_string(res_ptr)
        return res_str

    # Large dummy text
    dummy_text = "This is some dummy markdown content. " * 20000
    max_chars = 2000

    print(f"Benchmarking Native implementation with {len(dummy_text)} chars...")
    start = time.perf_counter()
    for _ in range(100):
        _clean_text_native(dummy_text, max_chars)
    duration = time.perf_counter() - start
    print(f"Forged took: {duration:.4f}s total ({duration/100:.6f}s per call)")
    
    # Verify correctness
    result = _clean_text_native("Hello    World  Test", 100)
    print(f"Verification: '{result}'")

if __name__ == "__main__":
    benchmark_forged()

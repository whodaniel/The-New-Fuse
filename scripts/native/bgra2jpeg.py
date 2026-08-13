"""
bgra2jpeg.py — Python wrapper for the native bgra2jpeg C extension.

Build the extension first:
    cc -O3 -march=native -shared -o bgra2jpeg.so bgra2jpeg.c -ljpeg
    
Then use from Python:
    import bgra2jpeg
    jpeg_bytes = bgra2jpeg.bgra2jpeg(raw_bgra_buffer, width, height, quality)
    
Or use the drop-in capture function that integrates with mss:
    from bgra2jpeg import capture_screen_jpeg_native
    jpeg_bytes = capture_screen_jpeg_native(quality=60)
"""

import ctypes
import ctypes.util
import os
import time

# Try loading the native extension
_lib = None
_lib_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bgra2jpeg.so")

def _load_native():
    global _lib
    if _lib is not None:
        return _lib is not False
    try:
        # Try Python C extension first (cleaner interface)
        from bgra2jpeg import bgra2jpeg as _bgra2jpeg_ext
        _lib = _bgra2jpeg_ext
        return True
    except ImportError:
        pass
    # Try ctypes fallback
    try:
        _lib = ctypes.CDLL(_lib_path)
        return True
    except OSError:
        _lib = False
        return False

def capture_screen_jpeg_native(quality=60):
    """Capture screen via mss and encode with native C extension.
    Falls back to simplejpeg/PIL if native extension not available.
    Returns: JPEG bytes
    """
    from mss import mss
    import numpy as np
    
    sct = mss()
    monitor = sct.monitors[1]
    screenshot = sct.grab(monitor)
    w, h = screenshot.size
    
    # Try native path
    if _load_native() and _lib is not False:
        if callable(_lib) and not isinstance(_lib, ctypes.CDLL):
            # Python extension path
            return _lib(screenshot.raw, w, h, quality)
        else:
            # ctypes path
            raw = (ctypes.c_ubyte * len(screenshot.raw)).from_buffer_copy(screenshot.raw)
            # Would need proper ctypes setup for mem_dest result
            # For now, fall through to Python path
            pass
    
    # Fallback: simplejpeg BGR path
    try:
        import simplejpeg
        raw = np.frombuffer(screenshot.raw, dtype=np.uint8).reshape(h, w, 4)
        bgr = np.ascontiguousarray(raw[:, :, :3])
        return simplejpeg.encode_jpeg(bgr, quality=quality, colorspace='BGR')
    except ImportError:
        pass
    
    # Last fallback: PIL
    from PIL import Image
    import io
    img = Image.frombytes('RGB', (w, h), screenshot.bgra, 'raw', 'BGRX')
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=quality, optimize=True)
    return buf.getvalue()


def benchmark(iterations=20):
    """Benchmark capture + encode pipeline."""
    print(f"Running {iterations} iterations...")
    
    # Native path
    times = []
    for i in range(iterations):
        t0 = time.time()
        data = capture_screen_jpeg_native(quality=60)
        t1 = time.time()
        times.append(t1 - t0)
    
    avg = sum(times) / len(times)
    print(f"Native capture+encode ({iterations} frames):")
    print(f"  avg: {avg*1000:.1f}ms, FPS: {1/avg:.1f}, JPEG: {len(data)//1024}KB")
    return avg


if __name__ == "__main__":
    benchmark()

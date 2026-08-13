"""
pipelined_capture.py — Double-buffered screen capture engine for TNF Remote Relay.

Architecture:
  Thread A (capture): continuously grabs frames from mss → buffer A
  Main thread: reads latest JPEG from buffer B (zero-wait if frame is ready)
  
  Buffers swap atomically via a Lock — capture thread writes to one,
  main thread reads from the other. No copying, no waiting.
  
  With turbojpeg (3.5ms encode), capture (85ms) is the bottleneck.
  Pipelining lets us serve frames at capture speed without encode stalls.

Benchmark targets:
  - Single-threaded: 11.4 FPS (turbojpeg RGB)
  - Pipelined: ~13-14 FPS (capture overlaps with network send)
  
Part of LLVM Forge Phase 0 — iPhone Vision Bridge.
"""

import threading
import time
import numpy as np
from mss import mss


class PipelinedCapture:
    """Double-buffered screen capture with background capture thread."""
    
    def __init__(self, quality=60, use_turbojpeg=True):
        self.quality = quality
        self.sct = mss()
        self.monitor = self.sct.monitors[1]
        self.w, self.h = self.monitor['width'], self.monitor['height']
        
        # Double buffer
        self._buf = [None, None]  # [ready_jpeg, being_captured_raw]
        self._buf_meta = [None, None]  # [(w, h), (w, h)]
        self._lock = threading.Lock()
        self._current_idx = 0  # index of buffer being written by capture thread
        self._latest_jpeg = None
        self._latest_time = 0
        self._running = False
        self._thread = None
        self._fps = 0
        self._frame_count = 0
        self._start_time = 0
        
        # Encoder setup
        self._encoder = self._setup_encoder(use_turbojpeg)
        print(f"[PipelinedCapture] Encoder: {self._encoder.__name__}, "
              f"Screen: {self.w}x{self.h}, Quality: {quality}")
    
    def _setup_encoder(self, use_turbojpeg):
        if use_turbojpeg:
            try:
                import importlib.util
                spec = importlib.util.spec_from_file_location(
                    "bgra2jpeg_turbo",
                    "./bgra2jpeg_turbo.so")
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                print("[PipelinedCapture] Using turbojpeg SIMD encoder")
                return mod.bgra2jpeg_turbo
            except Exception as e:
                print(f"[PipelinedCapture] turbojpeg not available: {e}")
        
        try:
            import simplejpeg
            def simplejpeg_encode(raw, w, h, quality):
                arr = np.frombuffer(raw, dtype=np.uint8).reshape(h, w, 4)
                bgr = np.ascontiguousarray(arr[:, :, :3])
                return simplejpeg.encode_jpeg(bgr, quality=quality, colorspace='BGR')
            print("[PipelinedCapture] Using simplejpeg encoder")
            return simplejpeg_encode
        except ImportError:
            from PIL import Image
            import io
            def pil_encode(raw, w, h, quality):
                img = Image.frombytes('RGB', (w, h), raw, 'raw', 'BGRX')
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=quality, optimize=True)
                return buf.getvalue()
            print("[PipelinedCapture] Using PIL encoder")
            return pil_encode
    
    def _capture_loop(self):
        """Background capture + encode loop."""
        self._start_time = time.time()
        while self._running:
            try:
                screenshot = self.sct.grab(self.monitor)
                jpeg = self._encoder(screenshot.raw, screenshot.size[0], 
                                     screenshot.size[1], self.quality)
                with self._lock:
                    self._latest_jpeg = jpeg
                    self._latest_time = time.time()
                    self._frame_count += 1
            except Exception as e:
                print(f"[PipelinedCapture] Capture error: {e}")
                time.sleep(0.01)
    
    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._thread.start()
        print("[PipelinedCapture] Background capture started")
    
    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)
        print("[PipelinedCapture] Stopped")
    
    def get_frame(self):
        """Get the latest JPEG frame (non-blocking). Returns (jpeg_bytes, age_ms)."""
        with self._lock:
            jpeg = self._latest_jpeg
            age = (time.time() - self._latest_time) * 1000 if self._latest_time else 9999
            return jpeg, age
    
    @property
    def fps(self):
        if not self._start_time:
            return 0
        elapsed = time.time() - self._start_time
        return self._frame_count / elapsed if elapsed > 0 else 0


class DirectCapture:
    """Non-pipelined capture for comparison (same encoder selection)."""
    
    def __init__(self, quality=60, use_turbojpeg=True):
        self.quality = quality
        self.sct = mss()
        self.monitor = self.sct.monitors[1]
        self._encoder = self._setup_encoder(use_turbojpeg)
    
    def _setup_encoder(self, use_turbojpeg):
        # Same as PipelinedCapture._setup_encoder
        if use_turbojpeg:
            try:
                import importlib.util
                spec = importlib.util.spec_from_file_location(
                    "bgra2jpeg_turbo",
                    "./bgra2jpeg_turbo.so")
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                return mod.bgra2jpeg_turbo
            except Exception:
                pass
        try:
            import simplejpeg
            def simplejpeg_encode(raw, w, h, quality):
                arr = np.frombuffer(raw, dtype=np.uint8).reshape(h, w, 4)
                bgr = np.ascontiguousarray(arr[:, :, :3])
                return simplejpeg.encode_jpeg(bgr, quality=quality, colorspace='BGR')
            return simplejpeg_encode
        except ImportError:
            from PIL import Image
            import io
            def pil_encode(raw, w, h, quality):
                img = Image.frombytes('RGB', (w, h), raw, 'raw', 'BGRX')
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=quality, optimize=True)
                return buf.getvalue()
            return pil_encode
    
    def get_frame(self):
        screenshot = self.sct.grab(self.monitor)
        jpeg = self._encoder(screenshot.raw, screenshot.size[0],
                             screenshot.size[1], self.quality)
        return jpeg


def benchmark(iterations=50):
    """Compare pipelined vs direct capture."""
    print("=== TNF Remote Relay Capture Pipeline Benchmark ===\n")
    
    # Direct capture baseline
    print("--- Direct (single-threaded) capture ---")
    direct = DirectCapture(quality=60, use_turbojpeg=True)
    times = []
    for i in range(iterations):
        t0 = time.time()
        jpeg = direct.get_frame()
        times.append(time.time() - t0)
    avg = sum(times) / len(times)
    print(f"  avg: {avg*1000:.1f}ms, FPS: {1/avg:.1f}, JPEG: {len(jpeg)//1024}KB")
    
    # Pipelined capture
    print("\n--- Pipelined (background thread) capture ---")
    piped = PipelinedCapture(quality=60, use_turbojpeg=True)
    piped.start()
    time.sleep(2)  # Let it warm up
    
    # Sample frames for 3 seconds
    sample_times = []
    sample_ages = []
    t_end = time.time() + 3
    while time.time() < t_end:
        jpeg, age = piped.get_frame()
        if jpeg:
            sample_ages.append(age)
        time.sleep(0.01)  # Simulate consumer reading at its own pace
    
    print(f"  Capture thread FPS: {piped.fps:.1f}")
    print(f"  Avg frame age: {sum(sample_ages)/len(sample_ages):.1f}ms")
    print(f"  Max frame age: {max(sample_ages):.1f}ms")
    
    piped.stop()
    
    # Downscaled capture (for AI vision)
    print("\n--- Downscaled 50% capture (AI vision mode) ---")
    sct = mss()
    monitor = sct.monitors[1]
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "bgra2jpeg_turbo",
        "./bgra2jpeg_turbo.so")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    
    times_ds = []
    for i in range(iterations):
        t0 = time.time()
        ss = sct.grab(monitor)
        raw = np.frombuffer(ss.raw, dtype=np.uint8).reshape(ss.size[1], ss.size[0], 4)
        # Downscale 50% nearest-neighbor, keep BGRA
        small = raw[::2, ::2, :].copy()
        sw, sh = small.shape[1], small.shape[0]
        # Convert BGRA→RGB for turbojpeg
        rgb = np.empty((sh, sw, 3), dtype=np.uint8)
        rgb[:,:,0] = small[:,:,2]  # R
        rgb[:,:,1] = small[:,:,1]  # G
        rgb[:,:,2] = small[:,:,0]  # B
        # Need BGRA-sized buffer for the C extension, or use turbo BGRX
        # Actually just pad back to 4 bytes for the bgra2jpeg interface
        bgra = np.empty((sh, sw, 4), dtype=np.uint8)
        bgra[:,:,:3] = small[:,:,:3]  # BGR
        bgra[:,:,3] = 255  # A
        jpeg = mod.bgra2jpeg_turbo(bgra.tobytes(), sw, sh, 60)
        times_ds.append(time.time() - t0)
    sct.close()
    
    avg_ds = sum(times_ds) / len(times_ds)
    print(f"  avg: {avg_ds*1000:.1f}ms, FPS: {1/avg_ds:.1f}, JPEG: {len(jpeg)//1024}KB")


if __name__ == "__main__":
    benchmark()

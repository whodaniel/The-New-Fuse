# TNF LLVM Forge — Native encoder build targets
# Build all: make -C scripts/native
# Requires: libjpeg, libturbojpeg, Python 3.14 dev headers

PYTHON_INC := $(shell python3.14 -c "import sysconfig; print(sysconfig.get_path('include'))")
PYTHON_LIB := $(shell python3.14 -c "import sysconfig; print(sysconfig.get_config_var('LIBDIR'))")
CC := cc
CFLAGS := -O3 -march=native -fPIC
LDFLAGS := -L/usr/local/lib -L$(PYTHON_LIB)

.PHONY: all clean benchmark

all: bgra2jpeg.so bgra2jpeg_turbo.so
	@echo "Build complete. Run 'make benchmark' to test."

bgra2jpeg.so: bgra2jpeg.c
	$(CC) $(CFLAGS) -shared -o $@ $< -I$(PYTHON_INC) $(LDFLAGS) -ljpeg -lpython3.14

bgra2jpeg_turbo.so: bgra2jpeg_turbo.c
	$(CC) $(CFLAGS) -shared -o $@ $< -I$(PYTHON_INC) $(LDFLAGS) -lturbojpeg -lpython3.14

benchmark: all
	@echo "=== Benchmarking native encoders ==="
	python3.14 -c " \
	import sys, time; sys.path.insert(0, '.'); \
	from mss import mss; \
	sct = mss(); m = sct.monitors[1]; \
	import bgra2jpeg_turbo; \
	times = []; \
	for i in range(20): \
		t0 = time.time(); \
		ss = sct.grab(m); \
		bgra2jpeg_turbo.bgra2jpeg_turbo_native(ss.raw, ss.size[0], ss.size[1], 60); \
		times.append(time.time() - t0); \
	avg = sum(times)/len(times); \
	print(f'turbojpeg BGRX: {avg*1000:.1f}ms, FPS: {1/avg:.1f}'); \
	sct.close()"

clean:
	rm -f *.so

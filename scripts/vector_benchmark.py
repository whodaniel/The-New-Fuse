import ctypes
import os
import time
import numpy as np

# Load native modules
SO_PATH_C = os.path.join(os.path.dirname(__file__), "native/vector_accelerator.so")
lib_c = ctypes.CDLL(SO_PATH_C)

SO_PATH_R = os.path.join(os.path.dirname(__file__), "native/vector_accelerator_rust.dylib")
lib_r = ctypes.CDLL(SO_PATH_R)

# Setup C types for both
for lib in [lib_c, lib_r]:
    lib.cosine_similarity.restype = ctypes.c_float
    lib.cosine_similarity.argtypes = [ctypes.POINTER(ctypes.c_float), ctypes.POINTER(ctypes.c_float), ctypes.c_int]
    lib.batch_cosine_similarity.argtypes = [
        ctypes.POINTER(ctypes.c_float), 
        ctypes.POINTER(ctypes.c_float), 
        ctypes.c_int, 
        ctypes.c_int, 
        ctypes.POINTER(ctypes.c_float)
    ]

def py_cosine_similarity(a, b):
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0: return 0.0
    return dot / (norm_a * norm_b)

def benchmark():
    DIM = 1536 # OpenAI embedding size
    COUNT = 10000
    
    print(f"[🔭] Benchmarking Vector Acceleration (Dim: {DIM}, Count: {COUNT})...")
    
    query = np.random.rand(DIM).astype(np.float32)
    matrix = np.random.rand(COUNT, DIM).astype(np.float32)
    results = np.zeros(COUNT).astype(np.float32)
    
    query_ptr = query.ctypes.data_as(ctypes.POINTER(ctypes.c_float))
    matrix_ptr = matrix.ctypes.data_as(ctypes.POINTER(ctypes.c_float))
    results_ptr = results.ctypes.data_as(ctypes.POINTER(ctypes.c_float))

    # 1. Pure Python (numpy-backed)
    t0 = time.perf_counter()
    for i in range(COUNT):
        py_cosine_similarity(query, matrix[i])
    numpy_time = time.perf_counter() - t0
    print(f"     Numpy Similarity:  {numpy_time:.4f}s")

    # 2. Native Forge (C++ SIMD)
    t0 = time.perf_counter()
    lib_c.batch_cosine_similarity(query_ptr, matrix_ptr, COUNT, DIM, results_ptr)
    native_c_time = time.perf_counter() - t0
    print(f"     Native (C++ AVX2):  {native_c_time:.4f}s")

    # 3. Native Forge (Rust Auto-SIMD)
    t0 = time.perf_counter()
    lib_r.batch_cosine_similarity(query_ptr, matrix_ptr, COUNT, DIM, results_ptr)
    native_r_time = time.perf_counter() - t0
    print(f"     Native (Rust SIMD): {native_r_time:.4f}s")
    
    print(f"\n[🏁] Results:")
    print(f"    Speedup C++ vs Numpy:  {numpy_time / native_c_time:.1f}x")
    print(f"    Speedup Rust vs Numpy: {numpy_time / native_r_time:.1f}x")
    print(f"    Native throughput: {round((COUNT * DIM) / min(native_c_time, native_r_time) / 1e6, 2)} million dimensions/sec")

if __name__ == "__main__":
    benchmark()

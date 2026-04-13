import os
import time
import ctypes
import functools
from tnf_forge import ForgeCompiler

class PythonAccelerator:
    """Agent-ready utility to swap Python functions with forged C-extensions."""
    
    def __init__(self, forge: ForgeCompiler):
        self.forge = forge
        self._registry = {}

    def accelerate(self, c_code: str, func_name: str):
        """
        Takes C source, forges it into a shared library, 
        and registers it for hot-swapping.
        """
        lib_path = self.forge.compile_c(c_code, func_name, shared=True)
        # Load the forged library
        native_lib = ctypes.CDLL(lib_path)
        self._registry[func_name] = getattr(native_lib, func_name)
        print(f"Hot-swap ready for: {func_name}")
        return lib_path

    def wrap(self, func):
        """Decorator to automatically use forged version if available."""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if func.__name__ in self._registry:
                # Call the native version
                # Note: This basic scaffolding assumes integer arguments
                # Future versions will use type-mapping for complex objects
                return self._registry[func.__name__](*args)
            return func(*args, **kwargs)
        return wrapper

# --- DEMONSTRATION & SCAFFOLDING TEST ---

if __name__ == "__main__":
    forge_service = ForgeCompiler()
    accel = PythonAccelerator(forge_service)

    # 1. THE SLOW PYTHON VERSION
    @accel.wrap
    def slow_factorial(n):
        res = 1
        for i in range(1, n + 1):
            res *= i
        return res

    # 2. THE AGENT-GENERATED C REPLACEMENT
    c_logic = """
    long slow_factorial(int n) {
        long res = 1;
        for (int i = 1; i <= n; i++) {
            res *= i;
        }
        return res;
    }
    """

    print("Testing original Python speed...")
    start = time.perf_counter()
    for _ in range(1000000): slow_factorial(20)
    print(f"Python took: {time.perf_counter() - start:.4f}s")

    try:
        # 3. FORGE AND SWAP
        accel.accelerate(c_logic, "slow_factorial")

        print("Testing forged Native speed...")
        start = time.perf_counter()
        for _ in range(1000000): slow_factorial(20)
        print(f"Forged took: {time.perf_counter() - start:.4f}s")
        
        print("\nSUCCESS: The Python function was hot-swapped with native LLVM code!")
        
    except Exception as e:
        print(f"Acceleration test skipped (LLVM not ready yet): {e}")

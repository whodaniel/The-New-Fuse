import os
import subprocess
import time
import tempfile
import shutil
from typing import List, Optional

class ForgeCompiler:
    """Interface for LLVM-backed compilers (Clang, LLC, Rustc)."""
    
    def __init__(self, output_dir: str = "bin/forged"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def compile_c(self, source_code: str, name: str, optimization_level: str = "-O3", shared: bool = False) -> str:
        return self._compile(source_code, name, "clang", ".c", optimization_level, shared)

    def compile_cpp(self, source_code: str, name: str, optimization_level: str = "-O3", shared: bool = False) -> str:
        """Compiles C++ code into a native binary or shared library using Clang++."""
        return self._compile(source_code, name, "clang++", ".cpp", optimization_level, shared)

    def compile_rust(self, source_code: str, name: str, optimization_level: str = "3") -> str:
        """Compiles Rust code into a standalone native binary."""
        with tempfile.NamedTemporaryFile(suffix=".rs", delete=False) as f:
            f.write(source_code.encode())
            source_path = f.name

        output_path = os.path.join(self.output_dir, name)
        
        # Use rustc (LLVM-based)
        cmd = ["rustc", "-C", f"opt-level={optimization_level}", source_path, "-o", output_path]
        
        print(f"Forging Rust tool: {name}...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        os.unlink(source_path)
        
        if result.returncode != 0:
            raise Exception(f"Forge failed: {result.stderr}")
            
        return output_path

    def _compile(self, source_code: str, name: str, compiler: str, suffix: str, optimization_level: str, shared: bool) -> str:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(source_code.encode())
            source_path = f.name

        extension = ".dylib" if shared else ""
        output_path = os.path.join(self.output_dir, name + extension)
        
        cmd = [compiler, optimization_level, source_path, "-o", output_path]
        if shared:
            cmd.extend(["-shared", "-fPIC"])
        if compiler == "clang++":
            cmd.append("-std=c++17")
        
        print(f"Forging {compiler} {'shared library' if shared else 'tool'}: {name}...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        os.unlink(source_path)
        
        if result.returncode != 0:
            raise Exception(f"Forge failed: {result.stderr}")
            
        return output_path

    def compile_llvm_ir(self, ir_code: str, name: str) -> str:
        """Compiles raw LLVM IR into a native binary."""
        with tempfile.NamedTemporaryFile(suffix=".ll", delete=False) as f:
            f.write(ir_code.encode())
            ir_path = f.name

        obj_path = ir_path + ".o"
        output_path = os.path.join(self.output_dir, name)

        try:
            # 1. LLVM Static Compiler (llc) to object file
            subprocess.run(["llc", "-filetype=obj", ir_path, "-o", obj_path], check=True)
            # 2. Link using Clang
            subprocess.run(["clang", obj_path, "-o", output_path], check=True)
        finally:
            if os.path.exists(ir_path): os.unlink(ir_path)
            if os.path.exists(obj_path): os.unlink(obj_path)

        return output_path

class ForgeBenchmarker:
    """Utility to compare performance between interpreted and forged code."""
    
    @staticmethod
    def run_and_time(cmd: List[str]) -> float:
        start = time.perf_counter()
        subprocess.run(cmd, capture_output=True)
        return time.perf_counter() - start

    def compare(self, original_cmd: List[str], forged_path: str):
        print("\n--- Performance Comparison ---")
        time_orig = self.run_and_time(original_cmd)
        time_forged = self.run_and_time([forged_path])
        
        speedup = time_orig / time_forged if time_forged > 0 else float('inf')
        
        print(f"Original Time: {time_orig:.4f}s")
        print(f"Forged Time:   {time_forged:.4f}s")
        print(f"Speedup:       {speedup:.1f}x faster")
        print("------------------------------\n")

if __name__ == "__main__":
    # Example Scaffolding Test: A simple heavy math loop
    sample_c_code = """
    #include <stdio.h>
    int main() {
        double result = 0;
        for (long i = 0; i < 100000000; i++) {
            result += i * 0.00001;
        }
        printf("Result: %f\\n", result);
        return 0;
    }
    """
    
    forge = ForgeCompiler()
    try:
        binary = forge.compile_c(sample_c_code, "math_speed_test")
        print(f"Successfully forged: {binary}")
        
        # Test it
        bench = ForgeBenchmarker()
        # Compare vs a hypothetical python equivalent
        # bench.compare(["python3", "-c", "print(sum(i * 0.00001 for i in range(100000000)))"], binary)
        
    except Exception as e:
        print(f"Forge test failed (likely LLVM not yet in path): {e}")

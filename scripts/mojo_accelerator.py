import os
import subprocess
import ctypes
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
DEFAULT_FORGE_DIR = os.path.join(PROJECT_ROOT, "forge")

class MojoAccelerator:
    """
    TNF Next-Gen: Mojo JIT Bridge
    Compiles Mojo source into LLVM-IR shared libraries for hot-swapping.
    """
    
    def __init__(self, forge_dir=DEFAULT_FORGE_DIR):
        self.forge_dir = forge_dir
        self._registry = {}

    def forge_mojo_kernel(self, mojo_code: str, kernel_name: str):
        """
        Takes Mojo source, compiles via --emit-llvm, and links to shared object.
        """
        source_path = os.path.join(self.forge_dir, f"{kernel_name}.mojo")
        lib_path = os.path.join(self.forge_dir, f"lib{kernel_name}.so")
        
        with open(source_path, "w") as f:
            f.write(mojo_code)
            
        print(f"[Mojo-Accelerator] Forging kernel: {kernel_name}")
        
        try:
            # Check if mojo is available locally
            has_mojo = subprocess.run(["which", "mojo"], capture_output=True).returncode == 0
            
            if has_mojo:
                # 1. Emit LLVM IR locally
                subprocess.run(["mojo", "build", "--emit-llvm", "-o", f"{source_path}.ll", source_path], check=True)
            else:
                # 1. Fallback: Use Docker for compilation
                print(f"[Mojo-Accelerator] Local 'mojo' not found. Failing over to containerized forge...")
                subprocess.run([
                    "docker", "run", "--rm", 
                    "-v", f"{self.forge_dir}:/forge", 
                    "tnf-mojo-forge", 
                    "mojo", "build", "--emit-llvm", "-o", f"{kernel_name}.mojo.ll", f"{kernel_name}.mojo"
                ], check=True)
            
            # 2. Use Clang to link the LLVM IR into a shared library
            # Note: This is the 'Tri-Layer' link-time optimization (WPO)
            subprocess.run(["clang", "-shared", "-o", lib_path, f"{source_path}.ll"], check=True)
            
            # 3. Load into process memory
            native_lib = ctypes.CDLL(lib_path)
            self._registry[kernel_name] = native_lib
            
            print(f"[SUCCESS] {kernel_name} kernel is now NATIVE and LIVE.")
            return lib_path
        except Exception as e:
            print(f"[FAILURE] Could not forge Mojo kernel: {e}")
            return None

    def call_kernel(self, kernel_name: str, func_name: str, *args):
        """Invoke a forged Mojo function."""
        if kernel_name in self._registry:
            func = getattr(self._registry[kernel_name], func_name)
            return func(*args)
        else:
            print(f"[Error] Kernel {kernel_name} not found in registry.")
            return None

if __name__ == "__main__":
    accel = MojoAccelerator()
    print("Mojo Accelerator initialized. Ready for Next-Gen deconstruction.")

import os
import time
import ctypes
import functools
from typing import Any, List, Optional, Dict
from tnf_forge import ForgeCompiler

class PythonAccelerator:
    """Agent-ready utility to swap Python functions with forged C-extensions."""
    
    def __init__(self, forge: ForgeCompiler):
        self.forge = forge
        self._registry: Dict[str, Dict[str, Any]] = {}

    def accelerate(self, 
                   source_code: str, 
                   func_name: str, 
                   argtypes: List[Any] = None, 
                   restype: Any = None,
                   free_func_name: Optional[str] = None):
        """
        Takes source code, forges it into a shared library, 
        and registers it for hot-swapping.
        """
        # Auto-detect language
        if "fn " in source_code or "pub " in source_code:
            lib_path = self.forge.compile_rust(source_code, func_name, shared=True)
        elif "class " in source_code or "template<" in source_code:
            lib_path = self.forge.compile_cpp(source_code, func_name, shared=True)
        else:
            lib_path = self.forge.compile_c(source_code, func_name, shared=True)
            
        # Load the forged library
        native_lib = ctypes.CDLL(lib_path)
        func = getattr(native_lib, func_name)
        
        if argtypes:
            func.argtypes = argtypes
        if restype:
            func.restype = restype
            
        free_func = None
        if free_func_name:
            free_func = getattr(native_lib, free_func_name)
            free_func.argtypes = [ctypes.c_void_p]
            
        self._registry[func_name] = {
            "func": func,
            "lib": native_lib,
            "path": lib_path,
            "restype": restype,
            "free_func": free_func
        }
        
        print(f"[🔥] Forge Hot-swap active: {func_name} ({lib_path})")
        return lib_path

    def wrap(self, func):
        """Decorator to automatically use forged version if available."""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            entry = self._registry.get(func.__name__)
            if entry:
                native_func = entry["func"]
                restype = entry["restype"]
                free_func = entry["free_func"]
                
                # Auto-encode strings to bytes
                processed_args = []
                for arg in args:
                    if isinstance(arg, str):
                        processed_args.append(arg.encode('utf-8'))
                    else:
                        processed_args.append(arg)
                
                # Call native
                res = native_func(*processed_args)
                
                # Auto-decode result if it's a pointer to a string (c_void_p or c_char_p)
                if restype in (ctypes.c_void_p, ctypes.c_char_p) and res:
                    raw_bytes = ctypes.string_at(res)
                    py_res = raw_bytes.decode('utf-8')
                    
                    # Free the C-allocated memory if free_func was provided
                    if free_func:
                        free_func(res)
                        
                    return py_res
                
                return res
            return func(*args, **kwargs)
        return wrapper

import os
import ctypes
from tnf_forge import ForgeCompiler

class NativeAudioForge:
    """Forges high-speed spectral detectors using Accelerate.framework."""
    
    def __init__(self, forge: ForgeCompiler):
        self.forge = forge
        self.so_path = os.path.join(os.path.dirname(__file__), "native/audio_spectral_matcher.so")
        self._lib = None
        if os.path.exists(self.so_path):
            self._lib = ctypes.CDLL(self.so_path)
            self._setup_ctypes()

    def _setup_ctypes(self):
        self._lib.create_analyzer.restype = ctypes.c_void_p
        self._lib.create_analyzer.argtypes = [ctypes.c_int]
        self._lib.check_frequency.restype = ctypes.c_bool
        self._lib.check_frequency.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_float), ctypes.c_int, ctypes.c_float]

    def forge_spectral_trigger(self, snippet_name: str, target_frequency: int):
        """
        Forges a C++ binary that monitors raw audio for a specific frequency spike.
        Uses Accelerate.framework for hardware acceleration.
        """
        cpp_code = f"""
        #include <Accelerate/Accelerate.h>
        #include <cmath>

        extern "C" {{
            bool check_{snippet_name}(float* buffer, int size, float threshold) {{
                int n = size;
                int log2n = log2(n);
                FFTSetup setup = vDSP_create_fftsetup(log2n, FFT_RADIX2);
                DSPSplitComplex complex;
                complex.realp = new float[n/2];
                complex.imagp = new float[n/2];
                
                vDSP_ctoz((DSPComplex*)buffer, 2, &complex, 1, n/2);
                vDSP_fft_zrip(setup, &complex, 1, log2n, FFT_FORWARD);
                
                int target_bin = (int)({target_frequency} * n / 44100.0);
                float r = complex.realp[target_bin];
                float i = complex.imagp[target_bin];
                float mag = sqrt(r*r + i*i) / (n/2);
                
                delete[] complex.realp;
                delete[] complex.imagp;
                vDSP_destroy_fftsetup(setup);
                
                return mag > threshold;
            }}
        }}
        """
        binary_path = self.forge.compile_cpp(cpp_code, f"trigger_{snippet_name}", shared=True, extra_args=["-framework", "Accelerate"])
        print(f"Native Audio Trigger Forged for '{snippet_name}': {binary_path}")
        return binary_path

if __name__ == "__main__":
    forge_service = ForgeCompiler()
    audio_forge = NativeAudioForge(forge_service)
    
    try:
        # Forge a real high-speed trigger for a 1000Hz tone
        audio_forge.forge_spectral_trigger("tone_1000hz", 1000)
        print("SUCCESS: Native Audio Trigger (Accelerate-backed) is ready.")
    except Exception as e:
        print(f"Audio Forge test failed: {e}")

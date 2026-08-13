/**
 * audio_spectral_matcher.cpp — Native macOS spectral trigger (LLVM Forge)
 * 
 * Uses Accelerate.framework (vDSP) for hardware-accelerated FFT.
 * Target: <1ms latency for frequency peak detection in live PCM streams.
 */

#include <iostream>
#include <vector>
#include <cmath>
#include <Accelerate/Accelerate.h>

extern "C" {

    typedef struct {
        FFTSetup fftSetup;
        DSPSplitComplex splitComplex;
        float* window;
        int n;
        int log2n;
    } SpectralAnalyzer;

    SpectralAnalyzer* create_analyzer(int n) {
        SpectralAnalyzer* sa = new SpectralAnalyzer();
        sa->n = n;
        sa->log2n = log2(n);
        sa->fftSetup = vDSP_create_fftsetup(sa->log2n, FFT_RADIX2);
        
        sa->splitComplex.realp = new float[n/2];
        sa->splitComplex.imagp = new float[n/2];
        
        sa->window = new float[n];
        vDSP_hann_window(sa->window, n, vDSP_HANN_NORM);
        
        return sa;
    }

    void destroy_analyzer(SpectralAnalyzer* sa) {
        vDSP_destroy_fftsetup(sa->fftSetup);
        delete[] sa->splitComplex.realp;
        delete[] sa->splitComplex.imagp;
        delete[] sa->window;
        delete sa;
    }

    /**
     * Checks if a target frequency bin exceeds a threshold.
     * buffer: raw float PCM (normalized -1.0 to 1.0)
     * target_bin: index in the FFT output
     */
    bool check_frequency(SpectralAnalyzer* sa, float* buffer, int target_bin, float threshold) {
        // 1. Apply Hann window
        std::vector<float> windowed(sa->n);
        vDSP_vmul(buffer, 1, sa->window, 1, windowed.data(), 1, sa->n);
        
        // 2. Pack into split complex format
        vDSP_ctoz((DSPComplex*)windowed.data(), 2, &sa->splitComplex, 1, sa->n / 2);
        
        // 3. Perform forward FFT
        vDSP_fft_zrip(sa->fftSetup, &sa->splitComplex, 1, sa->log2n, FFT_FORWARD);
        
        // 4. Calculate magnitudes (simplified for speed)
        // Magnitude at target_bin
        if (target_bin >= sa->n / 2) return false;
        
        float r = sa->splitComplex.realp[target_bin];
        float i = sa->splitComplex.imagp[target_bin];
        float mag = sqrt(r*r + i*i) / (sa->n / 2);
        
        return mag > threshold;
    }

    /**
     * Returns the strongest frequency bin in the buffer.
     */
    int get_peak_bin(SpectralAnalyzer* sa, float* buffer) {
        std::vector<float> windowed(sa->n);
        vDSP_vmul(buffer, 1, sa->window, 1, windowed.data(), 1, sa->n);
        vDSP_ctoz((DSPComplex*)windowed.data(), 2, &sa->splitComplex, 1, sa->n / 2);
        vDSP_fft_zrip(sa->fftSetup, &sa->splitComplex, 1, sa->log2n, FFT_FORWARD);
        
        float max_mag = 0;
        int peak_bin = 0;
        
        for (int j = 1; j < sa->n / 2; j++) {
            float r = sa->splitComplex.realp[j];
            float i = sa->splitComplex.imagp[j];
            float mag = r*r + i*i;
            if (mag > max_mag) {
                max_mag = mag;
                peak_bin = j;
            }
        }
        return peak_bin;
    }
}

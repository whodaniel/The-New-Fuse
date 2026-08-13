/**
 * vector_accelerator.cpp — SIMD-accelerated vector similarity (LLVM Forge)
 * 
 * Uses AVX2/SSE instructions for high-speed dot product and cosine similarity.
 * Target: >100M dimensions/sec on modern Intel/M-series hardware.
 */

#include <iostream>
#include <vector>
#include <cmath>

#ifdef __x86_64__
#include <immintrin.h>
#endif

extern "C" {

    /**
     * Dot product of two float vectors using AVX2 if available.
     */
    float dot_product(const float* a, const float* b, int n) {
        float sum = 0.0f;
        int i = 0;

#ifdef __x86_64__
        // AVX2 path
        __m256 vsum = _mm256_setzero_ps();
        for (; i <= n - 8; i += 8) {
            __m256 va = _mm256_loadu_ps(&a[i]);
            __m256 vb = _mm256_loadu_ps(&b[i]);
            vsum = _mm256_add_ps(vsum, _mm256_mul_ps(va, vb));
        }
        
        // Horizontal sum of the 8 floats in vsum
        float tmp[8];
        _mm256_storeu_ps(tmp, vsum);
        for (int j = 0; j < 8; j++) sum += tmp[j];
#endif

        // Remainder/Scalar path
        for (; i < n; i++) {
            sum += a[i] * b[i];
        }

        return sum;
    }

    /**
     * L2 Norm (magnitude) of a vector.
     */
    float l2_norm(const float* a, int n) {
        return sqrt(dot_product(a, a, n));
    }

    /**
     * Cosine similarity between two vectors.
     */
    float cosine_similarity(const float* a, const float* b, int n) {
        float dot = dot_product(a, b, n);
        float norm_a = l2_norm(a, n);
        float norm_b = l2_norm(b, n);
        
        if (norm_a == 0 || norm_b == 0) return 0.0f;
        return dot / (norm_a * norm_b);
    }

    /**
     * Batch similarity search: compares query vector against a matrix of vectors.
     * query: query vector (size dim)
     * matrix: flat array of vectors (size count * dim)
     * results: output array for scores (size count)
     */
    void batch_cosine_similarity(const float* query, const float* matrix, int count, int dim, float* results) {
        for (int i = 0; i < count; i++) {
            results[i] = cosine_similarity(query, &matrix[i * dim], dim);
        }
    }
}

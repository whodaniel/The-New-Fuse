
    #include <immintrin.h>
    #include <cmath>
    #include <cstdio>

    extern "C" {
        void batch_cosine_similarity(const float* query, const float* matrix, int count, int dim, float* results) {
            for (int i = 0; i < count; i++) {
                const float* b = &matrix[i * dim];
                float dot = 0.0f;
                float norm_a = 0.0f;
                float norm_b = 0.0f;
                
                int j = 0;
                __m256 vdot = _mm256_setzero_ps();
                __m256 vnorm_a = _mm256_setzero_ps();
                __m256 vnorm_b = _mm256_setzero_ps();
                
                for (; j <= dim - 8; j += 8) {
                    __m256 va = _mm256_loadu_ps(&query[j]);
                    __m256 vb = _mm256_loadu_ps(&b[j]);
                    vdot = _mm256_add_ps(vdot, _mm256_mul_ps(va, vb));
                    vnorm_a = _mm256_add_ps(vnorm_a, _mm256_mul_ps(va, va));
                    vnorm_b = _mm256_add_ps(vnorm_b, _mm256_mul_ps(vb, vb));
                }
                
                float tmp_dot[8], tmp_na[8], tmp_nb[8];
                _mm256_storeu_ps(tmp_dot, vdot);
                _mm256_storeu_ps(tmp_na, vnorm_a);
                _mm256_storeu_ps(tmp_nb, vnorm_b);
                
                for (int k = 0; k < 8; k++) {
                    dot += tmp_dot[k];
                    norm_a += tmp_na[k];
                    norm_b += tmp_nb[k];
                }
                
                // Remainder
                for (; j < dim; j++) {
                    dot += query[j] * b[j];
                    norm_a += query[j] * query[j];
                    norm_b += b[j] * b[j];
                }
                
                float na = sqrt(norm_a);
                float nb = sqrt(norm_b);
                results[i] = (na == 0 || nb == 0) ? 0.0f : dot / (na * nb);
                // printf("Doc %d: dot=%f, na=%f, nb=%f, sim=%f\n", i, dot, na, nb, results[i]);
            }
        }
    }
    
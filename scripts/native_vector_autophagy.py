import os
import sys
from tnf_forge import ForgeCompiler

def forge_vector_synapse():
    """
    Phase 3.2: Forge the Native Vector Synapse.
    Combines C++ AVX2 math with Rust/Axum networking.
    """
    forge = ForgeCompiler()
    
    # 1. Compile the C++ AVX2 math object
    cpp_code = """
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
                // printf("Doc %d: dot=%f, na=%f, nb=%f, sim=%f\\n", i, dot, na, nb, results[i]);
            }
        }
    }
    """
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    cpp_path = os.path.join(base_dir, "native/vector_math.cpp")
    
    with open(cpp_path, "w") as f:
        f.write(cpp_code)
    
    print("Forging C++ AVX2 math core...")
    os.system(f"clang++ -O3 -mavx2 -c {cpp_path} -o {os.path.join(base_dir, 'native/vector_math.o')}")

    # 2. Forge the Rust Server
    cargo_toml = """
[package]
name = "vector-synapse"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = { version = "0.7", features = ["macros"] }
tokio = { version = "1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
dashmap = "5.5"
uuid = { version = "1.4", features = ["v4"] }

[build-dependencies]
cc = "1.0"
"""

    main_rs = """
use axum::{
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use dashmap::DashMap;
use std::env;
use log::{info, error};

extern "C" {
    fn batch_cosine_similarity(query: *const f32, matrix: *const f32, count: i32, dim: i32, results: *mut f32);
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct VectorDoc {
    id: String,
    embedding: Vec<f32>,
    metadata: serde_json::Value,
}

#[derive(Deserialize, Debug)]
struct SearchQuery {
    embedding: Vec<f32>,
    limit: usize,
    threshold: f32,
}

#[derive(Serialize)]
struct SearchResult {
    id: String,
    score: f32,
    metadata: serde_json::Value,
}

type Store = Arc<DashMap<String, VectorDoc>>;

#[tokio::main]
async fn main() {
    env_logger::init();
    let store: Store = Arc::new(DashMap::new());

    let app = Router::new()
        .route("/vectors", post(add_vectors))
        .route("/search", post(search_vectors))
        .route("/health", get(|| async { "healthy" }))
        .with_state(store);
    
    let port_str = env::var("VECTOR_SYNAPSE_PORT").unwrap_or_else(|_| "3007".to_string());
    let port: u16 = port_str.parse().expect("Invalid port number");

    info!("[🧬] Native Vector Synapse Active on Port {}", port);
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn add_vectors(
    axum::extract::State(store): axum::extract::State<Store>,
    Json(docs): Json<Vec<VectorDoc>>,
) -> Json<serde_json::Value> {
    info!("[+] Adding {} vectors to store", docs.len());
    for doc in docs {
        store.insert(doc.id.clone(), doc);
    }
    Json(serde_json::json!({ "status": "ok" }))
}

async fn search_vectors(
    axum::extract::State(store): axum::extract::State<Store>,
    Json(query): Json<SearchQuery>,
) -> Json<Vec<SearchResult>> {
    let dim = query.embedding.len();
    let count = store.len();
    info!("[?] Searching {} vectors (dim: {})", count, dim);
    if count == 0 { return Json(vec![]); }

    let mut ids = Vec::with_capacity(count);
    let mut matrix = Vec::with_capacity(count * dim);
    let mut metadatas = Vec::with_capacity(count);

    for entry in store.iter() {
        if entry.value().embedding.len() != dim {
           error!("[!] Warning: Vector {} has dim {}, expected {}", entry.key(), entry.value().embedding.len(), dim);
           continue;
        }
        ids.push(entry.key().clone());
        matrix.extend_from_slice(&entry.value().embedding);
        metadatas.push(entry.value().metadata.clone());
    }

    let actual_count = ids.len();
    let mut results = vec![0.0f32; actual_count];

    unsafe {
        batch_cosine_similarity(
            query.embedding.as_ptr(),
            matrix.as_ptr(),
            actual_count as i32,
            dim as i32,
            results.as_mut_ptr(),
        );
    }

    let mut final_results: Vec<SearchResult> = ids.into_iter()
        .zip(results.into_iter())
        .zip(metadatas.into_iter())
        .map(|((id, score), metadata)| {
            SearchResult { id, score, metadata }
        })
        .filter(|r| r.score >= query.threshold)
        .collect();

    final_results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    info!("[!] Found {} matches above threshold", final_results.len());
    final_results.truncate(query.limit);

    Json(final_results)
}
"""

    project_dir = os.path.join(base_dir, "bin/forged/vector-synapse_project")
    os.makedirs(os.path.join(project_dir, "src"), exist_ok=True)
    
    with open(os.path.join(project_dir, "Cargo.toml"), "w") as f:
        f.write(cargo_toml)
    with open(os.path.join(project_dir, "src/main.rs"), "w") as f:
        f.write(main_rs)
    
    build_rs = f"""
fn main() {{
    cc::Build::new()
        .cpp(true)
        .flag("-mavx2")
        .flag("-O3")
        .file("{cpp_path}")
        .compile("vector_math");
}}
"""
    with open(os.path.join(project_dir, "build.rs"), "w") as f:
        f.write(build_rs)
        
    print(f"Forging Vector Synapse project at {project_dir}...")
    
if __name__ == "__main__":
    forge_vector_synapse()

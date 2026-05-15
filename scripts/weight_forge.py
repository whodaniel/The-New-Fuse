import json
import os
import sys

# Data Sources
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
TRAINING_DATA = os.path.join(PROJECT_ROOT, "scripts", "native", "codebase_training_data.json")
CONCORDANCE_STATS = {
    "relay": 1706,
    "message": 16674,
    "storage": 2061,
    "memory": 1650,
    "timeout": 2977
}

def forge_weight_matrix():
    print("[⚒️] Forging Weight Matrix for 'codebase_intuition_v1'...")
    
    with open(TRAINING_DATA, 'r') as f:
        relationships = json.load(f)
    
    # We'll create a simple lookup weights for the top 5 keywords
    # to their top 5 associated packages based on the map.
    keywords = list(CONCORDANCE_STATS.keys())
    
    # Find package-keyword associations
    scores = {kw: {} for kw in keywords}
    for rel in relationships:
        for kw in keywords:
            if kw in rel['source'].lower() or kw in rel['target'].lower():
                pkg = rel['source'] # Assuming source is a parent or container
                scores[kw][pkg] = scores[kw].get(pkg, 0) + 1

    # Extract top 5 targets per keyword
    top_targets = {}
    for kw, targets in scores.items():
        top_targets[kw] = sorted(targets.items(), key=lambda x: x[1], reverse=True)[:5]

    # Generate C++ Weight Array
    cpp_code = """
    #include <immintrin.h>
    #include <string.h>
    #include <stdio.h>

    // Synthesized Weights: Keyword -> Target Node Score
    // Format: [KW_INDEX][TARGET_INDEX]
    float weights[5][5] = {
    """
    
    for i, kw in enumerate(keywords):
        vals = [float(t[1]) for t in top_targets[kw]]
        while len(vals) < 5: vals.append(0.0) # Padding
        cpp_code += "        {" + ", ".join([str(v) + "f" for v in vals]) + "},"
        cpp_code += f" // {kw}: " + ", ".join([t[0] for t in top_targets[kw]]) + "\n"
        
    cpp_code += """    };

    extern "C" {
        /**
         * Infers the top structural match for a keyword index.
         * Returns the index of the highest-scoring structural target.
         */
        int infer_structural_match(int kw_index) {
            if (kw_index < 0 || kw_index >= 5) return -1;
            
            float* row = weights[kw_index];
            float max_val = -1.0f;
            int best_idx = -1;
            
            for(int i = 0; i < 5; i++) {
                if (row[i] > max_val) {
                    max_val = row[i];
                    best_idx = i;
                }
            }
            return best_idx;
        }
        
        /**
         * Bulk inference pass (AVX2-ready placeholder).
         */
        void batch_infer(const float* inputs, int count, float* outputs) {
             // ... future MLIR expansion point ...
        }
    }
    """
    
    output_path = os.path.join(PROJECT_ROOT, "scripts", "native", "weight_forge_output.cpp")
    with open(output_path, 'w') as f:
        f.write(cpp_code)
        
    print(f"[✅] Weight Matrix Forged: {output_path}")
    return keywords, top_targets

if __name__ == "__main__":
    kw, targets = forge_weight_matrix()
    for k in kw:
        print(f"  {k} targets: {[t[0] for t in targets[k]]}")

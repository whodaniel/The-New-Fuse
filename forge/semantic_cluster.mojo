from math import sqrt

@export
fn calculate_cosine_similarity(vecA: UnsafePointer[Float32], vecB: UnsafePointer[Float32], dim: Int) -> Float32:
    var dot_product: Float32 = 0.0
    var norm_a: Float32 = 0.0
    var norm_b: Float32 = 0.0
    
    for i in range(dim):
        let a = vecA[i]
        let b = vecB[i]
        dot_product += a * b
        norm_a += a * a
        norm_b += b * b
        
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
        
    return dot_product / (sqrt(norm_a) * sqrt(norm_b))

@export
fn semantic_cluster(vectors: UnsafePointer[Float32], num_shards: Int, dim: Int, threshold: Float32, output_clusters: UnsafePointer[Int]) -> Int:
    var current_cluster_id: Int = 0
    
    for i in range(num_shards):
        if output_clusters[i] != -1:
            continue
            
        output_clusters[i] = current_cluster_id
        let vec_i = vectors.offset(i * dim)
        
        for j in range(i + 1, num_shards):
            if output_clusters[j] != -1:
                continue
                
            let vec_j = vectors.offset(j * dim)
            let similarity = calculate_cosine_similarity(vec_i, vec_j, dim)
            
            if similarity >= threshold:
                output_clusters[j] = current_cluster_id
                
        current_cluster_id += 1
        
    return current_cluster_id
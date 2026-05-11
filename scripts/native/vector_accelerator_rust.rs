use std::slice;

#[no_mangle]
pub extern "C" fn dot_product(a: *const f32, b: *const f32, len: usize) -> f32 {
    let a_slice = unsafe { slice::from_raw_parts(a, len) };
    let b_slice = unsafe { slice::from_raw_parts(b, len) };
    
    a_slice.iter()
        .zip(b_slice.iter())
        .map(|(x, y)| x * y)
        .sum()
}

#[no_mangle]
pub extern "C" fn l2_norm(a: *const f32, len: usize) -> f32 {
    dot_product(a, a, len).sqrt()
}

#[no_mangle]
pub extern "C" fn cosine_similarity(a: *const f32, b: *const f32, len: usize) -> f32 {
    let dot = dot_product(a, b, len);
    let norm_a = l2_norm(a, len);
    let norm_b = l2_norm(b, len);
    
    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }
    dot / (norm_a * norm_b)
}

#[no_mangle]
pub extern "C" fn batch_cosine_similarity(
    query: *const f32,
    matrix: *const f32,
    count: usize,
    dim: usize,
    results: *mut f32
) {
    let query_slice = unsafe { slice::from_raw_parts(query, dim) };
    let matrix_slice = unsafe { slice::from_raw_parts(matrix, count * dim) };
    let results_slice = unsafe { slice::from_raw_parts_mut(results, count) };

    for i in 0..count {
        let start = i * dim;
        let end = start + dim;
        let row = &matrix_slice[start..end];
        
        let dot: f32 = query_slice.iter().zip(row.iter()).map(|(x, y)| x * y).sum();
        let norm_a: f32 = query_slice.iter().map(|x| x * x).sum::<f32>().sqrt();
        let norm_b: f32 = row.iter().map(|x| x * x).sum::<f32>().sqrt();
        
        results_slice[i] = if norm_a == 0.0 || norm_b == 0.0 {
            0.0
        } else {
            dot / (norm_a * norm_b)
        };
    }
}

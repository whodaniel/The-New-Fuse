use glob_match::glob_match;
use std::ffi::CStr;
use std::os::raw::c_char;

#[no_mangle]
pub extern "C" fn matches_pattern(value: *const c_char, pattern: *const c_char) -> bool {
    if value.is_null() || pattern.is_null() {
        return false;
    }

    let c_value = unsafe { CStr::from_ptr(value) };
    let c_pattern = unsafe { CStr::from_ptr(pattern) };

    let value_str = match c_value.to_str() {
        Ok(s) => s,
        Err(_) => return false,
    };

    let pattern_str = match c_pattern.to_str() {
        Ok(s) => s,
        Err(_) => return false,
    };

    glob_match(pattern_str, value_str)
}

#[no_mangle]
pub extern "C" fn matches_any_pattern(value: *const c_char, patterns_json: *const c_char) -> bool {
    if value.is_null() || patterns_json.is_null() {
        return false;
    }

    let c_value = unsafe { CStr::from_ptr(value) };
    let c_patterns = unsafe { CStr::from_ptr(patterns_json) };

    let value_str = match c_value.to_str() {
        Ok(s) => s,
        Err(_) => return false,
    };

    let patterns_str = match c_patterns.to_str() {
        Ok(s) => s,
        Err(_) => return false,
    };

    let patterns: Vec<String> = match serde_json::from_str(patterns_str) {
        Ok(p) => p,
        Err(_) => return false,
    };

    patterns.iter().any(|p| glob_match(p, value_str))
}

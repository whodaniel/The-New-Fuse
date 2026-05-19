#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/**
 * Native text cleaner for TNF Forge.
 * Collapses multiple whitespace chars into a single space and truncates.
 */
char* clean_text_native(const char* input, int max_chars) {
    if (!input) return NULL;
    
    size_t len = strlen(input);
    char* output = (char*)malloc(len + 1);
    if (!output) return NULL;
    
    int out_idx = 0;
    int in_whitespace = 0;
    int first_char = 1;
    
    for (size_t i = 0; i < len; i++) {
        if (isspace(input[i])) {
            if (!in_whitespace && !first_char) {
                output[out_idx++] = ' ';
                in_whitespace = 1;
            }
        } else {
            output[out_idx++] = input[i];
            in_whitespace = 0;
            first_char = 0;
        }
        
        // Stop if we hit the limit
        if (out_idx >= max_chars) {
            break;
        }
    }
    
    // Trim trailing space
    if (out_idx > 0 && output[out_idx - 1] == ' ') {
        out_idx--;
    }
    
    // Add ellipsis if truncated
    if (out_idx >= max_chars - 3 && len > (size_t)out_idx) {
        if (out_idx > max_chars - 3) out_idx = max_chars - 3;
        output[out_idx++] = '.';
        output[out_idx++] = '.';
        output[out_idx++] = '.';
    }
    
    output[out_idx] = '\0';
    return output;
}

// Free memory allocated by C
void free_string(char* ptr) {
    free(ptr);
}

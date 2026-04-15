#!/bin/bash

RESULTS_DIR="./page-analysis-results/all-pages"
mkdir -p "$RESULTS_DIR"

echo "🔍 Starting comprehensive page search..."

# 1. Find all potential page files
echo "Finding all UI and page files..."
find . -type f \( \
    -name "*.tsx" -o \
    -name "*.jsx" -o \
    -name "*.vue" -o \
    -name "*.svelte" \
\) -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/.next/*" > "$RESULTS_DIR/all-ui-files.txt"

# 2. Find files with Page/View/Screen in their name
echo "Finding files with Page/View/Screen naming..."
find . -type f \( \
    -name "*Page*.tsx" -o \
    -name "*View*.tsx" -o \
    -name "*Screen*.tsx" -o \
    -name "*Page*.jsx" -o \
    -name "*View*.jsx" -o \
    -name "*Screen*.jsx" \
\) -not -path "*/node_modules/*" > "$RESULTS_DIR/page-named-files.txt"

# 3. Search for page-like component definitions
echo "Searching for page-like component definitions..."
grep -r "export.*\(class\|function\|const\).*\(Page\|View\|Screen\)" \
    --include="*.tsx" \
    --include="*.jsx" \
    . > "$RESULTS_DIR/page-components.txt"

# 4. Find route definitions
echo "Finding route definitions..."
grep -r "Route.*path=" \
    --include="*.tsx" \
    --include="*.jsx" \
    . > "$RESULTS_DIR/routes.txt"

# 5. Search in specific directories
echo "Searching in common page directories..."
for dir in "pages" "views" "screens" "routes" "containers"; do
    find . -type d -name "$dir" -not -path "*/node_modules/*" \
        -exec find {} -type f \( -name "*.tsx" -o -name "*.jsx" \) \; \
        >> "$RESULTS_DIR/directory-pages.txt"
done

# 6. Analyze and consolidate results
echo "Analyzing results..."
echo "Summary:" > "$RESULTS_DIR/summary.txt"
echo "----------------------------------------" >> "$RESULTS_DIR/summary.txt"
echo "Total UI files found: $(wc -l < "$RESULTS_DIR/all-ui-files.txt")" >> "$RESULTS_DIR/summary.txt"
echo "Files with Page/View/Screen in name: $(wc -l < "$RESULTS_DIR/page-named-files.txt")" >> "$RESULTS_DIR/summary.txt"
echo "Page component definitions found: $(wc -l < "$RESULTS_DIR/page-components.txt")" >> "$RESULTS_DIR/summary.txt"
echo "Route definitions found: $(wc -l < "$RESULTS_DIR/routes.txt")" >> "$RESULTS_DIR/summary.txt"
echo "Pages in standard directories: $(wc -l < "$RESULTS_DIR/directory-pages.txt")" >> "$RESULTS_DIR/summary.txt"

echo "✅ Search complete. Results saved in $RESULTS_DIR"
echo "Run 'cat $RESULTS_DIR/summary.txt' to see the summary"
#!/bin/bash
# TNF Codebase Color Audit Agent - Google/Gemini
TNF_DIR="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse"

echo "[AGENT-2] Starting codebase color/contrast audit..."

# Find the SAAS app directory
SAAS_DIR=$(find "$TNF_DIR/packages" -maxdepth 2 -name "package.json" -path "*/saas/*" -o -name "package.json" -path "*/app/*" 2>/dev/null | head -1 | xargs dirname 2>/dev/null)

if [ -z "$SAAS_DIR" ]; then
  echo "[AGENT-2] Searching for SAAS app directory..."
  SAAS_DIR=$(find "$TNF_DIR" -maxdepth 4 -name "App.tsx" -o -name "App.jsx" 2>/dev/null | head -1 | xargs dirname 2>/dev/null)
fi

echo "[AGENT-2] SAAS dir: $SAAS_DIR"

# Search for nexus and workflow components
echo ""
echo "[AGENT-2] === NEXUS COMPONENTS ==="
find "$TNF_DIR" -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -path "*nexus*" 2>/dev/null | head -20

echo ""
echo "[AGENT-2] === WORKFLOW COMPONENTS ==="
find "$TNF_DIR" -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -path "*workflow*" 2>/dev/null | head -20

echo ""
echo "[AGENT-2] === DASHBOARD COMPONENTS ==="
find "$TNF_DIR" -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -path "*dashboard*" 2>/dev/null | head -20

# Search for color/contrast issues in CSS
echo ""
echo "[AGENT-2] === POTENTIAL CONTRAST ISSUES (dark text on dark bg) ==="
# Look for: dark background colors with dark text colors in same file
find "$TNF_DIR/packages" -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" \) 2>/dev/null | while read f; do
  # Check for gray/dark color combinations that might cause issues
  if grep -q "text-gray-[5-9]\|text-slate-[5-9]\|text-zinc-[5-9]\|text-neutral-[5-9]\|text-stone-[5-9]" "$f" 2>/dev/null &&      grep -q "bg-gray-[7-9]\|bg-slate-[7-9]\|bg-zinc-[7-9]\|bg-neutral-[7-9]\|bg-stone-[7-9]\|bg-black\|bg-gray-9\|bg-slate-9\|bg-zinc-9" "$f" 2>/dev/null; then
    echo "SUSPECT: $f"
  fi
done

# Look for inline style color issues
echo ""
echo "[AGENT-2] === INLINE STYLE COLOR ISSUES ==="
find "$TNF_DIR/packages" -type f \( -name "*.tsx" -o -name "*.jsx" \) 2>/dev/null | xargs grep -l "style={{.*color" 2>/dev/null | head -20

# Look for opacity issues
echo ""
echo "[AGENT-2] === OPACITY ISSUES (potential readability problems) ==="
find "$TNF_DIR/packages" -type f \( -name "*.tsx" -o -name "*.jsx" \) 2>/dev/null | xargs grep -n "opacity-\|opacity:" 2>/dev/null | grep -v "node_modules" | head -30

echo "[AGENT-2] Codebase audit complete."

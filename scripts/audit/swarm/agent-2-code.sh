#!/bin/bash
# Use default model (nvidia/meta/llama-3.3-70b-instruct)
TNF_DIR="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse"

echo "[AGENT-2] Starting codebase color/contrast audit (using nvidia)..." >> $HOME/tnf-swarm-audit/agent2-code.log

# Find SAAS app
SAAS_DIR=$(find "$TNF_DIR/packages" -maxdepth 2 -name "package.json" -path "*/saas/*" -o -name "package.json" -path "*/app/*" 2>/dev/null | head -1 | xargs dirname 2>/dev/null)
if [ -z "$SAAS_DIR"]; then
  SAAS_DIR=$(find "$TNF_DIR" -maxdepth 4 -name "App.tsx" -o -name "App.jsx" 2>/dev/null | head -1 | xargs dirname 2>/dev/null)
fi

echo "[AGENT-2] SAAS dir: $SAAS_DIR" >> $HOME/tnf-swarm-audit/agent2-code.log

# Find nexus and workflow components
echo "" >> $HOME/tnf-swarm-audit/agent2-code.log
echo "[AGENT-2] === NEXUS COMPONENTS ===" >> $HOME/tnf-swarm-audit/agent2-code.log
find "$TNF_DIR" -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -path "*nexus*" 2>/dev/null | head -20 >> $HOME/tnf-swarm-audit/agent2-code.log

echo "" >> $HOME/tnf-swarm-audit/agent2-code.log
echo "[AGENT-2] === WORKFLOW COMPONENTS ===" >> $HOME/tnf-swarm-audit/agent2-code.log
find "$TNF_DIR" -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -path "*workflow*" 2>/dev/null | head -20 >> $HOME/tnf-swarm-audit/agent2-code.log

# Search for contrast issues
echo "" >> $HOME/tnf-swarm-audit/agent2-code.log
echo "[AGENT-2] === POTENTIAL CONTRAST ISSUES ===" >> $HOME/tnf-swarm-audit/agent2-code.log
find "$TNF_DIR/packages" -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" \) 2>/dev/null | while read f; do
  if grep -qE "text-gray-[5-9]|text-slate-[5-9]|text-zinc-[5-9]|text-neutral-[5-9]|text-stone-[5-9]" "$f" 2>/dev/null &&      grep -qE "bg-gray-[7-9]|bg-slate-[7-9]|bg-zinc-[7-9]|bg-neutral-[7-9]|bg-stone-[7-9]|bg-black|bg-gray-9|bg-slate-9|bg-zinc-9" "$f" 2>/dev/null; then
    echo "SUSPECT: $f" >> $HOME/tnf-swarm-audit/agent2-code.log
  fi
done

# Check for inline styles
echo "" >> $HOME/tnf-swarm-audit/agent2-code.log
echo "[AGENT-2] === INLINE STYLE COLOR ISSUES ===" >> $HOME/tnf-swarm-audit/agent2-code.log
find "$TNF_DIR/packages" -type f \( -name "*.tsx" -o -name "*.jsx" \) 2>/dev/null | xargs grep -l "style={{.*color" 2>/dev/null | head -20 >> $HOME/tnf-swarm-audit/agent2-code.log

# Check opacity
echo "" >> $HOME/tnf-swarm-audit/agent2-code.log
echo "[AGENT-2] === OPACITY ISSUES ===" >> $HOME/tnf-swarm-audit/agent2-code.log
find "$TNF_DIR/packages" -type f \( -name "*.tsx" -o -name "*.jsx" \) 2>/dev/null | xargs grep -n "opacity-|opacity:" 2>/dev/null | grep -v "node_modules" | head -30 >> $HOME/tnf-swarm-audit/agent2-code.log

echo "[AGENT-2] Codebase audit complete." >> $HOME/tnf-swarm-audit/agent2-code.log

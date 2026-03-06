# Living Documentation System - Quick Start Guide

**Last Updated**: 2026-01-17 **Purpose**: Get started with the comprehensive
documentation analysis system **Estimated Time**: 30 minutes to first results

---

## What Is This?

The Living Documentation System is a **comprehensive, methodical, scientific
approach** to analyzing ALL 2,587+ documentation files in The New Fuse codebase.

It will:

- ✓ Discover every file automatically
- ✓ Classify all documents by type and purpose
- ✓ Extract concepts and relationships
- ✓ Identify redundancies and conflicts
- ✓ Fill documentation gaps
- ✓ Continuously improve quality

---

## Quick Start (30 Minutes)

### Step 1: Run Discovery (5 minutes)

```bash
# Navigate to project root
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse

# Run the discovery script
./scripts/documentation-system/01-discover.sh
```

**What this does**:

- Scans entire codebase
- Finds all .md, .txt, .json, .yaml files
- Excludes node_modules, .git, dist, build
- Generates manifest.json with metadata

**Output**:

```
.documentation-system/
  └── manifest.json  (Complete catalog of 2,587+ files)
```

**Expected Results**:

```
Total files discovered: 2,587
By Type:
  markdown: ~1,800
  text: ~230
  json: ~420
  yaml: ~110
By Directory:
  docs: ~450
  packages: ~890
  apps: ~1,050
  .agent: ~80
  .gemini: ~45
  ...
```

---

### Step 2: Review the Manifest (5 minutes)

```bash
# View the manifest
cat .documentation-system/manifest.json | jq '.metadata'

# See first 10 files
cat .documentation-system/manifest.json | jq '.files[:10]'

# Count by type
cat .documentation-system/manifest.json | jq '.metadata.by_type'

# Count by directory
cat .documentation-system/manifest.json | jq '.metadata.by_directory'
```

**What to look for**:

- Total file count matches expectations
- All major directories represented
- File types correctly identified
- No obvious missing files

---

### Step 3: Understand the System (10 minutes)

Read these documents in order:

1. **Master Plan** (5 min)

   ```
   Location: .agent/COMPREHENSIVE_DOCUMENTATION_ALIGNMENT_MASTER_PLAN.md
   Purpose: Overall strategy and vision
   Key sections: System Architecture, Execution Plan, Metrics
   ```

2. **Living System Spec** (5 min)
   ```
   Location: docs/LIVING_DOCUMENTATION_SYSTEM.md
   Purpose: Technical details of 5-stage pipeline
   Key sections: Discovery, Classification, Analysis, Consolidation, Evolution
   ```

---

### Step 4: Check Prerequisites (5 minutes)

Ensure you have the tools needed for the full system:

```bash
# Check Node.js
node --version  # Need 22.16.0+

# Check pnpm
pnpm --version  # Need latest

# Check jq (for JSON processing)
jq --version

# Check database (optional for now)
# psql --version  # PostgreSQL for later stages

# Check Python (for some analysis scripts)
python3 --version  # 3.10+
```

**If missing**:

```bash
# Install jq
brew install jq  # macOS
# or
apt-get install jq  # Linux

# Install Python requirements (for later)
# pip install -r scripts/documentation-system/requirements.txt
```

---

### Step 5: Explore the Data (5 minutes)

Use the manifest to explore your documentation:

```bash
# Find all protocol files
cat .documentation-system/manifest.json | jq '.files[] | select(.path | contains("PROTOCOL"))'

# Find large files (>10KB)
cat .documentation-system/manifest.json | jq '.files[] | select(.size > 10000) | {path, size}'

# Find recently modified (last 7 days)
# Note: Requires timestamp comparison

# Find all README files
cat .documentation-system/manifest.json | jq '.files[] | select(.path | contains("README"))'

# Count files per directory
cat .documentation-system/manifest.json | jq '.metadata.by_directory | to_entries | sort_by(.value) | reverse | .[:10]'
```

---

## What's Next?

### Immediate Next Steps

**This Week**:

1. [ ] Run discovery script
2. [ ] Review manifest.json
3. [ ] Understand the system architecture
4. [ ] Prepare for classification stage

**Next Week**:

1. [ ] Build classification agent
2. [ ] Run classification on all files
3. [ ] Review classification results
4. [ ] Start analysis stage

### The 5-Stage Pipeline

```
Current Stage: 1 (Discovery) ✓
Next Stage: 2 (Classification)

1. DISCOVERY     [✓] - Find all files
2. CLASSIFICATION [ ] - Categorize and tag
3. ANALYSIS      [ ] - Extract concepts
4. CONSOLIDATION [ ] - Merge and clean
5. EVOLUTION     [ ] - Generate and improve
```

---

### Operational runbooks

- `docs/JULES_AUTONOMOUS_LOOP.md` – outlines the Jules supervisor workflow,
  alert variables, and manual frontend guard.
- `docs/SKILL_BANK_OPERATIONS.md` – describes cross-LLM skill-bank
  sync/ingest/retry steps, artifacts, and supervisor lifecycle.
- `packages/tnf-cli/README.md` – catalogs the expanded `tnf` command surface
  (`tnf jules`, `tnf skills bank`, `tnf scripts`).

## Understanding the Output

### Manifest Structure

```json
{
  "metadata": {
    "generated": "2026-01-17T12:00:00Z",
    "total_files": 2587,
    "by_type": {
      "markdown": 1823,
      "text": 234,
      "json": 421,
      "yaml": 109
    },
    "by_directory": {
      "docs": 456,
      "packages": 892,
      "apps": 1059
    }
  },
  "files": [
    {
      "path": "docs/LIVING_DOCUMENTATION_SYSTEM.md",
      "size": 25678,
      "type": "markdown",
      "directory": "docs",
      "modified": 1737123456,
      "hash": "sha256:abc123...",
      "lines": 523
    }
  ]
}
```

**Fields Explained**:

- `path`: Relative path from project root
- `size`: File size in bytes
- `type`: File extension/type
- `directory`: Parent directory
- `modified`: Unix timestamp of last modification
- `hash`: SHA-256 hash for deduplication
- `lines`: Number of lines (text files only)

---

## Common Questions

### Q: How long does discovery take?

**A**: 2-5 minutes for ~2,600 files

### Q: Does it modify any files?

**A**: No, discovery is read-only

### Q: Where is the output stored?

**A**: `.documentation-system/` directory in project root

### Q: Can I run it multiple times?

**A**: Yes, it's idempotent. Run daily to catch new files.

### Q: What about node_modules?

**A**: Excluded automatically

### Q: How much disk space needed?

**A**: ~10MB for manifests, ~100GB for full system later

### Q: Can I customize what's discovered?

**A**: Yes, edit the `find` command in `01-discover.sh`

---

## Troubleshooting

### Problem: Permission denied

```bash
# Solution: Make script executable
chmod +x ./scripts/documentation-system/01-discover.sh
```

### Problem: jq command not found

```bash
# Solution: Install jq
brew install jq  # macOS
apt-get install jq  # Linux
```

### Problem: Too many open files

```bash
# Solution: Increase limit
ulimit -n 4096
```

### Problem: Script runs forever

```bash
# Possible cause: Very large repo or slow disk
# Solution: Check progress
tail -f .documentation-system/manifest.json

# Or run with smaller scope first
# Edit 01-discover.sh to limit search path
```

---

## Advanced Usage

### Filter Discovery

Edit `01-discover.sh` to customize:

```bash
# Only find markdown files
find "$PROJECT_ROOT" -type f -name "*.md" ...

# Exclude specific directories
! -path "*/custom-exclude/*" \

# Only search in docs/
find "$PROJECT_ROOT/docs" -type f ...
```

### Schedule Automatic Discovery

```bash
# Add to crontab
crontab -e

# Run daily at midnight
0 0 * * * cd /path/to/project && ./scripts/documentation-system/01-discover.sh >> /var/log/doc-discovery.log 2>&1
```

### Integration with CI/CD

```yaml
# .github/workflows/docs-discovery.yml
name: Documentation Discovery
on:
  schedule:
    - cron: '0 0 * * *' # Daily
  push:
    paths:
      - '**.md'
      - '**.txt'

jobs:
  discover:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run discovery
        run: ./scripts/documentation-system/01-discover.sh
      - name: Upload manifest
        uses: actions/upload-artifact@v2
        with:
          name: documentation-manifest
          path: .documentation-system/manifest.json
```

---

## Success Indicators

After running discovery, you should see:

✓ **Complete**: All expected files found ✓ **Accurate**: File counts match
directory structure ✓ **Fast**: Completes in <5 minutes ✓ **Reliable**: Produces
valid JSON ✓ **Repeatable**: Same results on re-run

---

## Next Stage Preview: Classification

Once discovery is complete, the next stage will:

1. **Load manifest.json**
2. **Classify each file** into categories:
   - Primary Documentation (Architecture, Protocols, Guides, etc.)
   - Project Management (Plans, Status, Handoffs, etc.)
   - Code Documentation (READMEs, API docs, etc.)
   - Development (Build, Testing, Deployment, etc.)
   - Analysis & Artifacts (Audits, Investigations, etc.)
   - Configuration (Package configs, tool configs, etc.)

3. **Assign tags** (10-20 per file):
   - Automatic: Extracted from path and content
   - AI-generated: Concepts and topics
   - Manual: User-defined overrides

4. **Set priorities** (P0-P4):
   - P0: Blocking, must-read
   - P1: Critical for most tasks
   - P2: High value for complex work
   - P3: Medium value for specific scenarios
   - P4: Low priority, optional

5. **Output**: `classified-manifest.json`

**Estimated time**: 1-2 hours for full classification (AI-powered)

---

## Resources

### Documentation

- [Living Documentation System](./LIVING_DOCUMENTATION_SYSTEM.md) - Complete
  technical spec
- [Master Plan](./.agent/COMPREHENSIVE_DOCUMENTATION_ALIGNMENT_MASTER_PLAN.md) -
  Strategy and execution
- [Protocol Alignment Framework](./PROTOCOL_ALIGNMENT_FRAMEWORK.md) - Overall
  framework

### Scripts

- `scripts/documentation-system/01-discover.sh` - Discovery (Stage 1)
- `scripts/documentation-system/02-classify.ts` - Classification (Stage 2)
  [Coming]
- `scripts/documentation-system/03-analyze.ts` - Analysis (Stage 3) [Coming]
- `scripts/documentation-system/04-consolidate.ts` - Consolidation (Stage 4)
  [Coming]
- `scripts/documentation-system/05-evolve.ts` - Evolution (Stage 5) [Coming]

---

## Get Help

- **Issues**: Create issue on GitHub
- **Questions**: Ask in team Slack #documentation
- **Improvements**: Submit PR with enhancements

---

**Ready to begin? Run the discovery script now!**

```bash
./scripts/documentation-system/01-discover.sh
```

---

_This guide will evolve as the system develops. Last updated: 2026-01-17_

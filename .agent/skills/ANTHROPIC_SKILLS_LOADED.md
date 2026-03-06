# Anthropic Skills Successfully Loaded into TNF

**Date**: December 29, 2025 **Source**:
[github.com/anthropics/skills](https://github.com/anthropics/skills) **Total
Skills**: 16 official Anthropic skills **Status**: ✅ All skills loaded and
accessible via MCP

## Loaded Skills

### Document Processing (4 skills)

1. **docx** - DOCX creation, editing, and analysis
   - Comprehensive document creation with tracked changes and comments
   - Full formatting preservation and text extraction

2. **pdf** - PDF Processing Guide
   - Extract text and tables, create new PDFs
   - Merge/split documents, handle forms

3. **pptx** - PPTX creation, editing, and analysis
   - Presentation creation and modification
   - Layout management and speaker notes

4. **xlsx** - Spreadsheet processing
   - Formulas, formatting, data analysis
   - Support for .xlsx, .xlsm, .csv, .tsv

### Development Tools (3 skills)

5. **mcp-builder** - MCP Server Development Guide
   - Create high-quality MCP servers
   - Python (FastMCP) and TypeScript (MCP SDK)

6. **webapp-testing** - Web Application Testing
   - Playwright-based testing toolkit
   - Frontend verification and debugging

7. **skill-creator** - Skill Creator
   - Guide for creating effective skills
   - Extend Claude's capabilities

### Creative & Design (5 skills)

8. **frontend-design** - Frontend Design
   - Production-grade frontend interfaces
   - High design quality, avoid generic AI aesthetics

9. **canvas-design** - Visual Design
   - Create beautiful visual art in PNG/PDF
   - Original designs, avoid copyright violations

10. **algorithmic-art** - Algorithmic Art
    - p5.js with seeded randomness
    - Generative art, flow fields, particle systems

11. **theme-factory** - Theme Factory Skill
    - 10 pre-set themes with colors/fonts
    - Apply to slides, docs, landing pages

12. **web-artifacts-builder** - Web Artifacts Builder
    - Complex React/Tailwind/shadcn/ui artifacts
    - State management and routing

### Communication & Workflow (4 skills)

13. **doc-coauthoring** - Doc Co-Authoring Workflow
    - Structured workflow for co-authoring
    - Technical specs, proposals, decision docs

14. **internal-comms** - Internal Communications
    - Status reports, leadership updates
    - Company newsletters, FAQs, incident reports

15. **slack-gif-creator** - Slack GIF Creator
    - Animated GIFs optimized for Slack
    - Validation tools and animation concepts

16. **brand-guidelines** - Anthropic Brand Styling
    - Official Anthropic brand colors and typography
    - Visual formatting and design standards

## Integration Details

### MCP Server Configuration

- **Server**: `tnf-skills`
- **Path**:
  `/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/mcp-skills-server/dist/index.js`
- **Skills Directory**: `.agent/skills/anthropic/`
- **Total Skills in Registry**: 47 (31 TNF + 16 Anthropic)

### Access Methods

Skills are available via:

1. **MCP Resources**: `skill://skill-name`
2. **MCP Tools**: `skill_skill_name`
3. **Slash Commands**: `/skill-<name>`

### Manifest Location

`.agent/skills/anthropic/manifest.json`

## Usage Examples

```bash
# List all skills
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_skills"},"id":1}' | node packages/mcp-skills-server/dist/index.js

# Get specific skill content
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_skill_content","arguments":{"skillName":"mcp-builder"}},"id":1}' | node packages/mcp-skills-server/dist/index.js

# Search skills
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search_skills","arguments":{"query":"pdf"}},"id":1}' | node packages/mcp-skills-server/dist/index.js
```

## Next Steps

1. ✅ Skills loaded and indexed
2. ✅ MCP server rebuilt with new skills
3. ✅ Manifest generated
4. ⏭️ Restart Claude Code to load updated MCP servers
5. ⏭️ Test skills via Claude Code interface
6. ⏭️ Create shortcuts/aliases for frequently used skills

## Sources

- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Claude Skills Blog Post](https://simonwillison.net/2025/Oct/16/claude-skills/)
- [Awesome Claude Skills Collection](https://github.com/travisvn/awesome-claude-skills)

# Documentation Consolidation Plan

## 1. New Documentation Structure

```
/docs/
├── README.md                 # Documentation overview and navigation
├── guides/                   # User and developer guides
│   ├── getting-started.md   # Quick start guide
│   ├── installation.md      # Installation instructions
│   ├── development.md       # Development guide
│   ├── deployment.md        # Deployment guide
│   └── troubleshooting.md   # Common issues and solutions
├── architecture/            # System architecture docs
│   ├── overview.md         # System overview
│   ├── components.md       # Core components
│   └── security.md         # Security architecture
├── api/                    # API documentation
│   ├── overview.md         # API overview
│   ├── authentication.md   # Auth documentation
│   ├── endpoints.md        # API endpoints
│   └── websocket.md        # WebSocket protocol
├── reference/              # Technical reference
│   ├── environment.md      # Environment variables
│   ├── configuration.md    # Configuration options
│   └── scripts.md         # Script documentation
└── operations/            # Operations documentation
    ├── deployment.md      # Deployment procedures
    ├── monitoring.md      # Monitoring procedures
    └── recovery.md        # Recovery procedures
```

## 2. Script Consolidation

### Cleanup Scripts
The project now uses a single TypeScript-based cleanup script:
- `scripts/cleanup.ts` - Main cleanup script with multiple options

### Removed Scripts
The following scripts have been deprecated and removed:
- `scripts/clean-all.sh`
- `scripts/cleanup.sh`
- `scripts/force-clean.sh`
- `scripts/manage/clean-all.sh`
- `scripts/fresh-env.sh`
- `remove-js-version.sh`
- `scripts/add-clean-scripts.js`

### Development Scripts
```bash
# Primary scripts
yarn dev           # Development mode
yarn start         # Production mode
yarn clean         # Clean all artifacts (using new cleanup.ts)

# Cleanup options
yarn clean:deps    # Clean only dependencies
yarn clean:build   # Clean only build artifacts
yarn clean:docker  # Clean only Docker artifacts
yarn clean:cache   # Clean only cache
```

## 3. Implementation Schedule

### Week 1: Documentation Structure
- [x] Create new directory structure
- [ ] Move core documentation
- [ ] Update cross-references

### Week 2: Content Migration
- [ ] Migrate component documentation
- [ ] Consolidate security documentation
- [ ] Update operations documentation

### Week 3: Script Consolidation
- [ ] Create new consolidated cleanup script
- [ ] Remove redundant scripts
- [ ] Update all script references in docs

### Week 4: Validation
- [ ] Technical review
- [ ] Developer testing
- [ ] Update all version references

## 4. Content Standards

### File Format
```markdown
# Title

## Overview
Brief description of the document's purpose

## Prerequisites
Required knowledge, tools, or permissions

## Detailed Content
Main documentation content

## Related Documentation
Links to related documents

## Version History
Document revision history
```

### Path References
- Always use relative paths from project root
- Format: `/apps/frontend/src/components`
- Include purpose comments: `# Authentication module`

### Version References
- Use specific versions in reference/environment.md
- Reference this file in other docs
- Include compatibility matrix

### Code Examples
- Include language identifier
- Add comments for complex code
- Show complete, working examples

## 5. Quality Checklist

### Technical Accuracy
- [ ] Code examples are tested
- [ ] Commands are verified
- [ ] Versions are current

### Completeness
- [ ] All features documented
- [ ] Error scenarios covered
- [ ] Examples provided

### Consistency
- [ ] Consistent terminology
- [ ] Consistent formatting
- [ ] Consistent paths

### Accessibility
- [ ] Clear navigation
- [ ] Search friendly
- [ ] Well-structured

## 6. Maintenance Plan

### Regular Updates
- Weekly review of changes
- Monthly comprehensive review
- Quarterly deep dive

### Version Control
- Document versions match code
- Track documentation changes
- Keep change history

### Review Process
- Technical review
- Peer review
- User feedback

## 7. Next Steps

1. Create new directory structure
2. Begin Phase 1 migration
3. Update TECHNICAL_DETAILS.md
4. Start consolidating security docs
5. Update component documentation

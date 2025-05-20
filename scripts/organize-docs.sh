#!/bin/bash
# organize-docs.sh - Script to organize documentation files into a structured format

# Create directory structure if it doesn't exist
mkdir -p docs/architecture
mkdir -p docs/api
mkdir -p docs/development
mkdir -p docs/deployment
mkdir -p docs/agents
mkdir -p docs/workflows
mkdir -p docs/components
mkdir -p docs/database
mkdir -p docs/getting-started

# Move architecture documentation
mv ARCHITECTURE.md docs/architecture/overview.md 2>/dev/null || echo "Already moved ARCHITECTURE.md"

# Move API documentation
mv API_SPECIFICATION.md docs/api/specification.md 2>/dev/null || echo "Already moved API_SPECIFICATION.md"
mv API-CONSOLIDATION-PLAN.md docs/api/consolidation-plan.md 2>/dev/null || echo "Already moved API-CONSOLIDATION-PLAN.md"

# Move development guides
mv DEVELOPMENT-GUIDE.md docs/development/guide.md 2>/dev/null || echo "Already moved DEVELOPMENT-GUIDE.md"
mv DEVELOPMENT-PLAN.md docs/development/plan.md 2>/dev/null || echo "Already moved DEVELOPMENT-PLAN.md"
mv BUILD-PROCESS-GUIDE.md docs/development/build-process.md 2>/dev/null || echo "Already moved BUILD-PROCESS-GUIDE.md"

# Move agent documentation
mv AGENT_DEVELOPMENT_GUIDE.md docs/agents/development-guide.md 2>/dev/null || echo "Already moved AGENT_DEVELOPMENT_GUIDE.md"
mv A2A-SPECIFICATION.md docs/agents/a2a-specification.md 2>/dev/null || echo "Already moved A2A-SPECIFICATION.md"

# Move workflow documentation
mv WORKFLOW_GUIDE.md docs/workflows/guide.md 2>/dev/null || echo "Already moved WORKFLOW_GUIDE.md"

# Move component documentation
mv COMPONENT-CONSOLIDATION-STRATEGY.md docs/components/consolidation-strategy.md 2>/dev/null || echo "Already moved COMPONENT-CONSOLIDATION-STRATEGY.md"
mv COMPONENT-CONSOLIDATION-WORKFLOW.md docs/components/consolidation-workflow.md 2>/dev/null || echo "Already moved COMPONENT-CONSOLIDATION-WORKFLOW.md"
mv COMPONENT-FEATURE-TRACKING.md docs/components/feature-tracking.md 2>/dev/null || echo "Already moved COMPONENT-FEATURE-TRACKING.md"

# Move database documentation
mv DATABASE-DEVELOPMENT-GUIDE.md docs/database/development-guide.md 2>/dev/null || echo "Already moved DATABASE-DEVELOPMENT-GUIDE.md"
mv DATABASE-CONSOLIDATION-PLAN.md docs/database/consolidation-plan.md 2>/dev/null || echo "Already moved DATABASE-CONSOLIDATION-PLAN.md"

# Move getting started guides
mv GET-STARTED.md docs/getting-started/overview.md 2>/dev/null || echo "Already moved GET-STARTED.md"
mv QUICKSTART.md docs/getting-started/quickstart.md 2>/dev/null || echo "Already moved QUICKSTART.md"
mv INSTALLATION.md docs/getting-started/installation.md 2>/dev/null || echo "Already moved INSTALLATION.md"

# Create index files for each documentation section
echo "# Architecture Documentation\n\n- [Architecture Overview](overview.md)" > docs/architecture/README.md
echo "# API Documentation\n\n- [API Specification](specification.md)\n- [API Consolidation Plan](consolidation-plan.md)" > docs/api/README.md
echo "# Development Documentation\n\n- [Development Guide](guide.md)\n- [Development Plan](plan.md)\n- [Build Process](build-process.md)" > docs/development/README.md
echo "# Agent Documentation\n\n- [Agent Development Guide](development-guide.md)\n- [A2A Specification](a2a-specification.md)" > docs/agents/README.md
echo "# Workflow Documentation\n\n- [Workflow Guide](guide.md)" > docs/workflows/README.md
echo "# Component Documentation\n\n- [Component Consolidation Strategy](consolidation-strategy.md)\n- [Component Consolidation Workflow](consolidation-workflow.md)\n- [Component Feature Tracking](feature-tracking.md)" > docs/components/README.md
echo "# Database Documentation\n\n- [Database Development Guide](development-guide.md)\n- [Database Consolidation Plan](consolidation-plan.md)" > docs/database/README.md
echo "# Getting Started\n\n- [Overview](overview.md)\n- [Quickstart](quickstart.md)\n- [Installation](installation.md)" > docs/getting-started/README.md

# Create a main index for all documentation
cat > docs/README.md << 'EOF'
# The New Fuse Documentation

Welcome to The New Fuse documentation. This repository contains comprehensive guides, specifications, and references for developing with The New Fuse platform.

## Documentation Sections

- [Getting Started](getting-started/) - Initial setup and quickstart guides
- [Architecture](architecture/) - System architecture and design
- [API](api/) - API specifications and usage
- [Development](development/) - Development guides and practices
- [Agents](agents/) - Agent development and specifications
- [Workflows](workflows/) - Workflow creation and management
- [Components](components/) - UI and service components
- [Database](database/) - Database schema and management

## Contributing to Documentation

Please follow the [contribution guidelines](../CONTRIBUTING.md) when updating documentation. All documentation should be written in Markdown and properly linked from this index.
EOF

echo "Documentation has been organized into the docs/ directory structure."
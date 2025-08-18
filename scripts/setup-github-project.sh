#!/bin/bash

# Script to set up GitHub Project Board for Codebase Improvement Roadmap
# This creates a comprehensive project board with automated workflows

set -e

echo "🚀 Setting up GitHub Project Board for Codebase Improvement..."

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   brew install gh"
    echo "   Then run: gh auth login"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated. Please run:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"

# Get repository info
REPO_OWNER=$(gh repo view --json owner --jq '.owner.login')
REPO_NAME=$(gh repo view --json name --jq '.name')

echo "📊 Creating project board for $REPO_OWNER/$REPO_NAME..."

# Create the project
PROJECT_ID=$(gh project create \
  --title "Codebase Improvement Roadmap" \
  --body "Comprehensive tracking for The New Fuse codebase improvement initiative. This project tracks progress across 4 phases of systematic refactoring, consolidation, and optimization." \
  --format json | jq -r '.id')

echo "✅ Project created with ID: $PROJECT_ID"

# Add custom fields to the project
echo "📝 Setting up custom fields..."

# Priority field
gh project field-create $PROJECT_ID \
  --name "Priority" \
  --type "single_select" \
  --single-select-option "🔥 High" \
  --single-select-option "🟡 Medium" \
  --single-select-option "🔵 Low"

# Phase field
gh project field-create $PROJECT_ID \
  --name "Phase" \
  --type "single_select" \
  --single-select-option "1️⃣ Foundation" \
  --single-select-option "2️⃣ Deduplication" \
  --single-select-option "3️⃣ Architecture" \
  --single-select-option "4️⃣ Optimization"

# Effort field
gh project field-create $PROJECT_ID \
  --name "Effort" \
  --type "single_select" \
  --single-select-option "🟢 1-2 days" \
  --single-select-option "🟡 3-5 days" \
  --single-select-option "🟠 1-2 weeks" \
  --single-select-option "🔴 2+ weeks"

# Impact field
gh project field-create $PROJECT_ID \
  --name "Impact" \
  --type "single_select" \
  --single-select-option "🚀 High Impact" \
  --single-select-option "📊 Medium Impact" \
  --single-select-option "🔧 Low Impact"

# Progress field
gh project field-create $PROJECT_ID \
  --name "Progress" \
  --type "number" \
  --number-format "percentage"

echo "✅ Custom fields created"

# Create project views
echo "📋 Creating project views..."

# Create Phase 1 view
gh project view-create $PROJECT_ID \
  --name "🏗️ Phase 1 - Foundation" \
  --type "board" \
  --field "Status"

# Create All Phases view  
gh project view-create $PROJECT_ID \
  --name "📊 All Phases Overview" \
  --type "table"

# Create Priority view
gh project view-create $PROJECT_ID \
  --name "🎯 By Priority" \
  --type "board" \
  --field "Priority"

echo "✅ Project views created"

# Add existing issues to the project (if any)
echo "🔗 Adding existing roadmap issues to project..."

# Get all issues with roadmap labels and add them to the project
gh issue list \
  --label "phase-1,phase-2,phase-3,phase-4" \
  --limit 100 \
  --json number \
  --jq '.[].number' | while read issue_number; do
  
  if [ ! -z "$issue_number" ]; then
    echo "Adding issue #$issue_number to project..."
    gh project item-add $PROJECT_ID --issue $issue_number
  fi
done

echo "✅ Existing issues added to project"

# Create automated workflows
echo "⚙️ Setting up automated workflows..."

# Create workflow file for project automation
cat > .github/workflows/project-automation.yml << 'EOF'
name: Project Board Automation

on:
  issues:
    types: [opened, closed, reopened, labeled, unlabeled]
  pull_request:
    types: [opened, closed, merged, ready_for_review]

jobs:
  update-project:
    runs-on: ubuntu-latest
    if: contains(github.event.issue.labels.*.name, 'phase-1') || contains(github.event.issue.labels.*.name, 'phase-2') || contains(github.event.issue.labels.*.name, 'phase-3') || contains(github.event.issue.labels.*.name, 'phase-4')
    
    steps:
      - name: Add to project
        if: github.event.action == 'opened'
        uses: actions/add-to-project@v0.4.0
        with:
          project-url: https://github.com/orgs/${{ github.repository_owner }}/projects/PROJECT_NUMBER
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Update item fields
        if: github.event.action == 'opened' || github.event.action == 'labeled'
        uses: titangene/github-project-automation@v1.0.0
        with:
          project-url: https://github.com/orgs/${{ github.repository_owner }}/projects/PROJECT_NUMBER
          github-token: ${{ secrets.GITHUB_TOKEN }}
          issue-number: ${{ github.event.issue.number }}
          field-mappings: |
            phase-1: Phase=1️⃣ Foundation
            phase-2: Phase=2️⃣ Deduplication  
            phase-3: Phase=3️⃣ Architecture
            phase-4: Phase=4️⃣ Optimization
            high-priority: Priority=🔥 High
            medium-priority: Priority=🟡 Medium
            low-priority: Priority=🔵 Low
EOF

echo "✅ Project automation workflow created"

# Create milestone tracking
echo "🎯 Creating milestones..."

# Create milestones for each phase
gh milestone create \
  --title "Phase 1: Foundation" \
  --description "Package consolidation and configuration standardization" \
  --due-date "$(date -d '+4 weeks' +%Y-%m-%d)"

gh milestone create \
  --title "Phase 2: Deduplication" \
  --description "Code deduplication and type system improvements" \
  --due-date "$(date -d '+8 weeks' +%Y-%m-%d)"

gh milestone create \
  --title "Phase 3: Architecture" \
  --description "Architecture consistency and testing infrastructure" \
  --due-date "$(date -d '+14 weeks' +%Y-%m-%d)"

gh milestone create \
  --title "Phase 4: Optimization" \
  --description "Performance optimization and final polish" \
  --due-date "$(date -d '+17 weeks' +%Y-%m-%d)"

echo "✅ Milestones created"

# Create project README
echo "📚 Creating project documentation..."

cat > PROJECT_TRACKING.md << 'EOF'
# Project Tracking Setup

This document describes the GitHub Project Board setup for The New Fuse Codebase Improvement Roadmap.

## 📊 Project Board Features

### Custom Fields
- **Priority**: 🔥 High, 🟡 Medium, 🔵 Low
- **Phase**: 1️⃣ Foundation, 2️⃣ Deduplication, 3️⃣ Architecture, 4️⃣ Optimization  
- **Effort**: 🟢 1-2 days, 🟡 3-5 days, 🟠 1-2 weeks, 🔴 2+ weeks
- **Impact**: 🚀 High Impact, 📊 Medium Impact, 🔧 Low Impact
- **Progress**: Percentage completion

### Views
- **🏗️ Phase 1 - Foundation**: Board view filtered to Phase 1 tasks
- **📊 All Phases Overview**: Table view of all tasks with custom fields
- **🎯 By Priority**: Board view organized by priority level

### Automation
- New issues with phase labels are automatically added to the project
- Labels automatically set corresponding field values
- Progress tracking updates the roadmap document

## 🚀 Usage

### For Project Managers
1. Use the "📊 All Phases Overview" for comprehensive tracking
2. Monitor progress percentages and update roadmap accordingly
3. Assign team members and set priorities

### For Developers
1. Use phase-specific views to focus on current work
2. Update progress percentages as work completes
3. Link PRs to issues for automatic progress tracking

### For Stakeholders
1. Check overall progress in the project board
2. Review milestone completion dates
3. Monitor high-priority task completion

## 🔗 Links

- **Project Board**: [View Project](PROJECT_URL)
- **Roadmap Document**: [CODEBASE_IMPROVEMENT_ROADMAP.md](./CODEBASE_IMPROVEMENT_ROADMAP.md)
- **Progress Reports**: [progress-reports/](./progress-reports/)

## 📈 Progress Tracking

The project board integrates with:
- GitHub Issues for task tracking
- GitHub Milestones for phase deadlines  
- Automated progress reporting
- Roadmap document updates

## 🛠️ Maintenance

- Weekly review of project board status
- Update progress percentages as work completes
- Archive completed phases to reduce clutter
- Generate progress reports for stakeholders
EOF

echo "✅ Project documentation created"

# Generate summary
echo ""
echo "🎉 GitHub Project Board setup complete!"
echo ""
echo "📋 Summary:"
echo "  ✅ Project board created with custom fields"
echo "  ✅ Multiple views configured for different perspectives"
echo "  ✅ Automated workflows for issue management"
echo "  ✅ Milestones created for each phase"
echo "  ✅ Documentation generated"
echo ""
echo "🔗 Next Steps:"
echo "  1. Visit the project board: https://github.com/$REPO_OWNER/$REPO_NAME/projects"
echo "  2. Assign team members to issues"
echo "  3. Start working on Phase 1 tasks"
echo "  4. Update progress percentages as work completes"
echo ""
echo "📊 To check progress anytime, run:"
echo "  ./scripts/check-progress.js"
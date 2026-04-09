#!/bin/bash

# Verification Script for Codebase Integrity
# This script executes the codebase auditor and then processes specific actions
# based on the audit results.

echo "🔍 Starting The New Fuse Codebase Audit & Navigation Verification"

# Make the auditor script executable
chmod +x ./codebase-auditor.js

# Run the codebase auditor
echo "⚙️ Running code audit..."
node ./codebase-auditor.js

# Check if the audit report was generated
if [ ! -f "./codebase-audit-report.md" ]; then
  echo "❌ Error: Audit report was not generated. Please check for errors."
  exit 1
fi

echo "✅ Audit completed successfully!"

# Extract recommended actions from the report
echo "📋 Processing audit results and generating action items..."

# Use grep to extract potentially unused files
UNUSED_FILES=$(grep -A 100 "Potentially Unused Files:" codebase-audit-report.md | grep -E "^\- \`.*\`" | sed -E "s/\- \`(.*)\`/\1/" | head -n 20)

# Use grep to extract navigation issues
NAV_ISSUES=$(grep -A 100 "Navigation Issues:" codebase-audit-report.md | grep -E "^\- \*\*.*\*\*:" | head -n 20)

# Generate action plan
echo "## Action Plan Based on Code Audit" > audit-action-plan.md
echo "Generated on: $(date)" >> audit-action-plan.md
echo "" >> audit-action-plan.md

# Add unused files section if there are any
if [ ! -z "$UNUSED_FILES" ]; then
  echo "### Potentially Unused Files to Review" >> audit-action-plan.md
  echo "" >> audit-action-plan.md
  echo "Please review these files to confirm they're truly unused before removal:" >> audit-action-plan.md
  echo "" >> audit-action-plan.md
  
  while IFS= read -r file; do
    if [ ! -z "$file" ]; then
      echo "- [ ] \`$file\` - Confirm unused and consider removal" >> audit-action-plan.md
    fi
  done <<< "$UNUSED_FILES"
  
  echo "" >> audit-action-plan.md
fi

# Add navigation issues section if there are any
if [ ! -z "$NAV_ISSUES" ]; then
  echo "### Navigation Issues to Address" >> audit-action-plan.md
  echo "" >> audit-action-plan.md
  echo "These navigation inconsistencies should be fixed:" >> audit-action-plan.md
  echo "" >> audit-action-plan.md
  
  while IFS= read -r issue; do
    if [ ! -z "$issue" ]; then
      echo "- [ ] Fix: $issue" >> audit-action-plan.md
    fi
  done <<< "$NAV_ISSUES"
  
  echo "" >> audit-action-plan.md
fi

# Add next steps
echo "### Next Steps" >> audit-action-plan.md
echo "" >> audit-action-plan.md
echo "1. Review the complete audit report in \`codebase-audit-report.md\`" >> audit-action-plan.md
echo "2. Address the items in this action plan" >> audit-action-plan.md
echo "3. Re-run the audit to verify improvements" >> audit-action-plan.md
echo "4. Consider adding the auditor to your CI/CD pipeline" >> audit-action-plan.md
echo "" >> audit-action-plan.md

echo "✅ Action plan generated: audit-action-plan.md"
echo "📊 Full report available: codebase-audit-report.md"
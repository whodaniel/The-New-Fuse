#!/bin/bash

# The New Fuse - Codebase Integrity Tool
# This script provides a unified interface for running the codebase auditing
# and navigation verification tools.

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Display header
echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  The New Fuse - Codebase Integrity Tool    ${NC}"
echo -e "${BLUE}=============================================${NC}\n"

# Functions
show_help() {
  echo -e "Usage: $0 [options]\n"
  echo -e "Options:"
  echo "  -a, --all             Run all checks (audit + navigation)"
  echo "  -c, --code-audit      Run code audit only"
  echo "  -n, --navigation      Run navigation verification only"
  echo "  -r, --report          Generate and open reports"
  echo "  -s, --scan=<dir>      Scan a specific directory"
  echo "  -f, --fix             Attempt to fix simple issues"
  echo "  -h, --help            Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --all              Run complete codebase integrity check"
  echo "  $0 -n -r              Run navigation check and open reports"
  echo "  $0 -c -s packages/ui  Audit only the UI package"
  echo ""
}

make_scripts_executable() {
  echo -e "${BLUE}➤ Making scripts executable...${NC}"
  chmod +x ./codebase-auditor.js
  chmod +x ./navigation-validator.js
  chmod +x ./verify-codebase-integrity.sh
}

run_code_audit() {
  echo -e "\n${BLUE}➤ Running code audit...${NC}"
  
  if [ -n "$SCAN_DIR" ]; then
    echo -e "${YELLOW}Scanning directory: $SCAN_DIR${NC}\n"
    # Pass directory to the auditor script via environment variable
    AUDIT_DIR="$SCAN_DIR" node ./codebase-auditor.js
  else
    node ./codebase-auditor.js
  fi
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Code audit completed successfully${NC}"
  else
    echo -e "${RED}✗ Code audit failed${NC}"
    exit 1
  fi
}

run_navigation_check() {
  echo -e "\n${BLUE}➤ Running navigation verification...${NC}"
  
  if [ -n "$SCAN_DIR" ]; then
    echo -e "${YELLOW}Scanning directory: $SCAN_DIR${NC}\n"
    # Pass directory to the navigation validator via environment variable
    NAV_DIR="$SCAN_DIR" node ./navigation-validator.js
  else
    node ./navigation-validator.js
  fi
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Navigation verification completed successfully${NC}"
  else
    echo -e "${RED}✗ Navigation verification failed${NC}"
    exit 1
  fi
}

generate_unified_report() {
  echo -e "\n${BLUE}➤ Generating unified integrity report...${NC}"
  
  # Create report directory if it doesn't exist
  mkdir -p ./integrity-reports
  
  # Create report header
  cat > ./integrity-reports/codebase-integrity-report.md << EOF
# The New Fuse - Codebase Integrity Report

**Generated on:** $(date)

This report provides a comprehensive assessment of code quality and navigation integrity for The New Fuse project.

## Overview

EOF

  # Add code audit summary if available
  if [ -f "./codebase-audit-report.md" ]; then
    echo -e "### Code Audit Summary\n" >> ./integrity-reports/codebase-integrity-report.md
    grep -A 5 "## 1\. Codebase Structure Overview" codebase-audit-report.md | tail -n +2 >> ./integrity-reports/codebase-integrity-report.md
    echo "" >> ./integrity-reports/codebase-integrity-report.md
    
    # Extract ghost code summary
    echo -e "### Ghost Code Summary\n" >> ./integrity-reports/codebase-integrity-report.md
    if grep -q "No ghost code identified" codebase-audit-report.md; then
      echo "✅ No ghost code identified. All files and exports appear to be in use." >> ./integrity-reports/codebase-integrity-report.md
    else
      echo "⚠️ Potentially unused code was identified:" >> ./integrity-reports/codebase-integrity-report.md
      grep -A 50 "## 2\. Potential Ghost Code" codebase-audit-report.md | grep -E "^- " | head -n 10 >> ./integrity-reports/codebase-integrity-report.md
      
      if [ $(grep -A 50 "## 2\. Potential Ghost Code" codebase-audit-report.md | grep -E "^- " | wc -l) -gt 10 ]; then
        echo "*(See full report for complete list)*" >> ./integrity-reports/codebase-integrity-report.md
      fi
    fi
    echo "" >> ./integrity-reports/codebase-integrity-report.md
  fi
  
  # Add navigation integrity summary if available
  if [ -f "./navigation-report/navigation-report.md" ]; then
    echo -e "### Navigation Integrity Summary\n" >> ./integrity-reports/codebase-integrity-report.md
    grep -A 6 "## Summary" navigation-report/navigation-report.md | tail -n +2 >> ./integrity-reports/codebase-integrity-report.md
    echo "" >> ./integrity-reports/codebase-integrity-report.md
    
    # Extract navigation issues
    if grep -q "No Issues Found" navigation-report/navigation-report.md; then
      echo "✅ No navigation issues were detected." >> ./integrity-reports/codebase-integrity-report.md
    else
      echo "⚠️ Navigation issues were identified:" >> ./integrity-reports/codebase-integrity-report.md
      grep -A 50 "## Issues Found" navigation-report/navigation-report.md | grep -E "^- \*\*" | head -n 10 >> ./integrity-reports/codebase-integrity-report.md
      
      if [ $(grep -A 50 "## Issues Found" navigation-report/navigation-report.md | grep -E "^- \*\*" | wc -l) -gt 10 ]; then
        echo "*(See full report for complete list)*" >> ./integrity-reports/codebase-integrity-report.md
      fi
    fi
    echo "" >> ./integrity-reports/codebase-integrity-report.md
  fi
  
  # Add recommendations
  echo -e "## Key Recommendations\n" >> ./integrity-reports/codebase-integrity-report.md
  
  if [ -f "./codebase-audit-report.md" ]; then
    grep -A 100 "## 5\. Recommendations" codebase-audit-report.md | grep -E "^### Recommendation" | head -n 3 >> ./integrity-reports/codebase-integrity-report.md
  fi
  
  if [ -f "./navigation-report/navigation-report.md" ]; then
    grep -A 100 "## Recommendations" navigation-report/navigation-report.md | grep -E "^### " | head -n 3 >> ./integrity-reports/codebase-integrity-report.md
  fi
  
  echo -e "\n### Next Steps\n" >> ./integrity-reports/codebase-integrity-report.md
  echo "1. Review the detailed reports in \`./codebase-audit-report.md\` and \`./navigation-report/\`" >> ./integrity-reports/codebase-integrity-report.md
  echo "2. Address high-priority issues first (dead code, broken navigation)" >> ./integrity-reports/codebase-integrity-report.md
  echo "3. Set up automated integrity checks as part of your CI pipeline" >> ./integrity-reports/codebase-integrity-report.md
  echo "4. Run this tool regularly to maintain codebase health" >> ./integrity-reports/codebase-integrity-report.md
  
  # Copy diagram if it exists
  if [ -f "./navigation-report/navigation-flow.md" ]; then
    cp ./navigation-report/navigation-flow.md ./integrity-reports/
  fi
  
  echo -e "${GREEN}✓ Unified report generated at ./integrity-reports/codebase-integrity-report.md${NC}"
}

open_reports() {
  echo -e "\n${BLUE}➤ Opening reports...${NC}"
  
  # Try to open reports with system default application
  if [ "$(uname)" == "Darwin" ]; then # macOS
    open ./integrity-reports/codebase-integrity-report.md 2>/dev/null
    echo -e "${GREEN}✓ Opened unified report${NC}"
  elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then # Linux
    xdg-open ./integrity-reports/codebase-integrity-report.md 2>/dev/null
    echo -e "${GREEN}✓ Opened unified report${NC}"
  else # Windows or others
    start ./integrity-reports/codebase-integrity-report.md 2>/dev/null
    echo -e "${GREEN}✓ Opened unified report${NC}"
  fi
}

try_fix_issues() {
  echo -e "\n${BLUE}➤ Attempting to fix simple issues...${NC}"
  
  # Track if any fixes were applied
  FIXES_APPLIED=false
  
  # Check if we have broken links to fix
  if [ -f "./navigation-report/navigation-report.md" ]; then
    # Extract broken links
    BROKEN_LINKS=$(grep -A 100 "Broken Link Issues" navigation-report/navigation-report.md | grep -E "^- \*\*Link to" | sed -E 's/.*Link to "([^"]+)".*/\1/' | head -n 10)
    
    if [ ! -z "$BROKEN_LINKS" ]; then
      echo -e "${YELLOW}Found broken links to fix:${NC}"
      
      # Search for potential route matches for each broken link
      while IFS= read -r link; do
        if [ ! -z "$link" ]; then
          echo -e "  - Looking for matches for broken link: ${YELLOW}$link${NC}"
          
          # Try to find similar routes
          SIMILAR_ROUTES=$(grep -A 100 "## Route Inventory" navigation-report/navigation-report.md | grep -E "^\| \`/[^|]*\`" | cut -d'|' -f2 | sed -E 's/^ \`(.*)\` $/\1/' | sort -r)
          
          # Find best match
          BEST_MATCH=""
          for route in $SIMILAR_ROUTES; do
            # Simple similarity check - if the broken link is a substring of a route
            if [[ "$route" == *"$link"* ]] || [[ "$link" == *"$route"* ]]; then
              BEST_MATCH="$route"
              break
            fi
          done
          
          if [ ! -z "$BEST_MATCH" ]; then
            echo -e "    ${GREEN}✓ Found potential match: $BEST_MATCH${NC}"
            
            # Suggestion only, no automatic fixing for links
            echo -e "    ${BLUE}ℹ Suggestion: Update '$link' to '$BEST_MATCH'${NC}"
            FIXES_APPLIED=true
          else
            echo -e "    ${RED}✗ No good match found${NC}"
          fi
        fi
      done <<< "$BROKEN_LINKS"
    fi
  fi
  
  # Check for potential unused files to suggest for cleanup
  if [ -f "./codebase-audit-report.md" ]; then
    # Extract unused files that are clearly temporary files
    TEMP_FILES=$(grep -A 100 "Potentially Unused Files:" codebase-audit-report.md | grep -E "^\- \`.*\.(tmp|temp|bak|old|copy)\`" | sed -E "s/\- \`(.*)\`/\1/" | head -n 5)
    
    if [ ! -z "$TEMP_FILES" ]; then
      echo -e "\n${YELLOW}Found temporary files that can be safely removed:${NC}"
      
      while IFS= read -r file; do
        if [ ! -z "$file" ] && [ -f "$file" ]; then
          echo -e "  - ${YELLOW}$file${NC} (temporary file)"
          echo -e "    ${BLUE}ℹ Suggestion: Remove this temporary file${NC}"
          FIXES_APPLIED=true
        fi
      done <<< "$TEMP_FILES"
    fi
  fi
  
  if [ "$FIXES_APPLIED" = false ]; then
    echo -e "${YELLOW}No automatic fixes were applied. Some issues require manual review.${NC}"
  fi
  
  echo -e "${BLUE}ℹ For detailed fix instructions, review the reports.${NC}"
}

# Process command line arguments
RUN_CODE_AUDIT=false
RUN_NAVIGATION=false
GENERATE_REPORT=false
OPEN_REPORT=false
SCAN_DIR=""
FIX_ISSUES=false

# If no arguments, show help
if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

# Parse arguments
while (( "$#" )); do
  case "$1" in
    -a|--all)
      RUN_CODE_AUDIT=true
      RUN_NAVIGATION=true
      GENERATE_REPORT=true
      shift
      ;;
    -c|--code-audit)
      RUN_CODE_AUDIT=true
      shift
      ;;
    -n|--navigation)
      RUN_NAVIGATION=true
      shift
      ;;
    -r|--report)
      GENERATE_REPORT=true
      OPEN_REPORT=true
      shift
      ;;
    -s|--scan=*)
      SCAN_DIR="${1#*=}"
      shift
      ;;
    -s|--scan)
      if [ -n "$2" ] && [ ${2:0:1} != "-" ]; then
        SCAN_DIR="$2"
        shift 2
      else
        echo -e "${RED}Error: Argument for $1 is missing${NC}" >&2
        exit 1
      fi
      ;;
    -f|--fix)
      FIX_ISSUES=true
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unsupported option $1${NC}" >&2
      show_help
      exit 1
      ;;
  esac
done

# Make sure scripts are executable
make_scripts_executable

# Run the selected tools
if [ "$RUN_CODE_AUDIT" = true ]; then
  run_code_audit
fi

if [ "$RUN_NAVIGATION" = true ]; then
  run_navigation_check
fi

if [ "$GENERATE_REPORT" = true ]; then
  generate_unified_report
  
  if [ "$OPEN_REPORT" = true ]; then
    open_reports
  fi
fi

if [ "$FIX_ISSUES" = true ]; then
  try_fix_issues
fi

# Final output
echo -e "\n${GREEN}✅ Codebase integrity check completed!${NC}"
if [ "$GENERATE_REPORT" = true ]; then
  echo -e "${BLUE}ℹ Check ./integrity-reports/ for detailed results${NC}"
else
  echo -e "${BLUE}ℹ Run with --report to generate a unified report${NC}"
fi
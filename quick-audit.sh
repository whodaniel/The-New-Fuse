#!/bin/bash

# Quick Codebase Audit Wrapper Script
# This provides an easy way to run the codebase auditor with common configurations

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Display header
echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}    The New Fuse - Quick Codebase Audit     ${NC}"
echo -e "${BLUE}=============================================${NC}\n"

# Default options
SCAN_DIR="."
OUTPUT_FILE="codebase-audit-report.md"
QUICK_SCAN=false
NAVIGATION_ONLY=false
DEAD_CODE_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dir=*)
      SCAN_DIR="${1#*=}"
      shift
      ;;
    --dir)
      SCAN_DIR="$2"
      shift 2
      ;;
    --quick)
      QUICK_SCAN=true
      shift
      ;;
    --navigation)
      NAVIGATION_ONLY=true
      shift
      ;;
    --dead-code)
      DEAD_CODE_ONLY=true
      shift
      ;;
    --help)
      echo -e "Usage: $0 [options]"
      echo -e "\nOptions:"
      echo "  --dir=<path>     Specify directory to scan (default: current directory)"
      echo "  --quick          Run a quick scan (faster but less comprehensive)"
      echo "  --navigation     Focus only on navigation integrity"
      echo "  --dead-code      Focus only on finding ghost/dead code"
      echo "  --help           Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Ensure the tool scripts are executable
chmod +x ./codebase-auditor.js
chmod +x ./navigation-validator.js

# Set environment variables for configuration
export AUDIT_DIR="$SCAN_DIR"
export AUDIT_QUICK="$QUICK_SCAN"
export AUDIT_OUTPUT="$OUTPUT_FILE"

# Run appropriate tools based on options
if [ "$NAVIGATION_ONLY" = true ]; then
  echo -e "${BLUE}Running navigation integrity check on ${YELLOW}$SCAN_DIR${NC}..."
  node ./navigation-validator.js
  
  # Check if report was generated
  if [ -d "./navigation-report" ]; then
    echo -e "${GREEN}✓ Navigation check completed! See ./navigation-report/ for results${NC}"
  else
    echo -e "${RED}✗ Navigation check failed or no results generated${NC}"
  fi
  
elif [ "$DEAD_CODE_ONLY" = true ]; then
  echo -e "${BLUE}Scanning for ghost/dead code in ${YELLOW}$SCAN_DIR${NC}..."
  export AUDIT_ANALYZE_NAV="false"
  export AUDIT_ANALYZE_COMPONENTS="false"
  
  node ./codebase-auditor.js
  
  # Check if report was generated
  if [ -f "$OUTPUT_FILE" ]; then
    # Extract ghost code section
    echo -e "${GREEN}✓ Ghost code scan completed!${NC}"
    echo -e "${BLUE}Ghost code summary:${NC}"
    grep -A 20 "## 2. Potential Ghost Code" "$OUTPUT_FILE" | tail -n +2 | head -n 10
    echo -e "\n${BLUE}For complete results, see: ${YELLOW}$OUTPUT_FILE${NC}"
  else
    echo -e "${RED}✗ Ghost code scan failed or no results generated${NC}"
  fi
  
else
  # Run full audit
  echo -e "${BLUE}Running full codebase audit on ${YELLOW}$SCAN_DIR${NC}..."
  if [ "$QUICK_SCAN" = true ]; then
    echo -e "${YELLOW}Note: Running in quick mode - results may be less comprehensive${NC}"
  fi
  
  node ./codebase-auditor.js
  
  # Check if report was generated
  if [ -f "$OUTPUT_FILE" ]; then
    echo -e "${GREEN}✓ Codebase audit completed!${NC}"
    echo -e "${BLUE}For complete results, see: ${YELLOW}$OUTPUT_FILE${NC}"
    
    # Generate action plan
    ./verify-codebase-integrity.sh
  else
    echo -e "${RED}✗ Codebase audit failed or no results generated${NC}"
  fi
fi
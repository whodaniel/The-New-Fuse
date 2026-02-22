#!/bin/bash
# ============================================================================
# Jules Task Submitter - Send multiple tasks to Jules CLI in parallel
# ============================================================================
# Usage:
#   ./submit-jules-tasks.sh                    # Submit all tasks in .jules/tasks/
#   ./submit-jules-tasks.sh --parallel 4       # Submit 4 tasks at a time
#   ./submit-jules-tasks.sh --task 01 02 03    # Submit specific tasks
#   ./submit-jules-tasks.sh --dry-run          # Show what would be submitted
# ============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
JULES_GUARD_SCRIPT="$ROOT_DIR/scripts/jules-task-guard.sh"
TASKS_DIR=".jules/tasks"
MAX_PARALLEL=${MAX_PARALLEL:-4}
DRY_RUN=false
SPECIFIC_TASKS=()
REPO=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --parallel|-p)
      MAX_PARALLEL="$2"
      shift 2
      ;;
    --task|-t)
      shift
      while [[ $# -gt 0 && ! $1 == --* ]]; do
        SPECIFIC_TASKS+=("$1")
        shift
      done
      ;;
    --repo|-r)
      REPO="$2"
      shift 2
      ;;
    --dry-run|-n)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -p, --parallel N    Maximum parallel tasks (default: 4)"
      echo "  -t, --task N...     Submit specific task numbers (e.g., 01 02 03)"
      echo "  -r, --repo REPO     Repository to use (e.g., owner/repo)"
      echo "  -n, --dry-run       Show what would be submitted without submitting"
      echo "  -h, --help          Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                           # Submit all tasks"
      echo "  $0 --parallel 8              # Submit with 8 parallel instances"
      echo "  $0 --task 01 02 03 04        # Submit only tasks 01-04"
      echo "  $0 --dry-run --task 05 06    # Preview tasks 05-06"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Check if jules CLI is available
if ! command -v jules &> /dev/null; then
  echo -e "${RED}Error: jules CLI not found. Please install it first.${NC}"
  exit 1
fi

# Check if tasks directory exists
if [ ! -d "$TASKS_DIR" ]; then
  echo -e "${RED}Error: Tasks directory '$TASKS_DIR' not found.${NC}"
  exit 1
fi

if [ ! -f "$JULES_GUARD_SCRIPT" ]; then
  echo -e "${RED}Error: Jules guard script missing: $JULES_GUARD_SCRIPT${NC}"
  exit 1
fi

# Build list of task files
TASK_FILES=()
if [ ${#SPECIFIC_TASKS[@]} -gt 0 ]; then
  for num in "${SPECIFIC_TASKS[@]}"; do
    pattern="${TASKS_DIR}/JULES_TASK_${num}*.md"
    files=($pattern)
    if [ -f "${files[0]}" ]; then
      TASK_FILES+=("${files[0]}")
    else
      echo -e "${YELLOW}Warning: No task file found matching pattern: $pattern${NC}"
    fi
  done
else
  for file in "${TASKS_DIR}"/JULES_TASK_*.md; do
    if [ -f "$file" ]; then
      TASK_FILES+=("$file")
    fi
  done
fi

if [ ${#TASK_FILES[@]} -eq 0 ]; then
  echo -e "${RED}Error: No task files found.${NC}"
  exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Jules Task Submitter                              ║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} Tasks found: ${GREEN}${#TASK_FILES[@]}${NC}"
echo -e "${BLUE}║${NC} Max parallel: ${GREEN}${MAX_PARALLEL}${NC}"
echo -e "${BLUE}║${NC} Dry run: ${GREEN}${DRY_RUN}${NC}"
if [ -n "$REPO" ]; then
  echo -e "${BLUE}║${NC} Repository: ${GREEN}${REPO}${NC}"
fi
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to submit a single task
submit_task() {
  local task_file="$1"
  local task_name=$(basename "$task_file" .md)
  local task_content=$(cat "$task_file")

  echo -e "${YELLOW}[SUBMITTING]${NC} $task_name"

  if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}  Would submit:${NC} ${task_file}"
    echo -e "${BLUE}  Content length:${NC} ${#task_content} chars"
    return 0
  fi

  # Build jules command
  local cmd="jules new"
  if [ -n "$REPO" ]; then
    cmd="$cmd --repo $REPO"
  fi

  if ! bash "$JULES_GUARD_SCRIPT" --text "$task_content" --file "$task_file"; then
    echo -e "${YELLOW}[SKIPPED POLICY]${NC} $task_name blocked: manual frontend/browser viewing is not routed to Jules"
    return 0
  fi

  # Submit to Jules
  if $cmd "$task_content" 2>&1; then
    echo -e "${GREEN}[SUCCESS]${NC} $task_name submitted"
    return 0
  else
    echo -e "${RED}[FAILED]${NC} $task_name"
    return 1
  fi
}

# Submit tasks with parallelism control
export -f submit_task
export DRY_RUN REPO RED GREEN YELLOW BLUE NC JULES_GUARD_SCRIPT

# Using xargs for parallel execution with limit
printf '%s\n' "${TASK_FILES[@]}" | xargs -P "$MAX_PARALLEL" -I {} bash -c 'submit_task "$@"' _ {}

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  All tasks submitted!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Run ${BLUE}jules${NC} to monitor progress, or ${BLUE}jules remote list --session${NC} to see all sessions."

#!/bin/bash
# Helper script for adding dependencies with the correct Yarn version

# Set color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display usage information
function show_usage {
  echo -e "${BLUE}===================================================================${NC}"
  echo -e "${BLUE}              The New Fuse - Add Dependency Helper                 ${NC}"
  echo -e "${BLUE}===================================================================${NC}"
  echo -e "${YELLOW}Usage:${NC}"
  echo -e "  $0 [options] <package-name>"
  echo -e "  $0 [options] <package-name>@<version>"
  echo ""
  echo -e "${YELLOW}Options:${NC}"
  echo -e "  -d, --dev       Add as dev dependency"
  echo -e "  -p, --peer      Add as peer dependency"
  echo -e "  -w, --workspace Specify workspace (e.g., -w @the-new-fuse/core)"
  echo -e "  -e, --exact     Use exact version"
  echo -e "  -h, --help      Show this help message"
  echo ""
  echo -e "${YELLOW}Examples:${NC}"
  echo -e "  $0 react                                   # Add react as dependency"
  echo -e "  $0 --dev typescript                        # Add typescript as dev dependency"
  echo -e "  $0 -w @the-new-fuse/core express           # Add express to core workspace"
  echo -e "  $0 -d -e -w @the-new-fuse/api jest@29.5.0  # Add jest 29.5.0 exactly to api workspace"
  echo ""
}

# Check if help is requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  show_usage
  exit 0
fi

# Check if we have enough arguments
if [ $# -eq 0 ]; then
  show_usage
  exit 1
fi

# Parse arguments
YARN_ARGS=()
PACKAGE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--dev)
      YARN_ARGS+=("-D")
      shift
      ;;
    -p|--peer)
      YARN_ARGS+=("-P")
      shift
      ;;
    -w|--workspace)
      if [ -z "$2" ]; then
        echo -e "${RED}Error: --workspace requires an argument${NC}"
        exit 1
      fi
      YARN_ARGS+=("-W" "$2")
      shift 2
      ;;
    -e|--exact)
      YARN_ARGS+=("--exact")
      shift
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      PACKAGE="$1"
      shift
      ;;
  esac
done

# Check if package name is provided
if [ -z "$PACKAGE" ]; then
  echo -e "${RED}Error: Package name is required${NC}"
  show_usage
  exit 1
fi

# Check if the local Yarn script exists
if [ ! -f "./use-project-yarn.sh" ]; then
  echo -e "${RED}Error: use-project-yarn.sh not found. Please run setup-correct-yarn.sh first.${NC}"
  exit 1
fi

# Add the package using the correct Yarn version
echo -e "${YELLOW}Adding $PACKAGE with Yarn 4.9.1...${NC}"
./use-project-yarn.sh add "${YARN_ARGS[@]}" "$PACKAGE"

# Check if installation was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Successfully added $PACKAGE${NC}"
else
  echo -e "${RED}❌ Failed to add $PACKAGE. Please check the errors above.${NC}"
  exit 1
fi

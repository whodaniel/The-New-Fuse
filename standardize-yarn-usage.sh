#!/bin/bash
# This script updates all shell scripts to use the consistent local Yarn version

# Set color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Standardizing Yarn usage across all shell scripts...${NC}"

# Find all shell scripts
SHELL_SCRIPTS=$(find . -type f -name "*.sh" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/.yarn/*" ! -path "*/dist/*" ! -path "*/build/*")

# Add a counter for modified files
MODIFIED_COUNT=0

for SCRIPT in $SHELL_SCRIPTS; do
  # Skip the use-project-yarn.sh script itself
  if [[ "$SCRIPT" == "./use-project-yarn.sh" ]]; then
    continue
  fi
  
  # Create a temporary file for modifications
  TMP_FILE=$(mktemp)
  
  # Check if the script contains direct yarn commands
  if grep -q "yarn " "$SCRIPT" || grep -q "yarn$" "$SCRIPT"; then
    echo -e "${YELLOW}Updating $SCRIPT...${NC}"
    
    # Replace direct yarn calls with the helper script
    sed 's/\byarn\b/\.\/use-project-yarn.sh/g' "$SCRIPT" > "$TMP_FILE"
    mv "$TMP_FILE" "$SCRIPT"
    
    # Add bash shebang if it doesn't exist
    if ! head -n 1 "$SCRIPT" | grep -q "#!/bin/bash"; then
      TMP_FILE=$(mktemp)
      echo '#!/bin/bash' > "$TMP_FILE"
      cat "$SCRIPT" >> "$TMP_FILE"
      mv "$TMP_FILE" "$SCRIPT"
    fi
    
    # Make the script executable
    chmod +x "$SCRIPT"
    
    MODIFIED_COUNT=$((MODIFIED_COUNT + 1))
  else
    # Clean up temp file if not used
    rm -f "$TMP_FILE"
  fi
done

echo -e "${GREEN}✅ Updated $MODIFIED_COUNT shell scripts to use the standardized Yarn approach${NC}"
echo -e "${YELLOW}Note: Please run ./use-project-yarn.sh install to ensure all dependencies are installed with the correct version${NC}"

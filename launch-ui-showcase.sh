#!/bin/bash
# Script to launch all UI components of The New Fuse project

# Exit on error
set -e

# Print with colors for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
BOLD="\033[1m"
NC="\033[0m" # No Color

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}===============================================================${NC}"
echo -e "${BOLD}${GREEN}🚀 THE NEW FUSE - UI COMPONENT LAUNCHER${NC}"
echo -e "${BLUE}===============================================================${NC}"

# Function to open a URL in a browser
open_url() {
  local url=$1
  local description=$2
  echo -e "${YELLOW}Opening $description: $url${NC}"
  
  case "$(uname)" in
    "Darwin") # macOS
      open "$url"
      ;;
    "Linux")
      if command -v xdg-open > /dev/null; then
        xdg-open "$url" &
      else
        echo "❓ Could not automatically open browser. Please open $url manually."
      fi
      ;;
    *)
      echo "❓ Could not automatically open browser. Please open $url manually."
      ;;
  esac
}

# Find all HTML files in the project
echo -e "\n${CYAN}${BOLD}STEP 1: LOCATING UI COMPONENTS${NC}"
echo -e "${YELLOW}Finding all HTML pages...${NC}"
HTML_FILES=$(find . -type f -name "*.html" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/out/*")

# Create a temporary server to serve HTML files
echo -e "\n${CYAN}${BOLD}STEP 2: SETTING UP TEMPORARY WEB SERVER${NC}"
echo -e "${YELLOW}Setting up local server to serve HTML files...${NC}"

# Check if http-server is available, install if necessary
if ! command -v npx > /dev/null; then
  echo -e "${RED}npx command not found. Please install Node.js with npm.${NC}"
  exit 1
fi

# Create directory for UI components
mkdir -p ./ui-showcase

# Copy HTML files to UI showcase directory
for file in $HTML_FILES; do
  # Get directory name for categorization
  DIR_NAME=$(dirname "$file" | tr / -)
  FILE_NAME=$(basename "$file")
  TARGET_NAME="${DIR_NAME}-${FILE_NAME}"
  
  # Create a wrapper HTML that lists the file and provides a link
  cat > "./ui-showcase/${TARGET_NAME}" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The New Fuse - ${file}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background-color: #333; color: white; padding: 1rem; border-radius: 5px; }
    .content { margin-top: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
    iframe { width: 100%; height: 500px; border: 1px solid #ddd; }
    .source { margin-top: 20px; background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
    .footer { margin-top: 20px; text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>The New Fuse UI Component</h1>
      <p>Viewing: ${file}</p>
    </div>
    <div class="content">
      <h2>Component Preview</h2>
      <iframe src="${file}" title="${file}"></iframe>
    </div>
    <div class="source">
      <h2>Source Path</h2>
      <code>${file}</code>
    </div>
    <div class="footer">
      <p>The New Fuse Project - UI Component Showcase</p>
    </div>
  </div>
</body>
</html>
EOL
done

# Create an index page listing all UI components
echo -e "${YELLOW}Creating index page for all UI components...${NC}"
cat > ./ui-showcase/index.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The New Fuse - UI Component Showcase</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background-color: #333; color: white; padding: 1rem; border-radius: 5px; }
    .components { margin-top: 20px; }
    .component-item { padding: 10px; border-bottom: 1px solid #ddd; }
    .component-item a { color: #0366d6; text-decoration: none; }
    .component-item a:hover { text-decoration: underline; }
    .footer { margin-top: 20px; text-align: center; color: #666; }
    .services { margin-top: 30px; padding: 20px; background-color: #f5f5f5; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>The New Fuse - UI Component Showcase</h1>
      <p>Browse all UI components in the project</p>
    </div>
    
    <div class="services">
      <h2>Core Services</h2>
      <ul>
        <li><a href="http://localhost:3000" target="_blank">Main Frontend UI (port 3000)</a></li>
        <li><a href="http://localhost:3001" target="_blank">API Service (port 3001)</a></li>
        <li><a href="http://localhost:3002" target="_blank">Backend Service (port 3002)</a></li>
      </ul>
    </div>
    
    <div class="components">
      <h2>All UI Components</h2>
EOL

# Add each HTML file to the index
for file in $HTML_FILES; do
  DIR_NAME=$(dirname "$file" | tr / -)
  FILE_NAME=$(basename "$file")
  TARGET_NAME="${DIR_NAME}-${FILE_NAME}"
  
  echo "<div class=\"component-item\"><a href=\"${TARGET_NAME}\" target=\"_blank\">${file}</a></div>" >> ./ui-showcase/index.html
done

# Close the index.html file
cat >> ./ui-showcase/index.html << EOL
    </div>
    
    <div class="footer">
      <p>The New Fuse Project - UI Component Showcase</p>
    </div>
  </div>
</body>
</html>
EOL

# Start a server to host the UI showcase
echo -e "\n${CYAN}${BOLD}STEP 3: LAUNCHING UI SHOWCASE SERVER${NC}"
echo -e "${YELLOW}Starting server on port 8080...${NC}"
npx http-server ./ui-showcase -p 8080 &
SERVER_PID=$!

# Give the server a moment to start
sleep 2

# Open the showcase in a browser
echo -e "\n${CYAN}${BOLD}STEP 4: OPENING UI SHOWCASE IN BROWSER${NC}"
open_url "http://localhost:8080" "UI Component Showcase"

echo -e "\n${GREEN}${BOLD}==============================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 UI COMPONENT SHOWCASE LAUNCHED!${NC}"
echo -e "${GREEN}${BOLD}==============================================================${NC}"
echo -e "${BLUE}UI Showcase:${NC} http://localhost:8080"
echo -e ""
echo -e "${RED}Press Ctrl+C to stop the showcase server${NC}"

# Capture Ctrl+C and cleanup
cleanup() {
  echo -e "\n${RED}Shutting down UI showcase server...${NC}"
  kill $SERVER_PID 2>/dev/null || true
  echo -e "${GREEN}Showcase server stopped.${NC}"
  exit 0
}

trap cleanup INT

# Keep script running
while true; do
  sleep 1
done

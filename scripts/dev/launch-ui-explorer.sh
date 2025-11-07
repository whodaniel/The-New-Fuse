#!/bin/bash
# Script to create an explorer for all UI components in The New Fuse project

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
echo -e "${BOLD}${GREEN}🚀 THE NEW FUSE - UI COMPONENT EXPLORER${NC}"
echo -e "${BLUE}===============================================================${NC}"

# Create directory for UI explorer
EXPLORER_DIR="$SCRIPT_DIR/ui-explorer"
mkdir -p "$EXPLORER_DIR"

# Find all HTML files in the project
echo -e "\n${CYAN}${BOLD}STEP 1: LOCATING UI COMPONENTS${NC}"
echo -e "${YELLOW}Finding all HTML and React components...${NC}"

# Find all HTML files (excluding node_modules, dist, and .git directories)
HTML_FILES=$(find . -name "*.html" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" -not -path "*/out/*")

# Find all React component files (TSX/JSX)
REACT_FILES=$(find . -name "*.tsx" -o -name "*.jsx" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" -not -path "*/out/*" | grep -E 'component|Component|page|Page')

# Create index page
echo -e "\n${CYAN}${BOLD}STEP 2: CREATING UI EXPLORER${NC}"
echo -e "${YELLOW}Building UI explorer index...${NC}"

cat > "$EXPLORER_DIR/index.html" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The New Fuse - UI Explorer</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #4a2a97 0%, #6a4fb8 100%);
      color: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    h1 { margin: 0; font-size: 2.5rem; }
    .subheader { margin-top: 0.5rem; opacity: 0.8; }
    .panel {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      margin-bottom: 20px;
      padding: 20px;
    }
    .panel h2 {
      margin-top: 0;
      color: #4a2a97;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 10px;
    }
    .component-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
    }
    .component-item {
      background-color: #f9f9f9;
      border-radius: 6px;
      padding: 15px;
      transition: all 0.2s ease;
    }
    .component-item:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
    .component-item h3 {
      margin-top: 0;
      color: #333;
      font-size: 1rem;
    }
    .component-type {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: bold;
      padding: 3px 8px;
      border-radius: 12px;
      margin-bottom: 8px;
    }
    .type-html { background-color: #e1f5fe; color: #0277bd; }
    .type-react { background-color: #e8f5e9; color: #2e7d32; }
    .path {
      font-family: monospace;
      font-size: 0.8rem;
      color: #555;
      margin-bottom: 10px;
      word-break: break-all;
    }
    .view-btn {
      display: inline-block;
      background-color: #4a2a97;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    }
    .view-btn:hover {
      background-color: #6a4fb8;
    }
    .services {
      background-color: #fff3e0;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .services h3 {
      margin-top: 0;
      color: #e65100;
    }
    .services a {
      color: #e65100;
      text-decoration: none;
      font-weight: bold;
    }
    .services a:hover {
      text-decoration: underline;
    }
    .search-box {
      width: 100%;
      padding: 10px;
      font-size: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>The New Fuse</h1>
      <div class="subheader">UI Component Explorer</div>
    </div>
    
    <div class="services panel">
      <h3>Core Services</h3>
      <ul>
        <li><a href="http://localhost:3000" target="_blank">Main Frontend UI (port 3000)</a></li>
        <li><a href="http://localhost:3001" target="_blank">API Service (port 3001)</a></li>
        <li><a href="http://localhost:3002" target="_blank">Backend Service (port 3002)</a></li>
        <li><a href="http://localhost:3711" target="_blank">WebSocket Server (port 3711)</a></li>
        <li><a href="http://localhost:3712" target="_blank">WebSocket Test Server (port 3712)</a></li>
      </ul>
    </div>
    
    <div class="panel">
      <h2>Component Explorer</h2>
      
      <input type="text" class="search-box" id="searchBox" placeholder="Search components by name or path...">
      
      <div class="component-list" id="componentList">
EOL

# Add HTML files to index
for file in $HTML_FILES; do
  name=$(basename "$file")
  cat >> "$EXPLORER_DIR/index.html" << EOL
        <div class="component-item">
          <span class="component-type type-html">HTML</span>
          <h3>${name}</h3>
          <div class="path">${file}</div>
          <a class="view-btn" href="view.html?path=${file}" target="_blank">View Component</a>
        </div>
EOL
done

# Add React files to index
for file in $REACT_FILES; do
  name=$(basename "$file")
  cat >> "$EXPLORER_DIR/index.html" << EOL
        <div class="component-item">
          <span class="component-type type-react">React</span>
          <h3>${name}</h3>
          <div class="path">${file}</div>
          <a class="view-btn" href="view.html?path=${file}&type=react" target="_blank">View Source</a>
        </div>
EOL
done

# Close the index.html
cat >> "$EXPLORER_DIR/index.html" << EOL
      </div>
    </div>
  </div>
  
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const searchBox = document.getElementById('searchBox');
      const componentItems = document.querySelectorAll('.component-item');
      
      searchBox.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        componentItems.forEach(item => {
          const title = item.querySelector('h3').textContent.toLowerCase();
          const path = item.querySelector('.path').textContent.toLowerCase();
          
          if (title.includes(searchTerm) || path.includes(searchTerm)) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  </script>
</body>
</html>
EOL

# Create component viewer page
echo -e "${YELLOW}Creating component viewer...${NC}"

cat > "$EXPLORER_DIR/view.html" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The New Fuse - Component Viewer</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #4a2a97 0%, #6a4fb8 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      margin: 0;
      font-size: 1.8rem;
    }
    .back-btn {
      background-color: rgba(255,255,255,0.2);
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
    }
    .back-btn:hover {
      background-color: rgba(255,255,255,0.3);
    }
    .panel {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      margin-bottom: 20px;
      padding: 20px;
    }
    .component-info {
      padding-bottom: 15px;
      margin-bottom: 15px;
      border-bottom: 1px solid #eee;
    }
    .component-info h2 {
      margin-top: 0;
      color: #4a2a97;
    }
    .path {
      font-family: monospace;
      font-size: 0.9rem;
      color: #555;
      margin-bottom: 10px;
      word-break: break-all;
    }
    .component-preview {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 20px;
      margin-bottom: 20px;
      min-height: 300px;
    }
    .component-code {
      background-color: #f8f8f8;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      overflow-x: auto;
      font-family: monospace;
      white-space: pre-wrap;
      font-size: 0.9rem;
    }
    .component-code code {
      display: block;
    }
    .not-available {
      text-align: center;
      padding: 40px;
      color: #999;
    }
    .tabs {
      display: flex;
      margin-bottom: 15px;
    }
    .tab {
      padding: 8px 16px;
      background-color: #f0f0f0;
      border: none;
      cursor: pointer;
      margin-right: 5px;
      border-radius: 4px 4px 0 0;
    }
    .tab.active {
      background-color: #4a2a97;
      color: white;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    iframe {
      width: 100%;
      height: 600px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Parse URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const filePath = urlParams.get('path');
      const fileType = urlParams.get('type') || 'html';
      
      // Update title and info
      document.title = 'Component: ' + filePath.split('/').pop();
      document.querySelector('.component-title').textContent = filePath.split('/').pop();
      document.querySelector('.component-path').textContent = filePath;
      
      // Fetch file content
      fetch('/fetch-file?path=' + encodeURIComponent(filePath))
        .then(response => {
          if (!response.ok) {
            throw new Error('File not found');
          }
          return response.text();
        })
        .then(content => {
          // Show content in code view
          const codeElement = document.querySelector('.component-code code');
          codeElement.textContent = content;
          
          // If it's HTML, also try to show in preview
          if (fileType === 'html') {
            try {
              const iframe = document.getElementById('preview-iframe');
              iframe.srcdoc = content;
            } catch (e) {
              console.error('Error setting preview:', e);
            }
          } else {
            document.getElementById('preview-tab').style.display = 'none';
            document.getElementById('source-tab').classList.add('active');
            document.getElementById('tab-source').classList.add('active');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          document.querySelector('.component-code code').textContent = 'Error: Could not load file content.';
          document.getElementById('preview-iframe').srcdoc = '<div style="padding:20px;text-align:center;">Preview not available</div>';
        });
        
      // Tab switching
      document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
          // Deactivate all tabs
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
          
          // Activate clicked tab
          tab.classList.add('active');
          document.getElementById('tab-' + tab.id.replace('-tab', '')).classList.add('active');
        });
      });
    });
  </script>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Component Viewer</h1>
      <a href="index.html" class="back-btn">← Back to Explorer</a>
    </div>
    
    <div class="panel">
      <div class="component-info">
        <h2 class="component-title">Loading...</h2>
        <div class="path component-path">Loading...</div>
      </div>
      
      <div class="tabs">
        <button id="preview-tab" class="tab active">Preview</button>
        <button id="source-tab" class="tab">Source Code</button>
      </div>
      
      <div id="tab-preview" class="tab-content active">
        <iframe id="preview-iframe" title="Component Preview"></iframe>
      </div>
      
      <div id="tab-source" class="tab-content">
        <div class="component-code">
          <code>Loading...</code>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
EOL

# Create server script to serve the explorer and fetch files
cat > "$EXPLORER_DIR/server.js" << EOL
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const ROOT_DIR = process.cwd();

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  console.log(\`[\${new Date().toISOString()}] \${req.method} \${pathname}\`);
  
  // Special handler for fetching file contents
  if (pathname === '/fetch-file') {
    const filePath = parsedUrl.query.path;
    
    if (!filePath) {
      res.writeHead(400);
      res.end('Missing path parameter');
      return;
    }
    
    // Security check to prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      res.writeHead(403);
      res.end('Access denied');
      return;
    }
    
    const absolutePath = path.join(ROOT_DIR, filePath);
    
    fs.readFile(absolutePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end(\`File not found: \${err.message}\`);
        return;
      }
      
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end(data);
    });
    return;
  }
  
  // Serve static files
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(__dirname, pathname);
  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'text/plain';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    res.writeHead(200, {'Content-Type': contentType});
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(\`UI Explorer server running at http://localhost:\${PORT}/\`);
});

console.log('Press Ctrl+C to stop the server');
EOL

echo -e "\n${CYAN}${BOLD}STEP 3: LAUNCHING UI EXPLORER${NC}"
echo -e "${YELLOW}Starting UI Explorer server on port 8080...${NC}"

# Start the server
cd "$EXPLORER_DIR"
node server.js &
SERVER_PID=$!

# Wait for the server to start
sleep 2

# Open browser
echo -e "${GREEN}Opening browser to UI Explorer...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:8080"
else
  echo "Please open http://localhost:8080 in your browser"
fi

echo -e "\n${GREEN}${BOLD}==============================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 UI EXPLORER LAUNCHED!${NC}"
echo -e "${GREEN}${BOLD}==============================================================${NC}"
echo -e "${BLUE}UI Explorer:${NC} http://localhost:8080"
echo -e ""
echo -e "${RED}Press Ctrl+C to stop the UI Explorer${NC}"

# Capture Ctrl+C and cleanup
trap 'kill $SERVER_PID 2>/dev/null; echo -e "\n${GREEN}UI Explorer stopped.${NC}"; exit 0' INT TERM

# Keep script running
wait $SERVER_PID
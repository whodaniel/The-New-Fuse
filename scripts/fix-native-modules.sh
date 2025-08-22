#!/bin/bash
echo "--- Starting Manual Native Module Fix ---"

# Ensure nvm is sourced
# This line may need to be adjusted based on the shell environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 1. Switch to the correct Node.js version
echo "Step 1: Switching to Node.js v18..."
nvm use 18

# 2. Install packages, ignoring build scripts to prevent errors
echo "Step 2: Installing dependencies with --ignore-scripts..."
bun install --ignore-scripts

# 3. Manually compile canvas native bindings
echo "Step 3: Rebuilding canvas module with node-gyp..."
if [ -d "node_modules/canvas" ]; then
  cd node_modules/canvas
  node-gyp rebuild
  cd ../..
  echo "Canvas rebuild complete."
else
  echo "Error: node_modules/canvas not found. Cannot rebuild."
  exit 1
fi

echo "--- Manual Fix Complete ---"
echo "Native modules should now be correctly built."

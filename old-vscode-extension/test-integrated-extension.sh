#!/bin/bash

echo "====================================================="
echo "  Testing The New Fuse Extension Integrated Features  "
echo "====================================================="

# Step 1: Build the extension
echo "Step 1: Building the extension..."
./build.sh

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Please fix the errors and try again."
  exit 1
fi

echo "✅ Build completed successfully!"

# Step 2: Set up environment for testing
echo "Step 2: Setting up test environment..."
mkdir -p ./test-workspace
cat > ./test-workspace/test-file.js << EOF
// This is a test file for The New Fuse Extension integrated features

function testFunction() {
  console.log('Testing The New Fuse Extension');
  console.log('With AI Coder and Roo Integration');
  return true;
}

testFunction();
EOF

echo "✅ Test workspace created!"

# Step 3: Launch VS Code with the extension
echo "Step 3: Launching VS Code with the extension..."
echo "This will open a new VS Code window with the extension loaded."
echo "You can test the integrated features in this window."

# Launch VS Code with the extension
code --extensionDevelopmentPath="$(pwd)" ./test-workspace

# Print test instructions
echo ""
echo "======= TEST INSTRUCTIONS ======="
echo "1. Check the extension sidebar for the AI Coder view"
echo "2. Try the 'Start Roo AI Code Monitoring' command"
echo "3. Check the status bar for the AI Coder status indicator"
echo "4. Use the 'Show AI Coder Status' command to verify integration"
echo ""
echo "When finished testing, close the VS Code window and press Enter to continue..."

read -p "Press Enter when finished testing..."

# Step 4: Clean up
echo "Step 4: Cleaning up..."
rm -rf ./test-workspace

echo "✅ Test completed!"
echo "====================================================="
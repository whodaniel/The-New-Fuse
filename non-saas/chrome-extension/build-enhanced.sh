#!/bin/bash

# Enhanced TNF Chrome Extension Build Script
# This script builds and packages the fully enhanced Chrome extension

set -e

echo "🚀 Building Enhanced TNF Chrome Extension..."

# Create build directory
BUILD_DIR="build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "📁 Creating build directory: $BUILD_DIR"

# Copy core extension files
echo "📄 Copying core extension files..."
cp manifest.json "$BUILD_DIR/"
cp popup.html "$BUILD_DIR/"
cp popup.js "$BUILD_DIR/"
cp background.js "$BUILD_DIR/"
cp content.js "$BUILD_DIR/"
cp injectable-ui.js "$BUILD_DIR/"
cp injectable-ui.css "$BUILD_DIR/"

# Copy additional assets if they exist
if [ -f "icons/icon16.png" ]; then
    mkdir -p "$BUILD_DIR/icons"
    cp icons/*.png "$BUILD_DIR/icons/" 2>/dev/null || true
fi

# Update manifest with build info
echo "⚙️ Updating manifest with build information..."
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_VERSION="2.1.0-enhanced"

# Create a temporary manifest with build info
jq --arg build_time "$BUILD_TIME" --arg build_version "$BUILD_VERSION" \
   '.version = $build_version | .description = .description + " (Built: " + $build_time + ")"' \
   manifest.json > "$BUILD_DIR/manifest.json" 2>/dev/null || {
    # Fallback if jq is not available
    echo "⚠️ jq not found, copying manifest as-is"
    cp manifest.json "$BUILD_DIR/"
}

# Add build metadata
echo "📊 Adding build metadata..."
cat > "$BUILD_DIR/build-info.json" << EOF
{
  "buildTime": "$BUILD_TIME",
  "version": "$BUILD_VERSION",
  "features": [
    "Enhanced TNF Integration",
    "Agent Orchestrator Connection",
    "Real-time Performance Monitoring",
    "Advanced Feature Management",
    "Comprehensive Status Monitoring",
    "Workflow Automation Support"
  ],
  "components": {
    "popup": "Enhanced popup with TNF integration",
    "injectable": "Full-featured injectable UI",
    "background": "Comprehensive background service",
    "content": "Content script with advanced injection"
  }
}
EOF

echo "🎨 Adding enhanced styles..."
# Ensure CSS is properly formatted
if [ -f injectable-ui.css ]; then
    # Add enhanced TNF styles to the CSS
    cat >> "$BUILD_DIR/injectable-ui.css" << 'EOF'

/* Enhanced TNF Integration Styles */
.tnf-advanced-status {
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  margin: 8px 0;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.status-card {
  background: white;
  border-radius: 6px;
  padding: 8px;
  border-left: 3px solid #667eea;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.status-card h4 {
  margin: 0 0 6px 0;
  font-size: 11px;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
}

.status-row, .metric-row, .feature-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  margin-bottom: 4px;
}

.status-indicator.online, .metric-value {
  color: #28a745;
  font-weight: 500;
}

.status-indicator.offline {
  color: #dc3545;
  font-weight: 500;
}

.feature-toggle {
  width: 24px;
  height: 12px;
  background: #ccc;
  border-radius: 6px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.feature-toggle.active {
  background: #667eea;
}

.toggle-slider {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 1px;
  left: 1px;
  transition: transform 0.3s;
}

.feature-toggle.active .toggle-slider {
  transform: translateX(12px);
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-top: 8px;
}

.tnf-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tnf-btn.primary {
  background: #667eea;
  color: white;
}

.tnf-btn.primary:hover {
  background: #5a6fd8;
}

.tnf-btn.secondary {
  background: #6c757d;
  color: white;
}

.tnf-btn.secondary:hover {
  background: #5a6268;
}
EOF
fi

echo "🔍 Validating extension files..."
# Basic validation
REQUIRED_FILES=("manifest.json" "popup.html" "popup.js" "background.js" "content.js" "injectable-ui.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$BUILD_DIR/$file" ]; then
        echo "❌ Error: Required file $file not found in build"
        exit 1
    fi
done

echo "📦 Creating extension package..."
# Create ZIP package
PACKAGE_NAME="tnf-enhanced-chrome-extension-$(date +%Y%m%d-%H%M%S).zip"
cd "$BUILD_DIR"
zip -r "../$PACKAGE_NAME" ./* -q
cd ..

echo "✅ Enhanced TNF Chrome Extension built successfully!"
echo ""
echo "📊 Build Summary:"
echo "   Version: $BUILD_VERSION"
echo "   Build Time: $BUILD_TIME"
echo "   Package: $PACKAGE_NAME"
echo "   Size: $(du -h "$PACKAGE_NAME" | cut -f1)"
echo ""
echo "🚀 Features Included:"
echo "   ✓ Enhanced popup with TNF integration"
echo "   ✓ Advanced injectable UI with feature toggles"
echo "   ✓ Comprehensive background service"
echo "   ✓ Agent orchestrator connectivity"
echo "   ✓ Real-time performance monitoring"
echo "   ✓ Workflow automation support"
echo "   ✓ Advanced status monitoring"
echo ""
echo "📋 Installation Instructions:"
echo "   1. Open Chrome and go to chrome://extensions/"
echo "   2. Enable 'Developer mode'"
echo "   3. Click 'Load unpacked' and select the '$BUILD_DIR' folder"
echo "   4. Or drag and drop '$PACKAGE_NAME' to install"
echo ""
echo "🔧 Testing Checklist:"
echo "   □ Test popup interface on AI websites"
echo "   □ Test injectable UI toggle and features"
echo "   □ Verify TNF integration status"
echo "   □ Test agent registration"
echo "   □ Verify performance monitoring"
echo "   □ Test feature toggles"
echo "   □ Check background service logs"
echo ""
echo "Build complete! 🎉"
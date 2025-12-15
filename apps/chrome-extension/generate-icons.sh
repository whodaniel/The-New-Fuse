#!/bin/bash

# Icon Generation Script for The New Fuse Chrome Extension
# This script generates PNG icons from SVG using various methods

# Create icons directory
mkdir -p icons

# Base SVG icon (TNF logo - stylized fuse/lightning bolt with purple gradient)
cat > icons/icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="tnf-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
    <linearGradient id="tnf-glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#6366f1"/>
    </linearGradient>
  </defs>

  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="url(#tnf-gradient)"/>

  <!-- Fuse/Lightning bolt symbol -->
  <path d="M72 20 L48 58 L62 58 L52 108 L88 54 L70 54 L84 20 Z"
        fill="white"
        stroke="rgba(255,255,255,0.3)"
        stroke-width="2"/>

  <!-- Connection dots -->
  <circle cx="30" cy="40" r="6" fill="rgba(255,255,255,0.6)"/>
  <circle cx="98" cy="88" r="6" fill="rgba(255,255,255,0.6)"/>

  <!-- Connecting lines (representing the "fuse") -->
  <line x1="30" y1="40" x2="48" y2="58" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
  <line x1="88" y1="54" x2="98" y2="88" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
</svg>
EOF

echo "SVG icon created at icons/icon.svg"

# Try to convert using available tools
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate PNGs..."
    convert icons/icon.svg -resize 16x16 icons/icon16.png
    convert icons/icon.svg -resize 32x32 icons/icon32.png
    convert icons/icon.svg -resize 48x48 icons/icon48.png
    convert icons/icon.svg -resize 128x128 icons/icon128.png
elif command -v rsvg-convert &> /dev/null; then
    echo "Using rsvg-convert to generate PNGs..."
    rsvg-convert -w 16 -h 16 icons/icon.svg > icons/icon16.png
    rsvg-convert -w 32 -h 32 icons/icon.svg > icons/icon32.png
    rsvg-convert -w 48 -h 48 icons/icon.svg > icons/icon48.png
    rsvg-convert -w 128 -h 128 icons/icon.svg > icons/icon128.png
elif command -v sips &> /dev/null; then
    echo "Using macOS sips..."
    # sips can't convert SVG, but we'll create placeholder PNGs
    echo "Note: sips cannot convert SVG. Creating PNG placeholders..."
else
    echo "No SVG conversion tool found. Install ImageMagick or librsvg."
    echo "Manual conversion needed:"
    echo "  brew install imagemagick"
    echo "  # Then re-run this script"
fi

echo "Icon generation complete!"
echo ""
echo "If PNG files were not created, you can:"
echo "1. Open icons/icon.svg in a browser"
echo "2. Use an online SVG to PNG converter"
echo "3. Install ImageMagick: brew install imagemagick"

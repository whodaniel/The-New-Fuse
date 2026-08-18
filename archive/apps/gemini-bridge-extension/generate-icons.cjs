'use strict';

// Add ESLint directives to allow CommonJS syntax
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

// Imports
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Simple icon generation that copies pre-made icons
function generateIcons() {
  // Create icons directory if it doesn't exist
  if (!fs.existsSync('./icons')) {
    fs.mkdirSync('./icons');
  }

  // Copy default icons for now instead of generating them
  const sizes = [16, 48, 128];
  const states = ['', '-connected', '-error', '-partial', '-disconnected'];

  sizes.forEach(size => {
    states.forEach(state => {
      try {
        // Try to copy from a default-icons directory first
        const defaultPath = path.join(__dirname, 'default-icons', `icon${size}${state}.png`);
        const targetPath = path.join(__dirname, 'icons', `icon${size}${state}.png`);
        
        if (fs.existsSync(defaultPath)) {
          fs.copyFileSync(defaultPath, targetPath);
        } else {
          // If no default icon exists, create a minimal placeholder
          const canvas = createCanvas(size, size);
          const ctx = canvas.getContext('2d');
          
          // Fill with a color based on state
          switch(state) {
            case '-connected':
              ctx.fillStyle = '#4CAF50'; // Green for connected
              break;
            case '-error':
              ctx.fillStyle = '#F44336'; // Red for error
              break;
            case '-partial':
              ctx.fillStyle = '#FF9800'; // Orange for partial
              break;
            case '-disconnected':
              ctx.fillStyle = '#9E9E9E'; // Grey for disconnected
              break;
            default:
              ctx.fillStyle = '#2196F3'; // Blue for default
              break;
          }
          
          ctx.fillRect(0, 0, size, size);
          
          // Add a simple letter in the middle
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.floor(size * 0.6)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('F', size/2, size/2);
          
          // Convert to PNG and save
          const buffer = canvas.toBuffer('image/png');
          fs.writeFileSync(targetPath, buffer);
        }
        
        console.log(`Generated icon${size}${state}.png`);
      } catch (error) {
        console.error(`Failed to generate icon${size}${state}.png:`, error);
      }
    });
  });

  console.log('Icons generated successfully!');
}

// Execute the function
generateIcons();

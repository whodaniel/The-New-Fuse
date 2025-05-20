const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function convertSvgToPng(size) {
  try {
    // Create a canvas with the specified dimensions
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Load the SVG file
    const svgPath = `./icons/icon${size}.svg`;
    if (!fs.existsSync(svgPath)) {
      console.error(`SVG file not found: ${svgPath}`);
      return;
    }
    
    // Create a data URL from the SVG file
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    
    // Load the image
    const img = await loadImage(dataUrl);
    
    // Draw the image on the canvas
    ctx.drawImage(img, 0, 0, size, size);
    
    // Save the canvas as a PNG file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`./icons/icon${size}.png`, buffer);
    
    console.log(`Successfully converted icon${size}.svg to icon${size}.png`);
  } catch (error) {
    console.error(`Error converting icon${size}.svg to PNG:`, error);
  }
}

// Convert the 128px icon
convertSvgToPng(128)
  .then(() => console.log('Conversion complete'))
  .catch(err => console.error('Conversion failed:', err));

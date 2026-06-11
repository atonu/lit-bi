const sharp = require('sharp');
const path = require('path');

async function generateIcon() {
  const inputPath = path.join(__dirname, 'public', 'favicon.png');
  const outputPath = path.join(__dirname, 'public', 'pwa-icon.png');
  const applePath = path.join(__dirname, 'public', 'apple-icon.png');

  try {
    const { width, height } = await sharp(inputPath).metadata();
    
    // Create a square background with color #131314
    const size = Math.max(width, height, 512); // ensure it's at least 512x512
    const bg = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: '#131314'
      }
    });

    // Resize input if needed to fit perfectly without whitespace
    // Or just composite it
    await bg.composite([
      {
        input: inputPath,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(outputPath);

    // Also copy to apple-icon
    await sharp(outputPath).resize(180, 180).toFile(applePath);

    console.log('Successfully generated pwa-icon.png and apple-icon.png');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcon();

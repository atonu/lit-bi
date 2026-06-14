const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_IMAGE = path.join(__dirname, '../public/splash.png');
const OUTPUT_DIR = path.join(__dirname, '../public/splash');

// Resolutions matching modern iPhone models:
// Format: { name, width, height }
const RESOLUTIONS = [
  { name: 'apple-splash-1320-2868', width: 1320, height: 2868 }, // iPhone 16 Pro Max
  { name: 'apple-splash-1206-2622', width: 1206, height: 2622 }, // iPhone 16 Pro
  { name: 'apple-splash-1290-2796', width: 1290, height: 2796 }, // iPhone 16 Plus, 15 Pro Max, 15 Plus, 14 Pro Max
  { name: 'apple-splash-1179-2556', width: 1179, height: 2556 }, // iPhone 16, 15 Pro, 15, 14 Pro
  { name: 'apple-splash-1284-2778', width: 1284, height: 2778 }, // iPhone 14 Plus, 13 Pro Max, 12 Pro Max
  { name: 'apple-splash-1170-2532', width: 1170, height: 2532 }, // iPhone 14, 13 Pro, 13, 12 Pro, 12
  { name: 'apple-splash-1125-2436', width: 1125, height: 2436 }, // iPhone 13 mini, 12 mini, 11 Pro, XS, X
  { name: 'apple-splash-1242-2688', width: 1242, height: 2688 }, // iPhone 11 Pro Max, XS Max
  { name: 'apple-splash-828-1792',  width: 828,  height: 1792 }, // iPhone 11, XR
  { name: 'apple-splash-750-1334',  width: 750,  height: 1334 }, // iPhone 8, 7, 6s, 6, SE 2/3
  { name: 'apple-splash-640-1136',  width: 640,  height: 1136 }  // iPhone SE 1st gen, 5s, 5
];

// Dark background color matching the edges of public/splash.png
const BACKGROUND_COLOR = { r: 1, g: 3, b: 12 }; // #01030c

async function generateSplashScreens() {
  console.log(`Starting splash screen generation from: ${SOURCE_IMAGE}`);
  
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error(`Source image not found at ${SOURCE_IMAGE}`);
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log(`Creating directory: ${OUTPUT_DIR}`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const res of RESOLUTIONS) {
    const outputPath = path.join(OUTPUT_DIR, `${res.name}.png`);
    console.log(`Generating ${res.name}.png (${res.width}x${res.height})...`);

    try {
      await sharp(SOURCE_IMAGE)
        .resize({
          width: res.width,
          height: res.height,
          fit: 'contain',
          background: BACKGROUND_COLOR
        })
        .toFile(outputPath);
      
      console.log(`Successfully generated ${res.name}.png`);
    } catch (err) {
      console.error(`Error generating ${res.name}.png:`, err);
    }
  }

  console.log('Splash screen generation complete!');
}

generateSplashScreens();

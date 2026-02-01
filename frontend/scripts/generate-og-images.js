#!/usr/bin/env node

/**
 * Generate Open Graph preview images from SVG templates
 * 
 * This script converts SVG files to PNG format for social media previews.
 * Run: node scripts/generate-og-images.js
 * 
 * Requirements: sharp (npm install sharp --save-dev)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const images = [
  { svg: 'og-feedback.svg', png: 'og-feedback.png' },
  { svg: 'og-availability.svg', png: 'og-availability.png' },
  { svg: 'og-payment.svg', png: 'og-payment.png' },
];

async function generateImages() {
  console.log('🎨 Generating OG preview images...\n');

  for (const { svg, png } of images) {
    const svgPath = path.join(PUBLIC_DIR, svg);
    const pngPath = path.join(PUBLIC_DIR, png);

    if (!fs.existsSync(svgPath)) {
      console.log(`⚠️  Skipping ${svg} (file not found)`);
      continue;
    }

    try {
      // Read SVG and convert to PNG with specified dimensions
      await sharp(svgPath)
        .resize(1200, 630) // Standard OG image size
        .png({
          quality: 90,
          compressionLevel: 9,
        })
        .toFile(pngPath);

      const stats = fs.statSync(pngPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      
      console.log(`✅ ${svg} → ${png} (${sizeKB} KB)`);
    } catch (error) {
      console.error(`❌ Error processing ${svg}:`, error.message);
    }
  }

  console.log('\n🎉 OG image generation complete!');
}

generateImages().catch(console.error);

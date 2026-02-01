#!/usr/bin/env node

/**
 * Generate Open Graph preview images for WhatsApp/Social sharing
 * 
 * Uses Puppeteer to render HTML templates and capture as PNG
 * 
 * WhatsApp OG Image Guidelines:
 * - Recommended: 1200x630 pixels (1.91:1 ratio)
 * - Minimum: 600x315 pixels
 * - Format: JPG or PNG
 * 
 * Run: node scripts/generate-og-images.js
 * Requirements: npm install puppeteer --save-dev
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const WIDTH = 1200;
const HEIGHT = 630;

const generateHTML = (type) => {
  const configs = {
    feedback: {
      title: 'Match Feedback',
      subtitle: 'Share your match experience and rate your performance',
      accentColors: ['#f97316', '#f43f5e', '#ec4899'],
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="url(#iconGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:60px;height:60px">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>`,
      emoji: '⭐'
    },
    availability: {
      title: 'Match Availability',
      subtitle: "View squad responses and who's playing",
      accentColors: ['#10b981', '#14b8a6', '#06b6d4'],
      iconSvg: `<svg viewBox="0 0 24 24" fill="url(#iconGrad)" style="width:60px;height:60px">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>`,
      emoji: '🏏'
    },
    payment: {
      title: 'Payment Status',
      subtitle: 'Track match payments and collection progress',
      accentColors: ['#6366f1', '#8b5cf6', '#a855f7'],
      iconSvg: `<svg viewBox="0 0 24 24" fill="url(#iconGrad)" style="width:60px;height:60px">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10" stroke="#1e293b" stroke-width="2"/>
      </svg>`,
      emoji: '💰'
    }
  };

  const config = configs[type];
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%);
      position: relative;
      overflow: hidden;
    }
    
    /* Neural network dots */
    .neural-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: radial-gradient(circle at 20% 20%, ${config.accentColors[0]}15 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, ${config.accentColors[1]}10 0%, transparent 50%),
                        radial-gradient(circle at 50% 50%, ${config.accentColors[2]}05 0%, transparent 70%);
    }
    
    /* Top accent bar */
    .accent-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, ${config.accentColors.join(', ')});
    }
    
    /* Vertical accent */
    .vertical-accent {
      position: absolute;
      left: 85px;
      top: 180px;
      width: 4px;
      height: 270px;
      background: linear-gradient(180deg, ${config.accentColors.join(', ')});
      border-radius: 2px;
      opacity: 0.6;
    }
    
    /* Logo section */
    .logo-section {
      position: absolute;
      top: 200px;
      left: 120px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    .logo {
      width: 90px;
      height: 90px;
      background: linear-gradient(135deg, #10b981, #06b6d4);
      border-radius: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 60px rgba(16, 185, 129, 0.3);
      position: relative;
    }
    
    .logo-letter {
      font-size: 54px;
      font-weight: 900;
      color: white;
    }
    
    .ai-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #8b5cf6, #a855f7);
      border-radius: 50%;
      border: 3px solid #020617;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .sparkle {
      color: white;
      font-size: 16px;
    }
    
    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .brand-name {
      font-size: 42px;
      font-weight: 800;
      color: white;
      letter-spacing: -0.5px;
    }
    
    .brand-tagline {
      font-size: 15px;
      font-weight: 700;
      color: ${config.accentColors[0]};
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    
    /* Center content */
    .center-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      margin-top: 30px;
    }
    
    .icon-container {
      width: 130px;
      height: 130px;
      background: #1e293b;
      border: 2px solid ${config.accentColors[0]};
      border-radius: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 30px;
      box-shadow: 0 0 60px ${config.accentColors[0]}30;
    }
    
    .main-title {
      font-size: 58px;
      font-weight: 800;
      color: white;
      margin-bottom: 15px;
      letter-spacing: -1px;
    }
    
    .main-subtitle {
      font-size: 24px;
      font-weight: 500;
      color: #94a3b8;
    }
    
    /* Bottom */
    .bottom-line {
      position: absolute;
      bottom: 95px;
      left: 50%;
      transform: translateX(-50%);
      width: 400px;
      height: 3px;
      background: linear-gradient(90deg, ${config.accentColors.join(', ')});
      border-radius: 2px;
      opacity: 0.5;
    }
    
    .footer {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 18px;
      font-weight: 500;
      color: #64748b;
      letter-spacing: 1px;
    }
    
    /* SVG gradients */
    svg defs {
      position: absolute;
    }
  </style>
</head>
<body>
  <svg style="position:absolute;width:0;height:0">
    <defs>
      <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${config.accentColors[0]}"/>
        <stop offset="50%" style="stop-color:${config.accentColors[1]}"/>
        <stop offset="100%" style="stop-color:${config.accentColors[2]}"/>
      </linearGradient>
    </defs>
  </svg>
  
  <div class="neural-bg"></div>
  <div class="accent-bar"></div>
  <div class="vertical-accent"></div>
  
  <div class="logo-section">
    <div class="logo">
      <span class="logo-letter">C</span>
      <div class="ai-badge">
        <span class="sparkle">✦</span>
      </div>
    </div>
    <div class="brand-text">
      <span class="brand-name">CricSmart</span>
      <span class="brand-tagline">AI Cricket Platform</span>
    </div>
  </div>
  
  <div class="center-content">
    <div class="icon-container">
      <span style="font-size: 60px;">${config.emoji}</span>
    </div>
    <h1 class="main-title">${config.title}</h1>
    <p class="main-subtitle">${config.subtitle}</p>
  </div>
  
  <div class="bottom-line"></div>
  <div class="footer">cricsmart.in</div>
</body>
</html>`;
};

async function generateImage(type, outputPath) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
    
    const html = generateHTML(type);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await page.screenshot({
      path: outputPath,
      type: 'png',
      omitBackground: false
    });
    
    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`✅ ${path.basename(outputPath)} generated (${sizeKB} KB)`);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🎨 Generating OG preview images with Puppeteer...\n');
  
  const images = [
    { type: 'feedback', name: 'og-feedback.png' },
    { type: 'availability', name: 'og-availability.png' },
    { type: 'payment', name: 'og-payment.png' },
  ];
  
  for (const { type, name } of images) {
    const outputPath = path.join(PUBLIC_DIR, name);
    try {
      await generateImage(type, outputPath);
    } catch (error) {
      console.error(`❌ Error generating ${name}:`, error.message);
    }
  }
  
  console.log('\n🎉 OG image generation complete!');
}

main().catch(console.error);

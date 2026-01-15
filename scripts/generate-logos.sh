#!/bin/bash

# Script to generate optimized logo files for WhatsApp sharing and PWA
# Usage: ./scripts/generate-logos.sh <path-to-source-logo>

SOURCE_LOGO="$1"
PUBLIC_DIR="frontend/public"

if [ -z "$SOURCE_LOGO" ]; then
    echo "Usage: ./scripts/generate-logos.sh <path-to-source-logo>"
    echo "Example: ./scripts/generate-logos.sh ~/Downloads/mavericks-logo.png"
    exit 1
fi

if [ ! -f "$SOURCE_LOGO" ]; then
    echo "Error: Source logo file not found: $SOURCE_LOGO"
    exit 1
fi

echo "🏏 Generating Mavericks XI logo files..."

# Copy original for OG image (WhatsApp works well with square logos too)
echo "Creating mavericks-og-image.png (for WhatsApp preview)..."
cp "$SOURCE_LOGO" "$PUBLIC_DIR/mavericks-og-image.png"

# Create favicon/icon sizes using sips
echo "Creating mavericks-logo.png (32x32)..."
sips -z 32 32 "$SOURCE_LOGO" --out "$PUBLIC_DIR/mavericks-logo.png" 2>/dev/null

echo "Creating mavericks-logo-64.png (64x64)..."
sips -z 64 64 "$SOURCE_LOGO" --out "$PUBLIC_DIR/mavericks-logo-64.png" 2>/dev/null

echo "Creating mavericks-logo-192.png (192x192)..."
sips -z 192 192 "$SOURCE_LOGO" --out "$PUBLIC_DIR/mavericks-logo-192.png" 2>/dev/null

echo "Creating mavericks-logo-512.png (512x512)..."
sips -z 512 512 "$SOURCE_LOGO" --out "$PUBLIC_DIR/mavericks-logo-512.png" 2>/dev/null

echo ""
echo "✅ Logo files generated successfully!"
echo ""
echo "Files created in $PUBLIC_DIR/:"
ls -la "$PUBLIC_DIR"/mavericks-* 2>/dev/null

echo ""
echo "🚀 Next steps:"
echo "1. Rebuild the frontend: cd frontend && npm run build"
echo "2. Deploy the updated files"
echo "3. Test WhatsApp link sharing"
echo ""
echo "💡 Tip: Use https://developers.facebook.com/tools/debug/ to force refresh OG cache"

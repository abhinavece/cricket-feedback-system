#!/bin/bash

# Test script to verify WhatsApp link preview functionality
echo "🏏 Testing WhatsApp Link Preview Implementation"
echo "=============================================="

# Check if react-helmet is installed
echo "📦 Checking dependencies..."
if npm list react-helmet > /dev/null 2>&1; then
    echo "✅ react-helmet is installed"
else
    echo "❌ react-helmet is not installed"
    exit 1
fi

if npm list @types/react-helmet > /dev/null 2>&1; then
    echo "✅ @types/react-helmet is installed"
else
    echo "❌ @types/react-helmet is not installed"
    exit 1
fi

# Check if OG images exist
echo ""
echo "🖼️  Checking OG images..."
if [ -f "public/og-payment.png" ]; then
    echo "✅ og-payment.png exists"
else
    echo "❌ og-payment.png missing"
fi

if [ -f "public/og-availability.png" ]; then
    echo "✅ og-availability.png exists"
else
    echo "❌ og-availability.png missing"
fi

if [ -f "public/og-feedback.png" ]; then
    echo "✅ og-feedback.png exists"
else
    echo "❌ og-feedback.png missing"
fi

# Check if components have Helmet imports
echo ""
echo "🔧 Checking component implementations..."
if grep -q "import.*Helmet.*from.*react-helmet" src/pages/PublicPaymentView.tsx; then
    echo "✅ PublicPaymentView.tsx has Helmet import"
else
    echo "❌ PublicPaymentView.tsx missing Helmet import"
fi

if grep -q "import.*Helmet.*from.*react-helmet" src/pages/PublicMatchView.tsx; then
    echo "✅ PublicMatchView.tsx has Helmet import"
else
    echo "❌ PublicMatchView.tsx missing Helmet import"
fi

if grep -q "import.*Helmet.*from.*react-helmet" src/pages/MatchFeedbackPage.tsx; then
    echo "✅ MatchFeedbackPage.tsx has Helmet import"
else
    echo "❌ MatchFeedbackPage.tsx missing Helmet import"
fi

# Check if components have OG meta tags
echo ""
echo "📝 Checking OG meta tags..."
if grep -q "og-image.*og-payment.png" src/pages/PublicPaymentView.tsx; then
    echo "✅ PublicPaymentView.tsx has payment OG image"
else
    echo "❌ PublicPaymentView.tsx missing payment OG image"
fi

if grep -q "og-image.*og-availability.png" src/pages/PublicMatchView.tsx; then
    echo "✅ PublicMatchView.tsx has availability OG image"
else
    echo "❌ PublicMatchView.tsx missing availability OG image"
fi

if grep -q "og-image.*og-feedback.png" src/pages/MatchFeedbackPage.tsx; then
    echo "✅ MatchFeedbackPage.tsx has feedback OG image"
else
    echo "❌ MatchFeedbackPage.tsx missing feedback OG image"
fi

# Check if documentation exists
echo ""
echo "📚 Checking documentation..."
if [ -f "../.claude/skills/whatsapp-link-preview.md" ]; then
    echo "✅ WhatsApp link preview skill documentation exists"
else
    echo "❌ WhatsApp link preview skill documentation missing"
fi

if grep -q "WhatsApp Link Previews" README.md; then
    echo "✅ README.md updated with WhatsApp preview section"
else
    echo "❌ README.md missing WhatsApp preview section"
fi

echo ""
echo "🎉 WhatsApp link preview implementation check complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test actual WhatsApp preview by sharing links"
echo "2. Use Facebook URL Debugger: https://developers.facebook.com/tools/debug/"
echo "3. Verify on mobile WhatsApp application"
echo ""
echo "🔗 Test URLs (when running):"
echo "- Payment: http://localhost:3000/share/payment/[token]"
echo "- Availability: http://localhost:3000/share/match/[token]"
echo "- Feedback: http://localhost:3000/feedback/[token]"

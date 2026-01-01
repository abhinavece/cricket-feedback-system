#!/bin/bash

echo "👑 Promoting User to Admin"
echo "========================"

# Check if backend is running
echo "1. Checking backend status..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/health)
if [[ $BACKEND_STATUS == "200" ]]; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start the backend first."
    exit 1
fi

# Get user token first (you'll need to sign in first)
echo ""
echo "2. First, you need to get your auth token:"
echo "   - Go to http://localhost:3000"
echo "   - Click 'Admin Dashboard'"
echo "   - Sign in with Google"
echo "   - Open browser dev tools (F12)"
echo "   - Go to Console tab"
echo "   - Run: localStorage.getItem('authToken')"
echo "   - Copy the token (it's a long JWT string)"
echo ""
read -p "Paste your auth token here: " AUTH_TOKEN

if [[ -z "$AUTH_TOKEN" ]]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

# Promote the user to admin
echo ""
echo "3. Promoting abhinavd1404@gmail.com to admin..."
RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/make-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "email": "abhinavd1404@gmail.com",
    "superAdminKey": "super-admin-setup-key-2024"
  }')

echo "Response: $RESPONSE"

if [[ $RESPONSE == *"promoted to admin successfully"* ]]; then
    echo ""
    echo "✅ SUCCESS! User abhinavd1404@gmail.com has been promoted to admin!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Refresh the admin dashboard"
    echo "2. The user should now see 'User Management' tab"
    echo "3. They can manage roles for other users"
    echo ""
    echo "📋 Admin Capabilities:"
    echo "- View all registered users"
    echo "- Change user roles (viewer, editor, admin)"
    echo "- Full access to all admin features"
else
    echo ""
    echo "❌ Failed to promote user. Response above shows the error."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "- Make sure the user exists in the database"
    echo "- Check if your token is valid"
    echo "- Verify backend is running correctly"
fi

echo ""
echo "📱 Alternative: Manual Database Update"
echo "===================================="
echo "If the script doesn't work, you can manually update the database:"
echo ""
echo "1. Connect to MongoDB:"
echo "   mongosh"
echo ""
echo "2. Switch to the database:"
echo "   use cricket-feedback"
echo ""
echo "3. Find and update the user:"
echo "   db.users.findOneAndUpdate("
echo "     { email: \"abhinavd1404@gmail.com\" },"
echo "     { \$set: { role: \"admin\" } },"
echo "     { returnNewDocument: true }"
echo "   )"
echo ""
echo "4. Verify the update:"
echo "   db.users.findOne({ email: \"abhinavd1404@gmail.com\" })"

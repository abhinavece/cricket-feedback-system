#!/bin/bash

echo "🔍 Debugging User Data Structure"
echo "=============================="

# Test 1: Check what the backend actually returns
echo "1. Testing backend users endpoint with auth..."
echo "   (You'll need to get your auth token first)"
echo ""
echo "   Steps:"
echo "   1. Go to http://localhost:3000"
echo "   2. Sign in as admin"
echo "   3. Open browser dev tools"
echo "   4. Run: localStorage.getItem('authToken')"
echo "   5. Copy the token"
echo ""
echo "   Then run:"
echo "   curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:5001/api/auth/users"
echo ""

# Test 2: Check database directly
echo "2. Checking database user structure..."
mongosh --eval "
use cricket-feedback;
db.users.findOne({email: 'abhinavd1404@gmail.com'});
" --quiet

echo ""
echo "3. Check all users structure..."
mongosh --eval "
use cricket-feedback;
db.users.find().limit(2);
" --quiet

echo ""
echo "🎯 What to Look For:"
echo "==================="
echo "✅ Backend should return users with '_id' field"
echo "✅ Frontend expects '_id' field"
echo "❌ If backend returns 'id' instead of '_id', we need to fix frontend"
echo "❌ If backend returns different structure, we need to adjust interface"
echo ""
echo "🔧 Possible Issues:"
echo "==================="
echo "1. Backend returns 'id' instead of '_id'"
echo "   → Fix: Change frontend interface to use 'id'"
echo ""
echo "2. Backend returns different field structure"
echo "   → Fix: Update User interface to match"
echo ""
echo "3. Backend returns stringified ObjectId"
echo "   → Fix: Convert to string in backend or frontend"
echo ""
echo "📱 Debug Steps:"
echo "==============="
echo "1. Check browser console for 'Fetched users data:' log"
echo "2. Check 'First user structure:' log"
echo "3. Check 'Rendering user:' logs in console"
echo "4. Look for undefined or missing _id fields"
echo ""
echo "🚀 Quick Fix Options:"
echo "===================="
echo "If backend returns 'id' instead of '_id':"
echo "  → Change interface User { id: string; ... }"
echo "  → Update all user._id to user.id references"
echo ""
echo "If backend returns different structure:"
echo "  → Update User interface to match actual structure"
echo "  → Add console.log to see exact structure"

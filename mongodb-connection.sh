#!/bin/bash

echo "🗄️ MongoDB Connection Information"
echo "=============================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if port-forward is running
if ! pgrep -f "kubectl port-forward.*mongodb-service" > /dev/null; then
    print_status "Starting MongoDB port-forward to port 27018..."
    kubectl port-forward service/mongodb-service 27018:27017 -n cricket-feedback &
    sleep 3
else
    print_status "MongoDB port-forward is already running"
fi

# Connection information
echo ""
print_status "🔗 MongoDB Connection Details:"
echo "=================================="
echo "📍 Host: localhost"
echo "🔌 Port: 27018 (forwarded from Kubernetes 27017)"
echo "👤 Username: admin"
echo "🔐 Password: password123"
echo "🗃️  Database: cricket-feedback"
echo ""
echo "📋 Connection Strings:"
echo "======================"
echo ""
echo "🔹 MongoDB Shell (mongosh):"
echo "mongosh --username admin --password password123 --host localhost --port 27018 --authenticationDatabase admin cricket-feedback"
echo ""
echo "🔹 MongoDB URI:"
echo "mongodb://admin:password123@localhost:27018/cricket-feedback?authSource=admin"
echo ""
echo "🔹 MongoDB Compass:"
echo "mongodb://admin:password123@localhost:27018/cricket-feedback?authSource=admin"
echo ""
echo "🔹 Node.js (if needed):"
echo "const uri = 'mongodb://admin:password123@localhost:27018/cricket-feedback?authSource=admin';"
echo ""

# Test connection
print_status "🧪 Testing MongoDB connection..."
if kubectl exec -n cricket-feedback deployment/mongodb -- mongosh --username admin --password password123 --authenticationDatabase admin --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_status "✅ MongoDB connection successful"
else
    print_error "❌ MongoDB connection failed"
fi

# Show collections
echo ""
print_status "📊 Available Collections:"
kubectl exec -n cricket-feedback deployment/mongodb -- mongosh --username admin --password password123 --authenticationDatabase admin cricket-feedback --eval "show collections" 2>/dev/null | grep -v "Currentdb" || echo "No collections found or connection issue"

echo ""
print_status "🔍 Useful Commands:"
echo "===================="
echo "🔹 Connect to MongoDB:"
echo "mongosh --username admin --password password123 --host localhost --port 27018 --authenticationDatabase admin cricket-feedback"
echo ""
echo "🔹 List databases:"
echo "mongosh --username admin --password password123 --host localhost --port 27018 --authenticationDatabase admin --eval 'show dbs'"
echo ""
echo "🔹 Show collections:"
echo "mongosh --username admin --password password123 --host localhost --port 27018 --authenticationDatabase admin cricket-feedback --eval 'show collections'"
echo ""
echo "🔹 View users:"
echo "mongosh --username admin --password password123 --host localhost --port 27018 --authenticationDatabase admin cricket-feedback --eval 'db.users.find().limit(5)'"
echo ""
echo "🔹 View feedbacks:"
echo "mongosh --username admin --password password123 --host localhost --port 27018 --authenticationDatabase admin cricket-feedback --eval 'db.feedbacks.find().limit(5)'"
echo ""
echo "🔹 Stop port-forward:"
echo "pkill -f 'kubectl port-forward.*mongodb-service'"
echo ""
echo "🎉 Happy querying! 🗄️"

#!/bin/bash

echo "🚀 Cricket Feedback System - GCP Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 | grep -q "@"; then
    print_error "Not logged into gcloud. Please run: gcloud auth login"
    exit 1
fi

print_status "Logged in as: $(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1)"

# Set project ID
PROJECT_ID="${1:-cricket-feedback-$(date +%s)}"
print_status "Using project ID: $PROJECT_ID"

# Create project if it doesn't exist
print_status "Creating GCP project..."
gcloud projects create $PROJECT_ID --name="Cricket Feedback System" || print_warning "Project might already exist"

# Set current project
gcloud config set project $PROJECT_ID

# Enable required APIs
print_status "Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable appengine.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com

# Create App Engine application
print_status "Creating App Engine application..."
gcloud app create --region=us-central1 || print_warning "App Engine app might already exist"

# Set up MongoDB Atlas (Free Tier)
print_status "Setting up MongoDB Atlas..."
echo "⚠️  MANUAL STEP REQUIRED:"
echo "1. Go to https://www.mongodb.com/cloud/atlas/register"
echo "2. Create a free account"
echo "3. Create a free cluster (M0)"
echo "4. Get the connection string"
echo "5. Add your IP to the whitelist"
echo "6. Create a database user"
echo ""
read -p "Press Enter after setting up MongoDB Atlas..."

# Get MongoDB connection string
read -p "Enter your MongoDB Atlas connection string: " MONGODB_URI

# Set environment variables
print_status "Setting up environment variables..."
gcloud app deploy --quiet --version=prod --promote

echo ""
echo "🎉 DEPLOYMENT COMPLETED!"
echo "========================="
echo "📱 Your app is available at: https://$PROJECT_ID.appspot.com"
echo "🔧 Admin console: https://console.cloud.google.com/appengine"
echo "💰 Free tier limits:"
echo "   - App Engine: 28 instance-hours per day"
echo "   - Cloud Build: 120 build-minutes per day"
echo "   - Storage: 5GB standard storage"
echo "   - Egress: 1GB per day"
echo ""
echo "📋 Next Steps:"
echo "1. Configure your Google OAuth in GCP Console"
echo "2. Set up environment variables in App Engine"
echo "3. Test your application"
echo "4. Monitor usage to stay within free tier"

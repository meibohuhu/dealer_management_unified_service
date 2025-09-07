#!/bin/bash

# Configure CORS for DigitalOcean Spaces
# This script sets up CORS to allow file uploads from your application

echo "🔧 Configuring CORS for DigitalOcean Spaces..."
echo "================================================="

# Configuration
SPACES_BUCKET="dealer-management-files"
SPACES_ENDPOINT="https://sfo3.digitaloceanspaces.com"
SPACES_REGION="sfo3"

echo "📊 Bucket: $SPACES_BUCKET"
echo "🌐 Endpoint: $SPACES_ENDPOINT"
echo "📍 Region: $SPACES_REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo ""
    echo "   brew install awscli"
    echo "   # or"
    echo "   pip install awscli"
    echo ""
    echo "Then configure it with your DigitalOcean Spaces credentials:"
    echo ""
    echo "   aws configure --profile digitalocean"
    echo "   AWS Access Key ID: YOUR_SPACES_ACCESS_KEY"
    echo "   AWS Secret Access Key: YOUR_SPACES_SECRET_KEY"
    echo "   Default region name: sfo3"
    echo "   Default output format: json"
    echo ""
    exit 1
fi

echo "✅ AWS CLI found"

# Check if CORS config file exists
if [ ! -f "spaces-cors-config.json" ]; then
    echo "❌ CORS configuration file not found: spaces-cors-config.json"
    exit 1
fi

echo "✅ CORS configuration file found"
echo ""

# Apply CORS configuration
echo "🚀 Applying CORS configuration..."
aws s3api put-bucket-cors \
    --bucket "$SPACES_BUCKET" \
    --cors-configuration file://spaces-cors-config.json \
    --endpoint-url "$SPACES_ENDPOINT" \
    --profile digitalocean

if [ $? -eq 0 ]; then
    echo "✅ CORS configuration applied successfully!"
    echo ""
    echo "📋 Verifying CORS configuration..."
    aws s3api get-bucket-cors \
        --bucket "$SPACES_BUCKET" \
        --endpoint-url "$SPACES_ENDPOINT" \
        --profile digitalocean
else
    echo "❌ Failed to apply CORS configuration"
    echo ""
    echo "💡 Manual Configuration:"
    echo "1. Go to DigitalOcean Control Panel"
    echo "2. Navigate to Spaces"
    echo "3. Select your bucket: $SPACES_BUCKET"
    echo "4. Go to Settings > CORS"
    echo "5. Add the following configuration:"
    echo ""
    cat spaces-cors-config.json
fi

echo ""
echo "🎉 CORS configuration complete!"
echo "Your file uploads should now work properly."

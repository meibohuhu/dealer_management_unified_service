#!/bin/bash

# Dealer Management System Deployment Script
# This script deploys the application to DigitalOcean

set -e

echo "🚀 Starting deployment of Dealer Management System..."

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl CLI is not installed. Please install it first:"
    echo "   https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Check if user is authenticated
if ! doctl auth list &> /dev/null; then
    echo "❌ Please authenticate with DigitalOcean first:"
    echo "   doctl auth init"
    exit 1
fi

# Build the application
echo "📦 Building the application..."
npm run build

# Create Docker image
echo "🐳 Building Docker image..."
docker build -t dealer-management-system .

# Test the Docker image locally
echo "🧪 Testing Docker image locally..."
docker run -d --name test-app -p 8080:8080 \
    -e NODE_ENV=production \
    -e PORT=8080 \
    -e USE_SQLITE=false \
    dealer-management-system

# Wait for the app to start
echo "⏳ Waiting for application to start..."
sleep 10

# Test health endpoint
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
else
    echo "❌ Application failed to start"
    docker logs test-app
    docker stop test-app
    docker rm test-app
    exit 1
fi

# Stop and remove test container
docker stop test-app
docker rm test-app

# Deploy to DigitalOcean App Platform
echo "☁️ Deploying to DigitalOcean App Platform..."

# Check if app exists
if doctl apps list | grep -q "dealer-management-system"; then
    echo "🔄 Updating existing app..."
    doctl apps update dealer-management-system --spec .do/app.yaml
else
    echo "🆕 Creating new app..."
    doctl apps create --spec .do/app.yaml
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "🔗 Your application should be available at:"
echo "   https://dealer-management-system-xxxxx.ondigitalocean.app"
echo ""
echo "📊 Monitor your deployment with:"
echo "   doctl apps list"
echo "   doctl apps logs dealer-management-system"

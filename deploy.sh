#!/bin/bash

# Deploy script for Dealer Management System
# This script builds and deploys the unified TypeScript service

set -e

echo "🚀 Deploying Dealer Management System..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed: dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"

# Check if we should start the server
if [ "$1" = "--start" ]; then
    echo "🚀 Starting production server..."
    npm start
elif [ "$1" = "--docker" ]; then
    echo "🐳 Building Docker image..."
    docker build -t dealer-management-system .
    echo "✅ Docker image built successfully!"
    echo "Run with: docker run -p 8080:8080 dealer-management-system"
else
    echo "✅ Deployment completed!"
    echo "To start the server, run: npm start"
    echo "To build Docker image, run: ./deploy.sh --docker"
fi

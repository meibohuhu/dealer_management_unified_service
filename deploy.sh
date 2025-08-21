#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if we're in production
if [ "$NODE_ENV" = "production" ]; then
    echo "📦 Production environment detected, building application..."
    
    # Clean previous builds
    echo "🧹 Cleaning previous builds..."
    npm run clean
    
    # Install dependencies
    echo "📥 Installing dependencies..."
    npm ci --only=production
    
    # Build the application
    echo "🔨 Building server..."
    npm run build:server
    
    echo "🔨 Building client..."
    npm run build:client
    
    # Verify build output
    echo "✅ Verifying build output..."
    if [ ! -d "dist/server" ] || [ ! -d "dist/client" ]; then
        echo "❌ Build failed - dist directories not found"
        exit 1
    fi
    
    if [ ! -f "dist/client/index.html" ]; then
        echo "❌ Build failed - client index.html not found"
        exit 1
    fi
    
    echo "✅ Build completed successfully"
    
    # Start the server
    echo "🚀 Starting server..."
    npm start
else
    echo "🔄 Development environment detected, starting dev server..."
    npm run dev
fi

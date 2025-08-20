#!/bin/bash

# Dealer Management System - DigitalOcean Droplet Deployment
# This script deploys the application to a DigitalOcean Droplet

set -e

DROPLET_NAME="dealer-management-droplet"
REGION="nyc3"
SIZE="s-1vcpu-1gb"
IMAGE="ubuntu-22-04-x64"

echo "🚀 Starting DigitalOcean Droplet deployment..."

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

# Check if SSH key exists
if ! doctl compute ssh-key list | grep -q "id_rsa"; then
    echo "❌ SSH key 'id_rsa' not found. Please add your SSH key:"
    echo "   doctl compute ssh-key import id_rsa --public-key-file ~/.ssh/id_rsa.pub"
    exit 1
fi

# Get SSH key ID
SSH_KEY_ID=$(doctl compute ssh-key list --format ID,Name --no-header | grep "id_rsa" | awk '{print $1}')

echo "🔑 Using SSH key: $SSH_KEY_ID"

# Create Droplet
echo "☁️ Creating Droplet..."
DROPLET_ID=$(doctl compute droplet create $DROPLET_NAME \
    --size $SIZE \
    --image $IMAGE \
    --region $REGION \
    --ssh-keys $SSH_KEY_ID \
    --wait \
    --format ID,Name --no-header | awk '{print $1}')

echo "✅ Droplet created with ID: $DROPLET_ID"

# Wait for Droplet to be ready
echo "⏳ Waiting for Droplet to be ready..."
sleep 30

# Get Droplet IP
DROPLET_IP=$(doctl compute droplet get $DROPLET_ID --format PublicIPv4 --no-header)

echo "🌐 Droplet IP: $DROPLET_IP"

# Wait for SSH to be available
echo "🔌 Waiting for SSH to be available..."
until ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$DROPLET_IP "echo 'SSH ready'" 2>/dev/null; do
    echo "⏳ Waiting for SSH..."
    sleep 10
done

echo "✅ SSH is ready!"

# Deploy application
echo "📦 Deploying application..."
ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << 'EOF'
    # Update system
    apt update && apt upgrade -y
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Create app directory
    mkdir -p /opt/dealer-management
    cd /opt/dealer-management
    
    # Create docker-compose.yml
    cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: dealer_management_postgres
    environment:
      POSTGRES_DB: dealer_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password_here
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  app:
    image: dealer-management-system:latest
    container_name: dealer_management_app
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:your_secure_password_here@postgres:5432/dealer_management
      USE_SQLITE: false
      PORT: 8080
    ports:
      - "80:8080"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
COMPOSE_EOF

    # Create .env file
    cat > .env << 'ENV_EOF'
NODE_ENV=production
PORT=8080
USE_SQLITE=false
DATABASE_URL=postgresql://postgres:your_secure_password_here@postgres:5432/dealer_management
ENV_EOF

    # Start services
    docker-compose up -d
    
    echo "✅ Application deployed successfully!"
EOF

echo "✅ Deployment completed!"
echo ""
echo "🔗 Your application should be available at:"
echo "   http://$DROPLET_IP"
echo ""
echo "📊 Monitor your deployment with:"
echo "   ssh root@$DROPLET_IP"
echo "   docker-compose logs -f"
echo ""
echo "⚠️  Remember to:"
echo "   1. Update the database password in docker-compose.yml"
echo "   2. Configure your domain to point to $DROPLET_IP"
echo "   3. Set up SSL with Let's Encrypt"

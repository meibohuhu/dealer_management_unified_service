# Dealer Management System - DigitalOcean Deployment Guide

This guide provides step-by-step instructions for deploying your Dealer Management System to DigitalOcean using either App Platform or Droplets.

## Prerequisites

1. **DigitalOcean Account**: Sign up at [digitalocean.com](https://digitalocean.com)
2. **doctl CLI**: Install the DigitalOcean command-line tool
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)
4. **Domain Name**: Optional but recommended for production

## Option 1: DigitalOcean App Platform (Recommended)

### Step 1: Install doctl CLI

```bash
# macOS
brew install doctl

# Linux
snap install doctl

# Windows
# Download from: https://github.com/digitalocean/doctl/releases
```

### Step 2: Authenticate with DigitalOcean

```bash
doctl auth init
# Enter your DigitalOcean API token when prompted
```

### Step 3: Configure Environment Variables

1. Copy `env.production.template` to `env.production`
2. Update the values with your actual configuration:

```bash
cp env.production.template env.production
# Edit env.production with your actual values
```

### Step 4: Set up DigitalOcean Spaces (File Storage)

1. Go to DigitalOcean Console → Spaces
2. Create a new Space in your preferred region
3. Generate API keys for the Space
4. Update your environment variables with the Space details

### Step 5: Deploy the Application

```bash
# Make the deployment script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

The script will:
- Build your application
- Test the Docker image locally
- Deploy to DigitalOcean App Platform
- Set up the PostgreSQL database
- Configure the Spaces integration

### Step 6: Verify Deployment

```bash
# List your apps
doctl apps list

# Check app logs
doctl apps logs dealer-management-system

# Get app info
doctl apps get dealer-management-system
```

## Option 2: DigitalOcean Droplet (More Control)

### Step 1: Prepare SSH Keys

```bash
# Generate SSH key if you don't have one
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Add your SSH key to DigitalOcean
doctl compute ssh-key import id_rsa --public-key-file ~/.ssh/id_rsa.pub
```

### Step 2: Deploy to Droplet

```bash
# Make the deployment script executable
chmod +x deploy-droplet.sh

# Run the deployment
./deploy-droplet.sh
```

### Step 3: Configure Domain and SSL

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Install Certbot for SSL
apt install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com
```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `8080` |
| `USE_SQLITE` | Database type | `false` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `VITE_SPACES_ENDPOINT` | DigitalOcean Spaces endpoint | `https://nyc3.digitaloceanspaces.com` |
| `VITE_SPACES_BUCKET` | Spaces bucket name | `dealer-management-files` |
| `VITE_SPACES_REGION` | Spaces region | `nyc3` |
| `VITE_SPACES_ACCESS_KEY_ID` | Spaces access key | `your_access_key` |
| `VITE_SPACES_SECRET_ACCESS_KEY` | Spaces secret key | `your_secret_key` |
| `VITE_SPACES_CDN_ENDPOINT` | Spaces CDN endpoint | `https://bucket.region.cdn.digitaloceanspaces.com` |

### Database Configuration

The system supports both PostgreSQL and SQLite:

- **Production**: Use PostgreSQL (recommended)
- **Development**: Use SQLite for simplicity

PostgreSQL connection string format:
```
postgresql://username:password@host:port/database_name
```

## Monitoring and Maintenance

### Health Checks

Your application includes a health check endpoint:
```
GET /health
```

### Logs

```bash
# App Platform
doctl apps logs dealer-management-system

# Droplet
ssh root@YOUR_IP
docker-compose logs -f
```

### Scaling

#### App Platform
```bash
# Scale horizontally
doctl apps update dealer-management-system --instance-count 3

# Scale vertically
doctl apps update dealer-management-system --instance-size-slug basic-s
```

#### Droplet
```bash
# Resize droplet
doctl compute droplet-action resize YOUR_DROPLET_ID --size s-2vcpu-2gb
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check Docker build logs

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check firewall rules
   - Ensure database is running

3. **File Upload Issues**
   - Verify DigitalOcean Spaces configuration
   - Check API keys and permissions
   - Verify bucket exists and is accessible

### Debug Commands

```bash
# Check app status
doctl apps list

# View app logs
doctl apps logs dealer-management-system

# SSH into droplet (if using droplet deployment)
ssh root@YOUR_DROPLET_IP

# Check Docker containers
docker ps
docker logs CONTAINER_ID

# Check database connection
docker exec -it dealer_management_postgres psql -U postgres -d dealer_management
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **Database**: Use strong passwords and restrict access
3. **Firewall**: Configure firewall rules to limit access
4. **SSL**: Always use HTTPS in production
5. **Updates**: Keep your system and dependencies updated

## Cost Optimization

### App Platform
- Start with `basic-xxs` for development
- Scale up as needed for production
- Use reserved instances for predictable workloads

### Droplets
- Start with `s-1vcpu-1gb` for development
- Monitor usage and scale accordingly
- Consider reserved instances for long-term use

## Support

If you encounter issues:

1. Check the application logs
2. Verify environment configuration
3. Test locally with Docker Compose
4. Check DigitalOcean status page
5. Review DigitalOcean documentation

## Next Steps

After successful deployment:

1. Set up monitoring and alerting
2. Configure backup strategies
3. Set up CI/CD pipelines
4. Implement logging and analytics
5. Plan for scaling and performance optimization

# Environment Variables Configuration Guide

This guide shows you exactly where to configure your environment variables with actual values.

## 🎯 Where to Configure Environment Variables

### 1. **DigitalOcean App Platform (`.do/app.yaml`)**

You need to update the `.do/app.yaml` file with your actual values. Here's what to change:

#### **Spaces Configuration (Lines 52-56)**
```yaml
spaces:
  - name: spaces
    region: nyc3
    bucket: dealer-management-files
    # REPLACE THESE WITH YOUR ACTUAL VALUES:
    access_key_id: "your_actual_spaces_access_key_id_here"
    secret_access_key: "your_actual_spaces_secret_access_key_here"
    endpoint: "https://nyc3.digitaloceanspaces.com"
    cdn_endpoint: "https://dealer-management-files.nyc3.cdn.digitaloceanspaces.com"
```

**What to replace:**
- `"your_actual_spaces_access_key_id_here"` → Your actual DigitalOcean Spaces access key ID
- `"your_actual_spaces_secret_access_key_here"` → Your actual DigitalOcean Spaces secret access key
- `"dealer-management-files"` → Your actual bucket name (if different)
- `"nyc3"` → Your preferred region (nyc1, sfo2, ams3, etc.)

### 2. **Local Development (`.env` file)**

Create a `.env` file in your project root for local development:

```bash
# Copy the template
cp env.production.template .env

# Edit the .env file with your local values
nano .env
```

**Example `.env` file:**
```env
# Local Development Environment
NODE_ENV=development
PORT=8080

# Database Configuration
USE_SQLITE=false
DATABASE_URL=c://postgres:password@localhost:5432/dealer_management

# DigitalOcean Spaces Configuration (for testing)
VITE_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
VITE_SPACES_BUCKET=dealer-management-files
VITE_SPACES_REGION=nyc3
VITE_SPACES_ACCESS_KEY_ID=your_actual_access_key_id
VITE_SPACES_SECRET_ACCESS_KEY=your_actual_secret_access_key
VITE_SPACES_CDN_ENDPOINT=https://dealer-management-files.nyc3.cdn.digitaloceanspaces.com
```

### 3. **Production Environment (DigitalOcean Console)**

For production, you can also set environment variables through the DigitalOcean Console:

1. Go to **Apps** → **Your App** → **Settings** → **Environment Variables**
2. Add/update variables as needed

## 🔑 How to Get Your DigitalOcean Spaces Credentials

### Step 1: Create a Space
1. Go to [DigitalOcean Console](https://cloud.digitalocean.com/spaces)
2. Click **Create a Space**
3. Choose your region (e.g., nyc3)
4. Name your space (e.g., `dealer-management-files`)
5. Click **Create a Space**

### Step 2: Generate API Keys
1. Go to **API** → **Spaces Keys**
2. Click **Generate New Key**
3. Give it a name (e.g., `dealer-management-spaces`)
4. Copy the **Key** and **Secret**

### Step 3: Update Your Configuration
```yaml
# In .do/app.yaml
spaces:
  - name: spaces
    region: nyc3  # Your actual region
    bucket: dealer-management-files  # Your actual bucket name
    access_key_id: "ABC123DEF456GHI789"  # Your actual access key
    secret_access_key: "xyz789abc123def456ghi789abc123def456ghi789"  # Your actual secret
    endpoint: "https://nyc3.digitaloceanspaces.com"  # Your region endpoint
    cdn_endpoint: "https://dealer-management-files.nyc3.cdn.digitaloceanspaces.com"  # Your CDN endpoint
```

## 🌍 Region Endpoints

Choose the endpoint based on your region:

| Region | Endpoint | CDN Endpoint Format |
|--------|----------|---------------------|
| nyc1 | `https://nyc1.digitaloceanspaces.com` | `https://bucket.nyc1.cdn.digitaloceanspaces.com` |
| nyc3 | `https://nyc3.digitaloceanspaces.com` | `https://bucket.nyc3.cdn.digitaloceanspaces.com` |
| sfo2 | `https://sfo2.digitaloceanspaces.com` | `https://bucket.sfo2.cdn.digitaloceanspaces.com` |
| ams3 | `https://ams3.digitaloceanspaces.com` | `https://bucket.ams3.cdn.digitaloceanspaces.com` |
| fra1 | `https://fra1.digitaloceanspaces.com` | `https://bucket.fra1.cdn.digitaloceanspaces.com` |

## 🔒 Security Best Practices

### 1. **Never Commit Secrets to Git**
```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "*.key" >> .gitignore
echo "secrets/" >> .gitignore
```

### 2. **Use Environment-Specific Files**
```bash
.env.local          # Local development (gitignored)
.env.production     # Production values (gitignored)
.env.example        # Template with placeholders (committed)
```

### 3. **Rotate Keys Regularly**
- Change your Spaces API keys every 90 days
- Use different keys for different environments

## 📝 Complete Configuration Checklist

Before deploying, ensure you have:

- [ ] **DigitalOcean Spaces created** with your preferred region
- [ ] **API keys generated** for Spaces access
- [ ] **Bucket name** chosen and created
- [ ] **`.do/app.yaml`** updated with actual values
- [ ] **Local `.env`** file created for testing
- [ ] **`.gitignore`** updated to exclude sensitive files

## 🧪 Testing Your Configuration

### Test Locally First
```bash
# Start with Docker Compose
docker-compose up -d

# Check if your app can connect to Spaces
curl http://localhost:8080/test-spaces
```

### Test Database Connection
```bash
# Check database health
curl http://localhost:8080/health
```

## 🚨 Common Issues & Solutions

### Issue: "Invalid credentials" error
**Solution**: Double-check your Spaces API keys in `.do/app.yaml`

### Issue: "Bucket not found" error
**Solution**: Verify your bucket name and region match exactly

### Issue: "Connection refused" for database
**Solution**: Check your DATABASE_URL format and ensure the database is running

## 📞 Getting Help

If you're still having issues:

1. **Check the logs**: `doctl apps logs dealer-management-system`
2. **Verify your configuration**: Compare with the examples above
3. **Test locally first**: Use Docker Compose to test before deploying
4. **Check DigitalOcean status**: Ensure their services are running

Remember: **Never share your actual API keys or secrets publicly!**

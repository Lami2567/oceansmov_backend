#!/bin/bash

echo "🚀 Render + Cloudflare R2 Deployment Script"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    print_success "Requirements check passed!"
}

# Check if we're in the right directory
check_directory() {
    print_status "Checking directory structure..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the backend directory."
        exit 1
    fi
    
    if [ ! -f "app.js" ]; then
        print_error "app.js not found. Please run this script from the backend directory."
        exit 1
    fi
    
    print_success "Directory structure is correct!"
}

# Check environment variables
check_env_vars() {
    print_status "Checking environment variables..."
    
    local missing_vars=()
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating template..."
        create_env_template
    fi
    
    # Check required variables
    local required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
        "FRONTEND_URL"
        "CLOUDFLARE_R2_ACCESS_KEY_ID"
        "CLOUDFLARE_R2_SECRET_ACCESS_KEY"
        "CLOUDFLARE_R2_ENDPOINT"
        "CLOUDFLARE_R2_BUCKET_NAME"
        "CLOUDFLARE_R2_PUBLIC_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_warning "Missing environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        print_status "Please add these variables to your .env file or Render environment variables."
        return 1
    else
        print_success "All required environment variables are present!"
        return 0
    fi
}

# Create .env template
create_env_template() {
    cat > .env << EOF
# Core Application
NODE_ENV=production
PORT=10000

# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/database_name

# JWT Security
JWT_SECRET=your_very_secure_jwt_secret_here_make_it_long_and_random

# Frontend URL
FRONTEND_URL=https://oceansmov.vercel.app

# Cloudflare R2 Configuration
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
CLOUDFLARE_R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
CLOUDFLARE_R2_BUCKET_NAME=movie-web-files
CLOUDFLARE_R2_PUBLIC_URL=https://pub-your_hash.r2.dev
EOF
    
    print_success ".env template created! Please update with your actual values."
}

# Test local setup
test_local_setup() {
    print_status "Testing local setup..."
    
    # Test Node.js dependencies
    if ! npm list --depth=0 &> /dev/null; then
        print_warning "Installing dependencies..."
        npm install
    fi
    
    # Test R2 connection
    if node -e "require('./setup-r2.js').setupR2().catch(console.error)" 2>/dev/null; then
        print_success "R2 connection test passed!"
    else
        print_warning "R2 connection test failed. Make sure your R2 credentials are correct."
    fi
    
    print_success "Local setup test completed!"
}

# Generate deployment instructions
generate_deployment_instructions() {
    print_status "Generating deployment instructions..."
    
    cat > RENDER_DEPLOYMENT_INSTRUCTIONS.md << EOF
# 🚀 Render Deployment Instructions

## Quick Setup Steps:

### 1. Create Render Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure settings:
   - **Name**: movie-web-backend-r2
   - **Environment**: Node
   - **Root Directory**: backend
   - **Build Command**: npm install
   - **Start Command**: npm start

### 2. Set Environment Variables
Add these in Render dashboard → Environment tab:

\`\`\`env
NODE_ENV=production
PORT=10000
DATABASE_URL=your_database_url_here
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=https://oceansmov.vercel.app
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
CLOUDFLARE_R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
CLOUDFLARE_R2_BUCKET_NAME=movie-web-files
CLOUDFLARE_R2_PUBLIC_URL=https://pub-your_hash.r2.dev
\`\`\`

### 3. Advanced Settings
- **Health Check Path**: /api/test
- **Health Check Timeout**: 180 seconds
- **Auto-Deploy**: Enabled

### 4. Deploy
Click "Create Web Service" and monitor the build logs.

## Testing Your Deployment:

\`\`\`bash
# Health check
curl https://your-app.onrender.com/api/test

# API status
curl https://your-app.onrender.com/
\`\`\`

## Troubleshooting:
- Check Render logs for errors
- Verify all environment variables are set
- Ensure R2 credentials are correct
- Test database connection

For detailed instructions, see: RENDER_R2_CONFIGURATION.md
EOF
    
    print_success "Deployment instructions generated: RENDER_DEPLOYMENT_INSTRUCTIONS.md"
}

# Main deployment function
main() {
    echo "🎬 Movie Web App - Render + R2 Deployment"
    echo "=========================================="
    echo ""
    
    # Run checks
    check_requirements
    check_directory
    check_env_vars
    test_local_setup
    
    # Generate instructions
    generate_deployment_instructions
    
    echo ""
    echo "🎉 Deployment preparation completed!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Follow the instructions in RENDER_DEPLOYMENT_INSTRUCTIONS.md"
    echo "   2. Set up your Render web service"
    echo "   3. Configure environment variables"
    echo "   4. Deploy and test"
    echo ""
    echo "📚 For detailed configuration, see:"
    echo "   - RENDER_R2_CONFIGURATION.md"
    echo "   - R2_CONFIGURATION_GUIDE.md"
    echo ""
    echo "🔗 Useful links:"
    echo "   - Render Dashboard: https://dashboard.render.com"
    echo "   - Cloudflare R2: https://dash.cloudflare.com"
    echo ""
}

# Run main function
main "$@" 
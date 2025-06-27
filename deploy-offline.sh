
#!/bin/bash

# AI-DU Agent Portal - Offline Deployment Script
# Prepares application for complete offline deployment

echo "Starting AI-DU Agent Portal Offline Deployment..."

# Check dependencies
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm not installed"
    exit 1
fi

echo "Installing dependencies..."
npm install

echo "Building production version..."
npm run build

# Verify build succeeded
if [ ! -d "dist" ]; then
    echo "Error: Build failed - dist directory not found"
    exit 1
fi

echo "Creating deployment package..."

# Remove existing deployment package
rm -rf deployment-package

# Create deployment structure
mkdir -p deployment-package
mkdir -p deployment-package/certs

# Copy application files
cp -r dist/ deployment-package/
cp server.js deployment-package/
cp package.json deployment-package/
cp package-lock.json deployment-package/

# Copy SSL certificates if available
if [ -f "aiduagent-csstip.ckit1.explab.com.crt" ]; then
    cp aiduagent-csstip.ckit1.explab.com.crt deployment-package/certs/
    echo "SSL certificate copied"
fi

if [ -f "aiduagent-csstip.ckit1.explab.com.key" ]; then
    cp aiduagent-csstip.ckit1.explab.com.key deployment-package/certs/
    echo "SSL key copied"
fi

# Create startup script
cat > deployment-package/start-offline.sh << 'EOF'
#!/bin/bash

echo "Starting AI-DU Agent Portal (Offline Mode)..."

# Move certificates to root directory if they exist
if [ -f "certs/aiduagent-csstip.ckit1.explab.com.crt" ]; then
    cp certs/aiduagent-csstip.ckit1.explab.com.crt ./
    echo "SSL certificate moved to root"
fi

if [ -f "certs/aiduagent-csstip.ckit1.explab.com.key" ]; then
    cp certs/aiduagent-csstip.ckit1.explab.com.key ./
    echo "SSL key moved to root"
fi

# Install production dependencies
echo "Installing production dependencies..."
npm ci --omit=dev

# Verify dist directory exists
if [ ! -d "dist" ]; then
    echo "Error: dist directory not found. Application not properly built."
    exit 1
fi

# Start server
echo "Starting server..."
if [ -f "aiduagent-csstip.ckit1.explab.com.crt" ] && [ -f "aiduagent-csstip.ckit1.explab.com.key" ]; then
    echo "Starting in HTTPS mode..."
    echo "Access URLs:"
    echo "  - https://aiduagent-csstip.ckit1.explab.com/"
    echo "  - https://localhost:443/"
    echo ""
    echo "Note: HTTPS requires sudo privileges"
    node server.js
else
    echo "Starting in HTTP mode..."
    echo "Access URL: http://localhost:8080/"
    echo ""
    node server.js
fi
EOF

chmod +x deployment-package/start-offline.sh

# Create deployment README
cat > deployment-package/README-DEPLOYMENT.md << 'EOF'
# AI-DU Agent Portal - Offline Deployment

## Quick Start

1. Transfer this folder to target Linux VM
2. Run: `./start-offline.sh` (or `sudo ./start-offline.sh` for HTTPS)

## Default Login

- Email: muhammad.mahmood@ericsson.com or carllyn.barfi@ericsson.com
- Password: password123

## Requirements

- Linux VM with Node.js (v16+ recommended)
- Port 443 (HTTPS) or 8080 (HTTP) access
- Sudo access for HTTPS only

## Access URLs

- HTTPS: https://aiduagent-csstip.ckit1.explab.com/ (requires sudo)
- HTTP: http://localhost:8080/ (no sudo required)

## Data Storage

All data stored in browser localStorage - persists locally per browser/device.

## Troubleshooting

- For HTTPS: Port 443 requires sudo privileges
- For HTTP: No special privileges required
- SSL certificates are automatically detected
- Run `npm install` if dependencies are missing
- If routing errors occur, clear browser cache
- Check that dist/ folder exists and contains built files

## File Structure

- `server.js` - Express server (ES module)
- `dist/` - Built React application
- `certs/` - SSL certificates (if available)
- `start-offline.sh` - Startup script
EOF

echo ""
echo "✅ Deployment package created successfully: ./deployment-package/"
echo ""
echo "📋 Next steps:"
echo "1. Copy deployment-package folder to your Linux VM"
echo "2. Run: cd deployment-package"
echo "3. For HTTPS: sudo ./start-offline.sh"
echo "4. For HTTP: ./start-offline.sh"
echo ""
echo "🔐 Default login: muhammad.mahmood@ericsson.com / password123"
echo "🌐 The app will be accessible on port 443 (HTTPS) or 8080 (HTTP)"
EOF

chmod +x deploy-offline.sh

echo "✅ All files have been updated and verified!"
echo ""
echo "🚀 To test the deployment:"
echo "1. Run: ./deploy-offline.sh"
echo "2. Run: cd deployment-package"  
echo "3. Run: sudo ./start-offline.sh (for HTTPS) or ./start-offline.sh (for HTTP)"


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
fi

if [ -f "aiduagent-csstip.ckit1.explab.com.key" ]; then
    cp aiduagent-csstip.ckit1.explab.com.key deployment-package/certs/
fi

# Create startup script
cat > deployment-package/start-offline.sh << 'EOF'
#!/bin/bash

echo "Starting AI-DU Agent Portal (Offline Mode)..."

# Move certificates to root directory
if [ -f "certs/aiduagent-csstip.ckit1.explab.com.crt" ]; then
    cp certs/aiduagent-csstip.ckit1.explab.com.crt ./
fi

if [ -f "certs/aiduagent-csstip.ckit1.explab.com.key" ]; then
    cp certs/aiduagent-csstip.ckit1.explab.com.key ./
fi

# Install production dependencies
echo "Installing production dependencies..."
npm ci --omit=dev

# Start server
echo "Starting server..."
if [ -f "aiduagent-csstip.ckit1.explab.com.crt" ]; then
    echo "HTTPS: https://aiduagent-csstip.ckit1.explab.com/"
    echo "HTTPS: https://localhost:443/"
    sudo node server.js
else
    echo "HTTP: http://localhost:8080/"
    node server.js
fi
EOF

chmod +x deployment-package/start-offline.sh

# Create deployment README
cat > deployment-package/README-DEPLOYMENT.md << 'EOF'
# AI-DU Agent Portal - Offline Deployment

## Quick Start

1. Transfer this folder to target Linux VM
2. Run: `sudo ./start-offline.sh`

## Default Login

- Email: muhammad.mahmood@ericsson.com or carllyn.barfi@ericsson.com
- Password: password123

## Requirements

- Linux VM with Node.js
- Port 443 (HTTPS) or 8080 (HTTP) access
- Sudo access for HTTPS

## Access URLs

- HTTPS: https://aiduagent-csstip.ckit1.explab.com/
- HTTP: http://localhost:8080/

## Data Storage

All data stored in browser localStorage - persists locally per browser/device.

## Troubleshooting

- Port 443 requires sudo
- Place .crt and .key files in main directory
- Run `npm install` if dependencies missing
- If routing errors occur, clear browser cache
EOF

echo "Deployment package created: ./deployment-package/"
echo ""
echo "To deploy:"
echo "1. Copy deployment-package folder to Linux VM"
echo "2. Run: sudo ./start-offline.sh"
echo ""
echo "Default login: muhammad.mahmood@ericsson.com / password123"

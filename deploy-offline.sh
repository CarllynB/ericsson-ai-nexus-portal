
#!/bin/bash

# AI-DU Agent Portal - Offline Deployment Script
# This script prepares the application for complete offline deployment

echo "🚀 Starting AI-DU Agent Portal Offline Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building production version..."
npm run build

echo "📋 Creating deployment package..."

# Create deployment directory
mkdir -p deployment-package
mkdir -p deployment-package/certs

# Copy built files
cp -r dist/ deployment-package/
cp server.js deployment-package/
cp package.json deployment-package/
cp package-lock.json deployment-package/

# Copy SSL certificates
if [ -f "aiduagent-csstip.ckit1.explab.com.crt" ]; then
    cp aiduagent-csstip.ckit1.explab.com.crt deployment-package/certs/
fi

if [ -f "aiduagent-csstip.ckit1.explab.com.key" ]; then
    cp aiduagent-csstip.ckit1.explab.com.key deployment-package/certs/
fi

# Create startup script
cat > deployment-package/start-offline.sh << 'EOF'
#!/bin/bash

echo "🌐 Starting AI-DU Agent Portal (Offline Mode)..."

# Check if certificates exist and move them
if [ -f "certs/aiduagent-csstip.ckit1.explab.com.crt" ]; then
    cp certs/aiduagent-csstip.ckit1.explab.com.crt ./
fi

if [ -f "certs/aiduagent-csstip.ckit1.explab.com.key" ]; then
    cp certs/aiduagent-csstip.ckit1.explab.com.key ./
fi

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Start the server
echo "🚀 Starting server..."
echo "📍 Application will be available at:"
if [ -f "aiduagent-csstip.ckit1.explab.com.crt" ]; then
    echo "   🔒 HTTPS: https://aiduagent-csstip.ckit1.explab.com/"
    echo "   🔒 HTTPS: https://localhost:443/"
    sudo node server.js
else
    echo "   🌐 HTTP: http://localhost:8080/"
    node server.js
fi
EOF

# Make startup script executable
chmod +x deployment-package/start-offline.sh

# Create README for deployment
cat > deployment-package/README-DEPLOYMENT.md << 'EOF'
# AI-DU Agent Portal - Offline Deployment

## Quick Start

1. **Transfer this entire folder** to your target Linux VM
2. **Run the startup script**:
   ```bash
   sudo ./start-offline.sh
   ```

## Default Login Credentials

- **Email**: muhammad.mahmood@ericsson.com or carllyn.barfi@ericsson.com
- **Password**: password123

## What's Included

- ✅ Complete offline application
- ✅ Local authentication system
- ✅ Local data storage (localStorage)
- ✅ Role-based access control
- ✅ Agent management system
- ✅ HTTPS support (if certificates provided)
- ✅ All 10 pre-loaded agents

## Features

- **Zero Internet Dependency**: Runs completely offline
- **Role Management**: Super Admin, Admin, Viewer roles
- **Agent Management**: Create, edit, delete agents
- **Local Storage**: All data stored in browser localStorage
- **Export/Import**: Data can be exported and imported between systems

## Deployment Requirements

- Linux VM with Node.js installed
- Port 443 (HTTPS) or 8080 (HTTP) access
- Sudo access (for HTTPS on port 443)

## Accessing the Application

- **With HTTPS**: https://aiduagent-csstip.ckit1.explab.com/
- **HTTP Fallback**: http://localhost:8080/

## Data Persistence

All data is stored locally in the browser's localStorage:
- User accounts and roles
- Agent configurations
- Authentication sessions

Data persists between browser sessions but is tied to the specific browser/machine.

## Troubleshooting

1. **Port 443 Permission**: Run with `sudo` for HTTPS
2. **Certificates**: Place .crt and .key files in the main directory
3. **Dependencies**: Run `npm install` if packages are missing

EOF

echo "✅ Deployment package created successfully!"
echo ""
echo "📁 Location: ./deployment-package/"
echo ""
echo "🚀 To deploy:"
echo "1. Copy the 'deployment-package' folder to your Linux VM"
echo "2. Run: sudo ./start-offline.sh"
echo ""
echo "🔑 Default login:"
echo "   Email: muhammad.mahmood@ericsson.com"
echo "   Password: password123"
echo ""
echo "🌐 The application will run completely offline with all functionality preserved!"

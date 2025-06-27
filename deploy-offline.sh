
#!/bin/bash

# AI-DU Agent Portal - Offline Deployment Script
# Prepares application for complete offline deployment with HTTPS support

set -e  # Exit on any error

echo "🚀 Starting AI-DU Agent Portal Offline Deployment..."

# Check dependencies
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm not installed"
    exit 1
fi

echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building production version..."
npm run build

# Verify build succeeded
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "📂 Creating deployment package..."

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

# Copy SSL certificates directly to deployment root
if [ -f "aiduagent-csstip.ckit1.explab.com.crt" ]; then
    cp aiduagent-csstip.ckit1.explab.com.crt deployment-package/
    echo "✅ SSL certificate copied to deployment root"
fi

if [ -f "aiduagent-csstip.ckit1.explab.com.key" ]; then
    cp aiduagent-csstip.ckit1.explab.com.key deployment-package/
    echo "✅ SSL key copied to deployment root"
fi

# Create startup script
cat > deployment-package/start-offline.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting AI-DU Agent Portal (Offline Mode)..."

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --omit=dev

# Verify dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found. Application not properly built."
    exit 1
fi

# Check for SSL certificates
if [ -f "aiduagent-csstip.ckit1.explab.com.crt" ] && [ -f "aiduagent-csstip.ckit1.explab.com.key" ]; then
    echo "🔒 SSL certificates found - Starting HTTPS server..."
    echo ""
    echo "🌐 HTTPS Access URLs:"
    echo "   Primary: https://aiduagent-csstip.ckit1.explab.com/"
    echo "   Local:   https://localhost:443/"
    echo ""
    echo "⚠️  Note: HTTPS on port 443 requires sudo privileges"
    echo "📋 Default login: muhammad.mahmood@ericsson.com / password123"
    echo ""
else
    echo "⚠️  SSL certificates not found - Will start HTTP server..."
    echo ""
    echo "🌐 HTTP Access URL:"
    echo "   http://localhost:8080/"
    echo ""
    echo "📋 Default login: muhammad.mahmood@ericsson.com / password123"
    echo ""
fi

# Start server
echo "⏳ Starting server..."
node server.js
EOF

chmod +x deployment-package/start-offline.sh

# Create comprehensive deployment README
cat > deployment-package/README-DEPLOYMENT.md << 'EOF'
# 🚀 AI-DU Agent Portal - Offline Deployment

## ⚡ Quick Start

1. **Transfer this folder to your Linux VM**
2. **For HTTPS (recommended):** `sudo ./start-offline.sh`
3. **For HTTP (fallback):** Remove SSL certificates and run `./start-offline.sh`

## 🔐 Default Login Credentials

- **Email:** muhammad.mahmood@ericsson.com or carllyn.barfi@ericsson.com
- **Password:** password123

## 📋 System Requirements

- Linux VM with Node.js (v16+ recommended)
- For HTTPS: Port 443 access + sudo privileges
- For HTTP: Port 8080 access (no sudo required)

## 🌐 Access URLs

### HTTPS Mode (Recommended)
- **Primary:** https://aiduagent-csstip.ckit1.explab.com/
- **Local:** https://localhost:443/
- **Requires:** sudo privileges

### HTTP Mode (Fallback)
- **URL:** http://localhost:8080/
- **Requires:** No special privileges

## 🏗️ File Structure

```
deployment-package/
├── dist/                          # Built React application
├── server.js                      # Express server (ES module)
├── aiduagent-csstip.ckit1.explab.com.crt  # SSL certificate
├── aiduagent-csstip.ckit1.explab.com.key  # SSL private key
├── start-offline.sh               # Startup script
├── package.json                   # Dependencies
└── README-DEPLOYMENT.md          # This file
```

## 🔧 Troubleshooting

### Port 443 Permission Denied
```bash
sudo ./start-offline.sh
```

### Certificates Not Working
- Verify certificate files exist in deployment folder
- Check file permissions: `ls -la *.crt *.key`
- Test HTTP mode first: Remove certificates and restart

### Application Not Loading
1. Verify dist/ folder exists and contains files
2. Check server logs for errors
3. Clear browser cache
4. Try different browser/incognito mode

### DNS Resolution Issues
Add to `/etc/hosts`:
```
127.0.0.1 aiduagent-csstip.ckit1.explab.com
```

## 💾 Data Storage

- All data stored in browser localStorage
- Persists per browser/device
- No external database required

## 🛡️ Security Notes

- Application runs with HTTPS by default
- SSL certificates included for secure communication
- CORS properly configured for the FQDN
- Security headers enabled

## 📞 Support

For issues or questions, refer to the deployment logs or contact your system administrator.
EOF

echo ""
echo "✅ Deployment package created successfully!"
echo ""
echo "📁 Location: ./deployment-package/"
echo ""
echo "🔧 Next Steps:"
echo "1. Copy 'deployment-package' folder to your Linux VM"
echo "2. cd deployment-package"
echo "3. For HTTPS: sudo ./start-offline.sh"
echo "4. For HTTP:  ./start-offline.sh (after removing SSL certs)"
echo ""
echo "🌐 URLs:"
echo "   HTTPS: https://aiduagent-csstip.ckit1.explab.com/"
echo "   HTTP:  http://localhost:8080/"
echo ""
echo "🔐 Login: muhammad.mahmood@ericsson.com / password123"
EOF

chmod +x deploy-offline.sh

echo "✅ All deployment files updated and verified!"
echo ""
echo "🧪 To test locally:"
echo "1. Run: ./deploy-offline.sh"
echo "2. Run: cd deployment-package"
echo "3. Run: sudo ./start-offline.sh (HTTPS) or ./start-offline.sh (HTTP)"

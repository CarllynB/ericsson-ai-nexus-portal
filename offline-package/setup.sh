#!/bin/bash

# AI-DU Agent Portal - Offline Package Setup Script
# This script prepares the zero-download offline package

echo "🚀 Setting up AI-DU Agent Portal Offline Package..."

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p database
mkdir -p ssl
mkdir -p frontend
mkdir -p node_modules

echo "📦 Installing dependencies..."
npm install --production

echo "🗄️ Copying database..."
if [ -f "../shared_database.sqlite" ]; then
    cp ../shared_database.sqlite database/
    echo "✅ Database copied"
else
    echo "⚠️ Database not found at ../shared_database.sqlite"
    echo "   Please copy your database file to database/shared_database.sqlite"
fi

echo "🔐 Copying SSL certificates..."
if [ -f "../aiduagent-csstip.ckit1.explab.com.crt" ]; then
    cp ../aiduagent-csstip.ckit1.explab.com.crt ssl/
    echo "✅ Certificate copied"
else
    echo "⚠️ Certificate not found"
fi

if [ -f "../aiduagent-csstip.ckit1.explab.com.key" ]; then
    cp ../aiduagent-csstip.ckit1.explab.com.key ssl/
    echo "✅ Private key copied"
else
    echo "⚠️ Private key not found"
fi

echo "🎨 Building frontend..."
cd ..
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully"
    cp -r dist/* offline-package/frontend/
    echo "✅ Frontend copied to offline package"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd offline-package

echo "✅ Offline package setup complete!"
echo ""
echo "🎯 To start the portal:"
echo "   node run-offline.js"
echo ""
echo "🌐 Access at: https://aiduagent-csstip.ckit1.explab.com/"
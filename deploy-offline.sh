
#!/bin/bash

echo "Deploying AI-DU Agent Portal for offline use..."

# Install dependencies
echo "Installing dependencies..."
npm ci

# Install Supabase CLI globally
echo "Installing Supabase CLI..."
npm install -g @supabase/cli

# Initialize Supabase if needed
if [ ! -d "supabase" ]; then
    echo "Initializing Supabase..."
    supabase init
fi

# Build the application
echo "Building application..."
export VITE_OFFLINE_MODE=true
npm run build

# Create deployment package
echo "Creating deployment package..."
mkdir -p offline-deployment
cp -r dist/ offline-deployment/
cp server.js offline-deployment/
cp -r supabase/ offline-deployment/
cp start-offline.sh offline-deployment/
cp stop-offline.sh offline-deployment/
cp *.crt offline-deployment/ 2>/dev/null || true
cp *.key offline-deployment/ 2>/dev/null || true

# Make scripts executable
chmod +x offline-deployment/start-offline.sh
chmod +x offline-deployment/stop-offline.sh

echo "Offline deployment package created in 'offline-deployment' directory"
echo "To deploy: copy the 'offline-deployment' directory to your offline environment"
echo "Then run: ./start-offline.sh"

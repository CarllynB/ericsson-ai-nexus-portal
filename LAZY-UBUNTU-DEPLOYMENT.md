
# Lazy Man's AI-DU Deployment Guide 🚀

## Prerequisites
- Fresh Ubuntu server with sudo access
- AI_DU folder packaged as `ai-du-production-ready.tar.gz`

## Step 1: Prepare Ubuntu Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 2: Transfer & Extract
```bash
# Upload ai-du-production-ready.tar.gz to server (use WinSCP/FileZilla)
# Or use SCP: scp ai-du-production-ready.tar.gz user@server:/home/user/

# Extract
tar -xzf ai-du-production-ready.tar.gz
cd AI_DU/
```

## Step 3: Install Dependencies (if needed)
```bash
# Only if node_modules is missing
npm install
```

## Step 4: Place SSL Certificates
```bash
# Copy your SSL files to AI_DU directory
cp /path/to/aiduagent-csstip.ckit1.explab.com.crt .
cp /path/to/aiduagent-csstip.ckit1.explab.com.key .

# Set permissions
chmod 600 *.key
chmod 644 *.crt
```

## Step 5: Start the Server
```bash
# Option A: Use pre-built offline package (RECOMMENDED)
cd offline-package/
sudo node server.js

# Option B: Use main server
cd AI_DU/
sudo node server.js
```

## Step 6: Test
```bash
# Check if running
curl -k https://localhost:443/api/health

# Should return: {"status":"ok","database":"connected",...}
```

## Done! 🎉
- Access: `https://aiduagent-csstip.ckit1.explab.com/`
- Login: Use any email + password `admin123`

## If Something Goes Wrong
```bash
# Check what's using port 443
sudo netstat -tulpn | grep :443

# Kill existing processes
sudo pkill -f "node server.js"

# Restart
sudo node server.js
```

## That's It!
No compilation, no building - just extract and run!

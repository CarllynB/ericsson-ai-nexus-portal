
# AI-DU Agent Portal Transfer Methods - MOP Guides

## MOP 1: Transfer Pre-built Package Only (RECOMMENDED)

### Purpose
Transfer only the ready-to-run offline package for immediate deployment

### Prerequisites
- Source system with built AI-DU application
- Target Linux VM with sudo access
- SSL certificates ready for deployment

### Procedure

#### Step 1: Package Preparation (Source System)
```bash
# Navigate to your AI-DU directory
cd /path/to/AI_DU/

# Verify offline package exists and is built
ls -la offline-package/
ls -la offline-package/dist/
ls -la offline-package/node_modules/

# Create transfer package
tar -czf ai-du-offline-package.tar.gz offline-package/
```

#### Step 2: Transfer to Target System
```bash
# Option A: SCP Transfer
scp ai-du-offline-package.tar.gz user@target-server:/home/user/

# Option B: Upload via file transfer tool
# Use your preferred method (WinSCP, FileZilla, etc.)
```

#### Step 3: Deployment on Target System
```bash
# Extract package
tar -xzf ai-du-offline-package.tar.gz

# Navigate to extracted directory
cd offline-package/

# Place SSL certificates (if not already present)
cp /path/to/aiduagent-csstip.ckit1.explab.com.crt .
cp /path/to/aiduagent-csstip.ckit1.explab.com.key .

# Set proper permissions
chmod 600 *.key
chmod 644 *.crt

# Start the production server
sudo node server.js
```

#### Step 4: Verification
```bash
# Check if server is running
curl -k https://localhost:443/api/health

# Check process
ps aux | grep node

# Check logs
tail -f /var/log/syslog | grep node
```

### Expected Results
- Server running on port 443 (HTTPS)
- Application accessible via domain
- All APIs functional
- Database initialized with default data

---

## MOP 2: Transfer Complete AI_DU Folder

### Purpose
Transfer entire development environment for flexibility and debugging

### Prerequisites
- Source system with complete AI-DU project
- Target Linux VM with Node.js 18+ installed
- Git (optional, for version control)

### Procedure

#### Step 1: Package Preparation (Source System)
```bash
# Navigate to parent directory of AI_DU
cd /path/to/parent/

# Create complete package (excluding node_modules to reduce size)
tar --exclude='node_modules' --exclude='.git' -czf ai-du-complete.tar.gz AI_DU/

# Alternative: Include everything
tar -czf ai-du-complete-full.tar.gz AI_DU/
```

#### Step 2: Transfer to Target System
```bash
# Transfer the package
scp ai-du-complete.tar.gz user@target-server:/home/user/
```

#### Step 3: Setup on Target System
```bash
# Extract package
tar -xzf ai-du-complete.tar.gz

# Navigate to project directory
cd AI_DU/

# Install dependencies (if not included)
npm install

# Build the application
npm run build

# Place SSL certificates
cp /path/to/aiduagent-csstip.ckit1.explab.com.crt .
cp /path/to/aiduagent-csstip.ckit1.explab.com.key .

# Set permissions
chmod 600 *.key
chmod 644 *.crt
```

#### Step 4: Choose Deployment Method
```bash
# Option A: Use the main server.js
sudo node server.js

# Option B: Use the pre-built offline package
cd offline-package/
sudo node server.js

# Option C: Development mode (for testing)
npm run dev
```

#### Step 5: Verification
```bash
# Check server status
curl -k https://localhost:443/api/health

# Check all processes
ps aux | grep node

# Monitor logs
tail -f shared_database.sqlite*
```

### Expected Results
- Multiple deployment options available
- Full source code for modifications
- Both development and production modes available

---

## MOP 3: Transfer Compressed Archive (.tar.gz)

### Purpose
Transfer the pre-built package in compressed format for bandwidth efficiency

### Prerequisites
- Pre-built offline package created
- Compression tools available
- Target system with extraction capabilities

### Procedure

#### Step 1: Create Compressed Archive (Source System)
```bash
# Navigate to AI_DU directory
cd /path/to/AI_DU/

# Create timestamp for tracking
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create compressed archive with timestamp
tar -czf "ai-du-production-transfer_${TIMESTAMP}.tar.gz" offline-package/

# Verify archive
tar -tzf "ai-du-production-transfer_${TIMESTAMP}.tar.gz" | head -20

# Check archive size
ls -lh ai-du-production-transfer_*.tar.gz
```

#### Step 2: Transfer Archive
```bash
# Transfer via SCP with progress
scp -v ai-du-production-transfer_*.tar.gz user@target-server:/home/user/

# Or use rsync for better transfer reliability
rsync -avz --progress ai-du-production-transfer_*.tar.gz user@target-server:/home/user/
```

#### Step 3: Extract and Deploy on Target System
```bash
# List available archives
ls -la ai-du-production-transfer_*.tar.gz

# Extract the latest archive
tar -xzf ai-du-production-transfer_*.tar.gz

# Navigate to extracted directory
cd offline-package/

# Verify contents
ls -la
ls -la dist/
ls -la node_modules/

# Place SSL certificates
cp /path/to/certificates/*.crt .
cp /path/to/certificates/*.key .

# Set proper permissions
chmod 600 *.key
chmod 644 *.crt

# Start production server
sudo node server.js
```

#### Step 4: Post-Deployment Verification
```bash
# Test HTTPS endpoint
curl -k https://localhost:443/api/health

# Test specific API endpoints
curl -k https://localhost:443/api/agents
curl -k https://localhost:443/api/sidebar

# Check database
ls -la shared_database.sqlite

# Monitor server logs
journalctl -f -u node
```

### Expected Results
- Efficient transfer with compression
- Ready-to-run application
- All features functional
- Database properly initialized

---

## Quick Reference Commands

### Common Troubleshooting
```bash
# Check port 443 usage
sudo netstat -tulpn | grep :443

# Kill existing processes on port 443
sudo lsof -ti:443 | xargs sudo kill -9

# Check SSL certificate validity
openssl x509 -in aiduagent-csstip.ckit1.explab.com.crt -text -noout

# View server logs
tail -100 /var/log/syslog | grep node

# Check disk space
df -h

# Check memory usage
free -h
```

### Emergency Rollback
```bash
# Stop current server
sudo pkill -f "node server.js"

# Restore from backup (if available)
tar -xzf backup-ai-du-*.tar.gz

# Restart with backup
cd offline-package/
sudo node server.js
```

---

## Recommendation Summary

**For Production Deployment: Use MOP 1** (Pre-built Package Only)
- ✅ Fastest deployment
- ✅ Smallest transfer size
- ✅ Ready to run immediately
- ✅ Most secure (no source code exposure)

**For Development/Testing: Use MOP 2** (Complete Folder)
- ✅ Full source code access
- ✅ Multiple deployment options
- ✅ Easy modifications and debugging

**For Bandwidth-Limited Transfer: Use MOP 3** (Compressed Archive)
- ✅ Efficient transfer
- ✅ Timestamped for tracking
- ✅ Same end result as MOP 1



# AI-DU Agent Portal Transfer Methods - MOP Guides

## MOP 1: Send Just the offline-package/ Folder (RECOMMENDED)

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

# Create transfer package of JUST the offline-package folder
tar -czf ai-du-offline-ready.tar.gz offline-package/
```

#### Step 2: Transfer to Target System
```bash
# Option A: SCP Transfer
scp ai-du-offline-ready.tar.gz user@target-server:/home/user/

# Option B: Upload via file transfer tool
# Use your preferred method (WinSCP, FileZilla, etc.)
```

#### Step 3: Deployment on Target System
```bash
# Extract package
tar -xzf ai-du-offline-ready.tar.gz

# Navigate to extracted directory
cd offline-package/

# Place SSL certificates (if not already present)
cp /path/to/aiduagent-csstip.ckit1.explab.com.crt .
cp /path/to/aiduagent-csstip.ckit1.explab.com.key .

# Set proper permissions
chmod 600 *.key
chmod 644 *.crt

# Start the production server immediately
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
- ✅ Server running on port 443 (HTTPS)
- ✅ Application accessible via domain
- ✅ All APIs functional
- ✅ Database initialized with default data
- ✅ Ready to use immediately

---

## MOP 2: Send the Whole AI_DU Folder

### Purpose
Transfer entire development environment - gives flexibility to use main app OR offline-package

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

# Alternative: Include everything if you want node_modules too
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

#### Step 4: Choose Your Deployment Method
```bash
# OPTION A: Use the main server.js (unified approach)
sudo node server.js

# OPTION B: Use the pre-built offline package (fastest)
cd offline-package/
sudo node server.js

# OPTION C: Development mode (for testing/debugging)
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
- ✅ Multiple deployment options available
- ✅ Full source code for modifications
- ✅ Both development and production modes available
- ✅ Can switch between main app and offline-package

---

## MOP 3: Send the .tar.gz File (Compressed offline-package)

### Purpose
Transfer the ready-to-run package in compressed format for bandwidth efficiency - same as MOP 1 but compressed

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

# Create compressed archive with timestamp - JUST the offline-package
tar -czf "ai-du-offline-compressed_${TIMESTAMP}.tar.gz" offline-package/

# Verify archive contents
tar -tzf "ai-du-offline-compressed_${TIMESTAMP}.tar.gz" | head -20

# Check archive size (should be smaller due to compression)
ls -lh ai-du-offline-compressed_*.tar.gz
```

#### Step 2: Transfer Archive
```bash
# Transfer via SCP with progress
scp -v ai-du-offline-compressed_*.tar.gz user@target-server:/home/user/

# Or use rsync for better transfer reliability
rsync -avz --progress ai-du-offline-compressed_*.tar.gz user@target-server:/home/user/
```

#### Step 3: Extract and Deploy on Target System
```bash
# List available archives
ls -la ai-du-offline-compressed_*.tar.gz

# Extract the latest archive
tar -xzf ai-du-offline-compressed_*.tar.gz

# Navigate to extracted directory
cd offline-package/

# Verify contents are identical to MOP 1
ls -la
ls -la dist/
ls -la node_modules/

# Place SSL certificates
cp /path/to/certificates/*.crt .
cp /path/to/certificates/*.key .

# Set proper permissions
chmod 600 *.key
chmod 644 *.crt

# Start production server (identical to MOP 1)
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
- ✅ Efficient transfer with compression
- ✅ Identical functionality to MOP 1
- ✅ Ready-to-run application
- ✅ All features functional
- ✅ Database properly initialized

---

## Quick Decision Matrix

| Method | Best For | Transfer Size | Setup Time | Flexibility |
|--------|----------|---------------|------------|-------------|
| **MOP 1** | Production deployment | Small | Fastest | Low |
| **MOP 2** | Development/Testing | Large | Medium | High |
| **MOP 3** | Bandwidth-limited | Smallest | Fast | Low |

## Common Troubleshooting Commands

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

## Emergency Rollback Procedure

```bash
# Stop current server
sudo pkill -f "node server.js"

# Restore from backup (if available)
tar -xzf backup-ai-du-*.tar.gz

# Restart with backup
cd offline-package/  # or AI_DU/ depending on your backup
sudo node server.js
```

---

## Final Recommendation

**For Production: Use MOP 1 or MOP 3**
- Fastest deployment
- Smallest risk
- Ready to run immediately
- Most secure (no source code exposure)

**For Development: Use MOP 2**
- Full flexibility
- Access to source code
- Multiple deployment options
- Easy debugging and modifications


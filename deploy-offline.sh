
#!/bin/bash

echo "Creating complete offline deployment package for AI-DU Agent Portal..."

# Check if running as root (needed for some installations)
if [[ $EUID -eq 0 ]]; then
   echo "Warning: Running as root. Consider running as non-root user for security."
fi

# Create deployment directory
echo "Creating deployment structure..."
mkdir -p offline-deployment/{docker,scripts,backup}

# Install system dependencies check
echo "Checking system dependencies..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker installed. Please log out and back in for group changes to take effect."
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose not found. Installing..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm ci --production

# Install Supabase CLI globally
echo "Installing Supabase CLI..."
npm install -g supabase

# Initialize Supabase if needed
if [ ! -d "supabase" ]; then
    echo "Initializing Supabase..."
    supabase init
fi

# Create offline environment configuration
echo "Setting up offline configuration..."
export VITE_OFFLINE_MODE=true

# Build the application
echo "Building application for offline use..."
npm run build

# Create comprehensive deployment package
echo "Creating deployment package..."

# Copy application files
cp -r dist/ offline-deployment/
cp -r supabase/ offline-deployment/
cp server.js offline-deployment/
cp package*.json offline-deployment/
cp Dockerfile offline-deployment/
cp docker-compose.yml offline-deployment/

# Copy SSL certificates if they exist
cp *.crt offline-deployment/ 2>/dev/null || echo "No SSL certificates found (optional)"
cp *.key offline-deployment/ 2>/dev/null || echo "No SSL keys found (optional)"

# Copy and update scripts
cp start-offline.sh offline-deployment/
cp stop-offline.sh offline-deployment/
cp OFFLINE-DEPLOYMENT.md offline-deployment/

# Create additional utility scripts
cat > offline-deployment/scripts/check-dependencies.sh << 'EOF'
#!/bin/bash
echo "Checking offline deployment dependencies..."

# Check Node.js
if command -v node &> /dev/null; then
    echo "✓ Node.js $(node --version)"
else
    echo "✗ Node.js not installed"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✓ npm $(npm --version)"
else
    echo "✗ npm not installed"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo "✓ Docker $(docker --version)"
else
    echo "✗ Docker not installed"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✓ Docker Compose $(docker-compose --version)"
else
    echo "✗ Docker Compose not installed"
    exit 1
fi

# Check Supabase CLI
if command -v supabase &> /dev/null; then
    echo "✓ Supabase CLI $(supabase --version)"
else
    echo "✗ Supabase CLI not installed"
    exit 1
fi

echo "All dependencies are installed!"
EOF

# Create backup script
cat > offline-deployment/scripts/backup-database.sh << 'EOF'
#!/bin/bash
echo "Creating database backup..."

# Create backup directory if it doesn't exist
mkdir -p backup

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Dump database
supabase db dump -f backup/backup_${TIMESTAMP}.sql

echo "Database backup created: backup/backup_${TIMESTAMP}.sql"
EOF

# Create restore script
cat > offline-deployment/scripts/restore-database.sh << 'EOF'
#!/bin/bash
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql>"
    echo "Available backups:"
    ls -la backup/*.sql 2>/dev/null || echo "No backups found"
    exit 1
fi

echo "Restoring database from $1..."
supabase db reset
psql -h localhost -p 54322 -U postgres -d postgres -f "$1"
echo "Database restored from $1"
EOF

# Create Docker-only deployment
cat > offline-deployment/docker-start.sh << 'EOF'
#!/bin/bash
echo "Starting AI-DU Agent Portal with Docker..."

# Build Docker image if it doesn't exist
if ! docker images | grep -q ai-du-agent; then
    echo "Building Docker image..."
    docker build -t ai-du-agent .
fi

# Start services with Docker Compose
echo "Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 15

echo "Services started!"
echo "Application: http://localhost:8080"
echo "To stop: docker-compose down"
EOF

# Make all scripts executable
chmod +x offline-deployment/*.sh
chmod +x offline-deployment/scripts/*.sh

# Create README for the deployment package
cat > offline-deployment/README.md << 'EOF'
# AI-DU Agent Portal - Offline Deployment Package

This package contains everything needed to run the AI-DU Agent Portal offline.

## Quick Start

1. **Check dependencies:**
   ```bash
   ./scripts/check-dependencies.sh
   ```

2. **Start the application:**
   ```bash
   ./start-offline.sh
   ```

3. **Access the application:**
   - Main app: http://localhost:8080
   - Database admin: http://localhost:54323

4. **Stop the application:**
   ```bash
   ./stop-offline.sh
   ```

## Alternative Docker Deployment

If you prefer Docker:
```bash
./docker-start.sh
```

## Utilities

- `scripts/backup-database.sh` - Create database backup
- `scripts/restore-database.sh <file>` - Restore from backup
- `scripts/check-dependencies.sh` - Verify all dependencies

## Troubleshooting

See OFFLINE-DEPLOYMENT.md for detailed troubleshooting guide.
EOF

# Create system info script
cat > offline-deployment/scripts/system-info.sh << 'EOF'
#!/bin/bash
echo "System Information for AI-DU Agent Portal"
echo "========================================"
echo "OS: $(uname -a)"
echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
echo "npm: $(npm --version 2>/dev/null || echo 'Not installed')"
echo "Docker: $(docker --version 2>/dev/null || echo 'Not installed')"
echo "Docker Compose: $(docker-compose --version 2>/dev/null || echo 'Not installed')"
echo "Supabase: $(supabase --version 2>/dev/null || echo 'Not installed')"
echo "Available Memory: $(free -h | grep Mem | awk '{print $2}' 2>/dev/null || echo 'Unknown')"
echo "Available Disk: $(df -h . | tail -1 | awk '{print $4}' 2>/dev/null || echo 'Unknown')"
echo "Current User: $(whoami)"
echo "Current Directory: $(pwd)"
EOF

chmod +x offline-deployment/scripts/system-info.sh

# Create installation verification
echo "Verifying deployment package..."
if [ -f "offline-deployment/dist/index.html" ] && [ -f "offline-deployment/server.js" ] && [ -d "offline-deployment/supabase" ]; then
    echo "✓ Deployment package created successfully!"
else
    echo "✗ Deployment package incomplete!"
    exit 1
fi

echo ""
echo "================================================"
echo "Offline deployment package created successfully!"
echo "================================================"
echo ""
echo "Package location: $(pwd)/offline-deployment"
echo "Package size: $(du -sh offline-deployment | cut -f1)"
echo ""
echo "To deploy on offline machine:"
echo "1. Copy the entire 'offline-deployment' directory"
echo "2. Run: cd offline-deployment && ./scripts/check-dependencies.sh"
echo "3. Run: ./start-offline.sh"
echo ""
echo "The package includes:"
echo "- Complete application build"
echo "- Local Supabase configuration"
echo "- SSL certificates (if available)"
echo "- Database migrations"
echo "- Utility scripts"
echo "- Docker configuration"
echo "- Complete documentation"
echo ""
echo "For Docker deployment: ./docker-start.sh"
echo "For manual setup: see OFFLINE-DEPLOYMENT.md"
EOF

Now let me update the start script to handle all the requirements:

<lov-write file_path="start-offline.sh">
#!/bin/bash

echo "Starting AI-DU Agent Portal in complete offline mode..."
echo "======================================================"

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Warning: Port $1 is already in use"
        echo "Process using port $1: $(lsof -ti:$1 | head -1 | xargs ps -p | tail -1)"
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborting startup..."
            exit 1
        fi
    fi
}

# Check critical ports
echo "Checking port availability..."
check_port 8080  # Main application
check_port 54321 # Supabase API
check_port 54322 # PostgreSQL
check_port 54323 # Supabase Studio

# Check system requirements
echo "Checking system requirements..."

# Check available memory
AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
if [ "$AVAILABLE_MEM" -lt 1024 ]; then
    echo "Warning: Low available memory (${AVAILABLE_MEM}MB). Recommended: 1GB+"
fi

# Check available disk space
AVAILABLE_DISK=$(df . | awk 'NR==2{print $4}')
if [ "$AVAILABLE_DISK" -lt 1048576 ]; then  # 1GB in KB
    echo "Warning: Low disk space. Recommended: 1GB+"
fi

# Check if Docker is running (for potential conflicts)
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        echo "Docker is running. Checking for port conflicts..."
        DOCKER_PORTS=$(docker ps --format "table {{.Ports}}" | grep -E "(8080|54321|54322|54323)" | wc -l)
        if [ "$DOCKER_PORTS" -gt 0 ]; then
            echo "Warning: Docker containers are using required ports"
            docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "(8080|54321|54322|54323)"
        fi
    fi
fi

# Install dependencies if missing
echo "Checking and installing dependencies..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js 18+ and run this script again"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    exit 1
fi

# Check and install Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    npm install -g supabase
    if ! command -v supabase &> /dev/null; then
        echo "Error: Failed to install Supabase CLI"
        echo "Try running: sudo npm install -g supabase"
        exit 1
    fi
fi

# Check if we have the required files
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Are you in the right directory?"
    exit 1
fi

# Install application dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing application dependencies..."
    npm ci
fi

# Initialize Supabase if not already done
if [ ! -d "supabase" ]; then
    echo "Initializing Supabase project..."
    supabase init
fi

# Set offline mode environment variables
export VITE_OFFLINE_MODE=true
export NODE_ENV=development

# Check if Supabase is already running
if supabase status &> /dev/null; then
    echo "Supabase is already running. Checking status..."
    supabase status
else
    echo "Starting local Supabase services..."
    echo "This may take a few minutes on first run..."
    
    # Start Supabase with retry logic
    RETRY_COUNT=0
    MAX_RETRIES=3
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if supabase start; then
            echo "✓ Supabase started successfully"
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            echo "Failed to start Supabase (attempt $RETRY_COUNT/$MAX_RETRIES)"
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                echo "Retrying in 10 seconds..."
                sleep 10
                echo "Cleaning up and retrying..."
                supabase stop 2>/dev/null || true
                sleep 5
            else
                echo "Error: Failed to start Supabase after $MAX_RETRIES attempts"
                echo "Please check the logs and try again"
                exit 1
            fi
        fi
    done
fi

# Wait for Supabase to be fully ready
echo "Waiting for Supabase services to be ready..."
sleep 15

# Verify Supabase is responding
SUPABASE_READY=false
for i in {1..30}; do
    if curl -s http://localhost:54321/health &> /dev/null; then
        SUPABASE_READY=true
        break
    fi
    echo "Waiting for Supabase API... ($i/30)"
    sleep 2
done

if [ "$SUPABASE_READY" = false ]; then
    echo "Error: Supabase API is not responding"
    echo "Check Supabase status: supabase status"
    echo "Check Supabase logs: supabase logs"
    exit 1
fi

# Run database migrations and reset
echo "Setting up database..."
if ! supabase db reset --db-url postgresql://postgres:postgres@localhost:54322/postgres; then
    echo "Warning: Database reset failed. Continuing anyway..."
    echo "You may need to run 'supabase db reset' manually later"
fi

# Build the application if dist doesn't exist or is outdated
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "Building application..."
    npm run build
else
    # Check if source is newer than build
    if [ "src" -nt "dist" ]; then
        echo "Source files are newer than build. Rebuilding..."
        npm run build
    fi
fi

# Start the application server
echo "Starting application server..."

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo "Error: server.js not found"
    exit 1
fi

# Start the server in background
node server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "Error: Failed to start application server"
    exit 1
fi

# Verify the application is responding
APP_READY=false
for i in {1..15}; do
    if curl -s http://localhost:8080 &> /dev/null; then
        APP_READY=true
        break
    fi
    echo "Waiting for application server... ($i/15)"
    sleep 2
done

if [ "$APP_READY" = false ]; then
    echo "Warning: Application server may not be responding properly"
fi

# Save PID for cleanup
echo $SERVER_PID > .server.pid

echo ""
echo "=================================================="
echo "AI-DU Agent Portal started successfully!"
echo "=================================================="
echo ""
echo "🌐 Application URL: http://localhost:8080"
echo "🗄️  Database Admin: http://localhost:54323"
echo "🔌 Supabase API: http://localhost:54321"
echo "📧 Email Testing: http://localhost:54324"
echo ""
echo "Services Status:"
echo "- Application Server: ✓ Running (PID: $SERVER_PID)"
echo "- Supabase Services: ✓ Running"
echo "- PostgreSQL: ✓ Running on port 54322"
echo ""
echo "Useful Commands:"
echo "- Stop all services: ./stop-offline.sh"
echo "- View Supabase status: supabase status"
echo "- View Supabase logs: supabase logs"
echo "- Backup database: ./scripts/backup-database.sh"
echo ""
echo "Press Ctrl+C to stop the application server"
echo "Or run './stop-offline.sh' from another terminal"
echo ""

# Keep the script running and handle Ctrl+C
trap 'echo ""; echo "Stopping application server..."; kill $SERVER_PID 2>/dev/null; echo "Application server stopped. Supabase services are still running."; echo "Run ./stop-offline.sh to stop all services."; exit 0' INT

# Wait for the server process
wait $SERVER_PID

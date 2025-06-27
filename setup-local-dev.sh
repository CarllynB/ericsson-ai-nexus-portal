
#!/bin/bash

echo "🚀 Setting up AI-DU Agent Portal for local development"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Step 1: Fix file permissions
echo "1. Fixing file permissions..."
if [ -d "node_modules" ]; then
    sudo chown -R $(whoami) node_modules
    print_status "Fixed node_modules ownership"
else
    print_warning "node_modules not found, will be created during npm install"
fi

# Step 2: Update browserslist if needed
echo "2. Updating browserslist database..."
if npx update-browserslist-db@latest; then
    print_status "Browserslist database updated"
else
    print_warning "Could not update browserslist (not critical)"
fi

# Step 3: Install dependencies
echo "3. Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_status "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 4: Install Supabase CLI if not present
echo "4. Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    npm install -g supabase
    if [ $? -eq 0 ]; then
        print_status "Supabase CLI installed"
    else
        print_error "Failed to install Supabase CLI"
        echo "Try: brew install supabase/tap/supabase (on macOS)"
        exit 1
    fi
else
    print_status "Supabase CLI already installed"
fi

# Step 5: Check Docker
echo "5. Checking Docker..."
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
else
    print_status "Docker is running"
fi

# Step 6: Generate SSL certificate for local development
echo "6. Setting up SSL certificate..."
if ! command -v mkcert &> /dev/null; then
    print_warning "mkcert not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install mkcert
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Try to install mkcert
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y mkcert
        elif command -v yum &> /dev/null; then
            sudo yum install -y mkcert
        else
            print_error "Please install mkcert manually"
            exit 1
        fi
    fi
fi

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ipconfig getifaddr en0 2>/dev/null || echo "127.0.0.1")

# Create SSL certificate
mkcert -install
mkcert localhost 127.0.0.1 ::1 $LOCAL_IP
if [ $? -eq 0 ]; then
    print_status "SSL certificate created for localhost, 127.0.0.1, and $LOCAL_IP"
    # Move certificates to expected location
    mv localhost+*-key.pem localhost-key.pem 2>/dev/null
    mv localhost+*.pem localhost.pem 2>/dev/null
else
    print_warning "Could not create SSL certificate"
fi

# Step 7: Check and fix migration file names
echo "7. Checking migration file names..."
MIGRATION_DIR="supabase/migrations"
if [ -d "$MIGRATION_DIR" ]; then
    # Check for files with UUID pattern and suggest renaming
    UUID_FILES=$(find "$MIGRATION_DIR" -name "*-*-*-*-*.sql" 2>/dev/null)
    if [ ! -z "$UUID_FILES" ]; then
        print_warning "Found migration files with UUID naming pattern"
        echo "These files need to be renamed to follow Supabase's naming convention:"
        echo "$UUID_FILES"
        echo ""
        echo "Please rename them to: <timestamp>_<descriptive_name>.sql"
        echo "For example: 20250624213437_create_agents_table.sql"
    else
        print_status "Migration file names look good"
    fi
fi

# Step 8: Start Supabase
echo "8. Starting Supabase..."
supabase start
if [ $? -eq 0 ]; then
    print_status "Supabase started successfully"
else
    print_error "Failed to start Supabase"
    exit 1
fi

# Step 9: Reset database with migrations
echo "9. Applying database migrations..."
supabase db reset
if [ $? -eq 0 ]; then
    print_status "Database migrations applied"
else
    print_error "Failed to apply migrations"
    echo "This might be due to migration file naming or foreign key issues"
    echo "Check the troubleshooting guide for details"
fi

# Step 10: Build the application
echo "10. Building application..."
npm run build
if [ $? -eq 0 ]; then
    print_status "Application built successfully"
else
    print_error "Failed to build application"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo "=================================================="
echo ""
echo "Your local development environment is ready:"
echo "• Main app: http://localhost:8080 (or https:// if SSL cert available)"
echo "• Database admin: http://localhost:54323"
echo "• Supabase API: http://localhost:54321"
echo "• LAN access: http://$LOCAL_IP:8080"
echo ""
echo "To start the application:"
echo "  export VITE_OFFLINE_MODE=true"
echo "  npm run dev    (for development)"
echo "  node server.js (for production build)"
echo ""
echo "To stop Supabase:"
echo "  supabase stop"
echo ""


#!/bin/bash

echo "Starting AI-DU Agent Portal in offline mode..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    npm install -g @supabase/cli
fi

# Initialize Supabase if not already done
if [ ! -d "supabase" ]; then
    echo "Initializing Supabase..."
    supabase init
fi

# Start local Supabase
echo "Starting local Supabase..."
supabase start

# Wait for Supabase to be ready
echo "Waiting for Supabase to be ready..."
sleep 10

# Run database migrations
echo "Running database migrations..."
supabase db reset

# Set offline mode environment variable
export VITE_OFFLINE_MODE=true

# Start the application
echo "Starting application..."
npm run dev -- --port 8080

echo "Application started at http://localhost:8080"
echo "Local Supabase Studio available at http://localhost:54323"

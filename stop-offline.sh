
#!/bin/bash

echo "Stopping AI-DU Agent Portal offline services..."
echo "==============================================="

# Function to kill process by PID file
kill_by_pidfile() {
    if [ -f "$1" ]; then
        PID=$(cat "$1")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Stopping process with PID: $PID"
            kill "$PID"
            sleep 2
            # Force kill if still running
            if kill -0 "$PID" 2>/dev/null; then
                echo "Force stopping process with PID: $PID"
                kill -9 "$PID"
            fi
        fi
        rm -f "$1"
    fi
}

# Stop application server
echo "Stopping application server..."
kill_by_pidfile ".server.pid"

# Kill any node processes running server.js
NODE_PIDS=$(pgrep -f "node server.js")
if [ ! -z "$NODE_PIDS" ]; then
    echo "Stopping additional node server processes..."
    echo "$NODE_PIDS" | xargs kill 2>/dev/null
    sleep 2
    # Force kill if still running
    NODE_PIDS=$(pgrep -f "node server.js")
    if [ ! -z "$NODE_PIDS" ]; then
        echo "Force stopping node server processes..."
        echo "$NODE_PIDS" | xargs kill -9 2>/dev/null
    fi
fi

# Stop Supabase services
echo "Stopping Supabase services..."
if command -v supabase &> /dev/null; then
    supabase stop
else
    echo "Supabase CLI not found, attempting manual cleanup..."
    
    # Kill Docker containers that might be running Supabase
    if command -v docker &> /dev/null; then
        echo "Stopping Supabase Docker containers..."
        docker stop $(docker ps -q --filter "label=com.supabase.cli.project") 2>/dev/null || true
        docker rm $(docker ps -aq --filter "label=com.supabase.cli.project") 2>/dev/null || true
    fi
fi

# Kill any processes using our ports
echo "Cleaning up port usage..."
PORTS=(8080 54321 54322 54323 54324)

for PORT in "${PORTS[@]}"; do
    PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "Killing process using port $PORT (PID: $PID)"
        kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null || true
    fi
done

# Clean up temporary files
echo "Cleaning up temporary files..."
rm -f .server.pid
rm -f supabase/.env 2>/dev/null || true

# Stop Docker Compose services if they exist
if [ -f "docker-compose.yml" ] && command -v docker-compose &> /dev/null; then
    echo "Stopping Docker Compose services..."
    docker-compose down 2>/dev/null || true
fi

# Final verification
echo "Verifying services are stopped..."

# Check if ports are still in use
STILL_RUNNING=false
for PORT in "${PORTS[@]}"; do
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Warning: Port $PORT is still in use"
        STILL_RUNNING=true
    fi
done

if [ "$STILL_RUNNING" = true ]; then
    echo ""
    echo "Some services may still be running."
    echo "You can check with: netstat -tulpn | grep -E '(8080|54321|54322|54323|54324)'"
    echo "Or force kill with: sudo pkill -f supabase"
else
    echo "✓ All services stopped successfully"
fi

echo ""
echo "============================================="
echo "AI-DU Agent Portal services stopped"
echo "============================================="
echo ""
echo "To restart: ./start-offline.sh"
echo "To check status: supabase status"
echo ""

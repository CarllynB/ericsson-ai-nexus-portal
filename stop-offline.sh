
#!/bin/bash

echo "Stopping AI-DU Agent Portal offline services..."

# Stop local Supabase
echo "Stopping local Supabase..."
supabase stop

echo "All services stopped."

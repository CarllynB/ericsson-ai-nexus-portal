
# Complete Offline Deployment Guide

This comprehensive guide explains how to deploy and run the AI-DU Agent Portal in a completely offline environment with all dependencies.

## System Requirements

- Node.js 18 or higher
- npm or yarn
- Docker and Docker Compose
- At least 4GB RAM
- 10GB available disk space
- Internet connection for initial setup only

## Complete Setup Process

### Method 1: Automated Setup (Recommended)

1. **Create deployment package:**
   ```bash
   chmod +x deploy-offline.sh
   ./deploy-offline.sh
   ```

2. **Transfer to offline environment:**
   ```bash
   # Copy the entire offline-deployment directory to your offline machine
   scp -r offline-deployment/ user@offline-machine:/path/to/deployment/
   ```

3. **Start services on offline machine:**
   ```bash
   cd offline-deployment
   chmod +x start-offline.sh
   ./start-offline.sh
   ```

### Method 2: Manual Setup

1. **Install system dependencies:**
   ```bash
   # Install Node.js (if not installed)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install Docker (if not installed)
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Install Docker Compose (if not installed)
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Install application dependencies:**
   ```bash
   npm ci
   npm install -g supabase
   ```

3. **Initialize and start Supabase:**
   ```bash
   # Initialize Supabase project
   supabase init
   
   # Start local Supabase (includes PostgreSQL, PostgREST, GoTrue, etc.)
   supabase start
   
   # Run database migrations
   supabase db reset
   ```

4. **Build and start the application:**
   ```bash
   export VITE_OFFLINE_MODE=true
   npm run build
   node server.js
   ```

## Docker Deployment (Alternative)

For containerized deployment:

1. **Build Docker image:**
   ```bash
   docker build -t ai-du-agent .
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

## Services and Ports

When running offline, these services will be available:

- **Main Application:** http://localhost:8080
- **Supabase Studio:** http://localhost:54323 (Database admin)
- **Supabase API:** http://localhost:54321
- **PostgreSQL:** localhost:54322
- **Inbucket (Email testing):** http://localhost:54324

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using the ports
   sudo netstat -tulpn | grep :8080
   sudo netstat -tulpn | grep :54321
   
   # Kill processes if needed
   sudo kill -9 <PID>
   ```

2. **Docker issues:**
   ```bash
   # Restart Docker service
   sudo systemctl restart docker
   
   # Clean up Docker resources
   docker system prune -a
   ```

3. **Supabase startup issues:**
   ```bash
   # Check Supabase status
   supabase status
   
   # View logs
   supabase logs
   
   # Reset if needed
   supabase stop
   supabase start
   ```

4. **Database connection issues:**
   ```bash
   # Reset database
   supabase db reset
   
   # Check database status
   supabase db diff
   ```

### Performance Optimization

1. **Increase memory for Docker:**
   - Allocate at least 4GB RAM to Docker
   - Increase swap space if needed

2. **Database optimization:**
   ```bash
   # Optimize PostgreSQL settings in supabase/config.toml
   [db]
   max_connections = 100
   shared_buffers = "256MB"
   effective_cache_size = "1GB"
   ```

## Security Considerations

- Change default passwords in production
- Configure firewall rules appropriately
- Use HTTPS in production (certificates provided)
- Regularly backup the database

## Backup and Restore

1. **Backup database:**
   ```bash
   supabase db dump -f backup.sql
   ```

2. **Restore database:**
   ```bash
   supabase db reset
   psql -h localhost -p 54322 -U postgres -d postgres -f backup.sql
   ```

## Monitoring

- Application logs: Check console output
- Supabase logs: `supabase logs`
- System resources: `htop` or `top`
- Database performance: Access Supabase Studio

## Complete Offline Package Contents

The deployment package includes:
- Built application files
- SSL certificates
- Supabase configuration
- Database migrations
- Startup/shutdown scripts
- Docker configuration
- Documentation

This ensures complete offline functionality without any external dependencies.

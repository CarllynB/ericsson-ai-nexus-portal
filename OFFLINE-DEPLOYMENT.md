
# Offline Deployment Guide

This guide explains how to deploy and run the AI-DU Agent Portal in an offline environment using a local Supabase instance.

## Requirements

- Node.js 18 or higher
- npm or yarn
- Internet connection for initial setup (to download dependencies)

## Quick Start

1. **Deploy offline package:**
   ```bash
   ./deploy-offline.sh
   ```

2. **Start the application:**
   ```bash
   ./start-offline.sh
   ```

3. **Stop the application:**
   ```bash
   ./stop-offline.sh
   ```

## Manual Setup

If you need to set up manually:

1. **Install dependencies:**
   ```bash
   npm ci
   npm install -g supabase
   ```

2. **Initialize Supabase:**
   ```bash
   supabase init
   ```

3. **Start local Supabase:**
   ```bash
   supabase start
   ```

4. **Run migrations:**
   ```bash
   supabase db reset
   ```

5. **Start the application:**
   ```bash
   export VITE_OFFLINE_MODE=true
   npm run dev -- --port 8080
   ```

## Access Points

- **Application:** http://localhost:8080
- **Supabase Studio:** http://localhost:54323
- **Supabase API:** http://localhost:54321

## Features in Offline Mode

- Full application functionality
- Local database with all migrations
- Role-based access control
- Agent management
- User authentication
- All existing features work locally

## Troubleshooting

- Ensure port 8080 and 54321 are available
- Check that Supabase services are running: `supabase status`
- View logs: `supabase logs`
- Reset database if needed: `supabase db reset`

## Production Deployment

For production offline deployment:

1. Run `./deploy-offline.sh` to create deployment package
2. Copy the `offline-deployment` directory to your target environment
3. Run `./start-offline.sh` on the target system

The application will automatically detect offline mode and use local Supabase instance.

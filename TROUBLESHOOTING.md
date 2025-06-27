
# AI-DU Agent Portal Local Development Troubleshooting

This guide addresses common issues encountered during local development setup.

## 🔧 Quick Fixes

### Permission Errors
```bash
# Fix node_modules ownership
sudo chown -R $(whoami) node_modules

# Update browserslist (optional)
npx update-browserslist-db@latest
```

### SSL Certificate Issues
```bash
# Generate new certificate with your LAN IP
LOCAL_IP=$(hostname -I | awk '{print $1}')
mkcert localhost 127.0.0.1 ::1 $LOCAL_IP

# Install mkcert if not present
# macOS: brew install mkcert
# Ubuntu: sudo apt install mkcert
```

### Docker Issues
```bash
# Check if Docker is running
docker info

# Start Docker Desktop and wait for "Docker is running" status
# Then restart Supabase
supabase stop
supabase start
```

## 🐛 Common Issues & Solutions

### 1. "Cannot connect to Docker daemon"
**Cause**: Docker Desktop not running
**Fix**: Launch Docker Desktop, wait for green status, then retry

### 2. "Skipping migration ... (file name must match pattern)"
**Cause**: Migration files named with hyphens instead of underscores
**Fix**: Rename files from `timestamp-uuid.sql` to `timestamp_description.sql`

### 3. "Mixed content" or "Failed to load agents"
**Cause**: HTTPS frontend calling HTTP Supabase API
**Fix**: Use the proxy in vite.config.ts or run both on HTTP

### 4. "Foreign key constraint violation"
**Cause**: Trying to insert user_roles before users exist
**Fix**: Run the new migration that handles this properly

### 5. "Certificate not trusted" on LAN IP
**Cause**: SSL cert doesn't include your network IP
**Fix**: Regenerate cert with `mkcert localhost 127.0.0.1 [YOUR_IP]`

### 6. "EACCES" when installing Supabase CLI
**Cause**: No permission to write to global npm directory
**Fix**: Use `npx supabase` instead of global install, or use Homebrew

## 📋 Setup Checklist

- [ ] Docker Desktop installed and running
- [ ] Node.js and npm installed
- [ ] Supabase CLI available (`supabase --version`)
- [ ] SSL certificates generated with mkcert
- [ ] Migration files properly named
- [ ] Database reset successful (`supabase db reset`)
- [ ] App builds without errors (`npm run build`)
- [ ] Local Supabase accessible at http://localhost:54321

## 🚀 Automated Setup

Run the automated setup script:
```bash
chmod +x setup-local-dev.sh
./setup-local-dev.sh
```

This script handles:
- Permission fixes
- Dependency installation
- SSL certificate generation
- Supabase setup
- Database migrations
- Application build

## 🆘 Still Having Issues?

1. Check the console for specific error messages
2. Verify all services are running:
   - `supabase status`
   - `docker ps`
3. Check file permissions in node_modules
4. Ensure your firewall isn't blocking ports 8080, 54321, 54322, 54323

## 📞 Getting Help

If you're still stuck, provide these details:
- Operating system and version  
- Node.js version (`node --version`)
- Docker version (`docker --version`)
- Complete error message
- Output of `supabase status`

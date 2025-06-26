
# HTTPS Setup Instructions

## Prerequisites

You need to obtain the private key file that matches your certificate. Contact the person who provided the certificate to get:
- `aiduagent-csstip.ckit1.explab.com.key`

## Development Setup

1. **Get the private key file:**
   ```bash
   # Place the private key file in the root directory
   # aiduagent-csstip.ckit1.explab.com.key
   ```

2. **Run development with HTTPS:**
   ```bash
   # Start Vite dev server (in one terminal)
   npm run dev

   # Start HTTPS proxy (in another terminal)
   sudo node dev-server.js
   ```

3. **Access your app:**
   - Open: `https://aiduagent-csstip.ckit1.explab.com/`
   - Your browser may show a certificate warning (click "Advanced" → "Proceed")

## Production Setup

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Run with Docker:**
   ```bash
   docker-compose up -d
   ```

3. **Or run directly:**
   ```bash
   sudo node server.js
   ```

## DNS Configuration

Make sure your domain points to your server:
- Add DNS A record: `aiduagent-csstip.ckit1.explab.com` → `YOUR_SERVER_IP`
- Or add to `/etc/hosts`: `YOUR_SERVER_IP aiduagent-csstip.ckit1.explab.com`

## Firewall Configuration

Open port 443:
```bash
# Ubuntu/Debian
sudo ufw allow 443

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## Troubleshooting

1. **Permission denied on port 443:**
   - Run with `sudo` (ports below 1024 require root privileges)
   
2. **Certificate errors:**
   - Ensure both `.crt` and `.key` files are in the root directory
   - Check file permissions: `chmod 600 *.key`
   
3. **Domain not resolving:**
   - Check DNS configuration
   - Try accessing by IP first

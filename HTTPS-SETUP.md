
# HTTPS Setup Instructions

## Quick Start

### Development
```bash
# If you have SSL certificates
sudo npm run start:dev

# If you don't have SSL certificates yet
npm run start:dev
```

### Production
```bash
# Build and run production server
sudo npm run start:prod
```

## SSL Certificates

### Current Setup
- Certificate: `aiduagent-csstip.ckit1.explab.com.crt` (already provided)
- Private Key: `aiduagent-csstip.ckit1.explab.com.key` (you need to get this)

### Future Certificates (from your team)
- **Production**: `aiduagent-csstip.msts.ericsson.net`
- **Sandbox**: TBD (Debajit will provide by 7/2)

## How to Get the Private Key

Contact the person who provided the certificate to get:
- `aiduagent-csstip.ckit1.explab.com.key`

Place this file in the root directory of your project.

## What Happens

### With SSL Certificates
- **Development**: Runs on `https://aiduagent-csstip.ckit1.explab.com/` (port 443)
- **Production**: Runs on `https://aiduagent-csstip.ckit1.explab.com/` (port 443)

### Without SSL Certificates
- **Development**: Runs on `http://localhost:8080/`
- **Production**: Attempts HTTPS but may not work

## Commands

| Command | What it does |
|---------|--------------|
| `npm run start:dev` | Start development with auto-HTTPS detection |
| `npm run start:prod` | Build and start production server |
| `npm run dev` | Standard Vite dev server |
| `npm run build` | Build for production |

## DNS Configuration

Make sure your domain points to your server:
```bash
# Add to /etc/hosts for local testing
127.0.0.1 aiduagent-csstip.ckit1.explab.com
```

## Firewall Configuration

```bash
# Ubuntu/Debian
sudo ufw allow 443

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## Docker (Optional)

```bash
# Build and run with Docker
docker-compose up -d
```

## Troubleshooting

1. **Permission denied on port 443**: Run with `sudo`
2. **Certificate errors**: Ensure both `.crt` and `.key` files exist
3. **Domain not resolving**: Check DNS or `/etc/hosts`

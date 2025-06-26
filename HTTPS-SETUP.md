
# HTTPS Setup Instructions - COMPLETE SETUP

## ✅ You're All Set!
Both certificate files are now in place:
- `aiduagent-csstip.ckit1.explab.com.crt` ✅
- `aiduagent-csstip.ckit1.explab.com.key` ✅

## 🚀 Quick Commands (Linux VM)

### Development Mode
```bash
# Run with HTTPS on port 443
sudo npm run dev

# Access at: https://aiduagent-csstip.ckit1.explab.com/
```

### Production Mode
```bash
# Build and run production server
npm run build
sudo node server.js

# Access at: https://aiduagent-csstip.ckit1.explab.com/
```

### Alternative: Using Docker
```bash
# Build and run with Docker (includes HTTPS)
sudo docker-compose up -d

# Access at: https://aiduagent-csstip.ckit1.explab.com/
```

## 🔧 What Happens Now

### Automatic HTTPS Detection
- The app automatically detects your SSL certificates
- **With certificates**: Runs on HTTPS port 443
- **Without certificates**: Falls back to HTTP port 8080

### URLs
- **HTTPS**: `https://aiduagent-csstip.ckit1.explab.com/`
- **Fallback**: `http://localhost:8080/`

## 📋 DNS Setup (if needed)

Add to `/etc/hosts` on your Linux VM:
```bash
echo "127.0.0.1 aiduagent-csstip.ckit1.explab.com" | sudo tee -a /etc/hosts
```

## 🔥 Firewall Setup (if needed)

```bash
# Ubuntu/Debian
sudo ufw allow 443

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## 🎯 Recommended Commands

**For Development:**
```bash
sudo npm run dev
```

**For Production:**
```bash
npm run build && sudo node server.js
```

## 🔮 Future Certificates

When you get new certificates from your team:
- **Production**: `aiduagent-csstip.msts.ericsson.net`
- **Sandbox**: (Debajit will provide by 7/2)

Just replace the certificate files and restart!

## ✨ That's It!

Your HTTPS setup is now complete and ready to run on your Linux VM.

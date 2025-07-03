# AI-DU Agent Portal - Zero-Download Offline Package

## Overview
This is a completely self-contained version of the AI-DU Agent Portal that requires **only Node.js** to run. No npm installations, no TypeScript compilation, no dependency downloads required.

## Features Included
✅ **Agent Management** - Create, edit, delete, and search agents  
✅ **Role Management** - Assign user roles (super_admin, admin, viewer)  
✅ **Authentication** - JWT-based login system  
✅ **Sidebar Management** - Customize navigation items  
✅ **Dashboard** - View agent analytics and metrics  
✅ **Persistent SQLite Database** - All data preserved across sessions  
✅ **HTTPS Support** - SSL certificate integration  
✅ **Responsive Design** - Works on all devices  

## Features Removed
❌ **NOVA AI Chat** - Removed as requested  
❌ **Hardcoded Agents** - Only manual agent management via UI  

## Requirements
- **Node.js** (version 14 or higher)
- **SSL Certificates** (for HTTPS on port 443)

## Installation & Setup

### 1. Copy the Package
Simply copy this entire `offline-package` folder to your target machine.

### 2. Install Dependencies (One-time only)
```bash
cd offline-package
npm install
```

### 3. Prepare SSL Certificates
Copy your SSL certificates to the `ssl/` directory:
- `ssl/aiduagent-csstip.ckit1.explab.com.crt`
- `ssl/aiduagent-csstip.ckit1.explab.com.key`

### 4. Copy Your Database
Copy your existing `shared_database.sqlite` file to `database/shared_database.sqlite`

### 5. Build Frontend (One-time only)
```bash
# In your original project directory
npm run build

# Then copy the dist/ folder contents to offline-package/frontend/
```

## Running the Portal

### Start the Server
```bash
node run-offline.js
```

### Or using npm
```bash
npm start
```

### Access the Portal
- **Production URL**: https://aiduagent-csstip.ckit1.explab.com/
- **Health Check**: https://aiduagent-csstip.ckit1.explab.com/api/health

## Default Login Credentials
- **Super Admin 1**: muhammad.mahmood@ericsson.com / admin123
- **Super Admin 2**: carllyn.barfi@ericsson.com / admin123

## Directory Structure
```
offline-package/
├── run-offline.js          # Main server file (pure JavaScript)
├── package.json            # Minimal dependencies
├── README.md              # This file
├── database/              # SQLite database
│   └── shared_database.sqlite
├── ssl/                   # SSL certificates
│   ├── aiduagent-csstip.ckit1.explab.com.crt
│   └── aiduagent-csstip.ckit1.explab.com.key
└── frontend/              # Pre-built React app
    ├── index.html
    ├── assets/
    └── ...
```

## Features & Functionality

### Agent Management
- Create new agents through the UI
- Edit existing agent details
- Delete agents (admin/super_admin only)
- Search and filter agents
- No hardcoded agents - all manual

### Role Management
- Assign roles to users by email
- Three role levels: super_admin, admin, viewer
- Role-based access control

### Authentication
- JWT-based login system
- 24-hour token expiration
- Role-based route protection

### Database
- Persistent SQLite database
- All data preserved across restarts
- No data loss when moving between machines

## Troubleshooting

### Port 443 Permission Error
```bash
sudo node run-offline.js
```

### SSL Certificate Issues
Ensure your certificates are in the correct location and have proper file permissions.

### Database Connection Issues
Verify the database file exists and is readable:
```bash
ls -la database/shared_database.sqlite
```

## Support
This is a self-contained package. All functionality works offline without any external dependencies beyond Node.js.

## Version
Offline Package v1.0.0 - Zero-Download Edition
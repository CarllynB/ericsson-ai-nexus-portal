#!/usr/bin/env node

// AI-DU Agent Portal - Zero-Download Offline Package
// Single startup script - requires only Node.js

const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuration
const PORT = 443;
const JWT_SECRET = 'ai-du-portal-offline-secret-key-2024';
const DB_PATH = path.join(__dirname, 'database', 'shared_database.sqlite');
const CERT_PATH = path.join(__dirname, 'ssl', 'aiduagent-csstip.ckit1.explab.com.crt');
const KEY_PATH = path.join(__dirname, 'ssl', 'aiduagent-csstip.ckit1.explab.com.key');

console.log('🚀 Starting AI-DU Agent Portal (Offline Package)...');
console.log('📦 Zero-download version - requires only Node.js');

// Initialize SQLite database
let db;
try {
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Database connection failed:', err);
      process.exit(1);
    } else {
      console.log('✅ SQLite database connected:', DB_PATH);
    }
  });
} catch (error) {
  console.error('❌ Critical database error:', error);
  process.exit(1);
}

// Database utility functions
const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Role requirement middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Express app setup
const app = express();

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS configuration
app.use(cors({
  origin: [
    'https://aiduagent-csstip.ckit1.explab.com',
    'http://localhost:8080',
    'https://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// AUTH ROUTES
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const role = await dbGet('SELECT role FROM user_roles WHERE user_id = ?', [user.id]);
    const userRole = role ? role.role : 'viewer';

    const token = jwt.sign(
      { id: user.id, email: user.email, role: userRole },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: userRole } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AGENT ROUTES
app.get('/api/agents', async (req, res) => {
  try {
    const agents = await dbAll('SELECT * FROM agents ORDER BY last_updated DESC');
    const formattedAgents = agents.map(agent => ({
      ...agent,
      key_features: JSON.parse(agent.key_features),
      contact_info: agent.contact_info ? JSON.parse(agent.contact_info) : undefined
    }));
    res.json(formattedAgents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json([]);
  }
});

app.post('/api/agents', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const agent = req.body;
    const newAgent = {
      ...agent,
      id: agent.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    await dbRun(`
      INSERT INTO agents (id, name, description, category, status, key_features, access_link, contact_info, owner, last_updated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newAgent.id,
      newAgent.name,
      newAgent.description,
      newAgent.category,
      newAgent.status,
      JSON.stringify(newAgent.key_features),
      newAgent.access_link || null,
      newAgent.contact_info ? JSON.stringify(newAgent.contact_info) : null,
      newAgent.owner,
      newAgent.last_updated,
      newAgent.created_at,
    ]);

    res.json(newAgent);
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

app.put('/api/agents/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const existingAgent = await dbGet('SELECT * FROM agents WHERE id = ?', [id]);
    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        if (key === 'key_features' && Array.isArray(value)) {
          values.push(JSON.stringify(value));
        } else if (key === 'contact_info' && value) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    }

    updateFields.push('last_updated = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await dbRun(`UPDATE agents SET ${updateFields.join(', ')} WHERE id = ?`, values);

    const updatedAgent = await dbGet('SELECT * FROM agents WHERE id = ?', [id]);
    const formattedAgent = {
      ...updatedAgent,
      key_features: JSON.parse(updatedAgent.key_features),
      contact_info: updatedAgent.contact_info ? JSON.parse(updatedAgent.contact_info) : undefined
    };

    res.json(formattedAgent);
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

app.delete('/api/agents/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbRun('DELETE FROM agents WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// ROLE ROUTES
app.get('/api/roles', authenticateToken, async (req, res) => {
  try {
    const roles = await dbAll('SELECT * FROM user_roles ORDER BY email');
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

app.post('/api/roles', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { email, role } = req.body;
    const assignedBy = req.user.email;
    const userId = email.replace('@', '_').replace(/\./g, '_');

    await dbRun(`
      INSERT OR REPLACE INTO user_roles (id, user_id, email, role, assigned_by, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [userId, userId, email, role, assignedBy]);

    const newRole = await dbGet('SELECT * FROM user_roles WHERE email = ?', [email]);
    res.json(newRole);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

app.put('/api/roles/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const updatedBy = req.user.email;

    await dbRun(`
      UPDATE user_roles SET role = ?, assigned_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [role, updatedBy, id]);

    const updatedRole = await dbGet('SELECT * FROM user_roles WHERE id = ?', [id]);
    res.json(updatedRole);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

app.delete('/api/roles/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbRun('DELETE FROM user_roles WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// SIDEBAR ROUTES
app.get('/api/sidebar', async (req, res) => {
  try {
    const items = await dbAll('SELECT * FROM sidebar_items ORDER BY order_index');
    res.json(items);
  } catch (error) {
    console.error('Error fetching sidebar items:', error);
    res.status(500).json({ error: 'Failed to fetch sidebar items' });
  }
});

app.post('/api/sidebar', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { title, url } = req.body;
    const createdBy = req.user.id;
    
    const maxOrder = await dbGet('SELECT MAX(order_index) as max_order FROM sidebar_items');
    const nextOrder = (maxOrder?.max_order || 0) + 1;
    
    const id = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    await dbRun(`
      INSERT INTO sidebar_items (id, title, url, order_index, is_default, created_by)
      VALUES (?, ?, ?, ?, 0, ?)
    `, [id, title, url, nextOrder, createdBy]);

    const newItem = await dbGet('SELECT * FROM sidebar_items WHERE id = ?', [id]);
    res.json(newItem);
  } catch (error) {
    console.error('Error creating sidebar item:', error);
    res.status(500).json({ error: 'Failed to create sidebar item' });
  }
});

app.put('/api/sidebar/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== 'id') {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    updateFields.push('updated_at = datetime("now")');
    values.push(id);

    await dbRun(`UPDATE sidebar_items SET ${updateFields.join(', ')} WHERE id = ?`, values);

    const updatedItem = await dbGet('SELECT * FROM sidebar_items WHERE id = ?', [id]);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating sidebar item:', error);
    res.status(500).json({ error: 'Failed to update sidebar item' });
  }
});

app.delete('/api/sidebar/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbRun('DELETE FROM sidebar_items WHERE id = ? AND is_default = 0', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Sidebar item not found or cannot delete default item' });
    }

    res.json({ message: 'Sidebar item deleted successfully' });
  } catch (error) {
    console.error('Error deleting sidebar item:', error);
    res.status(500).json({ error: 'Failed to delete sidebar item' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: 'connected',
    timestamp: new Date().toISOString(),
    version: 'offline-package'
  });
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend'), {
  maxAge: '1d',
  etag: true
}));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const indexPath = path.join(__dirname, 'frontend', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('Frontend not built');
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Server Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
const startServer = () => {
  const sslCertExists = fs.existsSync(CERT_PATH);
  const sslKeyExists = fs.existsSync(KEY_PATH);

  if (sslCertExists && sslKeyExists) {
    try {
      const httpsOptions = {
        cert: fs.readFileSync(CERT_PATH),
        key: fs.readFileSync(KEY_PATH),
        secureProtocol: 'TLSv1_2_method',
        honorCipherOrder: true
      };

      const server = https.createServer(httpsOptions, app);
      
      server.on('error', (error) => {
        console.error('🚨 HTTPS Server Error:', error);
        if (error.code === 'EACCES') {
          console.error('❌ Permission denied. Run with sudo for port 443');
        } else if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use`);
        }
        process.exit(1);
      });

      server.listen(PORT, '0.0.0.0', () => {
        console.log('✅ AI-DU Agent Portal Started Successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔒 HTTPS Server: Running on port ${PORT}`);
        console.log(`🌐 Production URL: https://aiduagent-csstip.ckit1.explab.com/`);
        console.log(`🔍 Health Check: https://aiduagent-csstip.ckit1.explab.com/api/health`);
        console.log(`💾 Database: ${DB_PATH}`);
        console.log(`📦 Offline Package - No downloads required!`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      });

    } catch (sslError) {
      console.error('❌ SSL Certificate Error:', sslError.message);
      console.error('🔧 Cannot start without SSL on port 443');
      process.exit(1);
    }
  } else {
    console.error('❌ SSL certificates required for port 443:');
    console.log(`   - Certificate: ${CERT_PATH} ${sslCertExists ? '✅' : '❌'}`);
    console.log(`   - Private Key: ${KEY_PATH} ${sslKeyExists ? '✅' : '❌'}`);
    console.error('🔧 Cannot start HTTPS server on port 443 without SSL certificates');
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  if (db) db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  if (db) db.close();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', error);
  if (db) db.close();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  if (db) db.close();
  process.exit(1);
});

console.log('📋 Starting server initialization...');
startServer();
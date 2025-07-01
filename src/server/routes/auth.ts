import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../database.js';
import { JWT_SECRET } from '../middleware/auth.js';

export const authRoutes = express.Router();

// Login endpoint
authRoutes.post('/login', async (req: Request, res: Response) => {
  console.log('🔑 Login attempt started');
  
  try {
    const { email, password } = req.body;
    console.log('📧 Login email:', email);

    if (!email || !password) {
      console.log('❌ Missing email or password');
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    console.log('🔍 Looking up user in database...');
    // Get user from database
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    console.log('👤 User lookup result:', user ? 'Found' : 'Not found');
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    console.log('🔐 Checking password...');
    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log('🔐 Password valid:', validPassword);
    
    if (!validPassword) {
      console.log('❌ Invalid password for user:', email);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    console.log('👥 Looking up user role...');
    // Get user role
    const userRole = await dbGet('SELECT role FROM user_roles WHERE email = ?', [email]);
    const role = userRole ? userRole.role : 'viewer';
    console.log('👥 User role:', role);

    console.log('🎫 Creating JWT token...');
    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('🎫 JWT token created successfully');

    const response = {
      token,
      user: {
        id: user.id,
        email: user.email,
        role,
        created_at: user.created_at
      }
    };

    console.log('✅ Login successful for:', email, 'with role:', role);
    res.json(response);
  } catch (error: any) {
    console.error('🚨 CRITICAL LOGIN ERROR:', error);
    console.error('Stack trace:', error?.stack || 'No stack trace available');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
authRoutes.post('/register', async (req: Request, res: Response) => {
  console.log('📝 Registration attempt started');
  
  try {
    const { email, password } = req.body;
    console.log('📧 Registration email:', email);

    if (!email || !password) {
      console.log('❌ Missing email or password');
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    console.log('🔍 Checking if user already exists...');
    // Check if user already exists
    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      console.log('❌ User already exists:', email);
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    // Validate password
    if (password.length < 6) {
      console.log('❌ Password too short');
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    console.log('🔐 Hashing password...');
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = email.replace('@', '_').replace(/\./g, '_');
    console.log('👤 Generated user ID:', userId);

    console.log('💾 Creating user in database...');
    // Create user
    await dbRun(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, email, passwordHash]
    );

    // Check if there's a pre-assigned role
    let role = 'viewer';
    const existingRole = await dbGet('SELECT role FROM user_roles WHERE email = ?', [email]);
    
    if (existingRole) {
      role = existingRole.role;
      console.log('👥 Found existing role assignment:', role);
    } else {
      console.log('👥 Creating default viewer role...');
      // Create default viewer role
      await dbRun(
        'INSERT INTO user_roles (id, user_id, email, role) VALUES (?, ?, ?, ?)',
        [userId, userId, email, 'viewer']
      );
    }

    console.log('🎫 Creating JWT token for new user...');
    // Create JWT token
    const token = jwt.sign(
      { id: userId, email, role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = {
      token,
      user: {
        id: userId,
        email,
        role,
        created_at: new Date().toISOString()
      }
    };

    console.log('✅ Registration successful for:', email, 'with role:', role);
    res.json(response);
  } catch (error: any) {
    console.error('🚨 CRITICAL REGISTRATION ERROR:', error);
    console.error('Stack trace:', error?.stack || 'No stack trace available');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password endpoint
authRoutes.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    
    // Validate password
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await dbRun(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [passwordHash, email]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

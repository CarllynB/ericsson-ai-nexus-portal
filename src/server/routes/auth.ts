
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../database';
import { JWT_SECRET } from '../index';

export const authRoutes = express.Router();

// Login endpoint
authRoutes.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Get user from database
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Get user role
    const userRole = await dbGet('SELECT role FROM user_roles WHERE email = ?', [email]);
    const role = userRole ? userRole.role : 'viewer';

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
authRoutes.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    // Validate password
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = email.replace('@', '_').replace(/\./g, '_');

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
    } else {
      // Create default viewer role
      await dbRun(
        'INSERT INTO user_roles (id, user_id, email, role) VALUES (?, ?, ?, ?)',
        [userId, userId, email, 'viewer']
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { id: userId, email, role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: userId,
        email,
        role,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
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

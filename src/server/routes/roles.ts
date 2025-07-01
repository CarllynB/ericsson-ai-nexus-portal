import express, { Request, Response } from 'express';
import { dbAll, dbRun, dbGet } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types.js';

export const roleRoutes = express.Router();

// Get all user roles (super_admin only)
roleRoutes.get('/', authenticateToken, requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRoles = await dbAll('SELECT * FROM user_roles ORDER BY assigned_at DESC');
    res.json(userRoles);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({ error: 'Failed to fetch user roles' });
  }
});

// Assign role to user (super_admin only)
roleRoutes.post('/assign', authenticateToken, requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userEmail, role } = req.body;
    const assignedBy = req.user?.email;
    
    const userId = userEmail.replace('@', '_').replace(/\./g, '_');
    const now = new Date().toISOString();
    
    // Check if user role already exists
    const existingRole = await dbGet('SELECT * FROM user_roles WHERE email = ?', [userEmail]);
    
    if (existingRole) {
      // Update existing role
      await dbRun(
        'UPDATE user_roles SET role = ?, updated_at = ?, assigned_by = ? WHERE email = ?',
        [role, now, assignedBy, userEmail]
      );
    } else {
      // Create new role
      await dbRun(
        'INSERT INTO user_roles (id, user_id, email, role, assigned_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, userId, userEmail, role, assignedBy, now]
      );
    }

    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
});

// Update user role (super_admin only)
roleRoutes.put('/:userId', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Get user by ID to find email
    const userRole = await dbGet('SELECT * FROM user_roles WHERE id = ?', [userId]);
    if (!userRole) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await dbRun(
      'UPDATE user_roles SET role = ?, updated_at = ? WHERE id = ?',
      [role, new Date().toISOString(), userId]
    );

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Get user's own role
roleRoutes.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = await dbGet('SELECT role FROM user_roles WHERE email = ?', [req.user?.email]);
    res.json({ role: userRole ? userRole.role : 'viewer' });
  } catch (error) {
    console.error('Error fetching user role:', error);
    res.status(500).json({ error: 'Failed to fetch user role' });
  }
});

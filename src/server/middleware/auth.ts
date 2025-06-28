
import jwt from 'jsonwebtoken';
import express from 'express';
import { AuthenticatedRequest } from '../types';

// JWT Secret (in production, this should be from environment variables)
export const JWT_SECRET = process.env.JWT_SECRET || 'aiduagent-jwt-secret-key-2024-production';

// Middleware to verify JWT token
export const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as any;
    req.user = user;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    res.sendStatus(403);
    return;
  }
};

// Role-based middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

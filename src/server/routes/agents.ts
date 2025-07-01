import express, { Request, Response } from 'express';
import { dbAll, dbRun, dbGet } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Agent } from '../../services/api.js';

export const agentRoutes = express.Router();

// Get all agents (public endpoint) - ONLY from SQLite database
agentRoutes.get('/', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Server: Fetching agents from SQLite database ONLY (no hardcoded data)...');
    const agents = await dbAll('SELECT * FROM agents ORDER BY last_updated DESC');
    
    console.log(`📊 Server: SQLite returned ${agents.length} agents from database`);
    if (agents.length === 0) {
      console.log('✅ Server: Database is empty - this is expected (no hardcoded agents)');
    }

    const formattedAgents = agents.map(agent => ({
      ...agent,
      key_features: JSON.parse(agent.key_features),
      contact_info: agent.contact_info ? JSON.parse(agent.contact_info) : undefined
    }));

    console.log('🚫 Server: NO hardcoded agents, NO fallback data - only SQLite results');
    res.json(formattedAgents);
  } catch (error) {
    console.error('❌ Server: Error fetching agents from SQLite:', error);
    console.log('🚫 Server: Returning empty array - NO hardcoded fallback data');
    res.status(500).json([]);
  }
});

// Create agent (admin/super_admin only)
agentRoutes.post('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const agent = req.body;
    const newAgent: Agent = {
      ...agent,
      id: agent.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    console.log('➕ Server: Creating agent in SQLite database permanently...');
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

    console.log('✅ Server: Agent created and saved permanently to SQLite');
    res.json(newAgent);
  } catch (error) {
    console.error('❌ Server: Error creating agent in SQLite:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent (admin/super_admin only)
agentRoutes.put('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if agent exists
    const existingAgent = await dbGet('SELECT * FROM agents WHERE id = ?', [id]);
    if (!existingAgent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    // Build update query dynamically
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

    // Return updated agent
    const updatedAgent = await dbGet('SELECT * FROM agents WHERE id = ?', [id]);
    const formattedAgent = {
      ...updatedAgent,
      key_features: JSON.parse(updatedAgent.key_features),
      contact_info: updatedAgent.contact_info ? JSON.parse(updatedAgent.contact_info) : undefined
    };

    console.log('✅ Server: Agent updated permanently in SQLite');
    res.json(formattedAgent);
  } catch (error) {
    console.error('❌ Server: Error updating agent in SQLite:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Delete agent (admin/super_admin only)
agentRoutes.delete('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await dbRun('DELETE FROM agents WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    console.log('🗑️ Server: Agent deleted permanently from SQLite');
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('❌ Server: Error deleting agent from SQLite:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

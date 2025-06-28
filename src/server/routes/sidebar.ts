
import express from 'express';
import { dbAll, dbGet, dbRun } from '../database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// GET /api/sidebar - Get all sidebar items (public)
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    console.log('📋 Fetching all sidebar items');
    const items = await dbAll(
      'SELECT * FROM sidebar_items ORDER BY "order" ASC'
    );
    
    console.log('✅ Retrieved sidebar items:', items.length);
    res.json(items);
  } catch (error) {
    console.error('❌ Error fetching sidebar items:', error);
    res.status(500).json({ error: 'Failed to fetch sidebar items' });
  }
});

// POST /api/sidebar - Create new sidebar item (admin/super_admin only)
router.post('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { title, url } = req.body;
    
    if (!title || !url) {
      res.status(400).json({ error: 'Title and URL are required' });
      return;
    }

    console.log('➕ Creating new sidebar item:', { title, url });
    
    // Get the highest order number and add 1
    const maxOrderResult = await dbGet('SELECT MAX("order") as max_order FROM sidebar_items');
    const nextOrder = (maxOrderResult?.max_order || 0) + 1;
    
    const result = await dbRun(
      'INSERT INTO sidebar_items (title, url, "order", created_by) VALUES (?, ?, ?, ?) RETURNING *',
      [title, url, nextOrder, req.user?.id]
    );
    
    // Fetch the created item
    const newItem = await dbGet('SELECT * FROM sidebar_items WHERE id = ?', [result.id]);
    
    console.log('✅ Created sidebar item:', newItem);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('❌ Error creating sidebar item:', error);
    res.status(500).json({ error: 'Failed to create sidebar item' });
  }
});

// PUT /api/sidebar/:id - Update sidebar item (admin/super_admin only)
router.put('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const { title, url } = req.body;
    
    if (!title || !url) {
      res.status(400).json({ error: 'Title and URL are required' });
      return;
    }

    console.log('✏️ Updating sidebar item:', id, { title, url });
    
    await dbRun(
      'UPDATE sidebar_items SET title = ?, url = ? WHERE id = ?',
      [title, url, id]
    );
    
    // Fetch the updated item
    const updatedItem = await dbGet('SELECT * FROM sidebar_items WHERE id = ?', [id]);
    
    if (!updatedItem) {
      res.status(404).json({ error: 'Sidebar item not found' });
      return;
    }
    
    console.log('✅ Updated sidebar item:', updatedItem);
    res.json(updatedItem);
  } catch (error) {
    console.error('❌ Error updating sidebar item:', error);
    res.status(500).json({ error: 'Failed to update sidebar item' });
  }
});

// DELETE /api/sidebar/:id - Delete sidebar item (admin/super_admin only, not default items)
router.delete('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deleting sidebar item:', id);
    
    // Check if item exists and is not default
    const item = await dbGet('SELECT * FROM sidebar_items WHERE id = ?', [id]);
    
    if (!item) {
      res.status(404).json({ error: 'Sidebar item not found' });
      return;
    }
    
    if (item.is_default) {
      res.status(400).json({ error: 'Cannot delete default sidebar items' });
      return;
    }
    
    await dbRun('DELETE FROM sidebar_items WHERE id = ?', [id]);
    
    console.log('✅ Deleted sidebar item:', id);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting sidebar item:', error);
    res.status(500).json({ error: 'Failed to delete sidebar item' });
  }
});

// PUT /api/sidebar/reorder - Reorder sidebar items (admin/super_admin only)
router.put('/reorder', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'Items array is required' });
      return;
    }

    console.log('🔄 Reordering sidebar items:', items.length);
    
    // Update order for each item
    for (let i = 0; i < items.length; i++) {
      await dbRun(
        'UPDATE sidebar_items SET "order" = ? WHERE id = ?',
        [i + 1, items[i].id]
      );
    }
    
    // Fetch all items in new order
    const reorderedItems = await dbAll('SELECT * FROM sidebar_items ORDER BY "order" ASC');
    
    console.log('✅ Reordered sidebar items');
    res.json(reorderedItems);
  } catch (error) {
    console.error('❌ Error reordering sidebar items:', error);
    res.status(500).json({ error: 'Failed to reorder sidebar items' });
  }
});

export { router as sidebarRoutes };

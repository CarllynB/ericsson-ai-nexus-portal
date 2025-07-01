import { Router } from 'express';
import { dbAll, dbRun, dbGet } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Get all sidebar items
router.get('/', async (req, res) => {
  try {
    console.log('📋 Getting all sidebar items...');
    const items = await dbAll('SELECT * FROM sidebar_items ORDER BY order_index ASC');
    
    const formattedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      order: item.order_index,
      is_default: Boolean(item.is_default),
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    console.log(`✅ Retrieved ${formattedItems.length} sidebar items`);
    res.json(formattedItems);
  } catch (error) {
    console.error('❌ Error getting sidebar items:', error);
    res.status(500).json({ error: 'Failed to get sidebar items' });
  }
});

// Create new sidebar item (admin/super_admin only)
router.post('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { title, url } = req.body;
    
    if (!title || !url) {
      res.status(400).json({ error: 'Title and URL are required' });
      return;
    }

    console.log('➕ Creating new sidebar item:', title);

    // Get the highest order to append the new item
    const maxOrderResult = await dbGet('SELECT MAX(order_index) as max_order FROM sidebar_items');
    const nextOrder = (maxOrderResult?.max_order || 0) + 1;

    const id = `custom-${Date.now()}`;
    
    await dbRun(
      'INSERT INTO sidebar_items (id, title, url, order_index, is_default) VALUES (?, ?, ?, ?, ?)',
      [id, title, url, nextOrder, 0]
    );

    const newItem = await dbGet('SELECT * FROM sidebar_items WHERE id = ?', [id]);
    
    const formattedItem = {
      id: newItem.id,
      title: newItem.title,
      url: newItem.url,
      order: newItem.order_index,
      is_default: Boolean(newItem.is_default),
      created_at: newItem.created_at,
      updated_at: newItem.updated_at
    };

    console.log('✅ Sidebar item created successfully');
    res.status(201).json(formattedItem);
  } catch (error) {
    console.error('❌ Error creating sidebar item:', error);
    res.status(500).json({ error: 'Failed to create sidebar item' });
  }
});

// Update sidebar item (admin/super_admin only)
router.put('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, order } = req.body;

    console.log('📝 Updating sidebar item:', id);

    const updateFields = [];
    const values = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      values.push(title);
    }
    if (url !== undefined) {
      updateFields.push('url = ?');
      values.push(url);
    }
    if (order !== undefined) {
      updateFields.push('order_index = ?');
      values.push(order);
    }

    updateFields.push('updated_at = datetime("now")');
    values.push(id);

    await dbRun(
      `UPDATE sidebar_items SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    const updatedItem = await dbGet('SELECT * FROM sidebar_items WHERE id = ?', [id]);
    
    if (!updatedItem) {
      res.status(404).json({ error: 'Sidebar item not found' });
      return;
    }

    const formattedItem = {
      id: updatedItem.id,
      title: updatedItem.title,
      url: updatedItem.url,
      order: updatedItem.order_index,
      is_default: Boolean(updatedItem.is_default),
      created_at: updatedItem.created_at,
      updated_at: updatedItem.updated_at
    };

    console.log('✅ Sidebar item updated successfully');
    res.json(formattedItem);
  } catch (error) {
    console.error('❌ Error updating sidebar item:', error);
    res.status(500).json({ error: 'Failed to update sidebar item' });
  }
});

// Delete sidebar item (admin/super_admin only)
router.delete('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting sidebar item:', id);

    // Check if item is default
    const item = await dbGet('SELECT is_default FROM sidebar_items WHERE id = ?', [id]);
    
    if (!item) {
      res.status(404).json({ error: 'Sidebar item not found' });
      return;
    }

    if (item.is_default) {
      res.status(400).json({ error: 'Cannot delete default sidebar items' });
      return;
    }

    await dbRun('DELETE FROM sidebar_items WHERE id = ?', [id]);

    console.log('✅ Sidebar item deleted successfully');
    res.json({ message: 'Sidebar item deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting sidebar item:', error);
    res.status(500).json({ error: 'Failed to delete sidebar item' });
  }
});

// Reorder sidebar items (admin/super_admin only)
router.post('/reorder', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'Items must be an array' });
      return;
    }

    console.log('🔄 Reordering sidebar items...');

    // Update order for each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await dbRun(
        'UPDATE sidebar_items SET order_index = ?, updated_at = datetime("now") WHERE id = ?',
        [i + 1, item.id]
      );
    }

    console.log('✅ Sidebar items reordered successfully');
    res.json({ message: 'Sidebar items reordered successfully' });
  } catch (error) {
    console.error('❌ Error reordering sidebar items:', error);
    res.status(500).json({ error: 'Failed to reorder sidebar items' });
  }
});

export { router as sidebarRoutes };

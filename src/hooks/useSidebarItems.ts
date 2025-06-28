
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface SidebarItem {
  id: string;
  title: string;
  url: string;
  order: number;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useSidebarItems = () => {
  const [items, setItems] = useState<SidebarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load items from backend API on mount
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sidebar');
      if (!response.ok) {
        throw new Error('Failed to fetch sidebar items');
      }
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching sidebar items:', error);
      toast({
        title: "Error",
        description: "Failed to load sidebar items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (title: string, url: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/sidebar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, url })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add sidebar item');
      }

      await fetchItems(); // Refresh the list

      toast({
        title: "Success",
        description: `Added "${title}" to sidebar`
      });

      return true;
    } catch (error) {
      console.error('Error adding sidebar item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add sidebar item",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, updates: Partial<SidebarItem>) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sidebar/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update sidebar item');
      }

      await fetchItems(); // Refresh the list

      toast({
        title: "Success",
        description: "Sidebar item updated"
      });

      return true;
    } catch (error) {
      console.error('Error updating sidebar item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update sidebar item",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sidebar/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete sidebar item');
      }

      await fetchItems(); // Refresh the list

      toast({
        title: "Success",
        description: "Sidebar item deleted"
      });

      return true;
    } catch (error) {
      console.error('Error deleting sidebar item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete sidebar item",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reorderItems = async (reorderedItems: SidebarItem[]) => {
    setLoading(true);
    try {
      const response = await fetch('/api/sidebar/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ items: reorderedItems })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reorder sidebar items');
      }

      await fetchItems(); // Refresh the list

      toast({
        title: "Success",
        description: "Sidebar items reordered"
      });

      return true;
    } catch (error) {
      console.error('Error reordering sidebar items:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reorder sidebar items",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    items: items.sort((a, b) => a.order - b.order),
    loading,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    refreshItems: fetchItems
  };
};

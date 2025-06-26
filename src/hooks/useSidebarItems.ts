
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface SidebarItem {
  id: string;
  title: string;
  url: string;
  order: number;
  created_at?: string;
}

const DEFAULT_ITEMS: SidebarItem[] = [
  { id: 'home', title: 'Home', url: '/', order: 1 },
  { id: 'agents', title: 'Agents', url: '/agents', order: 2 },
  { id: 'dashboard', title: 'Dashboard', url: '/dashboard', order: 3 },
  { id: 'pitchbox', title: 'Pitch Box', url: 'https://apps.powerapps.com/play/e/default-92e84ceb-fbfd-47ab-be52-080c6b87953f/a/549a8af5-f6ba-4b8b-824c-dfdfcf6f3740?tenantId=92e84ceb-fbfd-47ab-be52-080c6b87953f&hint=ec5023c9-376e-41fb-9280-10bd9f925919&source=sharebutton&sourcetime=1750260233474', order: 4 }
];

export const useSidebarItems = () => {
  const [items, setItems] = useState<SidebarItem[]>(DEFAULT_ITEMS);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load items from localStorage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem('sidebar-items');
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems);
        setItems(parsed);
      } catch (error) {
        console.error('Error parsing saved sidebar items:', error);
        setItems(DEFAULT_ITEMS);
      }
    }
  }, []);

  // Save items to localStorage whenever items change
  const saveItems = (newItems: SidebarItem[]) => {
    localStorage.setItem('sidebar-items', JSON.stringify(newItems));
    setItems(newItems);
  };

  const addItem = async (title: string, url: string) => {
    setLoading(true);
    try {
      const newItem: SidebarItem = {
        id: `custom-${Date.now()}`,
        title,
        url,
        order: Math.max(...items.map(i => i.order)) + 1,
        created_at: new Date().toISOString()
      };

      const newItems = [...items, newItem].sort((a, b) => a.order - b.order);
      saveItems(newItems);

      toast({
        title: "Success",
        description: `Added "${title}" to sidebar`
      });

      return true;
    } catch (error) {
      console.error('Error adding sidebar item:', error);
      toast({
        title: "Error",
        description: "Failed to add sidebar item",
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
      const newItems = items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ).sort((a, b) => a.order - b.order);
      
      saveItems(newItems);

      toast({
        title: "Success",
        description: "Sidebar item updated"
      });

      return true;
    } catch (error) {
      console.error('Error updating sidebar item:', error);
      toast({
        title: "Error",
        description: "Failed to update sidebar item",
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
      // Don't allow deleting default items
      if (['home', 'agents', 'dashboard', 'pitchbox'].includes(id)) {
        toast({
          title: "Error",
          description: "Cannot delete default sidebar items",
          variant: "destructive"
        });
        return false;
      }

      const newItems = items.filter(item => item.id !== id);
      saveItems(newItems);

      toast({
        title: "Success",
        description: "Sidebar item deleted"
      });

      return true;
    } catch (error) {
      console.error('Error deleting sidebar item:', error);
      toast({
        title: "Error",
        description: "Failed to delete sidebar item",
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
      const itemsWithNewOrder = reorderedItems.map((item, index) => ({
        ...item,
        order: index + 1
      }));

      saveItems(itemsWithNewOrder);

      toast({
        title: "Success",
        description: "Sidebar items reordered"
      });

      return true;
    } catch (error) {
      console.error('Error reordering sidebar items:', error);
      toast({
        title: "Error",
        description: "Failed to reorder sidebar items",
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
    reorderItems
  };
};

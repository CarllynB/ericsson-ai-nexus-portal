import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { sidebarApiService, SidebarItem } from '@/services/sidebarApi';
import { useRoles } from '@/hooks/useRoles';

// Keep the original interface for backward compatibility
export interface SidebarItem {
  id: string;
  title: string;
  url: string;
  order: number;
  created_at?: string;
}

export const useSidebarItems = () => {
  const [items, setItems] = useState<SidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin, isSuperAdmin } = useRoles();

  const canManageSidebar = isAdmin || isSuperAdmin;

  // Load items from database on mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        console.log('📋 Loading sidebar items from database');
        
        const sidebarItems = await sidebarApiService.getSidebarItems();
        
        // Transform database items to match the expected interface
        const transformedItems = sidebarItems.map(item => ({
          id: item.id,
          title: item.title,
          url: item.url,
          order: item.order,
          created_at: item.created_at
        }));
        
        setItems(transformedItems);
        console.log('✅ Loaded sidebar items:', transformedItems.length);
        
        // Migration: Check if there are localStorage items to migrate (only for admins)
        if (canManageSidebar) {
          const savedItems = localStorage.getItem('sidebar-items');
          if (savedItems) {
            try {
              const localItems = JSON.parse(savedItems);
              console.log('🔄 Found localStorage items to potentially migrate:', localItems.length);
              
              // Check if we have custom items in localStorage that aren't in database
              const customLocalItems = localItems.filter((localItem: any) => 
                !['home', 'agents', 'dashboard', 'pitchbox'].includes(localItem.id) &&
                !transformedItems.find(dbItem => dbItem.title === localItem.title && dbItem.url === localItem.url)
              );
              
              if (customLocalItems.length > 0) {
                console.log('📦 Migrating custom items from localStorage:', customLocalItems.length);
                toast({
                  title: "Migrating Sidebar Items",
                  description: `Found ${customLocalItems.length} custom items to migrate to database`
                });
                
                // Migrate custom items
                for (const localItem of customLocalItems) {
                  try {
                    await sidebarApiService.createSidebarItem(localItem.title, localItem.url);
                  } catch (error) {
                    console.warn('⚠️ Failed to migrate item:', localItem.title, error);
                  }
                }
                
                // Reload items after migration
                const updatedItems = await sidebarApiService.getSidebarItems();
                const transformedUpdatedItems = updatedItems.map(item => ({
                  id: item.id,
                  title: item.title,
                  url: item.url,
                  order: item.order,
                  created_at: item.created_at
                }));
                setItems(transformedUpdatedItems);
              }
              
              // Clear localStorage after migration
              localStorage.removeItem('sidebar-items');
              console.log('🧹 Cleared localStorage sidebar items after migration');
            } catch (error) {
              console.error('❌ Error during migration:', error);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading sidebar items:', error);
        toast({
          title: "Error",
          description: "Failed to load sidebar items",
          variant: "destructive"
        });
        
        // Fallback to default items if database fails
        const defaultItems = [
          { id: 'home', title: 'Home', url: '/', order: 1 },
          { id: 'agents', title: 'Agents', url: '/agents', order: 2 },
          { id: 'dashboard', title: 'Dashboard', url: '/dashboard', order: 3 },
          { id: 'pitchbox', title: 'Pitch Box', url: 'https://apps.powerapps.com/play/e/default-92e84ceb-fbfd-47ab-be52-080c6b87953f/a/549a8af5-f6ba-4b8b-824c-dfdfcf6f3740?tenantId=92e84ceb-fbfd-47ab-be52-080c6b87953f&hint=ec5023c9-376e-41fb-9280-10bd9f925919&source=sharebutton&sourcetime=1750260233474', order: 4 }
        ];
        setItems(defaultItems);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [canManageSidebar, toast]);

  const addItem = async (title: string, url: string) => {
    if (!canManageSidebar) {
      toast({
        title: "Permission Denied",
        description: "Only admins can manage sidebar items",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      const newItem = await sidebarApiService.createSidebarItem(title, url);
      
      // Transform and add to local state
      const transformedItem = {
        id: newItem.id,
        title: newItem.title,
        url: newItem.url,
        order: newItem.order,
        created_at: newItem.created_at
      };
      
      setItems(prev => [...prev, transformedItem].sort((a, b) => a.order - b.order));

      toast({
        title: "Success",
        description: `Added "${title}" to sidebar`
      });

      return true;
    } catch (error) {
      console.error('❌ Error adding sidebar item:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add sidebar item",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, updates: Partial<SidebarItem>) => {
    if (!canManageSidebar) {
      toast({
        title: "Permission Denied",
        description: "Only admins can manage sidebar items",
        variant: "destructive"
      });
      return false;
    }

    if (!updates.title || !updates.url) {
      toast({
        title: "Error",
        description: "Title and URL are required",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      const updatedItem = await sidebarApiService.updateSidebarItem(id, updates.title, updates.url);
      
      // Transform and update local state
      const transformedItem = {
        id: updatedItem.id,
        title: updatedItem.title,
        url: updatedItem.url,
        order: updatedItem.order,
        created_at: updatedItem.created_at
      };
      
      setItems(prev => prev.map(item => 
        item.id === id ? transformedItem : item
      ).sort((a, b) => a.order - b.order));

      toast({
        title: "Success",
        description: "Sidebar item updated"
      });

      return true;
    } catch (error) {
      console.error('❌ Error updating sidebar item:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update sidebar item",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!canManageSidebar) {
      toast({
        title: "Permission Denied",
        description: "Only admins can manage sidebar items",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      await sidebarApiService.deleteSidebarItem(id);
      
      setItems(prev => prev.filter(item => item.id !== id));

      toast({
        title: "Success",
        description: "Sidebar item deleted"
      });

      return true;
    } catch (error) {
      console.error('❌ Error deleting sidebar item:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete sidebar item",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reorderItems = async (reorderedItems: SidebarItem[]) => {
    if (!canManageSidebar) {
      toast({
        title: "Permission Denied",
        description: "Only admins can manage sidebar items",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      // Transform items to match database interface
      const dbItems = reorderedItems.map((item, index) => ({
        ...item,
        order: index + 1
      }));
      
      const updatedItems = await sidebarApiService.reorderSidebarItems(dbItems as any);
      
      // Transform back to local interface
      const transformedItems = updatedItems.map(item => ({
        id: item.id,
        title: item.title,
        url: item.url,
        order: item.order,
        created_at: item.created_at
      }));
      
      setItems(transformedItems);

      toast({
        title: "Success",
        description: "Sidebar items reordered"
      });

      return true;
    } catch (error) {
      console.error('❌ Error reordering sidebar items:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reorder sidebar items",
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
    canManageSidebar
  };
};

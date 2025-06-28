
import { backendApiService } from './backendApi';

export interface SidebarItem {
  id: string;
  title: string;
  url: string;
  order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

class SidebarApiService {
  async getSidebarItems(): Promise<SidebarItem[]> {
    try {
      console.log('🔍 Fetching sidebar items from database');
      const response = await fetch('/api/sidebar');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const items = await response.json();
      console.log('✅ Fetched sidebar items:', items.length);
      return items;
    } catch (error) {
      console.error('❌ Failed to fetch sidebar items:', error);
      throw new Error('Failed to load sidebar items from database');
    }
  }

  async createSidebarItem(title: string, url: string): Promise<SidebarItem> {
    try {
      console.log('➕ Creating sidebar item:', { title, url });
      const response = await fetch('/api/sidebar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ title, url })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const item = await response.json();
      console.log('✅ Created sidebar item:', item);
      return item;
    } catch (error) {
      console.error('❌ Failed to create sidebar item:', error);
      throw error;
    }
  }

  async updateSidebarItem(id: string, title: string, url: string): Promise<SidebarItem> {
    try {
      console.log('✏️ Updating sidebar item:', id, { title, url });
      const response = await fetch(`/api/sidebar/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ title, url })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const item = await response.json();
      console.log('✅ Updated sidebar item:', item);
      return item;
    } catch (error) {
      console.error('❌ Failed to update sidebar item:', error);
      throw error;
    }
  }

  async deleteSidebarItem(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting sidebar item:', id);
      const response = await fetch(`/api/sidebar/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('✅ Deleted sidebar item:', id);
    } catch (error) {
      console.error('❌ Failed to delete sidebar item:', error);
      throw error;
    }
  }

  async reorderSidebarItems(items: SidebarItem[]): Promise<SidebarItem[]> {
    try {
      console.log('🔄 Reordering sidebar items:', items.length);
      const response = await fetch('/api/sidebar/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ items })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reorderedItems = await response.json();
      console.log('✅ Reordered sidebar items');
      return reorderedItems;
    } catch (error) {
      console.error('❌ Failed to reorder sidebar items:', error);
      throw error;
    }
  }
}

export const sidebarApiService = new SidebarApiService();


import { Agent, getAgents as getSupabaseAgents, createAgent as createSupabaseAgent, updateAgent as updateSupabaseAgent, deleteAgent as deleteSupabaseAgent } from './api';
import { sqliteService } from './sqlite';

class OfflineApiService {
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    // Listen for network changes
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Initialize SQLite
    this.initializeSQLite();
  }

  private async initializeSQLite() {
    try {
      await sqliteService.initialize();
      console.log('SQLite service initialized');
    } catch (error) {
      console.error('Failed to initialize SQLite service:', error);
    }
  }

  private handleOnline() {
    this.isOnline = true;
    console.log('Connection restored - syncing data...');
    this.syncToSupabase();
  }

  private handleOffline() {
    this.isOnline = false;
    console.log('Connection lost - switching to offline mode');
  }

  async getAgents(): Promise<Agent[]> {
    if (this.isOnline) {
      try {
        console.log('Fetching agents from Supabase (online)');
        const agents = await getSupabaseAgents();
        
        // Sync to SQLite in background
        try {
          await sqliteService.syncFromSupabase(agents);
        } catch (error) {
          console.warn('Failed to sync to SQLite:', error);
        }
        
        return agents;
      } catch (error) {
        console.warn('Supabase fetch failed, falling back to SQLite:', error);
        this.isOnline = false; // Treat as offline if Supabase fails
        return await sqliteService.getAgents();
      }
    } else {
      console.log('Fetching agents from SQLite (offline)');
      return await sqliteService.getAgents();
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    if (this.isOnline) {
      try {
        console.log('Creating agent in Supabase (online)');
        const newAgent = await createSupabaseAgent(agent);
        
        // Sync to SQLite in background
        try {
          await sqliteService.createAgent(agent);
        } catch (error) {
          console.warn('Failed to sync new agent to SQLite:', error);
        }
        
        return newAgent;
      } catch (error) {
        console.warn('Supabase create failed, creating in SQLite:', error);
        this.isOnline = false;
        return await sqliteService.createAgent(agent);
      }
    } else {
      console.log('Creating agent in SQLite (offline)');
      return await sqliteService.createAgent(agent);
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    if (this.isOnline) {
      try {
        console.log('Updating agent in Supabase (online)');
        const updatedAgent = await updateSupabaseAgent(id, updates);
        
        // Sync to SQLite in background
        try {
          await sqliteService.updateAgent(id, updates);
        } catch (error) {
          console.warn('Failed to sync agent update to SQLite:', error);
        }
        
        return updatedAgent;
      } catch (error) {
        console.warn('Supabase update failed, updating in SQLite:', error);
        this.isOnline = false;
        return await sqliteService.updateAgent(id, updates);
      }
    } else {
      console.log('Updating agent in SQLite (offline)');
      return await sqliteService.updateAgent(id, updates);
    }
  }

  async deleteAgent(id: string): Promise<void> {
    if (this.isOnline) {
      try {
        console.log('Deleting agent from Supabase (online)');
        await deleteSupabaseAgent(id);
        
        // Sync to SQLite in background
        try {
          await sqliteService.deleteAgent(id);
        } catch (error) {
          console.warn('Failed to sync agent deletion to SQLite:', error);
        }
      } catch (error) {
        console.warn('Supabase delete failed, deleting from SQLite:', error);
        this.isOnline = false;
        await sqliteService.deleteAgent(id);
      }
    } else {
      console.log('Deleting agent from SQLite (offline)');
      await sqliteService.deleteAgent(id);
    }
  }

  private async syncToSupabase() {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    console.log('Starting sync to Supabase...');

    try {
      // Get local SQLite data
      const localAgents = await sqliteService.getAgents();
      
      // Get remote Supabase data
      const remoteAgents = await getSupabaseAgents();
      
      // Simple sync strategy: remote wins for now
      // In a production app, you'd implement conflict resolution
      await sqliteService.syncFromSupabase(remoteAgents);
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async logAction(agentId: string, action: string, details?: any) {
    console.log('Action logged:', { agentId, action, details, offline: !this.isOnline });
  }

  get isOffline() {
    return !this.isOnline;
  }
}

export const offlineApiService = new OfflineApiService();

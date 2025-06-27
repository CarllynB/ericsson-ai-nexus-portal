
import { Agent } from './api';
import { sqliteService } from './sqlite';

class OfflineApiService {
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Don't initialize in constructor to avoid blocking
  }

  private async initializeSQLite() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize() {
    try {
      console.log('Initializing offline API service...');
      await sqliteService.initialize();
      console.log('SQLite service initialized successfully');
      this.initialized = true;
      
      // No longer seed database with hardcoded data
      console.log('Database initialized - ready for user-created agents');
    } catch (error) {
      console.error('Failed to initialize SQLite service:', error);
      this.initialized = false;
      this.initPromise = null;
      throw error;
    }
  }

  async getAgents(): Promise<Agent[]> {
    try {
      await this.initializeSQLite();
      console.log('Fetching agents from local database');
      return await sqliteService.getAgents();
    } catch (error) {
      console.error('Error getting agents:', error);
      throw new Error('Failed to load agents from local database');
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    try {
      await this.initializeSQLite();
      console.log('Creating agent in local database');
      return await sqliteService.createAgent(agent);
    } catch (error) {
      console.error('Error creating agent:', error);
      throw new Error('Failed to create agent in local database');
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    try {
      await this.initializeSQLite();
      console.log('Updating agent in local database');
      return await sqliteService.updateAgent(id, updates);
    } catch (error) {
      console.error('Error updating agent:', error);
      throw new Error('Failed to update agent in local database');
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      await this.initializeSQLite();
      console.log('Deleting agent from local database');
      await sqliteService.deleteAgent(id);
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw new Error('Failed to delete agent from local database');
    }
  }

  async logAction(agentId: string, action: string, details?: any) {
    console.log('Action logged:', { agentId, action, details });
  }

  get isOffline() {
    return true; // Always offline in this mode
  }
}

export const offlineApiService = new OfflineApiService();

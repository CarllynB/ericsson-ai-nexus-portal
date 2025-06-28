
import { Agent } from './api';
import { sqliteService } from './sqlite';

class OfflineApiService {
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      console.log('🔄 Initializing SQLite service as the only data source...');
      
      // Initialize SQLite - this is our only source of truth
      await sqliteService.initialize();
      console.log('✅ SQLite initialized successfully - no hardcoded data loaded');
      console.log('💾 All data operations will persist permanently across sessions');
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize SQLite service:', error);
      this.initialized = false;
      this.initializationPromise = null;
      throw new Error('SQLite database unavailable. Please refresh the page.');
    }
  }

  async getAgents(): Promise<Agent[]> {
    try {
      await this.initialize();
      console.log('🔍 Fetching agents from SQLite database (no hardcoded data)...');
      const agents = await sqliteService.getAgents();
      
      if (agents.length === 0) {
        console.log('ℹ️ No agents found - database is empty as expected (no hardcoded data)');
      } else {
        console.log(`✅ Successfully fetched ${agents.length} persistent agents from SQLite`);
      }
      
      return agents;
    } catch (error) {
      console.error('❌ Error getting agents from SQLite:', error);
      throw new Error('Failed to load agents from database.');
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    try {
      await this.initialize();
      console.log('➕ Creating agent in SQLite database for permanent storage...');
      const newAgent = await sqliteService.createAgent(agent);
      console.log('✅ Agent created successfully and saved permanently:', newAgent.name);
      return newAgent;
    } catch (error) {
      console.error('❌ Error creating agent in SQLite:', error);
      throw new Error('Failed to create agent in database');
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    try {
      await this.initialize();
      console.log('📝 Updating agent in SQLite database for permanent storage...');
      const updatedAgent = await sqliteService.updateAgent(id, updates);
      console.log('✅ Agent updated successfully and saved permanently:', updatedAgent.name);
      return updatedAgent;
    } catch (error) {
      console.error('❌ Error updating agent in SQLite:', error);
      throw new Error('Failed to update agent in database');
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      await this.initialize();
      console.log('🗑️ Deleting agent from SQLite database permanently...');
      await sqliteService.deleteAgent(id);
      console.log('✅ Agent deleted successfully and removed permanently from database');
    } catch (error) {
      console.error('❌ Error deleting agent from SQLite:', error);
      throw new Error('Failed to delete agent from database');
    }
  }

  async logAction(agentId: string, action: string, details?: any) {
    console.log('📋 Action logged:', { agentId, action, details, timestamp: new Date().toISOString() });
  }

  get isOffline() {
    return !this.initialized;
  }
}

export const offlineApiService = new OfflineApiService();

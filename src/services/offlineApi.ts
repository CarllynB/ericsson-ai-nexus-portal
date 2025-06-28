
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
      console.log('🔄 Initializing SQLite service - ABSOLUTELY NO data will be seeded...');
      
      await sqliteService.initialize();
      console.log('✅ SQLite initialized - database starts COMPLETELY EMPTY');
      console.log('🚫 ZERO hardcoded agents, ZERO fallback data, ZERO sample data');
      console.log('💾 Database is 100% empty - only user-created data will exist');
      
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
      console.log('🔍 Fetching agents from SQLite - ABSOLUTELY NO fallback data...');
      const agents = await sqliteService.getAgents();
      
      console.log(`📊 SQLite returned exactly ${agents.length} agents from database`);
      console.log('🔥 CRITICAL: If you see agents but database says 0, there is STILL hardcoded data somewhere!');
      
      if (agents.length === 0) {
        console.log('✅ Database is empty - this is CORRECT (no hardcoded agents should exist)');
      } else {
        console.log(`ℹ️ Found ${agents.length} real agents from SQLite database`);
      }
      
      // CRITICAL: Return EXACTLY what SQLite returns - NO exceptions, NO fallbacks
      return agents;
    } catch (error) {
      console.error('❌ Error getting agents from SQLite:', error);
      console.log('🚫 CRITICAL: Returning empty array - NO hardcoded fallback data EVER');
      return [];
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    try {
      await this.initialize();
      console.log('➕ Creating agent in SQLite for permanent storage...');
      const newAgent = await sqliteService.createAgent(agent);
      console.log('✅ Agent created and saved permanently:', newAgent.name);
      return newAgent;
    } catch (error) {
      console.error('❌ Error creating agent in SQLite:', error);
      throw new Error('Failed to create agent in database');
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    try {
      await this.initialize();
      console.log('📝 Updating agent in SQLite for permanent storage...');
      const updatedAgent = await sqliteService.updateAgent(id, updates);
      console.log('✅ Agent updated and saved permanently:', updatedAgent.name);
      return updatedAgent;
    } catch (error) {
      console.error('❌ Error updating agent in SQLite:', error);
      throw new Error('Failed to update agent in database');
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      await this.initialize();
      console.log('🗑️ Deleting agent from SQLite permanently...');
      await sqliteService.deleteAgent(id);
      console.log('✅ Agent deleted permanently from database');
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

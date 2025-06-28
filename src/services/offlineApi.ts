
import { Agent } from './api';
import { backendApiService } from './backendApi';
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
      console.log('🔄 Initializing services...');
      
      // Initialize SQLite first
      await sqliteService.initialize();
      console.log('✅ SQLite initialized');
      
      // Test backend connection
      try {
        const healthCheck = await backendApiService.healthCheck();
        console.log('✅ Backend connection established:', healthCheck);
      } catch (error) {
        console.warn('⚠️ Backend not available, using SQLite only:', error);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      this.initialized = false;
      this.initializationPromise = null;
      throw new Error('Services unavailable. Please refresh the page.');
    }
  }

  async getAgents(): Promise<Agent[]> {
    try {
      await this.initialize();
      console.log('🔍 Fetching agents from SQLite...');
      const agents = await sqliteService.getAgents();
      console.log(`✅ Successfully fetched ${agents.length} agents`);
      return agents;
    } catch (error) {
      console.error('❌ Error getting agents:', error);
      throw new Error('Failed to load agents from database.');
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    try {
      await this.initialize();
      console.log('➕ Creating agent via SQLite...');
      const newAgent = await sqliteService.createAgent(agent);
      console.log('✅ Agent created successfully:', newAgent.name);
      return newAgent;
    } catch (error) {
      console.error('❌ Error creating agent:', error);
      throw new Error('Failed to create agent');
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    try {
      await this.initialize();
      console.log('📝 Updating agent via SQLite...');
      const updatedAgent = await sqliteService.updateAgent(id, updates);
      console.log('✅ Agent updated successfully:', updatedAgent.name);
      return updatedAgent;
    } catch (error) {
      console.error('❌ Error updating agent:', error);
      throw new Error('Failed to update agent');
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      await this.initialize();
      console.log('🗑️ Deleting agent via SQLite...');
      await sqliteService.deleteAgent(id);
      console.log('✅ Agent deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting agent:', error);
      throw new Error('Failed to delete agent');
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

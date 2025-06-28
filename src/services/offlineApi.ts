
import { Agent } from './api';
import { backendApiService } from './backendApi';

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
      console.log('🔄 Initializing backend connection...');
      
      // Test backend connection
      const healthCheck = await backendApiService.healthCheck();
      console.log('✅ Backend connection established:', healthCheck);
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to connect to backend:', error);
      this.initialized = false;
      this.initializationPromise = null;
      throw new Error('Backend service unavailable. Please ensure the server is running.');
    }
  }

  async getAgents(): Promise<Agent[]> {
    try {
      await this.initialize();
      console.log('🔍 Fetching agents from backend API...');
      const agents = await backendApiService.getAgents();
      console.log(`✅ Successfully fetched ${agents.length} agents`);
      return agents;
    } catch (error) {
      console.error('❌ Error getting agents:', error);
      throw new Error('Failed to load agents from backend. Please check if the server is running.');
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    try {
      await this.initialize();
      console.log('➕ Creating agent via backend API...');
      const newAgent = await backendApiService.createAgent(agent);
      console.log('✅ Agent created successfully:', newAgent.name);
      return newAgent;
    } catch (error) {
      console.error('❌ Error creating agent:', error);
      throw new Error('Failed to create agent via backend');
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    try {
      await this.initialize();
      console.log('📝 Updating agent via backend API...');
      const updatedAgent = await backendApiService.updateAgent(id, updates);
      console.log('✅ Agent updated successfully:', updatedAgent.name);
      return updatedAgent;
    } catch (error) {
      console.error('❌ Error updating agent:', error);
      throw new Error('Failed to update agent via backend');
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      await this.initialize();
      console.log('🗑️ Deleting agent via backend API...');
      await backendApiService.deleteAgent(id);
      console.log('✅ Agent deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting agent:', error);
      throw new Error('Failed to delete agent via backend');
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

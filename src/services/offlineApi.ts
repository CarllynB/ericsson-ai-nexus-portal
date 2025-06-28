
import { Agent } from './api';
import { backendApiService } from './backendApi';

class OfflineApiService {
  private initialized = false;

  constructor() {
    this.initialized = true;
  }

  async getAgents(): Promise<Agent[]> {
    try {
      console.log('Fetching agents from backend API');
      return await backendApiService.getAgents();
    } catch (error) {
      console.error('Error getting agents:', error);
      throw new Error('Failed to load agents from backend');
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    try {
      console.log('Creating agent via backend API');
      return await backendApiService.createAgent(agent);
    } catch (error) {
      console.error('Error creating agent:', error);
      throw new Error('Failed to create agent via backend');
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    try {
      console.log('Updating agent via backend API');
      return await backendApiService.updateAgent(id, updates);
    } catch (error) {
      console.error('Error updating agent:', error);
      throw new Error('Failed to update agent via backend');
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      console.log('Deleting agent via backend API');
      await backendApiService.deleteAgent(id);
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw new Error('Failed to delete agent via backend');
    }
  }

  async logAction(agentId: string, action: string, details?: any) {
    console.log('Action logged:', { agentId, action, details });
  }

  get isOffline() {
    return false; // Now we're using backend API
  }
}

export const offlineApiService = new OfflineApiService();

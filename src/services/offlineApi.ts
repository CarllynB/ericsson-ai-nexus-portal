
import { Agent } from './api';
import { fileStorageService } from './fileStorage';

class OfflineApiService {
  private initialized = false;

  constructor() {
    // File storage is always ready, no async initialization needed
    this.initialized = true;
  }

  async getAgents(): Promise<Agent[]> {
    try {
      console.log('Fetching agents from persistent file storage');
      return await fileStorageService.getAgents();
    } catch (error) {
      console.error('Error getting agents:', error);
      throw new Error('Failed to load agents from persistent storage');
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    try {
      console.log('Creating agent in persistent file storage');
      return await fileStorageService.createAgent(agent);
    } catch (error) {
      console.error('Error creating agent:', error);
      throw new Error('Failed to create agent in persistent storage');
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    try {
      console.log('Updating agent in persistent file storage');
      return await fileStorageService.updateAgent(id, updates);
    } catch (error) {
      console.error('Error updating agent:', error);
      throw new Error('Failed to update agent in persistent storage');
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      console.log('Deleting agent from persistent file storage');
      await fileStorageService.deleteAgent(id);
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw new Error('Failed to delete agent from persistent storage');
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


import { Agent } from './api';
import { sqliteService } from './sqlite';

class OfflineApiService {
  private initialized = false;

  constructor() {
    this.initializeSQLite();
  }

  private async initializeSQLite() {
    if (this.initialized) return;
    
    try {
      await sqliteService.initialize();
      console.log('SQLite service initialized for offline-only mode');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize SQLite service:', error);
    }
  }

  async getAgents(): Promise<Agent[]> {
    if (!this.initialized) {
      await this.initializeSQLite();
    }
    
    console.log('Fetching agents from SQLite (offline-only mode)');
    return await sqliteService.getAgents();
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    if (!this.initialized) {
      await this.initializeSQLite();
    }
    
    console.log('Creating agent in SQLite (offline-only mode)');
    return await sqliteService.createAgent(agent);
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    if (!this.initialized) {
      await this.initializeSQLite();
    }
    
    console.log('Updating agent in SQLite (offline-only mode)');
    return await sqliteService.updateAgent(id, updates);
  }

  async deleteAgent(id: string): Promise<void> {
    if (!this.initialized) {
      await this.initializeSQLite();
    }
    
    console.log('Deleting agent from SQLite (offline-only mode)');
    await sqliteService.deleteAgent(id);
  }

  async logAction(agentId: string, action: string, details?: any) {
    console.log('Action logged (offline-only mode):', { agentId, action, details });
  }

  async seedDatabase() {
    if (!this.initialized) {
      await this.initializeSQLite();
    }

    // Check if we already have data
    const existingAgents = await sqliteService.getAgents();
    if (existingAgents.length > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }

    // Seed with sample data
    const sampleAgents: Omit<Agent, 'id' | 'created_at' | 'last_updated'>[] = [
      {
        name: 'Sample AI Agent',
        description: 'A sample AI agent for demonstration purposes',
        category: 'General',
        status: 'active',
        key_features: ['Feature 1', 'Feature 2', 'Feature 3'],
        access_link: 'https://example.com',
        owner: 'System',
        contact_info: {
          name: 'System Administrator',
          email: 'admin@example.com'
        }
      }
    ];

    for (const agent of sampleAgents) {
      await sqliteService.createAgent(agent);
    }

    console.log('Database seeded with sample data');
  }

  get isOffline() {
    return true; // Always offline in this mode
  }
}

export const offlineApiService = new OfflineApiService();

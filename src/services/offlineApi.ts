
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
      console.log('Initializing offline API service...');
      await sqliteService.initialize();
      console.log('SQLite service initialized successfully');
      this.initialized = true;
      
      // Seed database if empty
      await this.seedDatabase();
    } catch (error) {
      console.error('Failed to initialize SQLite service:', error);
      throw error;
    }
  }

  async getAgents(): Promise<Agent[]> {
    if (!this.initialized) {
      await this.initializeSQLite();
    }
    
    console.log('Fetching agents from local database');
    return await sqliteService.getAgents();
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    if (!this.initialized) {
      await this.initializeSQLite();
    }
    
    console.log('Creating agent in local database');
    return await sqliteService.createAgent(agent);
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    if (!this.initialized) {
      await this.initializeSQLite();
    }
    
    console.log('Updating agent in local database');
    return await sqliteService.updateAgent(id, updates);
  }

  async deleteAgent(id: string): Promise<void> {
    if (!this.initialized) {
      await this.initializeSQLite();
    }
    
    console.log('Deleting agent from local database');
    await sqliteService.deleteAgent(id);
  }

  async logAction(agentId: string, action: string, details?: any) {
    console.log('Action logged:', { agentId, action, details });
  }

  async seedDatabase() {
    if (!this.initialized) {
      await this.initializeSQLite();
    }

    try {
      // Check if we already have data
      const existingAgents = await sqliteService.getAgents();
      if (existingAgents.length > 0) {
        console.log('Database already has data, skipping seed');
        return;
      }

      console.log('Seeding database with sample data...');

      // Seed with sample data
      const sampleAgents: Omit<Agent, 'id' | 'created_at' | 'last_updated'>[] = [
        {
          name: 'AI Code Assistant',
          description: 'An intelligent code generation and review assistant that helps developers write better code faster.',
          category: 'Development',
          status: 'active',
          key_features: ['Code Generation', 'Code Review', 'Bug Detection', 'Performance Optimization'],
          access_link: 'https://ai-code-assistant.example.com',
          owner: 'Development Team',
          contact_info: {
            name: 'Dev Team Lead',
            email: 'dev-team@company.com'
          }
        },
        {
          name: 'Customer Support Bot',
          description: 'Advanced AI chatbot for handling customer inquiries and support tickets automatically.',
          category: 'Customer Service',
          status: 'active',
          key_features: ['24/7 Support', 'Multi-language', 'Ticket Routing', 'Knowledge Base Integration'],
          access_link: 'https://support-bot.example.com',
          owner: 'Customer Success'
        },
        {
          name: 'Data Analytics Agent',
          description: 'Automated data analysis and reporting agent that generates insights from your business data.',
          category: 'Analytics',
          status: 'active',
          key_features: ['Real-time Analytics', 'Custom Reports', 'Predictive Modeling', 'Data Visualization'],
          owner: 'Data Science Team'
        },
        {
          name: 'Marketing Assistant',
          description: 'AI-powered marketing content creation and campaign optimization tool.',
          category: 'Marketing',
          status: 'coming_soon',
          key_features: ['Content Generation', 'Campaign Optimization', 'A/B Testing', 'Social Media Management'],
          owner: 'Marketing Team'
        }
      ];

      for (const agent of sampleAgents) {
        await sqliteService.createAgent(agent);
      }

      console.log(`Database seeded with ${sampleAgents.length} sample agents`);
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }

  get isOffline() {
    return true; // Always offline in this mode
  }
}

export const offlineApiService = new OfflineApiService();

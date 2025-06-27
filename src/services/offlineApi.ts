
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
      
      // Seed database if empty
      await this.seedDatabase();
    } catch (error) {
      console.error('Failed to initialize SQLite service:', error);
      this.initialized = false;
      this.initPromise = null;
      throw error;
    }
  }

  async getAgents(): Promise<Agent[]> {
    await this.initializeSQLite();
    console.log('Fetching agents from local database');
    return await sqliteService.getAgents();
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    await this.initializeSQLite();
    console.log('Creating agent in local database');
    return await sqliteService.createAgent(agent);
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    await this.initializeSQLite();
    console.log('Updating agent in local database');
    return await sqliteService.updateAgent(id, updates);
  }

  async deleteAgent(id: string): Promise<void> {
    await this.initializeSQLite();
    console.log('Deleting agent from local database');
    await sqliteService.deleteAgent(id);
  }

  async logAction(agentId: string, action: string, details?: any) {
    console.log('Action logged:', { agentId, action, details });
  }

  async seedDatabase() {
    try {
      // Check if we already have data
      const existingAgents = await sqliteService.getAgents();
      if (existingAgents.length > 0) {
        console.log('Database already has data, skipping seed');
        return;
      }

      console.log('Seeding database with sample data...');

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
          owner: 'Customer Success',
          contact_info: {
            name: 'Support Manager',
            email: 'support@company.com'
          }
        },
        {
          name: 'Data Analytics Agent',
          description: 'Automated data analysis and reporting agent that generates insights from your business data.',
          category: 'Analytics',
          status: 'active',
          key_features: ['Real-time Analytics', 'Custom Reports', 'Predictive Modeling', 'Data Visualization'],
          owner: 'Data Science Team',
          contact_info: {
            name: 'Data Science Lead',
            email: 'data-science@company.com'
          }
        },
        {
          name: 'Marketing Assistant',
          description: 'AI-powered marketing content creation and campaign optimization tool.',
          category: 'Marketing',
          status: 'coming_soon',
          key_features: ['Content Generation', 'Campaign Optimization', 'A/B Testing', 'Social Media Management'],
          owner: 'Marketing Team',
          contact_info: {
            name: 'Marketing Director',
            email: 'marketing@company.com'
          }
        },
        {
          name: 'HR Recruitment Bot',
          description: 'Intelligent recruitment assistant for screening candidates and scheduling interviews.',
          category: 'Human Resources',
          status: 'active',
          key_features: ['Resume Screening', 'Interview Scheduling', 'Candidate Matching', 'Reference Checking'],
          access_link: 'https://hr-bot.example.com',
          owner: 'HR Department',
          contact_info: {
            name: 'HR Manager',
            email: 'hr@company.com'
          }
        },
        {
          name: 'Financial Advisor AI',
          description: 'AI-powered financial planning and investment advice system.',
          category: 'Finance',
          status: 'inactive',
          key_features: ['Portfolio Analysis', 'Risk Assessment', 'Investment Recommendations', 'Budget Planning'],
          owner: 'Finance Team',
          contact_info: {
            name: 'Finance Director',
            email: 'finance@company.com'
          }
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

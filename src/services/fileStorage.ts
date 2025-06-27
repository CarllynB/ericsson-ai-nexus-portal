
import { Agent } from './api';

export interface UserRole {
  id: string;
  user_id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'viewer';
  assigned_at: string;
  assigned_by?: string;
  updated_at: string;
}

export interface DatabaseData {
  agents: Agent[];
  userRoles: UserRole[];
  lastUpdated: string;
}

class FileStorageService {
  private readonly STORAGE_KEY = 'persistent_database';
  private data: DatabaseData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseData {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('📁 Loaded persistent data from storage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('❌ Error loading persistent data:', error);
    }

    // Return empty database structure
    return {
      agents: [],
      userRoles: [],
      lastUpdated: new Date().toISOString()
    };
  }

  private saveData(): void {
    try {
      this.data.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
      console.log('💾 Persistent data saved successfully');
      
      // Also save to sessionStorage as backup
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('❌ Error saving persistent data:', error);
    }
  }

  // Agent methods
  async getAgents(): Promise<Agent[]> {
    console.log('🔍 Getting agents from persistent storage');
    return [...this.data.agents];
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    const newAgent: Agent = {
      ...agent,
      id: agent.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    console.log('➕ Creating new agent in persistent storage:', newAgent.name);
    this.data.agents.push(newAgent);
    this.saveData();
    return newAgent;
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    console.log('📝 Updating agent in persistent storage:', id);
    
    const agentIndex = this.data.agents.findIndex(agent => agent.id === id);
    if (agentIndex === -1) {
      throw new Error('Agent not found');
    }

    const updatedAgent = {
      ...this.data.agents[agentIndex],
      ...updates,
      last_updated: new Date().toISOString()
    };

    this.data.agents[agentIndex] = updatedAgent;
    this.saveData();
    return updatedAgent;
  }

  async deleteAgent(id: string): Promise<void> {
    console.log('🗑️ Deleting agent from persistent storage:', id);
    
    const initialLength = this.data.agents.length;
    this.data.agents = this.data.agents.filter(agent => agent.id !== id);
    
    if (this.data.agents.length === initialLength) {
      throw new Error('Agent not found');
    }
    
    this.saveData();
  }

  // User role methods
  async createUserRole(email: string, role: 'super_admin' | 'admin' | 'viewer', assignedBy?: string): Promise<void> {
    console.log(`🔄 Creating/updating user role: ${email} -> ${role}`);
    
    const userId = email.replace('@', '_').replace(/\./g, '_');
    const now = new Date().toISOString();
    
    // Check if user already exists
    const existingUserIndex = this.data.userRoles.findIndex(u => u.email === email);
    
    if (existingUserIndex >= 0) {
      // Update existing user
      this.data.userRoles[existingUserIndex] = {
        ...this.data.userRoles[existingUserIndex],
        role,
        updated_at: now,
        assigned_by: assignedBy
      };
      console.log('✅ User role updated successfully');
    } else {
      // Create new user
      const newUserRole: UserRole = {
        id: userId,
        user_id: userId,
        email,
        role,
        assigned_at: now,
        assigned_by: assignedBy,
        updated_at: now
      };
      this.data.userRoles.push(newUserRole);
      console.log('✅ User role created successfully');
    }
    
    this.saveData();
  }

  async updateUserRole(email: string, newRole: 'super_admin' | 'admin' | 'viewer'): Promise<void> {
    console.log(`🔄 Updating user role: ${email} -> ${newRole}`);
    
    const userIndex = this.data.userRoles.findIndex(u => u.email === email);
    if (userIndex === -1) {
      throw new Error(`No user found with email: ${email}`);
    }
    
    this.data.userRoles[userIndex] = {
      ...this.data.userRoles[userIndex],
      role: newRole,
      updated_at: new Date().toISOString()
    };
    
    this.saveData();
    console.log('✅ User role updated successfully');
  }

  async getUserRole(email: string): Promise<string | null> {
    const user = this.data.userRoles.find(u => u.email === email);
    if (user) {
      console.log(`✅ Found role for ${email}:`, user.role);
      return user.role;
    }
    
    console.log(`ℹ️ No role found for ${email}`);
    return null;
  }

  async getAllUserRoles(): Promise<Array<{id: string, email: string, role: string, assigned_at: string}>> {
    console.log(`✅ Retrieved ${this.data.userRoles.length} user roles from persistent storage`);
    return this.data.userRoles.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      assigned_at: user.assigned_at
    }));
  }

  // Utility methods
  exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonData: string): void {
    try {
      const importedData = JSON.parse(jsonData);
      this.data = {
        agents: importedData.agents || [],
        userRoles: importedData.userRoles || [],
        lastUpdated: new Date().toISOString()
      };
      this.saveData();
      console.log('✅ Data imported successfully');
    } catch (error) {
      console.error('❌ Error importing data:', error);
      throw new Error('Invalid data format');
    }
  }

  clearAllData(): void {
    this.data = {
      agents: [],
      userRoles: [],
      lastUpdated: new Date().toISOString()
    };
    this.saveData();
    console.log('🧹 All data cleared');
  }
}

export const fileStorageService = new FileStorageService();

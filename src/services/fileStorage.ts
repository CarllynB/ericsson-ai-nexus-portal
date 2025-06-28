
// This file is fully deprecated - SQLite is now the only source of truth
// NO hardcoded data, NO localStorage usage, NO fallback data

import { Agent } from './api';
import { sqliteService } from './sqlite';

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

// All methods proxy directly to SQLite - NO hardcoded data, NO fallbacks
class FileStorageService {
  async getAgents(): Promise<Agent[]> {
    console.log('🔍 FileStorage.getAgents() - proxying to SQLite (no hardcoded data)');
    return sqliteService.getAgents();
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    console.log('➕ FileStorage.createAgent() - proxying to SQLite');
    return sqliteService.createAgent(agent);
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    console.log('📝 FileStorage.updateAgent() - proxying to SQLite');
    return sqliteService.updateAgent(id, updates);
  }

  async deleteAgent(id: string): Promise<void> {
    console.log('🗑️ FileStorage.deleteAgent() - proxying to SQLite');
    return sqliteService.deleteAgent(id);
  }

  async createUserRole(email: string, role: 'super_admin' | 'admin' | 'viewer', assignedBy?: string): Promise<void> {
    return sqliteService.createUserRole(email, role, assignedBy);
  }

  async updateUserRole(email: string, newRole: 'super_admin' | 'admin' | 'viewer'): Promise<void> {
    return sqliteService.updateUserRole(email, newRole);
  }

  async getUserRole(email: string): Promise<string | null> {
    return sqliteService.getUserRole(email);
  }

  async getAllUserRoles(): Promise<Array<{id: string, email: string, role: string, assigned_at: string}>> {
    return sqliteService.getAllUserRoles();
  }

  // Deprecated methods - no functionality
  exportData(): string {
    console.warn('🚫 Export functionality deprecated - no hardcoded data exists');
    return JSON.stringify({ message: "No hardcoded data to export - all data in SQLite" });
  }

  importData(jsonData: string): void {
    console.warn('🚫 Import functionality deprecated - use SQLite directly');
  }

  clearAllData(): void {
    console.warn('🚫 Clear functionality deprecated - use SQLite directly');
  }
}

export const fileStorageService = new FileStorageService();

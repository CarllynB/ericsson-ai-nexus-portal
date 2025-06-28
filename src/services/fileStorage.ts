// This file is deprecated - all functionality has been moved to SQLite
// Keeping minimal interface for backwards compatibility during transition

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

// All methods now proxy to SQLite service
class FileStorageService {
  async getAgents(): Promise<Agent[]> {
    return sqliteService.getAgents();
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    return sqliteService.createAgent(agent);
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    return sqliteService.updateAgent(id, updates);
  }

  async deleteAgent(id: string): Promise<void> {
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

  exportData(): string {
    return JSON.stringify({ message: "Data export now handled by SQLite service" });
  }

  importData(jsonData: string): void {
    console.log("Import functionality moved to SQLite service");
  }

  clearAllData(): void {
    console.log("Clear data functionality moved to SQLite service");
  }
}

export const fileStorageService = new FileStorageService();

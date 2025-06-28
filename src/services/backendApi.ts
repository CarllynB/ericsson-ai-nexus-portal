
import { Agent } from './api';

export interface UserWithRole {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'viewer';
  assigned_at: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: 'super_admin' | 'admin' | 'viewer';
    created_at: string;
  };
}

class BackendApiService {
  private baseUrl = '/api';
  private token: string | null = null;

  constructor() {
    // Get token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          console.log('Raw response text:', text);
          
          // Try to parse as JSON
          if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
            errorData = JSON.parse(text);
          } else {
            errorData = { error: text || `HTTP ${response.status}: ${response.statusText}` };
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const text = await response.text();
      console.log('Raw response text:', text);
      
      // Handle empty responses
      if (!text.trim()) {
        return {};
      }
      
      // Try to parse as JSON
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      this.token = response.token;
      localStorage.setItem('auth_token', this.token!);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      this.token = response.token;
      localStorage.setItem('auth_token', this.token!);
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async changePassword(email: string, newPassword: string): Promise<void> {
    await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }

  // Agent methods
  async getAgents(): Promise<Agent[]> {
    try {
      return await this.request('/agents');
    } catch (error) {
      console.error('Failed to get agents:', error);
      throw new Error('Failed to load agents from backend');
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    return this.request(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAgent(id: string): Promise<void> {
    await this.request(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  // Role methods
  async getAllUserRoles(): Promise<UserWithRole[]> {
    return this.request('/roles');
  }

  async assignRole(userEmail: string, role: 'super_admin' | 'admin' | 'viewer'): Promise<void> {
    await this.request('/roles/assign', {
      method: 'POST',
      body: JSON.stringify({ userEmail, role }),
    });
  }

  async updateUserRole(userId: string, role: 'super_admin' | 'admin' | 'viewer'): Promise<void> {
    await this.request(`/roles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getUserRole(): Promise<{ role: string }> {
    return this.request('/roles/me');
  }

  get isAuthenticated() {
    return !!this.token;
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; database: string; timestamp: string }> {
    return this.request('/health');
  }
}

export const backendApiService = new BackendApiService();

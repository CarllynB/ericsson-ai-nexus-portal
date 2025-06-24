
import { Agent, User } from '@/types/database';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-supabase-project.supabase.co/rest/v1'
  : '/api';

// Default super admin users
const SUPER_ADMINS = ['muhammad.mahmood@ericsson.com', 'carllyn.barfi@ericsson.com'];

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Agent endpoints
  async getAgents(page = 1, pageSize = 12, showAll = false): Promise<{ items: Agent[]; total: number }> {
    const params = new URLSearchParams();
    if (!showAll) {
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());
    }
    params.append('order', 'created_at.desc');

    return this.request(`/agents?${params}`);
  }

  async getActiveAgents(): Promise<Agent[]> {
    return this.request('/agents?status=eq.active');
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    return this.request(`/agents?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...updates, last_updated: new Date().toISOString() }),
    });
  }

  async deleteAgent(id: string): Promise<void> {
    await this.request(`/agents?id=eq.${id}`, {
      method: 'DELETE',
    });
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store token in localStorage
    localStorage.setItem('token', response.access_token);
    
    // Determine user role
    const role = SUPER_ADMINS.includes(email) ? 'super_admin' : 'admin';
    
    return {
      user: {
        id: response.user.id,
        email: response.user.email,
        role,
        created_at: response.user.created_at,
      },
      token: response.access_token,
    };
  }

  async getUserRole(): Promise<{ role: string }> {
    return this.request('/user/role');
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    await this.request('/auth/logout', { method: 'POST' });
  }

  // Logging endpoint
  async logAction(agentId: string, action: string, details?: Record<string, any>): Promise<void> {
    await this.request('/logs', {
      method: 'POST',
      body: JSON.stringify({
        agent_id: agentId,
        action,
        details,
        timestamp: new Date().toISOString(),
      }),
    });
  }
}

export const apiService = new ApiService();


import { Agent, User } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

// Default super admin users
const SUPER_ADMINS = ['muhammad.mahmood@ericsson.com', 'carllyn.barfi@ericsson.com'];

class ApiService {
  // Agent endpoints
  async getAgents(page = 1, pageSize = 12, showAll = false): Promise<{ items: Agent[]; total: number }> {
    try {
      // Use any to bypass TypeScript checking since agents table is not in generated types yet
      let query = (supabase as any)
        .from('agents')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (!showAll) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        items: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  }

  async getActiveAgents(): Promise<Agent[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('agents')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active agents:', error);
      throw error;
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    try {
      const { data, error } = await (supabase as any)
        .from('agents')
        .insert({
          ...agent,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    try {
      const { data, error } = await (supabase as any)
        .from('agents')
        .update({
          ...updates,
          last_updated: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  }

  // Auth endpoints (these will use the existing Supabase auth)
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (!data.user) throw new Error('No user returned from login');

      // Determine user role
      const role = SUPER_ADMINS.includes(email) ? 'super_admin' : 'admin';
      
      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          role,
          created_at: data.user.created_at || new Date().toISOString(),
        },
        token: data.session?.access_token || '',
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getUserRole(): Promise<{ role: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No authenticated user');

      const role = SUPER_ADMINS.includes(user.email || '') ? 'super_admin' : 'admin';
      return { role };
    } catch (error) {
      console.error('Error getting user role:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Logging endpoint (this would need a logs table in Supabase)
  async logAction(agentId: string, action: string, details?: Record<string, any>): Promise<void> {
    try {
      // For now, just log to console since we don't have a logs table
      console.log('Action logged:', {
        agent_id: agentId,
        action,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }
}

export const apiService = new ApiService();

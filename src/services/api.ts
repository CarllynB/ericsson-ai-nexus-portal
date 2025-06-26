
import { supabase } from '@/integrations/supabase/client';

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'coming_soon';
  key_features: string[];
  access_link?: string;
  contact_info?: {
    name: string;
    email: string;
  };
  owner: string;
  last_updated: string;
  created_at: string;
}

export const getAgents = async (): Promise<Agent[]> => {
  try {
    const { data, error } = await (supabase as any)
      .from('agents')
      .select('*')
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }

    return (data || []).map((agent: any) => ({
      ...agent,
      status: agent.status as 'active' | 'inactive' | 'coming_soon',
      access_link: agent.access_link || undefined,
      // Parse contact_info from JSON string if it exists, otherwise undefined
      contact_info: agent.contact_info ? (typeof agent.contact_info === 'string' ? JSON.parse(agent.contact_info) : agent.contact_info) : undefined
    }));
  } catch (error) {
    console.error('Error in getAgents:', error);
    throw error;
  }
};

export const createAgent = async (agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> => {
  try {
    const agentData = {
      name: agent.name,
      description: agent.description,
      category: agent.category,
      status: agent.status,
      key_features: agent.key_features,
      access_link: agent.access_link || null,
      // Store contact_info as JSON string if it exists
      contact_info: agent.contact_info ? JSON.stringify(agent.contact_info) : null,
      owner: agent.owner,
      id: agent.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      last_updated: new Date().toISOString()
    };

    const { data, error } = await (supabase as any)
      .from('agents')
      .insert(agentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      throw error;
    }

    return {
      ...data,
      status: data.status as 'active' | 'inactive' | 'coming_soon',
      access_link: data.access_link || undefined,
      contact_info: data.contact_info ? (typeof data.contact_info === 'string' ? JSON.parse(data.contact_info) : data.contact_info) : undefined
    };
  } catch (error) {
    console.error('Error in createAgent:', error);
    throw error;
  }
};

export const updateAgent = async (id: string, agent: Partial<Agent>): Promise<Agent> => {
  try {
    const updateData: any = {
      ...agent,
      last_updated: new Date().toISOString()
    };

    // Handle contact_info serialization
    if (agent.contact_info !== undefined) {
      updateData.contact_info = agent.contact_info ? JSON.stringify(agent.contact_info) : null;
    }

    const { data, error } = await (supabase as any)
      .from('agents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating agent:', error);
      throw error;
    }

    return {
      ...data,
      status: data.status as 'active' | 'inactive' | 'coming_soon',
      access_link: data.access_link || undefined,
      contact_info: data.contact_info ? (typeof data.contact_info === 'string' ? JSON.parse(data.contact_info) : data.contact_info) : undefined
    };
  } catch (error) {
    console.error('Error in updateAgent:', error);
    throw error;
  }
};

export const deleteAgent = async (id: string): Promise<void> => {
  try {
    const { error } = await (supabase as any)
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteAgent:', error);
    throw error;
  }
};

// Export as apiService for backward compatibility
export const apiService = {
  getAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  logAction: async (agentId: string, action: string, details?: any) => {
    console.log('Action logged:', { agentId, action, details });
  }
};

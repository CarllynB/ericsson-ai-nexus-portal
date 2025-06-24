
import { supabase } from '@/integrations/supabase/client';

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'coming_soon';
  key_features: string[];
  access_link?: string;
  owner: string;
  last_updated: string;
  created_at: string;
}

export const getAgents = async (): Promise<Agent[]> => {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }

    return (data || []).map(agent => ({
      ...agent,
      status: agent.status as 'active' | 'inactive' | 'coming_soon',
      access_link: agent.access_link || undefined
    }));
  } catch (error) {
    console.error('Error in getAgents:', error);
    throw error;
  }
};

export const createAgent = async (agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> => {
  try {
    const { data, error } = await supabase
      .from('agents')
      .insert({
        ...agent,
        id: agent.name.toLowerCase().replace(/\s+/g, '-'),
        last_updated: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      throw error;
    }

    return {
      ...data,
      status: data.status as 'active' | 'inactive' | 'coming_soon',
      access_link: data.access_link || undefined
    };
  } catch (error) {
    console.error('Error in createAgent:', error);
    throw error;
  }
};

export const updateAgent = async (id: string, agent: Partial<Agent>): Promise<Agent> => {
  try {
    const { data, error } = await supabase
      .from('agents')
      .update({
        ...agent,
        last_updated: new Date().toISOString()
      })
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
      access_link: data.access_link || undefined
    };
  } catch (error) {
    console.error('Error in updateAgent:', error);
    throw error;
  }
};

export const deleteAgent = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
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

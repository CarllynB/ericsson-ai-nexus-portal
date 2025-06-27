
import { offlineApiService } from './offlineApi';

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

// Export the getAgents function to maintain compatibility
export const getAgents = () => offlineApiService.getAgents();
export const createAgent = (agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>) => offlineApiService.createAgent(agent);
export const updateAgent = (id: string, updates: Partial<Agent>) => offlineApiService.updateAgent(id, updates);
export const deleteAgent = (id: string) => offlineApiService.deleteAgent(id);

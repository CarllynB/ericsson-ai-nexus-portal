
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

// Export functions that proxy to offlineApiService (which uses SQLite only)
// NO hardcoded data, NO fallbacks, NO mock data
export const getAgents = () => {
  console.log('📡 api.getAgents() - proxying to SQLite (no hardcoded data)');
  return offlineApiService.getAgents();
};

export const createAgent = (agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>) => {
  console.log('➕ api.createAgent() - proxying to SQLite');
  return offlineApiService.createAgent(agent);
};

export const updateAgent = (id: string, updates: Partial<Agent>) => {
  console.log('📝 api.updateAgent() - proxying to SQLite');
  return offlineApiService.updateAgent(id, updates);
};

export const deleteAgent = (id: string) => {
  console.log('🗑️ api.deleteAgent() - proxying to SQLite');
  return offlineApiService.deleteAgent(id);
};

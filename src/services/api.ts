
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

// Export functions that proxy to offlineApiService (which uses SQLite ONLY)
// ABSOLUTELY NO hardcoded data, NO fallbacks, NO mock data, NO sample data
export const getAgents = () => {
  console.log('📡 api.getAgents() - proxying to SQLite (ZERO hardcoded data)');
  console.log('🔥 CRITICAL: If agents appear but SQLite is empty, hardcoded data still exists!');
  return offlineApiService.getAgents();
};

export const createAgent = (agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>) => {
  console.log('➕ api.createAgent() - proxying to SQLite for permanent storage');
  return offlineApiService.createAgent(agent);
};

export const updateAgent = (id: string, updates: Partial<Agent>) => {
  console.log('📝 api.updateAgent() - proxying to SQLite for permanent storage');
  return offlineApiService.updateAgent(id, updates);
};

export const deleteAgent = (id: string) => {
  console.log('🗑️ api.deleteAgent() - proxying to SQLite for permanent deletion');
  return offlineApiService.deleteAgent(id);
};

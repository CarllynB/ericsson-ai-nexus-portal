
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

// This file now only contains the Agent interface for type consistency
// All actual API operations are handled by the offline API service

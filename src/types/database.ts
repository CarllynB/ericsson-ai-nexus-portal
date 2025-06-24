
export interface Agent {
  id: string;
  name: string;
  description: string;
  key_features: string[];
  status: 'active' | 'inactive' | 'coming_soon';
  access_link: string | null;
  owner: string;
  category: string;
  last_updated: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'viewer';
  created_at: string;
}

export interface AgentLog {
  id: string;
  agent_id: string;
  user_id: string;
  action: 'created' | 'updated' | 'deleted' | 'accessed';
  timestamp: string;
  details?: Record<string, any>;
}

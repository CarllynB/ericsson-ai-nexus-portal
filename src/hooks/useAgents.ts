
import { useState, useEffect } from 'react';
import { Agent } from '@/services/api';
import { backendApiService } from '@/services/backendApi';

export const useAgents = (page = 1, pageSize = 12, showAll = false) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const sortAgents = (agentList: Agent[]) => {
    return agentList.sort((a, b) => {
      // Active agents first
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      // Then sort by name
      return a.name.localeCompare(b.name);
    });
  };

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 useAgents: Fetching agents from SQLite backend API...');
      
      const response = await backendApiService.getAgents();
      console.log('📊 useAgents: Raw response from SQLite backend:', response);
      console.log(`📊 useAgents: Response type: ${typeof response}, Array: ${Array.isArray(response)}, Length: ${response?.length || 'undefined'}`);
      
      if (Array.isArray(response)) {
        const sortedAgents = sortAgents(response);
        setAgents(sortedAgents);
        console.log(`✅ useAgents: Set ${sortedAgents.length} agents from SQLite database`);
        setError(null);
      } else {
        console.error('❌ useAgents: Invalid response format from SQLite backend:', response);
        setAgents([]);
        setError('Invalid data format received from backend');
      }
    } catch (err) {
      console.error('❌ useAgents: Failed to fetch agents from SQLite backend:', err);
      setAgents([]);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load agents: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useAgents: Effect triggered - fetching from SQLite backend API');
    fetchAgents();
  }, [page, pageSize, showAll]);

  const updateAgentStatus = async (id: string, status: Agent['status']) => {
    try {
      await backendApiService.updateAgent(id, { status });
      setAgents(prev => 
        sortAgents(prev.map(agent => 
          agent.id === id ? { ...agent, status, last_updated: new Date().toISOString() } : agent
        ))
      );
    } catch (err) {
      console.error('❌ useAgents: Failed to update agent status:', err);
      setError('Failed to update agent status');
    }
  };

  const deleteAgentById = async (id: string) => {
    try {
      await backendApiService.deleteAgent(id);
      setAgents(prev => prev.filter(agent => agent.id !== id));
    } catch (err) {
      console.error('❌ useAgents: Failed to delete agent:', err);
      setError('Failed to delete agent');
    }
  };

  return {
    agents,
    loading,
    error,
    totalPages,
    updateAgentStatus,
    deleteAgent: deleteAgentById,
    refetch: fetchAgents,
  };
};

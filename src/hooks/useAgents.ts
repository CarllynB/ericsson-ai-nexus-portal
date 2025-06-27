
import { useState, useEffect } from 'react';
import { Agent } from '@/services/api';
import { offlineApiService } from '@/services/offlineApi';

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
      console.log('Fetching agents in offline-only mode...');
      
      const response = await offlineApiService.getAgents();
      console.log('Received agents from offline API:', response);
      
      if (Array.isArray(response)) {
        const sortedAgents = sortAgents(response);
        setAgents(sortedAgents);
        console.log(`Successfully loaded ${sortedAgents.length} agents from local database`);
      } else {
        console.warn('Invalid response format from offline API:', response);
        setAgents([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch agents from SQLite:', err);
      setAgents([]);
      setError('Failed to load agents from local database. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [page, pageSize, showAll]);

  const updateAgentStatus = async (id: string, status: Agent['status']) => {
    try {
      await offlineApiService.updateAgent(id, { status });
      setAgents(prev => 
        sortAgents(prev.map(agent => 
          agent.id === id ? { ...agent, status, last_updated: new Date().toISOString() } : agent
        ))
      );
    } catch (err) {
      console.error('Failed to update agent status:', err);
      setError('Failed to update agent status');
    }
  };

  const deleteAgentById = async (id: string) => {
    try {
      await offlineApiService.deleteAgent(id);
      setAgents(prev => prev.filter(agent => agent.id !== id));
    } catch (err) {
      console.error('Failed to delete agent:', err);
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


import { useState, useEffect } from 'react';
import { Agent, getAgents, updateAgent, deleteAgent } from '@/services/api';

export const useAgents = (page = 1, pageSize = 12, showAll = false) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  // Default agents as fallback
  const DEFAULT_AGENTS: Agent[] = [
    {
      id: "smart-error-detect",
      name: "Smart Error Detect",
      description: "Use GenAI to resolve CNIS issues reported in JIRA",
      category: "CNIS OPS",
      status: "active",
      key_features: [
        "Suggest possible solutions on CNIS issues",
        "Leverages past Jira ticket knowledge base",
        "Improves error detection accuracy",
        "Speeds resolution time"
      ],
      access_link: "https://sed-csstip.msts.ericsson.net/",
      owner: "system",
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "5gc-fa",
      name: "5GC FA Agent",
      description: "Use GenAI to perform 5GC fault analysis from network PCAP logs",
      category: "Fault Analysis",
      status: "active",
      key_features: [
        "PCAP log processing",
        "5G Core fault detection",
        "Performance analysis",
        "Predictive insights"
      ],
      access_link: "https://5gcfa-csstip.msts.ericsson.net/login.html",
      owner: "system",
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "mop",
      name: "MoP Agent",
      description: "Use GenAI to create base MoPs for delivery teams",
      category: "Documentation",
      status: "active",
      key_features: [
        "Automated MoP generation",
        "Best practice integration",
        "Template customization",
        "Quality assurance"
      ],
      access_link: "https://mop.cram066.rnd.gic.ericsson.se/mop-gui/mop-agent",
      owner: "system",
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "devmate",
      name: "DevMate",
      description: "Accelerate the delivery of upgrades and patches on Ericsson-developed tools and systems.",
      category: "Dev Tools",
      status: "active",
      key_features: [
        "VS Code extension for efficient patch releases",
        "Automated upgrade workflows",
        "License management integration",
        "Usage analytics"
      ],
      access_link: undefined,
      owner: "system",
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "palle",
      name: "PALLE",
      description: "Use GenAI to provide lessons learned from all projects",
      category: "Learning",
      status: "coming_soon",
      key_features: [
        "Project knowledge extraction",
        "Lessons learned database",
        "Best practice recommendations",
        "Historical insights"
      ],
      access_link: null,
      owner: "system",
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "ml4sec",
      name: "ML4SEC",
      description: "Use GenAI to execute SRM (Security Reliability Model)",
      category: "Security",
      status: "coming_soon",
      key_features: [
        "Security reliability modeling",
        "Risk assessment automation",
        "Compliance monitoring",
        "Threat analysis"
      ],
      access_link: null,
      owner: "system",
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "henka",
      name: "Henka",
      description: "GenAI based utility to improve Change Request (CR) - Henka",
      category: "Change Management",
      status: "coming_soon",
      key_features: [
        "Change request optimization",
        "Impact analysis",
        "Automated workflows",
        "Risk mitigation"
      ],
      access_link: null,
      owner: "system",
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "swift",
      name: "SWIFT",
      description: "GenAI based chatbot for end-use issue resolution (STWFT)",
      category: "Support",
      status: "coming_soon",
      key_features: [
        "End-user issue resolution",
        "Automated troubleshooting",
        "Knowledge base integration",
        "Real-time support"
      ],
      access_link: null,
      owner: "system",
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "nexus",
      name: "Nexus",
      description: "GenAI based handover from Project to Delivery (CNS)",
      category: "Project Management",
      status: "coming_soon",
      key_features: [
        "Project handover automation",
        "Documentation generation",
        "Knowledge transfer",
        "Delivery optimization"
      ],
      access_link: null,
      owner: "system",
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "stlc",
      name: "STLC",
      description: "Use GenAI to create full software test life cycle",
      category: "Testing",
      status: "coming_soon",
      key_features: [
        "Test case generation",
        "Automated test planning",
        "Coverage analysis",
        "Quality assurance"
      ],
      access_link: null,
      owner: "system",
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
  ];

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
      const response = await getAgents();
      
      if (Array.isArray(response)) {
        setAgents(sortAgents(response));
      } else {
        setAgents(sortAgents(DEFAULT_AGENTS));
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      setAgents(sortAgents(DEFAULT_AGENTS));
      setError('Failed to load agents from server, showing cached data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [page, pageSize, showAll]);

  const updateAgentStatus = async (id: string, status: Agent['status']) => {
    try {
      await updateAgent(id, { status });
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
      await deleteAgent(id);
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

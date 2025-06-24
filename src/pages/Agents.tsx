
import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Mail, User, ChevronRight, Settings, ChevronDown, ChevronUp, X, Edit, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthContext } from "@/lib/AuthContext";

type AgentStatus = "Active" | "Coming Soon" | "Inactive";

interface Agent {
  id: string;
  title: string;
  description: string;
  category: string;
  status: AgentStatus;
  features: string[];
  link: string | null;
  contactEmail?: string;
}

const Agents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showWelcome, setShowWelcome] = useState(true);
  
  const { user, roles } = useContext(AuthContext);

  const DEFAULT_AGENTS: Agent[] = [
    {
      id: "devmate",
      title: "DevMate",
      description: "Accelerate the delivery of upgrades and patches on Ericsson-developed tools and systems.",
      category: "Dev Tools",
      status: "Active",
      features: [
        "VS Code extension for efficient patch releases",
        "Automated upgrade workflows",
        "License management integration",
        "Usage analytics"
      ],
      link: null,
      contactEmail: "nitin.goel@ericsson.com"
    },
    {
      id: "smart-error-detect",
      title: "Smart Error Detect",
      description: "Use GenAI to resolve CNIS issues reported in JIRA",
      category: "CNIS OPS",
      status: "Active",
      features: [
        "Suggest possible solutions on CNIS issues",
        "Leverages past Jira ticket knowledge base",
        "Improves error detection accuracy",
        "Speeds resolution time"
      ],
      link: "https://sed-csstip.msts.ericsson.net/"
    },
    {
      id: "5gc-fa",
      title: "5GC FA Agent", 
      description: "Use GenAI to perform 5GC fault analysis from network PCAP logs",
      category: "Fault Analysis",
      status: "Active",
      features: [
        "PCAP log processing",
        "5G Core fault detection",
        "Performance analysis",
        "Predictive insights"
      ],
      link: "https://5gcfa-csstip.msts.ericsson.net/login.html"
    },
    {
      id: "mop",
      title: "MoP Agent",
      description: "Use GenAI to create base MoPs for delivery teams",
      category: "Documentation",
      status: "Active", 
      features: [
        "Automated MoP generation",
        "Best practice integration",
        "Template customization",
        "Quality assurance"
      ],
      link: "https://mop.cram066.rnd.gic.ericsson.se/mop-gui/mop-agent"
    },
    {
      id: "cantt",
      title: "CANTT Agent",
      description: "Use GenAI to optimize network configuration and troubleshooting tasks",
      category: "Network Operations",
      status: "Active",
      features: [
        "Network configuration automation",
        "Troubleshooting assistance",
        "Performance optimization",
        "Real-time monitoring"
      ],
      link: "https://cantt-agent.example.com"
    },
    {
      id: "palle",
      title: "PALLE",
      description: "Use GenAI to provide lessons learned from all projects",
      category: "Learning",
      status: "Coming Soon",
      features: [
        "Project knowledge extraction",
        "Lessons learned database",
        "Best practice recommendations",
        "Historical insights"
      ],
      link: null
    },
    {
      id: "ml4sec",
      title: "ML4SEC",
      description: "Use GenAI to execute SRM (Security Reliability Model)",
      category: "Security",
      status: "Coming Soon",
      features: [
        "Security reliability modeling",
        "Risk assessment automation",
        "Compliance monitoring",
        "Threat analysis"
      ],
      link: null
    },
    {
      id: "henka",
      title: "Henka",
      description: "GenAI based utility to improve Change Request (CR) - Henka",
      category: "Change Management",
      status: "Coming Soon",
      features: [
        "Change request optimization",
        "Impact analysis",
        "Automated workflows",
        "Risk mitigation"
      ],
      link: null
    },
    {
      id: "swift",
      title: "SWIFT",
      description: "GenAI based chatbot for end-use issue resolution (STWFT)",
      category: "Support",
      status: "Coming Soon",
      features: [
        "End-user issue resolution",
        "Automated troubleshooting",
        "Knowledge base integration",
        "Real-time support"
      ],
      link: null
    },
    {
      id: "nexus",
      title: "Nexus",
      description: "GenAI based handover from Project to Delivery (CNS)",
      category: "Project Management",
      status: "Coming Soon",
      features: [
        "Project handover automation",
        "Documentation generation",
        "Knowledge transfer",
        "Delivery optimization"
      ],
      link: null
    },
    {
      id: "stlc",
      title: "STLC",
      description: "Use GenAI to create full software test life cycle",
      category: "Testing",
      status: "Coming Soon",
      features: [
        "Test case generation",
        "Automated test planning",
        "Coverage analysis",
        "Quality assurance"
      ],
      link: null
    }
  ];

  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const pageSize = showAll ? 100 : 12;
        const response = await fetch(`/api/agents?page=${page}&page_size=${pageSize}`);
        if (response.ok) {
          const data = await response.json();
          setAgents(data.items || data);
          if (data.total) {
            setTotalPages(Math.ceil(data.total / 12));
          }
        } else {
          setAgents(DEFAULT_AGENTS);
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        setAgents(DEFAULT_AGENTS);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [page, showAll]);

  const filteredAgents = agents.filter(agent =>
    agent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleNext = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handleShowAll = () => {
    setShowAll(true);
    setPage(1);
  };

  const handleStatusChange = (agentId: string, newStatus: AgentStatus) => {
    console.log('Toggle', agentId, newStatus);
    setAgents(prev => 
      prev.map(agent => 
        agent.id === agentId ? { ...agent, status: newStatus } : agent
      )
    );
  };

  const handleEdit = (agentId: string) => {
    console.log('Edit agent:', agentId);
  };

  const handleDelete = (agentId: string) => {
    console.log('Delete agent:', agentId);
  };

  const handleEmailClick = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const toggleCardExpansion = (agentId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  const getCardStyles = (status: AgentStatus) => {
    switch (status) {
      case "Active":
        return "border-2 border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer";
      case "Coming Soon":
        return "opacity-70 bg-muted/30 border-2 border-muted hover:border-muted/60 hover:shadow-md transition-all duration-300";
      case "Inactive":
        return "opacity-50 bg-gray-100 border-2 border-gray-300 hover:border-gray-400 transition-all duration-300";
      default:
        return "hover:shadow-lg transition-all duration-300";
    }
  };

  const getStatusBadgeColor = (status: AgentStatus) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "Coming Soon":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "Inactive":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-12 flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading agents...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-12">
      {showWelcome && (
        <div className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 relative">
          <button
            onClick={() => setShowWelcome(false)}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome to the AI-DU Agent Portal
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our centralized gateway to access and interact with GenAI agents. 
              Streamline operations with intelligent automation.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            AI Agents
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access and interact with our specialized GenAI agents designed to enhance your operational efficiency
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="search"
              placeholder="Search agents by name, description, category, or features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-12">
          {filteredAgents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">No agents found matching your search.</p>
            </div>
          ) : (
            filteredAgents.map((agent) => {
              const isExpanded = expandedCards.has(agent.id);
              return (
                <Card 
                  key={agent.id} 
                  className={`relative ${getCardStyles(agent.status)}`}
                >
                  <div className="absolute top-2 right-2 z-20 flex gap-1">
                    {roles?.includes('admin') && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(agent.id)}
                          className="w-8 h-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Select
                          value={agent.status}
                          onValueChange={(value: AgentStatus) => handleStatusChange(agent.id, value)}
                        >
                          <SelectTrigger className="w-8 h-8 p-0 border-none bg-white/80 hover:bg-white">
                            <Settings className="w-4 h-4" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Coming Soon">Coming Soon</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                    {roles?.includes('super_admin') && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(agent.id)}
                        className="w-8 h-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">
                            {agent.title}
                          </CardTitle>
                          <button
                            onClick={() => toggleCardExpansion(agent.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            aria-label={isExpanded ? "Hide features" : "Show features"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {agent.category}
                        </Badge>
                      </div>
                      <Badge 
                        variant="secondary"
                        className={getStatusBadgeColor(agent.status)}
                      >
                        {agent.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>
                  
                  {isExpanded && (
                    <div className="px-6 pb-4 border-t border-gray-100">
                      <h4 className="font-semibold text-sm text-foreground mb-3 mt-4">Key Features:</h4>
                      <ul className="space-y-2">
                        {agent.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <CardContent className="space-y-6">
                    {agent.status === "Active" ? (
                      agent.id === "devmate" ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              className="w-full"
                              variant="outline"
                            >
                              Access Agent
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm">Onboarding Required</h4>
                              <p className="text-sm text-muted-foreground">
                                To access this agent, you need to go through an onboarding process.
                              </p>
                              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                                <User className="w-4 h-4" />
                                <div className="text-sm">
                                  <p className="font-medium">Contact: Nitin Goel</p>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Mail className="w-3 h-3" />
                                    <button 
                                      onClick={() => handleEmailClick('nitin.goel@ericsson.com')}
                                      className="hover:text-primary cursor-pointer"
                                    >
                                      nitin.goel@ericsson.com
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Button 
                          className="w-full"
                          variant="outline"
                          onClick={() => {
                            if (agent.link) {
                              window.open(agent.link, '_blank');
                            }
                          }}
                        >
                          Access Agent
                        </Button>
                      )
                    ) : (
                      <Button 
                        className="w-full opacity-50"
                        variant="outline"
                        disabled
                      >
                        {agent.status === "Coming Soon" ? "Coming Soon" : "Access Agent"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {!loading && !showAll && totalPages > 1 && (
          <div className="flex justify-center gap-4 mb-12">
            {page < totalPages && (
              <Button 
                onClick={handleNext}
                variant="outline" 
                size="lg"
                className="px-6"
              >
                Next
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            )}
            <Button 
              onClick={handleShowAll}
              variant="default" 
              size="lg"
              className="px-6"
            >
              Show All
            </Button>
          </div>
        )}

        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Got an Idea? Pitch It!
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Use our AI-DU PitchBox to submit smart, tailored pitches. Get funding. Lead the project. Make it real.
          </p>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => window.open('https://apps.powerapps.com/play/e/default-92e84ceb-fbfd-47ab-be52-080c6b87953f/a/549a8af5-f6ba-4b8b-824c-dfdfcf6f3740?tenantId=92e84ceb-fbfd-47ab-be52-080c6b87953f&hint=ec5023c9-376e-41fb-9280-10bd9f925919&source=sharebutton&sourcetime=1750260233474', '_blank')}
          >
            Submit a Pitch
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Agents;

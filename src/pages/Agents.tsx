
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Mail, User, ChevronRight, ChevronDown, ChevronUp, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useAgents } from "@/hooks/useAgents";
import { Agent } from "@/services/api";
import { useRoles } from "@/hooks/useRoles";

const Agents = () => {
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination & Display
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Welcome Banner
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Auth and Data Hooks
  const { user } = useAuth();
  const { agents, loading, error } = useAgents();
  const { currentUserRole } = useRoles();

  const ITEMS_PER_PAGE = 12;

  // Search filtering - includes owner but doesn't show it
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.key_features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = showAll ? filteredAgents.length : startIndex + ITEMS_PER_PAGE;
  const displayedAgents = filteredAgents.slice(startIndex, endIndex);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
    setShowAll(false);
  }, [searchTerm]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleShowAll = () => {
    setShowAll(true);
  };

  const toggleCardExpansion = (agentId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
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

  const getCardStyles = (status: Agent['status']) => {
    switch (status) {
      case "active":
        return "border-2 border-primary/20 hover:border-primary/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer";
      case "coming_soon":
        return "opacity-70 bg-muted/30 border-2 border-muted hover:border-muted/70 hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer";
      case "inactive":
        return "opacity-50 bg-gray-100 border-2 border-gray-300 hover:border-gray-400 hover:shadow-sm hover:scale-[1.01] transition-all duration-300 cursor-pointer";
      default:
        return "hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer";
    }
  };

  const getStatusBadgeColor = (status: Agent['status']) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "coming_soon":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "inactive":
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
      {/* Welcome Banner */}
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
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            AI Agents
          </h1>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="search"
              placeholder="Search agents by name, description, category, owner, or features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-12">
          {displayedAgents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">No agents found matching your search.</p>
            </div>
          ) : (
            displayedAgents.map((agent) => {
              const isExpanded = expandedCards.has(agent.id);
              return (
                <Card 
                  key={agent.id}
                  className={`relative ${getCardStyles(agent.status)}`}
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">
                            {agent.name}
                          </CardTitle>
                          <button
                            onClick={(e) => toggleCardExpansion(agent.id, e)}
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
                        {agent.status === "coming_soon" ? "Coming Soon" : agent.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>
                  
                  {/* Expandable Features Section */}
                  {isExpanded && (
                    <div className="px-6 pb-4 border-t border-gray-100">
                      <h4 className="font-semibold text-sm text-foreground mb-3 mt-4">Key Features:</h4>
                      <ul className="space-y-2">
                        {agent.key_features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <CardContent className="space-y-6">
                    {agent.status === "active" ? (
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
                                    <span>nitin.goel@ericsson.com</span>
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
                            if (agent.access_link) {
                              window.open(agent.access_link, '_blank');
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
                        {agent.status === "coming_soon" ? "Coming Soon" : "Access Agent"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {!showAll && filteredAgents.length > ITEMS_PER_PAGE && (
          <div className="flex justify-center gap-4 mb-12">
            {currentPage < totalPages && (
              <Button 
                onClick={handleNextPage}
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

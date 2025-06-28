
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Mail, User, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRoles } from "@/hooks/useRoles";
import { useAgents } from "@/hooks/useAgents";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const { currentUserRole } = useRoles();
  const { agents, loading, error } = useAgents();

  const ITEMS_PER_PAGE = 12;

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.key_features.some((feature: string) => feature.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedAgents = showAll ? filteredAgents : filteredAgents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleShowAll = () => {
    setShowAll(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-12 flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading agents from database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-12">
      {/* Welcome Banner - Updated with darker background */}
      {showWelcome && (
        <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl p-8 mb-8 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWelcome(false)}
            className="absolute top-4 right-4"
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-2">Welcome to the AI-DU Agent Portal</h2>
            <p className="text-muted-foreground">
              Our centralized gateway to access and interact with GenAI agents. Streamline operations with intelligent automation.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
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
              type="text"
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
              <p className="text-muted-foreground text-lg">
                {agents.length === 0 
                  ? "No agents have been created yet. Super Admins can create agents in the Dashboard." 
                  : "No agents found matching your search."
                }
              </p>
            </div>
          ) : (
            displayedAgents.map((agent) => {
              return (
                <Card 
                  key={agent.id}
                  className={`border-2 hover:shadow-lg hover:scale-105 transition-all duration-300 ${
                    agent.status === "coming_soon" ? "opacity-75 bg-muted/30" : ""
                  }`}
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">
                          {agent.name}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {agent.category}
                        </Badge>
                      </div>
                      {/* Show status badges to all users */}
                      <Badge 
                        variant={agent.status === "active" ? "default" : "secondary"}
                        className={agent.status === "active" 
                          ? "bg-green-100 text-green-800 hover:bg-green-100" 
                          : agent.status === "inactive"
                          ? "bg-red-100 text-red-800 hover:bg-red-100"
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }
                      >
                        {agent.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {agent.status === "coming_soon" ? (
                      <Button 
                        className="w-full"
                        variant="outline"
                        disabled
                      >
                        Coming Soon
                      </Button>
                    ) : agent.contact_info ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
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
                                <p className="font-medium">Contact: {agent.contact_info.name}</p>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Mail className="w-3 h-3" />
                                  <span>{agent.contact_info.email}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Button 
                        className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
                        variant="outline"
                        onClick={() => {
                          if (agent.access_link) {
                            window.open(agent.access_link, '_blank');
                          }
                        }}
                      >
                        Access Agent
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
            {currentPage > 1 && (
              <Button 
                onClick={handlePrevPage}
                variant="outline" 
                size="lg"
                className="px-6"
              >
                Back
              </Button>
            )}
            {currentPage < totalPages && (
              <Button 
                onClick={handleNextPage}
                variant="outline" 
                size="lg"
                className="px-6"
              >
                Next
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

        {/* Pitch Section - Updated with darker background and no external link icon */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl p-8 text-center">
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

export default Index;

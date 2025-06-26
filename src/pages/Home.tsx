
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Mail, User, ChevronRight, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useRoles } from "@/hooks/useRoles";
import { getAgents } from "@/services/api";

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState<{ [key: string]: boolean }>({});
  const { currentUserRole } = useRoles();

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agentsData = await getAgents();
        // Sort agents: active first, then by name
        const sortedAgents = agentsData.sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (a.status !== 'active' && b.status === 'active') return 1;
          return a.name.localeCompare(b.name);
        });
        setAgents(sortedAgents);
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };

    fetchAgents();
  }, []);

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.owner.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Only show status badges for super admins, not regular admins
  const showStatusBadges = currentUserRole === 'super_admin';

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleShowAll = () => {
    setShowAll(true);
  };

  const handleAccessAgent = (agent: any) => {
    if (agent.id === "devmate") {
      setExpandedAgents(prev => ({
        ...prev,
        [agent.id]: !prev[agent.id]
      }));
    } else if (agent.access_link) {
      window.open(agent.access_link, '_blank');
    }
  };

  return (
    <div className="min-h-screen px-6 py-12">
      {/* Welcome Popup */}
      <Dialog open={showWelcome} onOpenChange={(open) => !open && setShowWelcome(false)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center mb-4">
              Welcome to the AI-DU Agent Portal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <p className="text-lg text-muted-foreground text-center">
              A centralized space to access and interact with GenAI agents. Empowering intelligent automation across teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8"
                onClick={() => setShowWelcome(false)}
              >
                Explore Agents
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8"
                onClick={() => window.location.href = '/dashboard'}
              >
                View Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search agents by name, description, category, or owner..."
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
            displayedAgents.map((agent) => (
              <Card 
                key={agent.id}
                className={`transition-shadow hover:shadow-lg ${
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
                    {showStatusBadges && (
                      <Badge 
                        variant={agent.status === "active" ? "default" : "secondary"}
                        className={agent.status === "active" 
                          ? "bg-green-100 text-green-800 hover:bg-green-100" 
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }
                      >
                        {agent.status.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm leading-relaxed">
                    {agent.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {agent.status === "coming_soon" ? (
                    <Button 
                      className="w-full"
                      variant="outline"
                      disabled
                    >
                      Coming Soon
                    </Button>
                  ) : (
                    <Collapsible 
                      open={expandedAgents[agent.id]} 
                      onOpenChange={(open) => setExpandedAgents(prev => ({ ...prev, [agent.id]: open }))}
                    >
                      <CollapsibleTrigger asChild>
                        <Button 
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => handleAccessAgent(agent)}
                        >
                          Access Agent
                          {agent.id === "devmate" && (
                            <ChevronDown className={`ml-2 w-4 h-4 transition-transform ${expandedAgents[agent.id] ? 'rotate-180' : ''}`} />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      {agent.id === "devmate" && (
                        <CollapsibleContent className="mt-4">
                          <div className="p-4 bg-muted rounded-lg border">
                            <h4 className="font-medium mb-2">Onboarding Required</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              To access {agent.name}, you need to go through an onboarding process.
                            </p>
                            <div className="flex items-center gap-2 p-3 bg-background rounded border">
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
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            ))
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

        {/* Pitch Section */}
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

export default Home;

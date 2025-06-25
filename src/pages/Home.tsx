
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Mail, User, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRoles } from "@/hooks/useRoles";
import { getAgents } from "@/services/api";

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const { currentUserRole } = useRoles();

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
    agent.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.key_features.some((feature: string) => feature.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Only show status badges for super admins, not regular admins
  const showStatusBadges = currentUserRole === 'super_admin';

  const toggleAgentExpansion = (agentId: string) => {
    setExpandedAgent(expandedAgent === agentId ? null : agentId);
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
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            AI Agents
          </h1>
        </div>

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
          {filteredAgents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">No agents found matching your search.</p>
            </div>
          ) : (
            filteredAgents.map((agent) => {
              const isExpanded = expandedAgent === agent.id;
              return (
                <Card 
                  key={agent.id} 
                  className={`group relative hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20 ${
                    agent.status === "coming_soon" ? "opacity-75 bg-muted/30" : ""
                  }`}
                >
                  {/* Features Overlay on Hover - Only show when not expanded */}
                  {!isExpanded && (
                    <div className="absolute inset-0 bg-background/95 p-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-center">
                      <h4 className="font-semibold text-sm text-foreground mb-3">Key Features:</h4>
                      <ul className="space-y-2">
                        {agent.key_features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleAgentExpansion(agent.id);
                        }}
                      >
                        Pin Features
                      </Button>
                    </div>
                  )}

                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {agent.name}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleAgentExpansion(agent.id);
                            }}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? '−' : '+'}
                          </Button>
                        </div>
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

                    {/* Expanded Features */}
                    {isExpanded && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold text-sm text-foreground mb-3">Key Features:</h4>
                        <ul className="space-y-2">
                          {agent.key_features.map((feature: string, index: number) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-muted-foreground mt-3">
                          <strong>Owner:</strong> {agent.owner}
                        </p>
                      </div>
                    )}
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
                    ) : agent.id === "devmate" ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
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
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
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

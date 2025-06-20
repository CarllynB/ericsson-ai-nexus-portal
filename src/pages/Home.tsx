import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, ChevronUp, ChevronDown, Mail, User } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const Home = () => {
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const agents = [
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
      link: null
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
    }
  ];

  const filteredAgents = agents.filter(agent =>
    agent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen">
      <Collapsible open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        {/* Collapsible Header */}
        <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-auto p-4">
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-foreground">AI-DU Agent Portal</h2>
                  <p className="text-muted-foreground">
                    {welcomeOpen ? "Click to collapse welcome section" : "Click to expand welcome section"}
                  </p>
                </div>
                {welcomeOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Welcome Section */}
        <CollapsibleContent>
          <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative max-w-7xl mx-auto px-6 py-24">
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Welcome to the AI-DU Agent Portal
                  </h1>
                  <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                    Our centralized gateway to access and interact with GenAI agents. 
                    Streamline operations with intelligent automation.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6"
                    onClick={() => setWelcomeOpen(false)}
                  >
                    Explore Agents
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-lg px-8 py-6"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    View Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </CollapsibleContent>
      </Collapsible>

      {/* Agent List Section - Always visible when welcome is collapsed */}
      {!welcomeOpen && (
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search agents by name, description, category, or features..."
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
                filteredAgents.map((agent) => (
                  <Card key={agent.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20">
                    <CardHeader className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {agent.title}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {agent.category}
                          </Badge>
                        </div>
                        <Badge 
                          variant="default" 
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          {agent.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm leading-relaxed">
                        {agent.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-foreground">Key Features:</h4>
                        <ul className="space-y-2">
                          {agent.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {agent.id === "devmate" ? (
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
                            if (agent.link) {
                              window.open(agent.link, '_blank');
                            }
                          }}
                        >
                          Access Agent
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
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
        </section>
      )}

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              AI-DU Approved GenAI Agents
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Leverage cutting-edge GenAI agents to automate complex tasks and improve operational efficiency
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <div className="w-6 h-6 bg-primary rounded" />
                </div>
                <CardTitle>Intelligent Automation</CardTitle>
                <CardDescription>
                  Deployed AI agents that understand context and execute complex workflows automatically
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <div className="w-6 h-6 bg-primary rounded-full" />
                </div>
                <CardTitle>Real-time Analytics</CardTitle>
                <CardDescription>
                  Monitor agent performance and get insights into operational metrics in real-time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <div className="w-6 h-6 bg-primary rounded-sm rotate-45" />
                </div>
                <CardTitle>Seamless Integration</CardTitle>
                <CardDescription>
                  Connect with existing systems and workflows without having to navigate different websites
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join the AI revolution and experience the future of intelligent automation
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => window.location.href = '/agents'}
          >
            Get Started Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Agents = () => {
  const agents = [
    {
      id: "cns-tt",
      title: "CNS TT Agent",
      description: "Use GenAI to isolate and resolve CNS trouble tickets",
      category: "Network Operations",
      status: "Active",
      features: [
        "Automated ticket analysis",
        "Root cause identification",
        "Resolution recommendations",
        "Pattern recognition"
      ]
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
      ]
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
      ]
    }
  ];

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            AI Agents
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access and interact with our specialized GenAI agents designed to enhance your operational efficiency
          </p>
        </div>

        {/* Agents Grid */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-12">
          {agents.map((agent) => (
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
                
                <Button 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  variant="outline"
                >
                  Access Agent
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Need a Custom Agent?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our AI-DU platform can be extended with custom agents tailored to your specific operational needs. 
            Contact our team to discuss your requirements.
          </p>
          <Button size="lg" variant="outline">
            Request Custom Agent
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Agents;
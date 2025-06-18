import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                AI-DU Agent Portal
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
                onClick={() => window.location.href = '/agents'}
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
                  Deploy AI agents that understand context and execute complex workflows automatically
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
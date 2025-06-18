import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Monitor and manage the AI-DU Agents
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="flex items-center justify-center">
          <Card className="max-w-2xl w-full text-center border-dashed border-2 border-primary/30">
            <CardHeader className="pb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <div className="w-12 h-12 bg-primary/30 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-full animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">
                Coming Soon
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground">
                We're working hard to bring you an amazing dashboard experience with:
              </p>
              
              <div className="space-y-3 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">Real-time agent monitoring</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">Performance analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">Usage statistics</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.location.href = '/agents'}
                >
                  Explore Agents Meanwhile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
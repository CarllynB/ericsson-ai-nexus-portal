
import { useState, useEffect } from "react";
import { Bot, Settings, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export const NovaSettings = () => {
  const [isPublished, setIsPublished] = useState(false);
  const [novaStatus, setNovaStatus] = useState<'online' | 'limited'>('limited');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check NOVA status on component mount
  useEffect(() => {
    checkNovaStatus();
  }, []);

  const checkNovaStatus = async () => {
    try {
      const response = await fetch('/api/nova/status');
      const data = await response.json();
      setNovaStatus(data.status);
    } catch (error) {
      console.error('Failed to check NOVA status:', error);
      setNovaStatus('limited');
    }
  };

  const togglePublished = async () => {
    setLoading(true);
    try {
      // In a full implementation, this would save to the database
      // For now, we'll just update the local state
      setIsPublished(!isPublished);
      
      toast({
        title: "Success",
        description: `NOVA is now ${!isPublished ? 'published' : 'unpublished'}. ${!isPublished ? 'All users can now access NOVA.' : 'Only Super Admins can access NOVA.'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update NOVA settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">NOVA Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure NOVA (Next-gen Operations Virtual Assistant) for the AI-DU Portal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            NOVA Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">System Status</Label>
              <p className="text-xs text-muted-foreground">
                Current operational status of NOVA
              </p>
            </div>
            <Badge variant={novaStatus === 'online' ? "default" : "secondary"}>
              {novaStatus === 'online' ? 'Online (Ollama Connected)' : 'Limited Mode'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="nova-published" className="text-sm font-medium">
                Publish to All Users
              </Label>
              <p className="text-xs text-muted-foreground">
                Make NOVA available to all portal users
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <Switch
                id="nova-published"
                checked={isPublished}
                onCheckedChange={togglePublished}
                disabled={loading}
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={checkNovaStatus}
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
        </CardContent>
      </Card>

      {novaStatus === 'limited' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800">NOVA Running in Limited Mode</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  For full AI capabilities, install and run Ollama with a model like 'mistral' or 'llama3':
                </p>
                <div className="mt-2 p-3 bg-yellow-100 rounded text-xs font-mono">
                  <div>1. Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh</div>
                  <div>2. Pull a model: ollama pull mistral</div>
                  <div>3. Verify: ollama list</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bot, Globe, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface NovaStatus {
  status: string;
  ollama: string;
  model: string;
  is_live: boolean;
  available_to_all: boolean;
  access_level: string;
}

export const NovaSettings = () => {
  const [status, setStatus] = useState<NovaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/nova/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching NOVA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (key: string, value: boolean) => {
    try {
      const response = await fetch('/api/nova/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          [key]: value,
          is_live: key === 'is_live' ? value : status?.is_live,
          available_to_all: key === 'available_to_all' ? value : status?.available_to_all
        })
      });

      if (response.ok) {
        setStatus(prev => prev ? { ...prev, [key]: value } : null);
        toast({
          title: "Settings Updated",
          description: `NOVA ${key.replace('_', ' ')} ${value ? 'enabled' : 'disabled'}`,
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating NOVA settings:', error);
      toast({
        title: "Error",
        description: "Failed to update NOVA settings",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading NOVA settings...</div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Failed to load NOVA settings
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          NOVA AI Assistant Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="space-y-3">
          <h3 className="font-medium">Connection Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">NOVA: {status.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status.ollama === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Ollama: {status.ollama}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span className="text-sm">Model: {status.model}</span>
            </div>
          </div>
        </div>

        {/* Ollama Status Alert */}
        {status.ollama === 'disconnected' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Ollama Not Connected</h4>
                <p className="text-sm text-amber-700 mt-1">
                  NOVA is using fallback responses. To enable full AI capabilities, ensure Ollama is running with the Mistral model.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <Label htmlFor="available-to-all">Available to All Users</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow all users to access NOVA, not just Super Admins
              </p>
            </div>
            <Switch
              id="available-to-all"
              checked={status.available_to_all}
              onCheckedChange={(checked) => updateSettings('available_to_all', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <Label htmlFor="is-live">Live Mode</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Enable live AI responses (requires Ollama connection)
              </p>
            </div>
            <Switch
              id="is-live"
              checked={status.is_live}
              onCheckedChange={(checked) => updateSettings('is_live', checked)}
            />
          </div>
        </div>

        {/* Access Level Display */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Access Level</span>
            <Badge variant={status.available_to_all ? "default" : "secondary"}>
              {status.available_to_all ? "All Users" : "Super Admin Only"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

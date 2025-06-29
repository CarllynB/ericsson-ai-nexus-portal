
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Send, Bot, User, Loader2, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useToast } from "@/components/ui/use-toast";

interface ChatMessage {
  id: string;
  type: 'user' | 'nova';
  content: string;
  timestamp: Date;
}

interface NovaSettings {
  available_to_all: boolean;
  is_live: boolean;
}

const TalkToNova = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'nova',
      content: "Hello! I'm NOVA, your AI-DU Portal assistant. I can help you understand our GenAI agents, navigate the portal, and answer questions about the AI & Data Unit. I have access to real-time agent data and metrics. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [novaSettings, setNovaSettings] = useState<NovaSettings>({ available_to_all: false, is_live: false });
  const [showSettings, setShowSettings] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { currentUserRole } = useRoles();
  const { toast } = useToast();

  const isSuperAdmin = currentUserRole === 'super_admin';

  // Load NOVA settings for Super Admins
  useEffect(() => {
    if (isSuperAdmin) {
      loadNovaSettings();
    }
  }, [isSuperAdmin]);

  const loadNovaSettings = async () => {
    try {
      const response = await fetch('/api/nova/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNovaSettings({
          available_to_all: data.available_to_all,
          is_live: data.is_live
        });
      }
    } catch (error) {
      console.error('Error loading NOVA settings:', error);
    }
  };

  const updateNovaSettings = async (newSettings: Partial<NovaSettings>) => {
    try {
      const response = await fetch('/api/nova/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        setNovaSettings(prev => ({ ...prev, ...newSettings }));
        toast({
          title: "Settings Updated",
          description: `NOVA is now ${newSettings.available_to_all ? 'available to all users' : 'restricted to Super Admins'}`,
        });
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
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/nova/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ message: inputMessage })
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('NOVA is not available to your role yet. Please contact a Super Admin.');
        }
        throw new Error('Failed to get response from NOVA');
      }

      const data = await response.json();
      
      const novaMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'nova',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, novaMessage]);
    } catch (error) {
      console.error('Error sending message to NOVA:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'nova',
        content: error.message || "I'm having trouble connecting right now. Please try again later or contact support.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection Issue",
        description: error.message || "NOVA is temporarily unavailable",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please sign in to access NOVA.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check access based on settings
  const hasAccess = isSuperAdmin || novaSettings.available_to_all;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">NOVA Not Available</h2>
            <p className="text-muted-foreground">
              NOVA is currently restricted to Super Admins. Please contact your administrator for access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="w-8 h-8 text-primary" />
              Talk to NOVA
            </h1>
            <p className="text-muted-foreground mt-2">
              Your AI-DU Portal assistant with access to real agent data and metrics
            </p>
          </div>
          
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          )}
        </div>

        {/* Super Admin Settings Panel */}
        {isSuperAdmin && showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>NOVA Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="available-to-all">Make NOVA available to all users</Label>
                <Switch
                  id="available-to-all"
                  checked={novaSettings.available_to_all}
                  onCheckedChange={(checked) => updateNovaSettings({ available_to_all: checked })}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                When enabled, all users (Admin, Viewer) can access NOVA. When disabled, only Super Admins can use it.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center justify-between">
              Chat with NOVA
              {!isSuperAdmin && (
                <span className="text-sm font-normal text-muted-foreground">
                  Available to: {novaSettings.available_to_all ? 'All Users' : 'Super Admins Only'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea 
              ref={scrollAreaRef}
              className="flex-1 p-4 space-y-4"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'nova' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask NOVA about agents, metrics, or portal features..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TalkToNova;


import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

interface ChatMessage {
  id: string;
  type: 'user' | 'nova';
  content: string;
  timestamp: Date;
}

const TalkToNova = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'nova',
      content: "Hello! I'm NOVA, your AI-DU Portal assistant. I can help you understand our GenAI agents, navigate the portal, and answer questions about the AI & Data Unit. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

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
    const currentMessage = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      // Use the backend API endpoint for NOVA chat
      const response = await fetch('/api/nova/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const novaMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'nova',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, novaMessage]);
      } else {
        throw new Error(`API call failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error connecting to NOVA API:', error);
      
      // Fallback response when API is not available
      let fallbackResponse = "I'm NOVA, your AI-DU Portal assistant! ";
      
      const lowerMessage = currentMessage.toLowerCase();
      
      if (lowerMessage.includes('agent') || lowerMessage.includes('genai')) {
        fallbackResponse += "I can help you understand our GenAI agents in the portal. Each agent has specific capabilities like code generation, content creation, data analysis, and more. Would you like to know about any specific agent category?";
      } else if (lowerMessage.includes('dashboard') || lowerMessage.includes('metric')) {
        fallbackResponse += "The dashboard shows key metrics like time savings, usage counts, and adoption rates for each agent. These help track the impact and effectiveness of our AI tools. What specific metrics would you like to understand?";
      } else if (lowerMessage.includes('role') || lowerMessage.includes('permission')) {
        fallbackResponse += "Our portal has different user roles: Super Admins can manage everything, Admins can manage agents and users, and Viewers have read-only access. Your role determines what features you can access.";
      } else {
        fallbackResponse += `I'm here to help with the AI-DU Portal! I can explain GenAI agents, dashboard metrics, user roles, navigation, and troubleshooting. What would you like to know about?

Note: I'm currently running in fallback mode. The backend API may be unavailable or Ollama may not be running.`;
      }

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'nova',
        content: fallbackResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Using Fallback Mode",
        description: "NOVA backend API unavailable. Install Ollama and restart the server for full capabilities.",
        variant: "default"
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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <img 
              src="/lovable-uploads/bcbb4631-9e18-46d6-8baa-0f53f9092b35.png" 
              alt="NOVA" 
              className="w-8 h-8"
            />
            Talk to NOVA
          </h1>
          <p className="text-muted-foreground mt-2">
            Your AI-DU Portal assistant powered by Llama
          </p>
        </div>

        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Chat with NOVA</CardTitle>
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
                      <img 
                        src="/lovable-uploads/bcbb4631-9e18-46d6-8baa-0f53f9092b35.png" 
                        alt="NOVA" 
                        className="w-6 h-6"
                      />
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
                    <img 
                      src="/lovable-uploads/bcbb4631-9e18-46d6-8baa-0f53f9092b35.png" 
                      alt="NOVA" 
                      className="w-6 h-6"
                    />
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
              <p className="text-xs text-muted-foreground mt-2">
                Powered by backend API + Ollama - Install Ollama and run 'ollama run llama3.2' for full AI capabilities
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TalkToNova;

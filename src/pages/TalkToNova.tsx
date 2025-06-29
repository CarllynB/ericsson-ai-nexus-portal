
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Loader2, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

interface ChatMessage {
  id: string;
  type: 'user' | 'nova';
  content: string;
  timestamp: Date;
  source?: 'ollama' | 'fallback';
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
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
    setIsTyping(true);

    try {
      console.log('Sending message to NOVA API:', currentMessage);
      
      // Use the backend API endpoint for NOVA chat
      const response = await fetch('/api/nova/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          message: currentMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('NOVA response received:', data.source || 'unknown');
        
        // Simulate typing delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const novaMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'nova',
          content: data.response,
          timestamp: new Date(),
          source: data.source
        };

        setMessages(prev => [...prev, novaMessage]);
        
        // Show connection status
        if (data.source === 'ollama') {
          toast({
            title: "🤖 Ollama Connected",
            description: "NOVA is using local AI for responses",
            duration: 2000
          });
        }
      } else {
        throw new Error(`API call failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error connecting to NOVA API:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'nova',
        content: "I'm sorry, I'm having trouble connecting right now. Please check that the backend server is running and try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection Error",
        description: "Failed to connect to NOVA. Check backend server.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
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
              className="w-12 h-12"
            />
            Talk to NOVA
          </h1>
          <p className="text-muted-foreground mt-2">
            Your AI-DU Portal Assistant
          </p>
        </div>

        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Chat with NOVA</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea 
              ref={scrollAreaRef}
              className="flex-1 p-4"
            >
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type === 'nova' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <img 
                          src="/lovable-uploads/bcbb4631-9e18-46d6-8baa-0f53f9092b35.png" 
                          alt="NOVA" 
                          className="w-5 h-5"
                        />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs opacity-60">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                        {message.type === 'nova' && message.source && (
                          <div className="text-xs opacity-60 flex items-center gap-1">
                            {message.source === 'ollama' ? (
                              <>
                                <Bot className="w-3 h-3" />
                                <span>AI</span>
                              </>
                            ) : (
                              <span>Fallback</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {message.type === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <img 
                        src="/lovable-uploads/bcbb4631-9e18-46d6-8baa-0f53f9092b35.png" 
                        alt="NOVA" 
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="bg-muted rounded-lg p-4 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">NOVA is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-background">
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
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
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

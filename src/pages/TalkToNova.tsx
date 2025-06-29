
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'nova';
  timestamp: Date;
}

const TalkToNova = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hello! I'm NOVA, your AI-DU Portal assistant. I'm here to help you navigate GenAI agents, answer questions about the portal, and provide support for the AI & Data Unit. How can I assist you today?",
      sender: 'nova',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isNovaOnline, setIsNovaOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Call Ollama backend
      const response = await fetch('/api/nova/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from NOVA');
      }

      const data = await response.json();
      
      const novaMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'nova',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, novaMessage]);
      setIsNovaOnline(true);
    } catch (error) {
      console.error('Error sending message to NOVA:', error);
      setIsNovaOnline(false);
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm currently experiencing technical difficulties. Please try again in a moment, or contact your system administrator if the issue persists.",
        sender: 'nova',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackMessage]);
      
      toast({
        title: "Connection Error",
        description: "Unable to connect to NOVA. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Talk to NOVA</h1>
                <p className="text-muted-foreground">Your AI-DU Portal Assistant</p>
              </div>
            </div>
            <Badge variant={isNovaOnline ? "default" : "destructive"} className="px-3 py-1">
              {isNovaOnline ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="h-[70vh] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Chat with NOVA</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'nova' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground ml-12'
                        : 'bg-background border'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>

                  {message.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-background border p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask NOVA anything about the AI-DU Portal..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isTyping}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Questions */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">Quick Questions:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              "What GenAI agents are available?",
              "How do I assign admin rights?",
              "What does the Navigator 365 agent do?",
              "How do I add a new agent?",
              "Who maintains the Explorer agent?",
              "What is the AI & Data Unit responsible for?"
            ].map((question) => (
              <Button
                key={question}
                variant="outline"
                size="sm"
                className="text-left justify-start h-auto p-2 whitespace-normal"
                onClick={() => {
                  setInputMessage(question);
                  setTimeout(sendMessage, 100);
                }}
                disabled={isTyping}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalkToNova;

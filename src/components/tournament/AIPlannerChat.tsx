import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { aiPlannerAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AIPlannerChatProps {
  tournamentId: string;
  onEventsCreated?: () => void;
}

interface Message {
  role: "user" | "ai";
  content: string;
  type?: string;
  data?: any;
  suggestions?: string[];
}

const AIPlannerChat = ({ tournamentId, onEventsCreated }: AIPlannerChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Hi! I'm your AI Tournament Planner. I can help you with:\n\n• Planning court requirements\n• Suggesting events for different skill levels\n• Creating optimal schedules\n• Pricing recommendations\n• Managing registrations\n\nTry asking: \"How many courts do I need for 64 players?\" or \"What events should I create?\"",
      suggestions: [
        "Calculate court requirements",
        "Suggest events",
        "Help with scheduling",
        "Pricing advice"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");

  const chatMutation = useMutation({
    mutationFn: ({ prompt, context }: { prompt: string; context?: any }) =>
      aiPlannerAPI.chat(tournamentId, prompt, context),
    onSuccess: (data) => {
      const response = data.data;
      setMessages(prev => [...prev, {
        role: "ai",
        content: response.message,
        type: response.type,
        data: response.data,
        suggestions: response.suggestions
      }]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to get AI response");
    }
  });

  const applySuggestionsMutation = useMutation({
    mutationFn: ({ action, data }: { action: string; data: any }) =>
      aiPlannerAPI.applySuggestions(tournamentId, action, data),
    onSuccess: (data) => {
      toast.success(data.message || "Applied successfully!");
      if (onEventsCreated) {
        onEventsCreated();
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to apply suggestions");
    }
  });

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    chatMutation.mutate({ prompt: inputValue });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSendMessage();
  };

  const handleApplyEvents = (events: any[]) => {
    applySuggestionsMutation.mutate({
      action: "create-events",
      data: { events }
    });
  };

  const renderAIMessage = (message: Message) => {
    return (
      <div className="space-y-4">
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Court Calculation Display */}
        {message.type === "court-calculation" && message.data && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm">Court Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Minimum Courts:</span>
                <Badge variant="outline">{message.data.minimum}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recommended Courts:</span>
                <Badge variant="default">{message.data.recommended}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Optimal Courts:</span>
                <Badge variant="secondary">{message.data.optimal}</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Suggestions Display */}
        {message.type === "event-suggestions" && message.data && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-muted-foreground">Suggested Events:</div>
            {message.data.map((event: any, idx: number) => (
              <Card key={idx} className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold">{event.name}</div>
                      <div className="text-sm text-muted-foreground">{event.reasoning}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="capitalize">
                          {event.format.replace("-", " ")}
                        </Badge>
                        <Badge variant="secondary">{event.skillLevel}+</Badge>
                        <Badge variant="default">${event.entryFee}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              onClick={() => handleApplyEvents(message.data)}
              disabled={applySuggestionsMutation.isPending}
              className="w-full"
            >
              {applySuggestionsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Events...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Create All {message.data.length} Events
                </>
              )}
            </Button>
          </div>
        )}

        {/* Schedule Display */}
        {message.type === "schedule" && message.data && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-muted-foreground">Recommended Schedule:</div>
            {message.data.map((item: any, idx: number) => (
              <Card key={idx} className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{item.eventName}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.rounds} rounds • {item.courtsUsed} courts • {item.estimatedDuration}
                      </div>
                    </div>
                    <Badge variant="outline">{item.startTime}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pricing Advice Display */}
        {message.type === "pricing-advice" && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {message.content}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs"
              >
                {suggestion}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[600px] glass-card-hover rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-hero-gradient p-4 flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-bold text-primary-foreground">AI Tournament Planner</h3>
          <p className="text-sm text-primary-foreground/80">Ask me anything about tournament planning</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl p-4",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.role === "user" ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                renderAIMessage(message)
              )}
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl p-4 bg-muted">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask me anything about planning your tournament..."
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || chatMutation.isPending}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIPlannerChat;

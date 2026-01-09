import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { aiPlannerAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  RotateCcw,
  Trash2,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface AIPlannerChatProps {
  tournamentId: string;
  onEventsCreated?: () => void;
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  type?: string;
  data?: any;
  suggestions?: string[];
  timestamp: Date;
}

const EnhancedAIPlannerChat = ({ tournamentId, onEventsCreated }: AIPlannerChatProps) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load chat history from localStorage
    const saved = localStorage.getItem(`ai-chat-${tournamentId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch {
        return [];
      }
    }
    return [
      {
        id: "welcome",
        role: "ai",
        content: `Hi! 👋 I'm your AI Tournament Planner. I can help you with:

• **Court Calculations** - Figure out how many courts you need
• **Event Suggestions** - Get recommendations for events based on skill levels
• **Scheduling** - Create optimal match schedules
• **Pricing Advice** - Tips for setting entry fees
• **Tournament Setup** - General planning and organization

What would you like help with today?`,
        suggestions: [
          "How many courts do I need for 64 players?",
          "What events should I create?",
          "Help me with scheduling",
          "Pricing recommendations"
        ],
        timestamp: new Date(),
      }
    ];
  });

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 1) { // Don't save if only welcome message
      localStorage.setItem(`ai-chat-${tournamentId}`, JSON.stringify(messages));
    }
  }, [messages, tournamentId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [inputValue]);

  const chatMutation = useMutation({
    mutationFn: ({ prompt, context }: { prompt: string; context?: any }) => {
      // Build context from previous messages
      const conversationHistory = messages
        .slice(-6) // Last 6 messages for context
        .map(m => ({ role: m.role, content: m.content }));

      return aiPlannerAPI.chat(tournamentId, prompt, {
        ...context,
        conversationHistory
      });
    },
    onSuccess: (data) => {
      const response = data.data;
      addAIMessage(response.message, response.type, response.data, response.suggestions);
      setIsTyping(false);
    },
    onError: (error: any) => {
      setIsTyping(false);
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

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addAIMessage = (content: string, type?: string, data?: any, suggestions?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "ai",
      content,
      type,
      data,
      suggestions,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = (content?: string) => {
    const messageToSend = content || inputValue.trim();
    if (!messageToSend) return;

    addUserMessage(messageToSend);
    setInputValue("");
    setIsTyping(true);

    chatMutation.mutate({ prompt: messageToSend });
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  const handleRegenerateResponse = () => {
    if (messages.length < 2) return;

    // Get the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMessage) return;

    // Remove last AI response
    setMessages(prev => prev.slice(0, -1));
    setIsTyping(true);

    chatMutation.mutate({ prompt: lastUserMessage.content });
  };

  const handleEditMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setEditingMessageId(messageId);
      setEditContent(message.content);
    }
  };

  const handleSaveEdit = (messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, content: editContent } : m
    ));
    setEditingMessageId(null);
    setEditContent("");

    // Resend the edited message
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      // Remove all messages after the edited one
      setMessages(prev => prev.slice(0, messageIndex + 1));
      setIsTyping(true);
      chatMutation.mutate({ prompt: editContent });
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleClearChat = () => {
    setMessages([messages[0]]); // Keep welcome message
    localStorage.removeItem(`ai-chat-${tournamentId}`);
    toast.success("Chat cleared!");
  };

  const handleApplyEvents = (events: any[]) => {
    applySuggestionsMutation.mutate({
      action: "create-events",
      data: { events }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMarkdown = (content: string) => {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:font-bold prose-p:leading-relaxed prose-pre:p-0">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark as any}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={cn("px-1.5 py-0.5 rounded bg-muted font-mono text-sm", className)} {...props}>
                {children}
              </code>
            );
          },
          a({ node, children, ...props }) {
            return (
              <a
                {...props}
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const renderAIMessageData = (message: Message) => {
    // Court Calculation Display
    if (message.type === "court-calculation" && message.data) {
      return (
        <Card className="bg-primary/5 border-primary/20 mt-3">
          <CardContent className="p-4 space-y-2">
            <div className="font-semibold text-sm mb-2">Court Requirements</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{message.data.minimum}</div>
                <div className="text-xs text-muted-foreground">Minimum</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{message.data.recommended}</div>
                <div className="text-xs text-muted-foreground">Recommended</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{message.data.optimal}</div>
                <div className="text-xs text-muted-foreground">Optimal</div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Event Suggestions Display
    if (message.type === "event-suggestions" && message.data) {
      return (
        <div className="mt-3 space-y-2">
          <div className="text-sm font-semibold text-muted-foreground">Suggested Events:</div>
          {message.data.map((event: any, idx: number) => (
            <Card key={idx} className="bg-muted/30 border-border/50">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="font-semibold text-sm">{event.name}</div>
                    <div className="text-xs text-muted-foreground">{event.reasoning}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">
                        {event.format.replace("-", " ")}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{event.skillLevel}+</Badge>
                      <Badge variant="default" className="text-xs">${event.entryFee}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            onClick={() => handleApplyEvents(message.data)}
            disabled={applySuggestionsMutation.isPending}
            className="w-full mt-2"
            size="sm"
          >
            {applySuggestionsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Create All {message.data.length} Events
              </>
            )}
          </Button>
        </div>
      );
    }

    // Schedule Display
    if (message.type === "schedule" && message.data) {
      return (
        <div className="mt-3 space-y-2">
          <div className="text-sm font-semibold text-muted-foreground">Recommended Schedule:</div>
          {message.data.map((item: any, idx: number) => (
            <Card key={idx} className="bg-muted/30 border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{item.eventName}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.rounds} rounds • {item.courtsUsed} courts • {item.estimatedDuration}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{item.startTime}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] glass-card-hover rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-hero-gradient p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display font-bold text-primary-foreground">AI Tournament Planner</h3>
            <p className="text-xs text-primary-foreground/80">Powered by Claude</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearChat}
          className="text-primary-foreground hover:bg-white/20"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 group",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "ai" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
            )}

            <div
              className={cn(
                "max-w-[80%] space-y-2",
                message.role === "user" ? "order-first" : ""
              )}
            >
              {editingMessageId === message.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEdit(message.id)}>
                      <Check className="w-4 h-4 mr-1" />
                      Save & Send
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      "rounded-2xl p-4",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "user" ? (
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    ) : (
                      renderMarkdown(message.content)
                    )}

                    {message.role === "ai" && renderAIMessageData(message)}

                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {message.suggestions.map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs border-border/50 hover:border-primary"
                          >
                            {suggestion}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopyMessage(message.content)}
                      className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy message"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {message.role === "user" && (
                      <button
                        onClick={() => handleEditMessage(message.id)}
                        className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit message"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    {message.role === "ai" && message.id === messages[messages.length - 1].id && (
                      <button
                        onClick={handleRegenerateResponse}
                        className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Regenerate response"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                    <span className="text-xs text-muted-foreground ml-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </>
              )}
            </div>

            {message.role === "user" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">You</span>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-muted rounded-2xl p-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-card flex-shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about tournament planning... (Shift+Enter for new line)"
            disabled={isTyping}
            className="resize-none max-h-32 min-h-[60px]"
            rows={1}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isTyping}
            size="icon"
            className="h-[60px] w-[60px] flex-shrink-0"
          >
            {isTyping ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
};

export default EnhancedAIPlannerChat;

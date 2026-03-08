import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { picklixAIAPI, tournamentAPI, eventAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Loader2, Send, User, Bot, Copy,
  Calendar, MapPin, Users, Trophy, Clock,
  RotateCcw, CheckCircle2, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: string | null;
  data?: any;
  timestamp: Date;
}

interface PicklixAIChatInterfaceProps {
  initialPrompt?: string;
}

const STARTER_PROMPTS = [
  'Create a one-day tournament for 32 players on 6 courts',
  'Plan a mixed doubles event for intermediate players',
  'How many courts do I need for 48 players in 5 hours?',
  'Suggest events for a 64-player weekend tournament',
  'Generate a schedule for 4 events on 8 courts starting at 8 AM',
];

function MarkdownMessage({ text }: { text: string }) {
  // Simple markdown renderer: bold, bullet points, headings
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        // Heading
        if (line.startsWith('### ')) {
          return <p key={i} className="font-bold text-base mt-2">{line.slice(4)}</p>;
        }
        if (line.startsWith('## ')) {
          return <p key={i} className="font-bold text-base mt-2">{line.slice(3)}</p>;
        }
        if (line.startsWith('# ')) {
          return <p key={i} className="font-bold text-lg mt-2">{line.slice(2)}</p>;
        }
        // Bullet point
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const content = line.slice(2);
          return (
            <div key={i} className="flex gap-2">
              <span className="text-primary mt-1 flex-shrink-0">•</span>
              <span>{renderInline(content)}</span>
            </div>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.*)/);
          if (match) {
            return (
              <div key={i} className="flex gap-2">
                <span className="text-primary font-semibold flex-shrink-0">{match[1]}.</span>
                <span>{renderInline(match[2])}</span>
              </div>
            );
          }
        }
        // Empty line
        if (line.trim() === '') return <div key={i} className="h-1" />;
        // Normal line
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  // Bold: **text** or __text__
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

// Action card: create-tournament
function CreateTournamentCard({ data, onCreated }: { data: any; onCreated: (id: string) => void }) {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      // Build the top-level payload the Tournament model expects.
      // The model has top-level `location` (string) and `address` (string),
      // NOT a nested venue object for those required fields.
      const { events: aiEvents, venue, ...rest } = data;

      const location = [venue?.city, venue?.state].filter(Boolean).join(', ') || venue?.name || 'TBD';
      const address = venue?.address || venue?.name || 'TBD';

      const payload = {
        ...rest,
        location,
        address,
        // Preserve the venue sub-document for extra fields (courts etc.)
        venue: venue ? { ...venue } : undefined,
      };

      const res = await tournamentAPI.create(payload);
      const tournamentId = res.data?._id || res._id;

      // Create events separately (Tournament.events stores ObjectId refs)
      if (Array.isArray(aiEvents) && aiEvents.length > 0) {
        await Promise.allSettled(
          aiEvents.map((ev: any) => eventAPI.create(tournamentId, ev))
        );
      }

      setCreated(true);
      toast.success('Tournament created! Redirecting...');
      onCreated(tournamentId);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to create tournament');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-primary/20 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm text-primary">Tournament Plan</span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-lg font-bold">{data.name}</p>
          {data.description && <p className="text-sm text-muted-foreground mt-0.5">{data.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {data.startDate && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{data.startDate}{data.endDate && data.endDate !== data.startDate ? ` – ${data.endDate}` : ''}</span>
            </div>
          )}
          {data.maxPlayers && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{data.maxPlayers} players max</span>
            </div>
          )}
          {data.venue?.city && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{data.venue.name || data.venue.city}{data.venue.state ? `, ${data.venue.state}` : ''}</span>
            </div>
          )}
          {data.venue?.courts && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-3.5 h-3.5 text-center font-bold text-[10px]">⛳</span>
              <span>{data.venue.courts} courts</span>
            </div>
          )}
        </div>

        {data.events && data.events.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Events ({data.events.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {data.events.map((ev: any, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {ev.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {created ? (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Tournament created successfully!
          </div>
        ) : (
          <Button onClick={handleCreate} disabled={creating} size="sm" className="w-full">
            {creating ? (
              <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Creating...</>
            ) : (
              <><Plus className="w-3.5 h-3.5 mr-2" />Create This Tournament</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// Action card: suggest-events
function SuggestEventsCard({ data }: { data: any[] }) {
  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Suggested Events</span>
      </div>
      <div className="p-3 grid gap-2">
        {data.slice(0, 8).map((ev: any, i: number) => (
          <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-background/60 text-xs">
            <div>
              <p className="font-medium">{ev.name}</p>
              <p className="text-muted-foreground">{ev.format} · {ev.playFormat} · max {ev.maxTeams} teams</p>
            </div>
            {ev.entryFee && (
              <span className="font-semibold text-primary">${ev.entryFee}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Action card: generate-schedule
function GenerateScheduleCard({ data }: { data: any }) {
  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Schedule</span>
        {data.totalDuration && (
          <Badge variant="outline" className="text-xs ml-auto">{data.totalDuration}</Badge>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        {(data.slots || []).map((slot: any, i: number) => (
          <div key={i} className="flex gap-3 py-1.5 px-2 rounded-lg bg-background/60 text-xs items-start">
            <span className="font-mono text-primary font-semibold w-16 flex-shrink-0">{slot.time}</span>
            <div>
              <p className="font-medium">{slot.eventName}</p>
              {slot.round && <p className="text-muted-foreground">{slot.round}</p>}
            </div>
            {slot.courts && (
              <span className="ml-auto text-muted-foreground">Courts {Array.isArray(slot.courts) ? slot.courts.join(', ') : slot.courts}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Action card: calculate-courts
function CalculateCourtsCard({ data }: { data: any }) {
  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="text-primary font-bold text-sm">⛳</span>
        <span className="font-semibold text-sm">Court Requirements</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-2 rounded-lg bg-background/60">
            <p className="text-2xl font-black text-muted-foreground">{data.minimum}</p>
            <p className="text-xs text-muted-foreground">Minimum</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-2xl font-black text-primary">{data.recommended}</p>
            <p className="text-xs text-primary font-medium">Recommended</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/60">
            <p className="text-2xl font-black text-muted-foreground">{data.optimal}</p>
            <p className="text-xs text-muted-foreground">Optimal</p>
          </div>
        </div>
        {data.reasoning && (
          <p className="text-xs text-muted-foreground">{data.reasoning}</p>
        )}
      </div>
    </div>
  );
}

const PicklixAIChatInterface = ({ initialPrompt }: PicklixAIChatInterfaceProps) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialPrompt || '');
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: ({ message, hist }: { message: string; hist: typeof history }) =>
      picklixAIAPI.chat(message, hist),
    onSuccess: (res: any, variables) => {
      const aiData = res.data ?? res;
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiData.message || "I'm here to help!",
        action: aiData.action,
        data: aiData.data,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setHistory(prev => [
        ...prev,
        { role: 'user', content: variables.message },
        { role: 'assistant', content: aiData.message || '' },
      ]);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to reach Picklix AI';
      toast.error(msg);
      // Remove the pending user message on error
      setMessages(prev => prev.filter(m => m.id !== 'pending'));
    },
  });

  const handleSend = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || chatMutation.isPending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: value,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    chatMutation.mutate({ message: value, hist: history });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
  };

  const handleReset = () => {
    setMessages([]);
    setHistory([]);
    setInput('');
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">Ask Picklix AI anything</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-8">
              Describe your tournament in plain English. I'll plan it, generate schedules, suggest events, and more.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 w-full max-w-lg text-left">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="flex items-start gap-2 p-3 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/40 transition-all text-sm text-left group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div className={`max-w-[80%] ${msg.role === 'user' ? 'max-w-[70%]' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-card border border-border/60 rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <MarkdownMessage text={msg.content} />
                    )}
                  </div>

                  {/* Action cards */}
                  {msg.role === 'assistant' && msg.action === 'create-tournament' && msg.data && (
                    <CreateTournamentCard
                      data={msg.data}
                      onCreated={(id) => setTimeout(() => navigate(`/tournaments/${id}`), 1500)}
                    />
                  )}
                  {msg.role === 'assistant' && msg.action === 'suggest-events' && Array.isArray(msg.data) && (
                    <SuggestEventsCard data={msg.data} />
                  )}
                  {msg.role === 'assistant' && msg.action === 'generate-schedule' && msg.data && (
                    <GenerateScheduleCard data={msg.data} />
                  )}
                  {msg.role === 'assistant' && msg.action === 'calculate-courts' && msg.data && (
                    <CalculateCourtsCard data={msg.data} />
                  )}

                  {/* Copy button for assistant messages */}
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleCopyMessage(msg.content)}
                      className="mt-1 ml-1 p-1 rounded opacity-0 hover:opacity-100 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                      title="Copy message"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {chatMutation.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border/60 bg-card/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex gap-2 items-end">
          {!isEmpty && (
            <button
              onClick={handleReset}
              className="flex-shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mb-0.5"
              title="New conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Picklix AI anything... (Enter to send, Shift+Enter for new line)"
              className="min-h-[44px] max-h-[200px] resize-none pr-12 py-3 text-sm"
              rows={1}
              disabled={chatMutation.isPending}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || chatMutation.isPending}
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8"
            >
              {chatMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Picklix AI can make mistakes. Review important details before applying suggestions.
        </p>
      </div>
    </div>
  );
};

export default PicklixAIChatInterface;

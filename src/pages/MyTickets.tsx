import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Calendar, CheckCircle, DownloadSimple, CircleNotch, MagnifyingGlass, Ticket, QrCode, ArrowRight } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TicketCard from '../components/check-in/TicketCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Eyebrow, Pill } from '../components/ui/pb';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TicketData {
  paymentId: string;
  ticketCode: string;
  qrCodeUrl: string;
  ticketPdfUrl?: string;
  tournament: {
    id: string;
    name: string;
    location: string;
    startDate: string;
    status: string;
  };
  events: Array<{
    id: string;
    name: string;
  }>;
  teams?: Array<{
    id: string;
    name: string;
  }>;
  amount: number;
  checkedIn?: {
    checkedInAt: string;
    checkedInBy: string;
    method: string;
  };
  createdAt: string;
}

export default function MyTickets() {
  const navigate = useNavigate();
  const [searchTerm, setMagnifyingGlassTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  // Fetch user's tickets
  const { data: tickets, isLoading, error } = useQuery<TicketData[]>({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const response = await api.get('/check-in/my-tickets');
      const data = response.data?.data ?? response.data;
      return Array.isArray(data) ? data : [];
    },
  });

  // Filter tickets based on search and tab
  const filteredTickets = tickets?.filter((ticket) => {
    // MagnifyingGlass filter
    const matchesMagnifyingGlass =
      ticket.tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.events.some(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ticket.ticketCode.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesMagnifyingGlass) return false;

    // Tab filter
    const tournamentDate = new Date(ticket.tournament.startDate);
    const now = new Date();
    const isUpcoming = tournamentDate >= now;

    if (activeTab === 'upcoming') return isUpcoming;
    if (activeTab === 'past') return !isUpcoming;
    return true; // 'all' tab
  });

  // DownloadSimple all PDFs
  const handleDownloadSimpleAll = () => {
    filteredTickets?.forEach((ticket) => {
      if (ticket.ticketPdfUrl) {
        window.open(ticket.ticketPdfUrl, '_blank');
      }
    });
  };

  // Stats
  const stats = {
    total: tickets?.length || 0,
    upcoming: tickets?.filter(t => new Date(t.tournament.startDate) >= new Date()).length || 0,
    checkedIn: tickets?.filter(t => t.checkedIn).length || 0,
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="h-24" />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
            <CircleNotch className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Loading tickets...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="h-24" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="glass-card rounded-2xl p-6 border-destructive/30 bg-destructive/5">
            <p className="text-destructive font-medium">Failed to load tickets. Please try again later.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">

        {/* ── Mobile layout ── */}
        <div className="md:hidden flex flex-col min-h-screen bg-pb-paper pb-20">

          {/* Sticky top bar */}
          <div className="flex items-center justify-between px-4 pb-3 bg-pb-surface border-b border-pb-hairline sticky top-0 z-30" style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)' }}>
            <h1 className="font-display font-bold text-[18px] text-pb-ink tracking-[-0.02em]">My Tickets</h1>
            {stats.upcoming > 0 && (
              <Pill tone="court" mono>{stats.upcoming} upcoming</Pill>
            )}
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 divide-x divide-pb-hairline bg-pb-surface border-b border-pb-hairline">
            {[
              { label: "TOTAL", value: String(stats.total) },
              { label: "UPCOMING", value: String(stats.upcoming) },
              { label: "CHECKED IN", value: String(stats.checkedIn) },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center justify-center py-4 gap-0.5">
                <Eyebrow>{label}</Eyebrow>
                <span className="font-mono text-[22px] font-bold text-pb-court leading-none">{value}</span>
              </div>
            ))}
          </div>

          {/* Tab filter */}
          <div className="flex gap-1.5 px-4 py-3 bg-pb-surface2 border-b border-pb-hairline overflow-x-auto">
            {([
              { key: "upcoming", label: `Upcoming (${stats.upcoming})` },
              { key: "past", label: `Past (${stats.total - stats.upcoming})` },
              { key: "all", label: `All (${stats.total})` },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-mono font-medium whitespace-nowrap transition-colors border",
                  activeTab === key
                    ? "bg-pb-ink text-white border-pb-ink"
                    : "border-pb-hairline text-pb-muted hover:border-pb-rule hover:text-pb-ink"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Ticket list */}
          <div className="flex-1 px-4 pt-4 space-y-3">
            {filteredTickets && filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => {
                const isUpcoming = new Date(ticket.tournament.startDate) >= new Date();
                const isCheckedIn = !!ticket.checkedIn;
                return (
                  <div
                    key={ticket.paymentId}
                    className="bg-pb-surface border border-pb-hairline rounded-[8px] overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/tournaments/${ticket.tournament.id}`)}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-pb-surface2 border-b border-pb-hairline">
                      <Eyebrow className="text-pb-muted">
                        {ticket.tournament.startDate
                          ? format(new Date(ticket.tournament.startDate), "EEE, MMM d")
                          : "TBD"}
                      </Eyebrow>
                      {isCheckedIn ? (
                        <Pill tone="court" mono className="text-[10px]">
                          <CheckCircle size={9} weight="bold" /> Checked in
                        </Pill>
                      ) : isUpcoming ? (
                        <Pill tone="amber" mono className="text-[10px]">Upcoming</Pill>
                      ) : (
                        <Pill tone="neutral" mono className="text-[10px]">Past</Pill>
                      )}
                    </div>

                    <div className="px-4 py-3">
                      <h3 className="font-display font-bold text-[16px] tracking-[-0.02em] text-pb-ink mb-0.5 leading-snug">
                        {ticket.tournament.name}
                      </h3>
                      <p className="font-mono text-[11px] text-pb-muted mb-2">
                        {ticket.events.map(e => e.name).join(" · ")}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-pb-faint uppercase tracking-[0.12em]">
                          #{ticket.ticketCode}
                        </span>
                        <div className="flex items-center gap-1.5 text-pb-court">
                          <QrCode size={13} />
                          <span className="font-mono text-[11px]">Show QR</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-8 text-center mt-4">
                <Ticket size={28} className="mx-auto mb-3 text-pb-faint" />
                <p className="font-display font-bold text-[16px] text-pb-ink mb-1">No tickets yet</p>
                <p className="font-mono text-[11px] text-pb-muted mb-5">Register for a tournament to get started</p>
                <button
                  onClick={() => navigate("/tournaments")}
                  className="h-9 px-4 rounded-[6px] border border-pb-rule text-[12px] font-mono text-pb-ink2 hover:border-pb-ink transition-colors"
                >
                  Browse Tournaments
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Desktop layout (md+) ── */}
        <div className="hidden md:block bg-background">
          <div className="h-24" />
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-display text-3xl font-bold text-foreground">My Tickets</h1>
                  <p className="text-muted-foreground mt-1">Manage your tournament tickets and QR codes</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card-hover rounded-2xl p-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tickets</p>
                      <p className="text-2xl font-display font-bold text-foreground">{stats.total}</p>
                    </div>
                    <Ticket className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="glass-card-hover rounded-2xl p-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Upcoming Events</p>
                      <p className="text-2xl font-display font-bold text-primary">{stats.upcoming}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="glass-card-hover rounded-2xl p-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Checked In</p>
                      <p className="text-2xl font-display font-bold text-primary">{stats.checkedIn}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by tournament, event, or ticket code..."
                  value={searchTerm}
                  onChange={(e) => setMagnifyingGlassTerm(e.target.value)}
                  className="pl-10 border-border rounded-xl"
                />
              </div>
              {filteredTickets && filteredTickets.length > 0 && (
                <Button onClick={handleDownloadSimpleAll} variant="outline" className="shrink-0">
                  <DownloadSimple className="w-4 h-4 mr-2" />
                  Download All PDFs
                </Button>
              )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-3 glass border border-border/50 p-1.5 rounded-xl">
                <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
                  Upcoming ({stats.upcoming})
                </TabsTrigger>
                <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
                  Past ({stats.total - stats.upcoming})
                </TabsTrigger>
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
                  All ({stats.total})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Tickets Grid */}
            {filteredTickets && filteredTickets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTickets.map((ticket) => (
                  <TicketCard key={ticket.paymentId} payment={ticket} />
                ))}
              </div>
            ) : (
              <div className="glass-card-hover rounded-2xl p-12 text-center animate-fade-in">
                <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-display font-bold text-lg mb-2">
                  {searchTerm ? 'No matching tickets found' : 'No tickets yet'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ? 'Try adjusting your search terms' : 'Register for a tournament to get your first ticket'}
                </p>
                {!searchTerm && (
                  <Button variant="hero" asChild className="shadow-glow">
                    <a href="/tournaments">Browse Tournaments</a>
                  </Button>
                )}
              </div>
            )}

            {/* Help Section */}
            <div className="mt-8 glass-card-hover rounded-2xl p-6 bg-primary/5 border-primary/20 animate-fade-in">
              <h3 className="font-display font-bold text-lg text-foreground mb-4">How to Use Your Tickets</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p><strong className="text-foreground">Save your tickets:</strong> Download the PDF or save this page for offline access</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p><strong className="text-foreground">Check-in:</strong> Present your QR code to the organizer on event day</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p><strong className="text-foreground">Backup:</strong> Your ticket code can be entered manually if the QR code doesn't scan</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

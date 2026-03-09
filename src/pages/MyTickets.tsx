import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Calendar, CheckCircle, Download, Loader2, Search, Ticket } from 'lucide-react';
import { useState } from 'react';
import TicketCard from '../components/check-in/TicketCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  // Fetch user's tickets
  const { data: tickets, isLoading, error } = useQuery<TicketData[]>({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const response = await axios.get('/api/check-in/my-tickets');
      const data = response.data?.data ?? response.data;
      return Array.isArray(data) ? data : [];
    },
  });

  // Filter tickets based on search and tab
  const filteredTickets = tickets?.filter((ticket) => {
    // Search filter
    const matchesSearch =
      ticket.tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.events.some(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ticket.ticketCode.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter
    const tournamentDate = new Date(ticket.tournament.startDate);
    const now = new Date();
    const isUpcoming = tournamentDate >= now;

    if (activeTab === 'upcoming') return isUpcoming;
    if (activeTab === 'past') return !isUpcoming;
    return true; // 'all' tab
  });

  // Download all PDFs
  const handleDownloadAll = () => {
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
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    <div className="min-h-screen bg-background">
      <div className="h-24" />
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Ticket className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              My Tickets
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your tournament tickets and QR codes
            </p>
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by tournament, event, or ticket code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-border rounded-xl"
          />
        </div>

        {filteredTickets && filteredTickets.length > 0 && (
          <Button
            onClick={handleDownloadAll}
            variant="outline"
            className="shrink-0"
          >
            <Download className="w-4 h-4 mr-2" />
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
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Register for a tournament to get your first ticket'}
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
    </Layout>
  );
}

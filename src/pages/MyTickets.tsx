import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import TicketCard from '../components/check-in/TicketCard';
import { Ticket, Search, Download, Loader2, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

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
      return response.data.data;
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Failed to load tickets. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Ticket className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">
              My Tickets
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your tournament tickets and QR codes
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Ticket className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming Events</p>
                  <p className="text-2xl font-bold text-green-600">{stats.upcoming}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Checked In</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.checkedIn}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by tournament, event, or ticket code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
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
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="upcoming">
            Upcoming ({stats.upcoming})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({stats.total - stats.upcoming})
          </TabsTrigger>
          <TabsTrigger value="all">
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
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No matching tickets found' : 'No tickets yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Register for a tournament to get your first ticket'}
            </p>
            {!searchTerm && (
              <Button asChild>
                <a href="/discover">Browse Tournaments</a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">How to Use Your Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-800">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <p>
              <strong>Save your tickets:</strong> Download the PDF or save this page for offline access
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <p>
              <strong>Check-in:</strong> Present your QR code to the organizer on event day
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <p>
              <strong>Backup:</strong> Your ticket code can be entered manually if the QR code doesn't scan
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

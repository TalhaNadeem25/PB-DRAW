import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import QRScanner from '../components/check-in/QRScanner';
import {
  QrCode,
  Users,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  DownloadSimple,
  Warning,
  CircleNotch,
  ArrowCounterClockwise
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { useToast } from '../hooks/use-toast';

interface CheckInResult {
  success: boolean;
  data?: {
    playerName: string;
    playerEmail: string;
    eventNames: string[];
    teamNames?: string[];
    checkedInAt: string;
  };
  message?: string;
}

interface RecentScan {
  ticketCode: string;
  playerName: string;
  eventNames: string[];
  timestamp: Date;
}

export default function OrganizerScanner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (ticketCode: string) => {
      const response = await axios.post<CheckInResult>('/api/check-in/scan', {
        ticketCode,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        toast({
          title: 'Check-in Successful',
          description: `${data.data.playerName} checked in for ${data.data.eventNames.join(', ')}`,
        });

        // Add to recent scans
        setRecentScans((prev) => [
          {
            ticketCode: '',
            playerName: data.data!.playerName,
            eventNames: data.data!.eventNames,
            timestamp: new Date(),
          },
          ...prev.slice(0, 19), // Keep last 20 scans
        ]);

        queryClient.invalidateQueries({ queryKey: ['check-in-stats'] });
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Check-in failed';
      toast({
        title: 'Check-in Failed',
        description: message,
        variant: 'destructive',
      });
    },
  });

  // Manual check-in mutation
  const manualCheckInMutation = useMutation({
    mutationFn: async ({ email, tournamentId }: { email: string; tournamentId: string }) => {
      const response = await axios.post<CheckInResult>('/api/check-in/manual', {
        userEmail: email,
        tournamentId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Manual Check-in Successful',
        description: data.message || 'Player checked in successfully',
      });
      setManualEmail('');
      queryClient.invalidateQueries({ queryKey: ['check-in-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Manual check-in failed',
        variant: 'destructive',
      });
    },
  });

  const handleScanSuccess = (ticketCode: string) => {
    checkInMutation.mutate(ticketCode);
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Get tournamentId from context or props
    const tournamentId = 'YOUR_TOURNAMENT_ID'; // This should come from route params or selection
    if (manualEmail.trim()) {
      manualCheckInMutation.mutate({ email: manualEmail, tournamentId });
    }
  };

  const filteredScans = recentScans.filter((scan) =>
    scan.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.eventNames.some(e => e.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <QrCode className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">
              Event Check-In Scanner
            </h1>
            <p className="text-gray-600 mt-1">
              Scan QR codes to check players into your event
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Checked In Today</p>
                  <p className="text-2xl font-display font-bold text-green-600">{recentScans.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Players</p>
                  <p className="text-2xl font-display font-bold text-gray-900">-</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-display font-bold text-yellow-600">-</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scanner */}
        <div className="lg:col-span-2 space-y-6">
          {/* QR Scanner */}
          <QRScanner
            onScanSuccess={handleScanSuccess}
            isScanning={checkInMutation.isPending}
          />

          {/* Manual Check-in */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manual Check-In</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualCheckIn} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Enter player email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!manualEmail.trim() || manualCheckInMutation.isPending}
                  className="w-full"
                >
                  {manualCheckInMutation.isPending ? (
                    <>
                      <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    'Check In Manually'
                  )}
                </Button>
                <p className="text-xs text-gray-500">
                  Use this if the QR code is unavailable or damaged
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Alert className="bg-blue-50 border-blue-200">
            <Warning className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>How to use:</strong> Point the camera at the player's QR code ticket. The system will automatically scan and check them in. Make sure there's good lighting for best results.
            </AlertDescription>
          </Alert>
        </div>

        {/* Right: Recent Scans */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Recent Check-Ins</span>
                <Badge variant="secondary">{recentScans.length}</Badge>
              </CardTitle>
              <div className="relative mt-2">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {filteredScans.length > 0 ? (
                <div className="space-y-3">
                  {filteredScans.map((scan, index) => (
                    <div
                      key={index}
                      className="p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {scan.playerName}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {scan.eventNames.join(', ')}
                          </p>
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{format(scan.timestamp, 'h:mm a')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">
                    {searchTerm ? 'No matching check-ins' : 'No check-ins yet'}
                  </p>
                  <p className="text-xs mt-1">
                    Scanned tickets will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export Button */}
      {recentScans.length > 0 && (
        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm">
            <DownloadSimple className="w-4 h-4 mr-2" />
            Export Check-In Log (CSV)
          </Button>
        </div>
      )}
    </div>
  );
}

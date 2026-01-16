import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Clock, Users, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '../../hooks/use-toast';

interface WaitlistButtonProps {
  eventId: string;
  isEventFull: boolean;
}

interface WaitlistPosition {
  position: number;
  totalAhead: number;
  status: 'waiting' | 'promoted' | 'expired' | 'converted' | 'cancelled';
  promotedAt?: string;
  promotionExpiresAt?: string;
  paymentLink?: string;
}

export default function WaitlistButton({ eventId, isEventFull }: WaitlistButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current waitlist position
  const { data: waitlistPosition, isLoading: loadingPosition } = useQuery<WaitlistPosition>({
    queryKey: ['waitlist-position', eventId],
    queryFn: async () => {
      const response = await axios.get(`/api/events/${eventId}/waitlist/my-position`);
      return response.data.data;
    },
    enabled: isEventFull,
    refetchInterval: (query) => {
      // Poll more frequently if promoted (every 10 seconds)
      if (query.state.data?.status === 'promoted') return 10000;
      // Otherwise poll every 30 seconds
      return 30000;
    },
  });

  // Join waitlist mutation
  const joinWaitlist = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/api/events/${eventId}/waitlist`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Joined Waitlist',
        description: 'You will be notified when a spot becomes available.',
      });
      queryClient.invalidateQueries({ queryKey: ['waitlist-position', eventId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to join waitlist',
        variant: 'destructive',
      });
    },
  });

  // Leave waitlist mutation
  const leaveWaitlist = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`/api/events/${eventId}/waitlist`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Left Waitlist',
        description: 'You have been removed from the waitlist.',
      });
      queryClient.invalidateQueries({ queryKey: ['waitlist-position', eventId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to leave waitlist',
        variant: 'destructive',
      });
    },
  });

  // Calculate time remaining for promotion
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  };

  if (loadingPosition) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  // Not on waitlist yet - show join button
  if (!waitlistPosition) {
    return (
      <Card className="border-2 border-yellow-500 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-600" />
            Event Full - Join Waitlist
          </CardTitle>
          <CardDescription>
            This event is currently full, but you can join the waitlist. You'll be automatically notified when a spot becomes available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => joinWaitlist.mutate()}
            disabled={joinWaitlist.isPending}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            {joinWaitlist.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining Waitlist...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Join Waitlist
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // On waitlist - show status
  return (
    <Card className={`border-2 ${
      waitlistPosition.status === 'promoted'
        ? 'border-green-500 bg-green-50'
        : waitlistPosition.status === 'expired'
        ? 'border-red-500 bg-red-50'
        : 'border-yellow-500 bg-yellow-50'
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            {waitlistPosition.status === 'promoted' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Spot Available!
              </>
            ) : waitlistPosition.status === 'expired' ? (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                Promotion Expired
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-yellow-600" />
                On Waitlist
              </>
            )}
          </CardTitle>
          <Badge variant={
            waitlistPosition.status === 'promoted' ? 'default' :
            waitlistPosition.status === 'expired' ? 'destructive' :
            'secondary'
          }>
            #{waitlistPosition.position}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Promoted Status */}
        {waitlistPosition.status === 'promoted' && (
          <>
            <Alert className="bg-white border-green-500">
              <AlertCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>A spot is now available for you!</strong>
                <br />
                Complete your registration within {waitlistPosition.promotionExpiresAt && getTimeRemaining(waitlistPosition.promotionExpiresAt)}
              </AlertDescription>
            </Alert>

            {waitlistPosition.paymentLink && (
              <Button
                onClick={() => window.location.href = waitlistPosition.paymentLink!}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Complete Registration Now
              </Button>
            )}

            {waitlistPosition.promotionExpiresAt && (
              <div className="text-center">
                <div className="text-sm font-semibold text-red-600">
                  {getTimeRemaining(waitlistPosition.promotionExpiresAt)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  If you don't complete registration, your spot will go to the next person
                </div>
              </div>
            )}
          </>
        )}

        {/* Waiting Status */}
        {waitlistPosition.status === 'waiting' && (
          <>
            <div className="bg-white rounded-lg p-4 border border-yellow-300">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-600 mb-2">
                  #{waitlistPosition.position}
                </div>
                <div className="text-sm text-gray-600">
                  Your position in the waitlist
                </div>
              </div>

              {waitlistPosition.totalAhead > 0 && (
                <div className="mt-4 pt-4 border-t border-yellow-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">People ahead:</span>
                    <span className="font-semibold text-gray-900">
                      {waitlistPosition.totalAhead}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Alert className="bg-white">
              <Clock className="w-4 h-4" />
              <AlertDescription>
                You'll receive an email notification when a spot becomes available. You'll then have <strong>24 hours</strong> to complete your registration.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => leaveWaitlist.mutate()}
              disabled={leaveWaitlist.isPending}
              variant="outline"
              className="w-full"
            >
              {leaveWaitlist.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                'Leave Waitlist'
              )}
            </Button>
          </>
        )}

        {/* Expired Status */}
        {waitlistPosition.status === 'expired' && (
          <>
            <Alert variant="destructive" className="bg-white">
              <XCircle className="w-4 h-4" />
              <AlertDescription>
                Your promotion window has expired. The spot was offered to the next person in line. You can rejoin the waitlist if you'd like.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => joinWaitlist.mutate()}
              disabled={joinWaitlist.isPending}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              {joinWaitlist.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejoining...
                </>
              ) : (
                'Rejoin Waitlist'
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

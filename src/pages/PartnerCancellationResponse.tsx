import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  DollarSign,
  UserPlus,
  XCircle,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  Trophy
} from 'lucide-react';
import { cancellationAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CancellationDetails {
  _id: string;
  requestedBy: {
    _id: string;
    name: string;
    email: string;
  };
  partner: {
    _id: string;
    name: string;
    email: string;
  };
  tournament: {
    _id: string;
    name: string;
    startDate: string;
  };
  event: {
    _id: string;
    name: string;
  };
  partnerDecision: string;
  partnerDecisionDeadline: string;
  refundAmount: number;
  refundPercentage: number;
  status: string;
  createdAt: string;
}

const PartnerCancellationResponse = () => {
  const { cancellationId } = useParams<{ cancellationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDecision, setSelectedDecision] = useState<'refund' | 'find-partner' | null>(null);

  // Fetch cancellation details
  const { data: cancellationData, isLoading, error } = useQuery<CancellationDetails>({
    queryKey: ['cancellation-response', cancellationId],
    queryFn: async () => {
      const response = await fetch(`/api/cancellations/${cancellationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch cancellation details');
      const data = await response.json();
      return data.data;
    },
    enabled: !!cancellationId,
  });

  // Respond to cancellation mutation
  const respondMutation = useMutation({
    mutationFn: async (decision: 'refund' | 'find-partner') => {
      return await cancellationAPI.respondToPartnerCancellation(cancellationId!, decision);
    },
    onSuccess: (data, decision) => {
      toast({
        title: 'Response Submitted',
        description: decision === 'refund'
          ? 'Your refund request has been processed. You and your partner will both receive refunds.'
          : 'You can now find a new partner! Your original partner has been refunded.',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: 'Response Failed',
        description: error.response?.data?.message || 'Failed to submit your response',
        variant: 'destructive',
      });
    },
  });

  const handleDecisionSubmit = () => {
    if (!selectedDecision) return;
    respondMutation.mutate(selectedDecision);
  };

  // Calculate time remaining
  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  if (error || !cancellationData) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <h2 className="text-xl font-bold mb-2">Cancellation Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This cancellation request could not be found or you don't have permission to view it.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Check if deadline has passed
  const deadlinePassed = new Date() > new Date(cancellationData.partnerDecisionDeadline);
  const hasResponded = cancellationData.partnerDecision !== 'pending';

  return (
    <Layout>
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Partner Cancellation Request</h1>
            <p className="text-muted-foreground">
              Your partner has requested to cancel their registration
            </p>
          </div>

          {/* Tournament Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-green-600" />
                Tournament Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tournament:</span>
                <span className="font-semibold">{cancellationData.tournament.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Event:</span>
                <span className="font-semibold">{cancellationData.event.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tournament Date:</span>
                <span className="font-semibold flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(cancellationData.tournament.startDate), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Partner Canceling:</span>
                <span className="font-semibold">{cancellationData.requestedBy.name}</span>
              </div>
            </CardContent>
          </Card>

          {/* Deadline Warning */}
          {!hasResponded && !deadlinePassed && (
            <Alert className="mb-6 bg-yellow-50 border-yellow-200">
              <Clock className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900">
                <strong>Time Remaining:</strong> {getTimeRemaining(cancellationData.partnerDecisionDeadline)}
                <br />
                <span className="text-sm">
                  You must respond by {format(new Date(cancellationData.partnerDecisionDeadline), 'MMM dd, yyyy \'at\' h:mm a')}
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Already Responded */}
          {hasResponded && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>Response Submitted:</strong> You have already responded to this cancellation request.
                {cancellationData.partnerDecision === 'refund' && ' Both you and your partner will receive refunds.'}
                {cancellationData.partnerDecision === 'find-partner' && ' You chose to find a new partner.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Deadline Passed */}
          {deadlinePassed && !hasResponded && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Deadline Expired:</strong> The response deadline has passed. Please contact the tournament organizer for assistance.
              </AlertDescription>
            </Alert>
          )}

          {/* Decision Options */}
          {!hasResponded && !deadlinePassed && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-center">Choose Your Option</h2>
                <p className="text-muted-foreground text-center mb-6">
                  Since your partner is canceling, you have two options:
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Option 1: Find New Partner */}
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedDecision === 'find-partner'
                        ? 'border-2 border-green-500 bg-green-50'
                        : 'border-2 border-transparent'
                    }`}
                    onClick={() => setSelectedDecision('find-partner')}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3 mx-auto">
                        <UserPlus className="w-6 h-6 text-green-600" />
                      </div>
                      <CardTitle className="text-center">Find a New Partner</CardTitle>
                      <CardDescription className="text-center">
                        Stay in the tournament and find someone else to play with
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>You remain registered for the tournament</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Your partner gets their refund</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>You can invite a new partner to your team</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>No refund for you (you keep playing)</span>
                        </li>
                      </ul>
                      <Badge className="w-full mt-4 justify-center bg-green-600 hover:bg-green-700">
                        Recommended if you still want to play
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Option 2: Get Refund */}
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedDecision === 'refund'
                        ? 'border-2 border-blue-500 bg-blue-50'
                        : 'border-2 border-transparent'
                    }`}
                    onClick={() => setSelectedDecision('refund')}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3 mx-auto">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                      </div>
                      <CardTitle className="text-center">Get a Refund</CardTitle>
                      <CardDescription className="text-center">
                        Cancel your registration and receive a refund as well
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Both you and your partner leave the tournament</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>You both receive refunds</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Refund amount: ${(cancellationData.refundAmount / 100).toFixed(2)} ({cancellationData.refundPercentage}%)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Refunds processed within 5-10 business days</span>
                        </li>
                      </ul>
                      <Badge variant="secondary" className="w-full mt-4 justify-center">
                        Choose if you can't find another partner
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/dashboard')}
                  disabled={respondMutation.isPending}
                >
                  Decide Later
                </Button>
                <Button
                  size="lg"
                  onClick={handleDecisionSubmit}
                  disabled={!selectedDecision || respondMutation.isPending}
                  className="min-w-[200px]"
                >
                  {respondMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Decision
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* After Response Submitted */}
          {hasResponded && (
            <div className="text-center">
              <Button size="lg" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          )}

          {/* Deadline Passed */}
          {deadlinePassed && !hasResponded && (
            <div className="text-center">
              <Button size="lg" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PartnerCancellationResponse;

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, ArrowSquareOut, Warning, Trash } from '@phosphor-icons/react';
import api from '@/services/api';
import { ConnectAccountButton } from './ConnectAccountButton';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const ConnectAccountStatus = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stripe-connect-status'],
    queryFn: async () => {
      const response = await api.get('/stripe/connect/status');
      return response.data;
    },
    retry: false,
  });

  // Handle return from Stripe onboarding
  useEffect(() => {
    const stripeSuccess = searchParams.get('stripe_success');
    const stripeRefresh = searchParams.get('stripe_refresh');

    if (stripeSuccess) {
      toast.success('Stripe account connected successfully!');
      refetch();
      // Clean up URL
      searchParams.delete('stripe_success');
      setSearchParams(searchParams);
    }

    if (stripeRefresh) {
      toast.info('Please complete your Stripe onboarding');
      refetch();
      searchParams.delete('stripe_refresh');
      setSearchParams(searchParams);
    }
  }, [searchParams, refetch, setSearchParams]);

  const disconnectMutation = useMutation({
    mutationFn: () => api.delete('/stripe/connect/disconnect'),
    onSuccess: () => {
      toast.success('Stripe account disconnected');
      queryClient.invalidateQueries({ queryKey: ['stripe-connect-status'] });
    },
    onError: () => toast.error('Failed to disconnect Stripe account'),
  });

  const handleViewDashboard = async () => {
    try {
      const response = await api.get('/stripe/connect/dashboard');
      window.open(response.data.url, '_blank');
    } catch (error) {
      toast.error('Failed to open Stripe dashboard');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading Stripe account status...</p>
        </CardContent>
      </Card>
    );
  }

  // API error — show recovery UI with disconnect option
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="text-destructive" />
            Stripe Connection Error
          </CardTitle>
          <CardDescription>
            Your Stripe account could not be verified. This usually happens when switching between test and live mode. Disconnect and reconnect to fix this.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive border-destructive/40 hover:bg-destructive/10"
            onClick={() => {
              if (confirm('Disconnect your Stripe account so you can reconnect with the correct keys?')) {
                disconnectMutation.mutate();
              }
            }}
            disabled={disconnectMutation.isPending}
          >
            <Trash className="w-4 h-4 mr-2" />
            {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect & Reconnect'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Not connected yet
  if (!data?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warning className="text-yellow-500" />
            Payment Setup Required
          </CardTitle>
          <CardDescription>
            Connect your Stripe account to receive tournament payments directly to your bank account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-medium mb-2">What you'll get:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Receive payments directly to your bank</li>
                <li>✓ Automatic payouts (2-day rolling)</li>
                <li>✓ Access your own Stripe dashboard</li>
                <li>✓ Manage refunds and disputes</li>
                <li>✓ Professional payment processing</li>
              </ul>
            </div>
            <ConnectAccountButton />
            <p className="text-xs text-muted-foreground">
              By connecting, you agree to Stripe's terms of service. Setup takes about 5 minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connected but not onboarded
  if (!data?.onboarded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="text-orange-500" />
            Complete Stripe Onboarding
          </CardTitle>
          <CardDescription>
            You've started connecting your Stripe account, but haven't completed the setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.requirements && data.requirements.currently_due?.length > 0 && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Missing information:
                </p>
                <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                  {data.requirements.currently_due.map((req: string) => (
                    <li key={req}>{req.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </div>
            )}
            <ConnectAccountButton />
            <p className="text-xs text-muted-foreground">
              You'll be redirected to Stripe to complete your profile and verify your information.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fully onboarded
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="text-green-500" />
          Stripe Account Connected
        </CardTitle>
        <CardDescription>
          Your Stripe account is connected and ready to receive payments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold text-green-600">Active</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Charges</p>
              <p className="text-lg font-semibold">
                {data?.chargesEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Payouts</p>
              <p className="text-lg font-semibold">
                {data?.payoutsEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleViewDashboard} variant="outline">
              <ArrowSquareOut className="w-4 h-4 mr-2" />
              View Stripe Dashboard
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={() => {
                if (confirm('Disconnect your Stripe account? You will need to reconnect to accept payments.')) {
                  disconnectMutation.mutate();
                }
              }}
              disabled={disconnectMutation.isPending}
            >
              <Trash className="w-4 h-4 mr-2" />
              {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Tournament payments will be deposited directly to your connected bank account.
              Payouts typically arrive in 2 business days.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

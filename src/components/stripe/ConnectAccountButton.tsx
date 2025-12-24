import { useState } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const ConnectAccountButton = () => {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const response = await api.post('/stripe/connect/onboard');

      // Redirect to Stripe onboarding
      window.location.href = response.data.url;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start Stripe onboarding');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleConnect} disabled={loading} size="lg">
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? 'Loading...' : 'Connect Stripe Account'}
    </Button>
  );
};

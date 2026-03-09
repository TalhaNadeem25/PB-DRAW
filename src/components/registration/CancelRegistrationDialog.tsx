import { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Warning, CurrencyDollar, Calendar, Users, CircleNotch, XCircle, Info } from '@phosphor-icons/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../hooks/use-toast';
import { cancellationAPI } from '../../services/api';

interface CancelRegistrationDialogProps {
  eventId: string;
  eventName: string;
  tournamentName: string;
  isDoubles?: boolean;
  partnerName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface RefundPreview {
  amountPaid: number;
  refundPercentage: number;
  refundAmount: number;
  stripeFeeDeducted: number;
  daysUntilTournament: number;
  policy: {
    '>14 days': string;
    '7-14 days': string;
    '2-7 days': string;
    '<2 days': string;
  };
}

export default function CancelRegistrationDialog({
  eventId,
  eventName,
  tournamentName,
  isDoubles = false,
  partnerName,
  open,
  onOpenChange,
  onSuccess,
}: CancelRegistrationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [confirmStep, setConfirmStep] = useState<'preview' | 'confirm'>('preview');

  // Fetch refund preview
  const { data: refundPreview, isLoading: loadingPreview, error: refundPreviewError } = useQuery<RefundPreview>({
    queryKey: ['refund-preview', eventId],
    queryFn: async () => {
      const response = await cancellationAPI.getRefundPreview(eventId);
      return response.data;
    },
    enabled: open,
  });

  // Request cancellation mutation
  const requestCancellation = useMutation({
    mutationFn: async () => {
      return await cancellationAPI.requestCancellation(eventId, reason || undefined);
    },
    onSuccess: (data) => {
      const requiresPartnerResponse = data.data?.requiresPartnerResponse;

      toast({
        title: 'Cancellation Requested',
        description: requiresPartnerResponse
          ? 'Your partner has been notified and has 72 hours to respond.'
          : 'Your cancellation has been processed. Refund will be issued within 5-10 business days.',
      });

      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-cancellations'] });

      onOpenChange(false);
      setConfirmStep('preview');
      setReason('');

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Cancellation Failed',
        description: error.response?.data?.message || 'Failed to process cancellation',
        variant: 'destructive',
      });
    },
  });

  const handleCancel = () => {
    if (confirmStep === 'preview') {
      setConfirmStep('confirm');
    } else {
      requestCancellation.mutate();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setConfirmStep('preview');
    setReason('');
  };

  const getRefundColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <XCircle className="w-6 h-6 text-red-600" />
            Cancel Registration
          </DialogTitle>
          <DialogDescription className="text-base">
            Review the cancellation details and refund information for <strong>{eventName}</strong> in {tournamentName}.
          </DialogDescription>
        </DialogHeader>

        {loadingPreview ? (
          <div className="flex items-center justify-center py-12">
            <CircleNotch className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : refundPreview ? (
          <div className="space-y-6">
            {/* Refund Summary */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <CurrencyDollar className="w-5 h-5 text-green-700" />
                <h3 className="text-lg font-semibold text-green-900">Refund Summary</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-gray-700">Amount Paid:</span>
                  <span className="text-lg font-semibold">${refundPreview.amountPaid.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-gray-700">Stripe Processing Fee:</span>
                  <span className="text-sm text-gray-600">-${refundPreview.stripeFeeDeducted.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-gray-700">Refund Percentage:</span>
                  <span className={`text-lg font-bold ${getRefundColor(refundPreview.refundPercentage)}`}>
                    {refundPreview.refundPercentage}%
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 bg-white rounded-lg px-4 mt-4">
                  <span className="text-lg font-semibold text-gray-900">You Will Receive:</span>
                  <span className={`text-2xl font-bold ${getRefundColor(refundPreview.refundPercentage)}`}>
                    ${refundPreview.refundAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tournament Date Info */}
            <Alert className="bg-blue-50 border-blue-200">
              <Calendar className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Days until tournament:</strong> {refundPreview.daysUntilTournament} days
              </AlertDescription>
            </Alert>

            {/* Refund Policy */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Refund Policy</h4>
              </div>
              <div className="space-y-2 text-sm">
                {Object.entries(refundPreview.policy).map(([timeframe, refund]) => (
                  <div key={timeframe} className="flex justify-between py-1">
                    <span className="text-gray-600">{timeframe}:</span>
                    <span className="font-medium text-gray-900">{refund}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3 italic">
                * Processing fees (2.9% + $0.30) charged by Stripe are non-refundable
              </p>
            </div>

            {/* Partner Warning (for doubles) */}
            {isDoubles && partnerName && (
              <Alert variant="destructive" className="bg-yellow-50 border-yellow-500">
                <Users className="w-4 h-4 text-yellow-700" />
                <AlertDescription className="text-yellow-900">
                  <strong>Partner Impact:</strong> Your partner <strong>{partnerName}</strong> will be notified and will have <strong>72 hours</strong> to choose between:
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                    <li>Getting a refund as well (both of you will leave the tournament)</li>
                    <li>Finding a new partner (you get refunded, they stay registered)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Confirmation Step Warning */}
            {confirmStep === 'confirm' && (
              <Alert variant="destructive" className="animate-pulse">
                <Warning className="w-5 h-5" />
                <AlertDescription>
                  <strong>Final Confirmation:</strong> This action cannot be undone. Are you absolutely sure you want to cancel your registration?
                </AlertDescription>
              </Alert>
            )}

            {/* Reason (optional) */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason for cancellation <span className="text-gray-500">(optional)</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Let us know why you're canceling (helps us improve)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        ) : (
          <Alert variant="destructive">
            <Warning className="w-4 h-4" />
            <AlertDescription>
              {refundPreviewError && (refundPreviewError as any)?.response?.data?.message
                ? (refundPreviewError as any).response.data.message
                : 'Unable to load refund preview. Please try again or contact support.'}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={requestCancellation.isPending}
          >
            {confirmStep === 'confirm' ? 'Go Back' : 'Close'}
          </Button>

          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={requestCancellation.isPending || !refundPreview}
          >
            {requestCancellation.isPending ? (
              <>
                <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : confirmStep === 'confirm' ? (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Confirm Cancellation
              </>
            ) : (
              <>
                <Warning className="w-4 h-4 mr-2" />
                Continue to Cancel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

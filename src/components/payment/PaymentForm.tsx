import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { paymentAPI } from "@/services/api";
import { toast } from "sonner";

interface PaymentFormProps {
  // Support both single and multi-event
  teamId?: string;
  eventId?: string;

  // Partner invitation payment
  invitationId?: string;

  // Multi-event props
  eventBreakdown?: Array<{
    eventId: string;
    teamId: string;
    amount: number;
    eventName: string;
  }>;

  tournamentName: string;
  eventName?: string;
  amount: number;
  onSuccess: () => void;
  onCancel?: () => void;

  /** When true, renders compact layout for two-panel checkout modal (no summary, secure CTA, Stripe branding) */
  checkoutModal?: boolean;
}

const PaymentForm = ({
  teamId,
  eventId,
  invitationId,
  eventBreakdown,
  tournamentName,
  eventName,
  amount,
  onSuccess,
  onCancel,
  checkoutModal = false,
}: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Submit the payment to Stripe
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (submitError) {
        setError(submitError.message || "An error occurred during payment");
        toast.error(submitError.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Confirm payment with backend
        await paymentAPI.confirmPayment(paymentIntent.id);

        toast.success("Payment successful! Your registration is confirmed.");
        onSuccess();
      } else if (paymentIntent && paymentIntent.status === "processing") {
        toast.info("Payment is being processed. You'll receive a confirmation email soon.");
        onSuccess();
      } else {
        setError("Payment status unclear. Please contact support.");
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.response?.data?.message || "An unexpected error occurred");
      toast.error(err.response?.data?.message || "Payment failed");
      setIsProcessing(false);
    }
  };

  if (checkoutModal) {
    return (
      <div className="flex flex-col h-full">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="mb-6">
            <PaymentElement />
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mb-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-display font-bold text-foreground">Total Amount</p>
                <p className="text-xs text-muted-foreground mt-0.5">Includes court fees & registration</p>
              </div>
              <span className="font-display font-bold text-2xl text-foreground">
                ${amount.toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full h-12 font-display font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider text-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Complete Secure Payment
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <span>Powered by</span>
          <span className="font-semibold text-foreground/80">Stripe</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tournament</span>
          <span className="font-medium">{tournamentName}</span>
        </div>

        {eventBreakdown && eventBreakdown.length > 1 ? (
          <>
            <div className="text-sm font-medium mt-2 mb-1">Events:</div>
            {eventBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm pl-2">
                <span className="text-muted-foreground">{item.eventName}</span>
                <span className="font-medium">${item.amount.toFixed(2)}</span>
              </div>
            ))}
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Event</span>
            <span className="font-medium">{eventName}</span>
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-primary">
              ${amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Payment Details</h3>
          </div>
          <PaymentElement />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Pay ${amount.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="text-xs text-center text-muted-foreground">
        <p>Secure payment powered by Stripe</p>
        <p>Your payment information is encrypted and secure</p>
      </div>
    </div>
  );
};

export default PaymentForm;

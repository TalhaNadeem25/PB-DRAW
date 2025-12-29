import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Loader2,
  AlertCircle,
  DollarSign,
  CheckCircle2,
  UserPlus,
  Mail,
} from "lucide-react";
import { invitationAPI, paymentAPI } from "@/services/api";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PaymentForm from "@/components/payment/PaymentForm";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

const AcceptInvitation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<"details" | "payment">("details");
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Fetch invitation data
  const { data: invitationData, isLoading } = useQuery({
    queryKey: ['invitation', id],
    queryFn: () => invitationAPI.getById(id!),
    enabled: !!id,
  });

  const invitation = invitationData?.data;
  const team = invitation?.team;
  const event = team?.event;
  const tournament = event?.tournament;

  // Accept invitation and create payment
  const acceptMutation = useMutation({
    mutationFn: async () => {
      // Check if payment is required
      const entryFee = event?.entryFee || 0;

      if (entryFee > 0) {
        // Create payment intent for partner
        const paymentResponse = await paymentAPI.createPartnerPaymentIntent({
          invitationId: id!,
        });

        if (paymentResponse.data.requiresPayment) {
          setClientSecret(paymentResponse.data.clientSecret);
          setStep("payment");
        } else {
          // Free event - just accept
          await invitationAPI.accept(id!);
          toast.success("Invitation accepted! You've joined the team.");
          navigate('/teams');
        }
      } else {
        // Free event - just accept
        await invitationAPI.accept(id!);
        toast.success("Invitation accepted! You've joined the team.");
        navigate('/teams');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to accept invitation");
    },
  });

  const handlePaymentSuccess = () => {
    toast.success("Payment successful! You've joined the team.");
    navigate('/teams');
  };

  const handlePaymentCancel = () => {
    toast.info("Payment cancelled. You can try again from your invitations page.");
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!invitation) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Invitation Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This invitation doesn't exist or has expired.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if invitation is already accepted/declined
  if (invitation.status !== 'pending') {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Invitation {invitation.status}</h2>
            <p className="text-muted-foreground mb-6">
              This invitation has already been {invitation.status}.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const entryFee = event?.entryFee || 0;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-12">
          <div className="container mx-auto px-4">
            <div className="animate-fade-in">
              <Badge className="bg-secondary text-secondary-foreground mb-4">
                <Mail className="w-3 h-3 mr-1" />
                Team Invitation {step === "payment" && "- Payment"}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-2">
                You've Been Invited!
              </h1>
              <p className="text-xl text-primary-foreground/80">
                Join {invitation.inviter?.name || 'your teammate'}'s team
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {step === "details" ? (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Card */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        Team Invitation Details
                      </CardTitle>
                      <CardDescription>
                        You've been invited to join a team for {event?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Inviter Info */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3">Invited By</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Name</span>
                            <span className="font-medium">{invitation.inviter?.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Email</span>
                            <span className="font-medium">{invitation.inviter?.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Team Info */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3">Team Details</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Team Name</span>
                            <span className="font-medium">{team?.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Event</span>
                            <span className="font-medium">{event?.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Format</span>
                            <Badge variant="secondary" className="capitalize">
                              {event?.format}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      {invitation.message && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                          <h3 className="font-semibold mb-2 text-blue-600">Personal Message</h3>
                          <p className="text-sm text-muted-foreground">{invitation.message}</p>
                        </div>
                      )}

                      {/* Entry Fee Notice */}
                      {entryFee > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                          <div className="flex gap-3">
                            <DollarSign className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-amber-600 mb-1">Payment Required</p>
                              <p className="text-muted-foreground">
                                You'll need to pay ${entryFee.toFixed(2)} to join this team and confirm your registration.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={() => acceptMutation.mutate()}
                          disabled={acceptMutation.isPending}
                          className="flex-1"
                          size="lg"
                        >
                          {acceptMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : entryFee > 0 ? (
                            <>
                              Accept & Pay ${entryFee.toFixed(2)}
                              <DollarSign className="w-4 h-4 ml-2" />
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Accept Invitation
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate('/dashboard')}
                          size="lg"
                        >
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar - Tournament Info */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tournament Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{tournament?.name}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{tournament?.location}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {tournament && format(new Date(tournament.startDate), 'MMM dd')} - {tournament && format(new Date(tournament.endDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>

                      {entryFee > 0 && (
                        <div className="bg-primary/5 p-4 rounded-lg mt-4">
                          <p className="text-xs text-muted-foreground mb-2">Entry Fee</p>
                          <p className="text-2xl font-bold text-primary">
                            ${entryFee.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              /* Payment Step */
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <DollarSign className="w-6 h-6 text-primary" />
                    Complete Payment
                  </CardTitle>
                  <CardDescription>
                    Secure your spot on {team?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clientSecret ? (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: 'stripe',
                          variables: {
                            colorPrimary: '#ea580c',
                            colorBackground: '#ffffff',
                            colorText: '#1e293b',
                            colorDanger: '#ef4444',
                            fontFamily: 'system-ui, sans-serif',
                            borderRadius: '8px',
                          },
                        },
                      }}
                    >
                      <PaymentForm
                        invitationId={id || ''}
                        tournamentName={tournament?.name || ''}
                        eventName={event?.name || ''}
                        amount={entryFee}
                        onSuccess={handlePaymentSuccess}
                        onCancel={handlePaymentCancel}
                      />
                    </Elements>
                  ) : (
                    <div className="text-center py-12">
                      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading payment form...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AcceptInvitation;

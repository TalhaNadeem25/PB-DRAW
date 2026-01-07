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
  Sparkles,
  PartyPopper,
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
      const entryFee = event?.entryFee || 0;

      if (entryFee > 0) {
        const paymentResponse = await paymentAPI.createPartnerPaymentIntent({
          invitationId: id!,
        });

        if (paymentResponse.data.requiresPayment) {
          setClientSecret(paymentResponse.data.clientSecret);
          setStep("payment");
        } else {
          await invitationAPI.accept(id!);
          toast.success("Invitation accepted! You've joined the team.");
          navigate('/teams');
        }
      } else {
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
        <div className="min-h-screen bg-mesh-gradient flex items-center justify-center">
          <div className="text-center glass p-8 rounded-2xl">
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
        <div className="min-h-screen bg-mesh-gradient flex items-center justify-center p-4">
          <Card className="max-w-md w-full glass border-0 shadow-float">
            <CardContent className="pt-10 pb-8 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Invitation Not Found</h2>
              <p className="text-muted-foreground mb-6">
                This invitation doesn't exist or has expired.
              </p>
              <Button onClick={() => navigate('/dashboard')} variant="hero" className="hover-lift">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Check if invitation is already accepted/declined
  if (invitation.status !== 'pending') {
    return (
      <Layout>
        <div className="min-h-screen bg-mesh-gradient flex items-center justify-center p-4">
          <Card className="max-w-md w-full glass border-0 shadow-float">
            <CardContent className="pt-10 pb-8 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2 capitalize">
                Invitation {invitation.status}
              </h2>
              <p className="text-muted-foreground mb-6">
                This invitation has already been {invitation.status}.
              </p>
              <Button onClick={() => navigate('/dashboard')} variant="hero" className="hover-lift">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const entryFee = event?.entryFee || 0;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-12 relative overflow-hidden">
          {/* Floating elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 right-20 w-32 h-32 bg-secondary/20 rounded-full blur-2xl animate-float" />
            <div className="absolute bottom-10 left-20 w-40 h-40 bg-primary-foreground/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "1s" }} />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-secondary text-secondary-foreground gap-1 px-3 py-1">
                  <PartyPopper className="w-3 h-3" />
                  Team Invitation {step === "payment" && "- Payment"}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-2 flex items-center gap-3">
                You've Been Invited!
                <Sparkles className="w-10 h-10 text-secondary animate-bounce" />
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
                  <Card className="glass border-0 shadow-float overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
                    <CardHeader className="pt-8">
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <UserPlus className="w-6 h-6 text-primary" />
                        Team Invitation Details
                      </CardTitle>
                      <CardDescription>
                        You've been invited to join a team for {event?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-8">
                      {/* Inviter Info */}
                      <div className="bg-muted/50 p-5 rounded-xl border border-border/50">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" />
                          Invited By
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xl font-bold">
                            {invitation.inviter?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-lg">{invitation.inviter?.name}</p>
                            <p className="text-sm text-muted-foreground">{invitation.inviter?.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Team Info */}
                      <div className="bg-muted/50 p-5 rounded-xl border border-border/50">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          Team Details
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Team Name</span>
                            <span className="font-medium">{team?.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Event</span>
                            <span className="font-medium">{event?.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Format</span>
                            <Badge variant="secondary" className="capitalize">
                              {event?.format}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      {invitation.message && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                          <h3 className="font-semibold mb-2 text-primary">Personal Message</h3>
                          <p className="text-muted-foreground italic">"{invitation.message}"</p>
                        </div>
                      )}

                      {/* Entry Fee Notice */}
                      {entryFee > 0 && (
                        <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-5">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                              <DollarSign className="w-6 h-6 text-secondary" />
                            </div>
                            <div>
                              <p className="font-semibold text-secondary mb-1">Payment Required</p>
                              <p className="text-sm text-muted-foreground">
                                You'll need to pay <span className="font-bold text-foreground">${entryFee.toFixed(2)}</span> to join this team and confirm your registration.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-4 pt-4">
                        <Button
                          onClick={() => acceptMutation.mutate()}
                          disabled={acceptMutation.isPending}
                          variant="hero"
                          className="flex-1 h-14 text-lg hover-lift shadow-glow"
                        >
                          {acceptMutation.isPending ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : entryFee > 0 ? (
                            <>
                              Accept & Pay ${entryFee.toFixed(2)}
                              <DollarSign className="w-5 h-5 ml-2" />
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Accept Invitation
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate('/dashboard')}
                          className="h-14 px-8 hover-lift"
                        >
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar - Tournament Info */}
                <div className="space-y-6">
                  <Card className="glass border-0 shadow-float">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        Tournament Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-medium text-lg">{tournament?.name}</p>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{tournament?.location}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {tournament && format(new Date(tournament.startDate), 'MMM dd')} - {tournament && format(new Date(tournament.endDate), 'MMM dd, yyyy')}
                        </span>
                      </div>

                      {entryFee > 0 && (
                        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-5 rounded-xl mt-4 border border-primary/20">
                          <p className="text-xs text-muted-foreground mb-1">Entry Fee</p>
                          <p className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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
              <Card className="max-w-2xl mx-auto glass border-0 shadow-float overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
                <CardHeader className="pt-8">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <DollarSign className="w-6 h-6 text-primary" />
                    Complete Payment
                  </CardTitle>
                  <CardDescription>
                    Secure your spot on {team?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                  {clientSecret ? (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: 'stripe',
                          variables: {
                            colorPrimary: '#16a34a',
                            colorBackground: '#ffffff',
                            colorText: '#1e293b',
                            colorDanger: '#ef4444',
                            fontFamily: 'system-ui, sans-serif',
                            borderRadius: '12px',
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

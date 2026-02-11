import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  ArrowLeft,
  Loader2,
  AlertCircle,
  DollarSign,
  Target,
  UserPlus,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { tournamentAPI, eventAPI, teamAPI, invitationAPI, paymentAPI } from "@/services/api";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PaymentForm from "@/components/payment/PaymentForm";
import WaitlistButton from "@/components/registration/WaitlistButton";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

const EventRegistration = () => {
  const { tournamentId, eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [step, setStep] = useState<"team-details" | "payment">("team-details");
  const [createdTeam, setCreatedTeam] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);

  // Fetch tournament data
  const { data: tournamentData, isLoading: tournamentLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentAPI.getById(tournamentId!),
    enabled: !!tournamentId,
  });

  // Fetch event data
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventAPI.getById(eventId!),
    enabled: !!eventId,
  });

  const tournament = tournamentData?.data;
  const event = eventData?.data;

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: { eventId: string; eventFormat: string; partnerName?: string; partnerEmail?: string }) => {
      // Generate team name based on format
      let teamName = '';
      if (data.eventFormat === 'singles') {
        teamName = user?.name || 'Team';
      } else {
        teamName = data.partnerName
          ? `${user?.name} & ${data.partnerName}`
          : `${user?.name}'s Team`;
      }

      const teamData: any = {
        name: teamName,
        players: [user?._id],
      };

      const teamResponse = await teamAPI.create(data.eventId, teamData);

      // If partner email is provided, create invitation (but don't send email yet - will be sent after payment)
      if (data.partnerEmail && teamResponse.data) {
        try {
          await invitationAPI.send(teamResponse.data._id, {
            inviteeEmail: data.partnerEmail,
            inviteeName: data.partnerName,
            message: `${user?.name} has invited you to join their team for ${event?.name}`,
            sendEmail: false // Don't send email yet - will be sent after payment confirmation
          });
        } catch (inviteError) {
          console.error('Failed to create invitation:', inviteError);
        }
      }

      return teamResponse;
    },
    onSuccess: async (data) => {
      console.log('Team created successfully:', data.data);
      queryClient.invalidateQueries({ queryKey: ['events', tournamentId] });

      // Store the created team
      setCreatedTeam(data.data);

      // Check if payment is required
      const entryFee = event?.entryFee || 0;
      console.log('Entry fee:', entryFee);

      if (entryFee > 0) {
        // Create payment intent
        setIsPreparingPayment(true);
        try {
          console.log('Creating payment intent...');
          const paymentResponse = await paymentAPI.createIntent({
            teamId: data.data._id,
            eventId: eventId!,
          });

          console.log('Payment response:', paymentResponse);

          if (paymentResponse.data.requiresPayment) {
            // Move to payment step
            console.log('Setting client secret and moving to payment step');
            setClientSecret(paymentResponse.data.clientSecret);
            setStep("payment");
            setIsPreparingPayment(false);
          } else {
            // Free tournament
            console.log('No payment required');
            setIsPreparingPayment(false);
            toast.success("Successfully registered for the event!");
            navigate('/dashboard');
          }
        } catch (paymentError: any) {
          console.error('Payment setup error:', paymentError);
          setIsPreparingPayment(false);
          toast.error(paymentError.response?.data?.message || "Failed to set up payment");
        }
      } else {
        // No payment required
        console.log('Free tournament, no payment needed');
        toast.success("Successfully registered for the event!");
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to register for event");
    },
  });

  const handleCreateTeam = () => {
    if (!user) {
      toast.error("Please login to register");
      navigate("/login");
      return;
    }

    if (!eventId || !event) {
      toast.error("Event information not found");
      return;
    }

    createTeamMutation.mutate({
      eventId: eventId,
      eventFormat: event.format,
      partnerName: partnerName.trim() || undefined,
      partnerEmail: partnerEmail.trim() || undefined,
    });
  };

  const handlePaymentSuccess = () => {
    toast.success("Payment successful! Your registration is confirmed.");
    navigate('/dashboard');
  };

  const handlePaymentCancel = () => {
    toast.info("Payment cancelled. You can complete payment later from your Teams page.");
    navigate('/teams');
  };

  if (tournamentLoading || eventLoading || isPreparingPayment) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isPreparingPayment ? "Preparing payment..." : "Loading registration..."}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tournament || !event) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The event you're trying to register for doesn't exist.
            </p>
            <Button onClick={() => navigate('/tournaments')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournaments
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const entryFee = event.entryFee || 0;
  const requiresPartner = event.format !== 'singles';

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Compact top bar — no green hero */}
        <div className="border-b border-border/60 bg-card/50">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            <Link
              to={`/tournaments/${tournamentId}/register`}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tournament Registration
            </Link>
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${step === "team-details" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">1</span>
                Team Details
              </div>
              <div className="w-6 h-px bg-border" />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${step === "payment" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">2</span>
                Payment
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
              {event.name}
            </h1>
            <p className="text-muted-foreground text-sm">{tournament.name}</p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            {step === "team-details" ? (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Check if event is full and show waitlist */}
                  {event.currentTeams >= event.maxTeams && tournament?.settings?.allowWaitlist ? (
                    <WaitlistButton eventId={event._id} isEventFull={true} />
                  ) : event.currentTeams >= event.maxTeams ? (
                    <Card className="border-red-500 bg-red-50">
                      <CardHeader>
                        <CardTitle className="text-red-900 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Event Full
                        </CardTitle>
                        <CardDescription className="text-red-700">
                          This event has reached its maximum capacity and waitlist is not available.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button asChild>
                          <Link to={`/tournaments/${tournamentId}`}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Tournament
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="glass-card border-border/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <span>Team Information</span>
                          <CardDescription className="mt-1">
                            {requiresPartner
                              ? "Enter your partner's information to create your team"
                              : "Register as a singles player"}
                          </CardDescription>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Player Info */}
                      <div className="glass rounded-xl p-5 border border-border/50">
                        <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Your Information
                        </Label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Name</span>
                            <span className="font-medium">{user?.name}</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Email</span>
                            <span className="font-medium">{user?.email}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-muted-foreground">Skill Level</span>
                            <Badge variant="secondary" className="bg-primary/10 text-primary">{user?.skillLevel}</Badge>
                          </div>
                        </div>
                      </div>

                      {requiresPartner && (
                        <>
                          <Separator />

                          {/* Partner Details Form */}
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="partnerName">Partner Name (Optional)</Label>
                              <Input
                                id="partnerName"
                                placeholder="e.g., John Smith"
                                value={partnerName}
                                onChange={(e) => setPartnerName(e.target.value)}
                                className="mt-2"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Enter your partner's name for team identification
                              </p>
                            </div>

                            <div>
                              <Label htmlFor="partnerEmail">Partner Email (Optional)</Label>
                              <Input
                                id="partnerEmail"
                                type="email"
                                placeholder="partner@example.com"
                                value={partnerEmail}
                                onChange={(e) => setPartnerEmail(e.target.value)}
                                className="mt-2"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                We'll send them an invitation to join your team
                              </p>
                            </div>
                          </div>

                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <div className="flex gap-3">
                              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                              <div className="text-sm">
                                <p className="font-medium text-blue-600 mb-1">Partner Information</p>
                                <p className="text-muted-foreground">
                                  You can create your team now and add your partner later. Partner details are optional.
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <Button
                        onClick={handleCreateTeam}
                        disabled={createTeamMutation.isPending}
                        className="w-full"
                        size="lg"
                      >
                        {createTeamMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating Team...
                          </>
                        ) : entryFee > 0 ? (
                          <>
                            Continue to Payment
                            <DollarSign className="w-4 h-4 ml-2" />
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Complete Registration
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                  )}
                </div>

                {/* Sidebar - Event Summary */}
                <div className="space-y-6">
                  <Card className="glass-card border-border/50 shadow-lg overflow-hidden">
                    {/* Gradient accent */}
                    <div className="h-1.5 bg-hero-gradient" />
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        Event Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground text-xs">Event Type</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="capitalize bg-primary/10 text-primary">
                            {event.format.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline">
                            {event.playFormat?.split('-').map((word: string) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-muted-foreground text-xs">Skill Level</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="font-medium">{event.skillLevel}+</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-muted-foreground text-xs">Teams Registered</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="font-medium">
                            {event.currentTeams || 0} / {event.maxTeams}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-hero-gradient rounded-full transition-all duration-500"
                            style={{ width: `${((event.currentTeams || 0) / event.maxTeams) * 100}%` }}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-muted-foreground text-xs">Tournament</Label>
                        <p className="font-medium mt-1">{tournament.name}</p>
                      </div>

                      <div>
                        <Label className="text-muted-foreground text-xs">Location</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{tournament.location}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-muted-foreground text-xs">Dates</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(tournament.startDate), 'MMM dd')} - {format(new Date(tournament.endDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>

                      {entryFee > 0 && (
                        <>
                          <Separator />
                          <div className="glass rounded-xl p-4 border border-primary/20 shadow-glow">
                            <Label className="text-muted-foreground text-xs">Entry Fee</Label>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-3xl font-display font-bold text-primary">
                                ${entryFee.toFixed(2)}
                              </span>
                              <DollarSign className="w-8 h-8 text-primary/30" />
                            </div>
                          </div>
                        </>
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
                    Secure your spot in {event.name}
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
                        teamId={createdTeam?._id || ''}
                        eventId={eventId || ''}
                        tournamentName={tournament.name}
                        eventName={event.name}
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

export default EventRegistration;

import Layout from "@/components/layout/Layout";
import PaymentForm from "@/components/payment/PaymentForm";
import WaitlistButton from "@/components/registration/WaitlistButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { eventAPI, invitationAPI, paymentAPI, teamAPI, tournamentAPI, waitlistAPI } from "@/services/api";
import { formatEventSkillLevel } from "@/types/tournament";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Warning,
  ArrowLeft,
  Calendar,
  CheckCircle,
  CurrencyDollar,
  CircleNotch,
  MapPin,
  Target,
  Trophy,
  UserPlus,
  Users
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

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

  // Check if user was approved from waitlist — if so, bypass the "event full" gate
  const { data: waitlistPosition } = useQuery({
    queryKey: ['waitlist-position', eventId],
    queryFn: async () => {
      try {
        const res = await waitlistAPI.getMyPosition(eventId!);
        return res?.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!eventId && !!user,
    retry: false,
  });
  const isPromotedFromWaitlist = waitlistPosition?.status === 'promoted';

  // Restore form fields from localStorage after post-login redirect (do NOT auto-trigger mutation)
  useEffect(() => {
    if (user && tournamentId && eventId) {
      const pendingStr = localStorage.getItem('pendingEventRegistration');
      if (pendingStr) {
        try {
          const pendingData = JSON.parse(pendingStr);
          if (pendingData.tournamentId === tournamentId && pendingData.eventId === eventId) {
            setPartnerName(pendingData.partnerName || "");
            setPartnerEmail(pendingData.partnerEmail || "");
            toast.info("Registration details restored. Click Continue to proceed.");
          }
        } catch (e) {
          console.error("Failed to parse pending event registration", e);
        }
        // Always clear localStorage regardless — prevents stale data triggering on future visits
        localStorage.removeItem('pendingEventRegistration');
      }
    }
  // Only run once after user + route params are available — not on every re-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tournamentId, eventId]);

  // Always ask the backend to confirm the registration — even when the fee looks
  // like $0 client-side, the server is the source of truth for pricing and is
  // what actually marks the registration paid, creates the ticket, and (for
  // singles events) writes the registeredPlayers entry that pool assignment and
  // bracket generation depend on. Skipping this call for "free" registrations
  // used to leave the team unpaid and invisible everywhere. Shared between the
  // team-creation success handler and the "team already exists" retry path so
  // neither one can skip straight to a screen without actually confirming
  // anything server-side.
  const confirmRegistration = async (teamId: string) => {
    setIsPreparingPayment(true);
    try {
      console.log('Creating payment intent...');
      const paymentResponse = await paymentAPI.createIntent({ teamId, eventId: eventId! });
      console.log('Payment response:', paymentResponse);

      if (paymentResponse.data.requiresPayment) {
        console.log('Setting client secret and moving to payment step');
        setClientSecret(paymentResponse.data.clientSecret);
        setStep("payment");
        setIsPreparingPayment(false);
      } else {
        console.log('No payment required');
        setIsPreparingPayment(false);
        toast.success("Successfully registered for the event!");
        navigate('/registration-success', {
          state: {
            tournamentName: tournament?.name,
            startDate: tournament?.startDate,
            endDate: tournament?.endDate,
            location: tournament?.location,
            eventIds: eventId ? [eventId] : [],
          },
        });
      }
    } catch (paymentError: any) {
      console.error('Payment setup error:', paymentError);
      setIsPreparingPayment(false);
      toast.error(paymentError.response?.data?.message || "Failed to set up payment");
    }
  };

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
      setCreatedTeam(data.data);
      await confirmRegistration(data.data._id);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to register for event";
      if (error.response?.status === 409) {
        toast.error("You're already registered for this event.");
      } else {
        toast.error(msg);
      }
    },
  });

  const handleCreateTeam = () => {
    if (!eventId || !event) {
      toast.error("Event information not found");
      return;
    }

    // Team already created in this session:
    // - If a payment intent is already pending (clientSecret set), just resume that step.
    // - Otherwise (e.g. a free event where the previous confirm call never actually ran,
    //   or errored out silently), re-run confirmation rather than jumping to a payment
    //   step that has nothing to render.
    if (createdTeam) {
      if (clientSecret) {
        setStep("payment");
      } else {
        confirmRegistration(createdTeam._id);
      }
      return;
    }

    if (!user) {
      localStorage.setItem('pendingEventRegistration', JSON.stringify({
        tournamentId,
        eventId,
        eventFormat: event.format,
        partnerName: partnerName.trim(),
        partnerEmail: partnerEmail.trim()
      }));
      navigate(`/auth?redirect=/tournaments/${tournamentId}/register/${eventId}`);
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
    navigate('/registration-success', {
      state: {
        tournamentName: tournament?.name,
        startDate: tournament?.startDate,
        endDate: tournament?.endDate,
        location: tournament?.location,
        eventIds: eventId ? [eventId] : [],
      },
    });
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
            <CircleNotch className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
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
              <Warning className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Event Not Found</h2>
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

  const tournamentFee = tournament?.entryFee || 0;
  const entryFee = event.entryFee || 0;
  const totalFee = tournamentFee + entryFee;
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
          <div className="max-w-6xl mx-auto">
            {step === "team-details" ? (
              <div className="grid lg:grid-cols-[1fr_minmax(420px,480px)] gap-8 items-stretch">
                {/* Main Form */}
                <div className="min-w-0 space-y-6 flex flex-col">
                  {/* Check if event is full and show waitlist — promoted users bypass this */}
                  {event.currentTeams >= event.maxTeams && !isPromotedFromWaitlist && tournament?.settings?.allowWaitlist ? (
                    <WaitlistButton
                      eventId={event._id}
                      isEventFull={true}
                      tournamentId={tournamentId}
                      onPayNow={handleCreateTeam}
                    />
                  ) : event.currentTeams >= event.maxTeams && !isPromotedFromWaitlist ? (
                    <Card className="border-red-500 bg-red-50">
                      <CardHeader>
                        <CardTitle className="text-red-900 flex items-center gap-2">
                          <Warning className="w-5 h-5" />
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
                    {isPromotedFromWaitlist && (
                      <div className="mx-6 mt-6 rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold text-green-700">Your waitlist spot was approved!</p>
                          <p className="text-green-600">
                            {waitlistPosition?.promotionExpiresAt
                              ? `Complete registration before your spot expires.`
                              : 'Complete your registration below.'}
                          </p>
                        </div>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <span>{requiresPartner ? 'Team Information' : 'Registration'}</span>
                          <CardDescription className="mt-1">
                            {requiresPartner
                              ? "Enter your partner's information to create your team"
                              : "You're registering as a singles player — no team details needed"}
                          </CardDescription>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Player Info */}
                      <div className="glass rounded-xl p-5 border border-border/50">
                        <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          Your Information
                        </Label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Name</span>
                            <span className="font-medium">{user ? user.name : "Guest Player"}</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Email</span>
                            <span className="font-medium">{user ? user.email : "Will collect at checkout"}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-muted-foreground">Skill Level</span>
                            {user ? (
                              <Badge variant="secondary" className="bg-primary/10 text-primary">{user.skillLevel}</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-muted text-muted-foreground">Pending</Badge>
                            )}
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
                              <Warning className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
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
                        disabled={createTeamMutation.isPending || createTeamMutation.isSuccess}
                        className="w-full"
                        size="lg"
                      >
                        {createTeamMutation.isPending ? (
                          <>
                            <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
                            {requiresPartner ? 'Creating Team...' : 'Setting up registration...'}
                          </>
                        ) : totalFee > 0 ? (
                          <>
                            {requiresPartner ? 'Create Team &' : ''} Continue to Payment
                            <CurrencyDollar className="w-4 h-4 ml-2" />
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete Registration
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                  )}
                </div>

                {/* Sidebar — Event Summary */}
                <div className="space-y-4">
                  <Card className="border border-border/60 shadow-xl overflow-hidden bg-card">
                    {/* Colour-band header */}
                    <div className="bg-hero-gradient px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white/70 uppercase tracking-widest">Event Details</p>
                          <p className="font-display font-bold text-white text-base leading-tight">{event.name}</p>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-5 space-y-5">
                      {/* Format badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-primary/10 text-primary border border-primary/20 capitalize font-semibold">
                          {event.format.replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline" className="font-medium">
                          {event.playFormat?.split('-').map((w: string) =>
                            w.charAt(0).toUpperCase() + w.slice(1)
                          ).join(' ')}
                        </Badge>
                      </div>

                      {/* Stats grid — 2 columns, never cramped */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Skill Level</p>
                          <div className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-semibold text-sm">{formatEventSkillLevel(event.skillLevel)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            {(event.format || '').toLowerCase() === 'singles' ? 'Players' : 'Teams'}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-semibold text-sm">{event.currentTeams || 0} / {event.maxTeams}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-hero-gradient rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(((event.currentTeams || 0) / event.maxTeams) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tournament</p>
                          <p className="font-semibold text-sm leading-snug">{tournament.name}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Location</p>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium">{tournament.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dates — full width */}
                      <div className="flex items-center gap-3 rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Dates</p>
                          <p className="font-semibold text-sm mt-0.5">
                            {format(new Date(tournament.startDate), 'MMM d')} – {format(new Date(tournament.endDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      {/* Fee Breakdown */}
                      {totalFee > 0 ? (
                        <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <CurrencyDollar className="w-5 h-5 text-primary" />
                            </div>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fees</p>
                          </div>
                          {tournamentFee > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Tournament Entry</span>
                              <span className="font-medium">${tournamentFee.toFixed(2)}</span>
                            </div>
                          )}
                          {entryFee > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Event Entry</span>
                              <span className="font-medium">${entryFee.toFixed(2)}</span>
                            </div>
                          )}
                          {tournamentFee > 0 && entryFee > 0 && (
                            <div className="border-t border-primary/20 pt-2 flex items-center justify-between">
                              <span className="font-semibold text-sm">Total</span>
                              <span className="text-2xl font-display font-black text-primary">${totalFee.toFixed(2)}</span>
                            </div>
                          )}
                          {(tournamentFee === 0 || entryFee === 0) && (
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">Total</span>
                              <span className="text-2xl font-display font-black text-primary">${totalFee.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-5 py-4 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Entry Fee</p>
                            <p className="text-3xl font-display font-black text-green-600 mt-0.5">Free</p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <CurrencyDollar className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      )}

                      {/* Refund policy */}
                      <div className="rounded-lg bg-muted/30 border border-border/40 px-4 py-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <span className="font-semibold text-foreground">Refund Policy: </span>
                          Full refund if cancelled 7+ days before the event. No refunds within 7 days of event start.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              /* Payment Step */
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <CurrencyDollar className="w-6 h-6 text-primary" />
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
                        amount={totalFee}
                        onSuccess={handlePaymentSuccess}
                        onCancel={handlePaymentCancel}
                      />
                    </Elements>
                  ) : !createdTeam ? (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-muted-foreground">
                        Complete your team details first, or use the payment link from your email if you received one.
                      </p>
                      <Button variant="outline" onClick={() => setStep('team-details')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to registration
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CircleNotch className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
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

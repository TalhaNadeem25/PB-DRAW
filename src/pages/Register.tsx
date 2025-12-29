import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Clock,
  Target,
  UserPlus,
} from "lucide-react";
import { tournamentAPI, eventAPI, teamAPI, invitationAPI, paymentAPI } from "@/services/api";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PaymentForm from "@/components/payment/PaymentForm";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface EventSelection {
  eventId: string;
  event: any;
  partnerName?: string;
  partnerEmail?: string;
}

const Register = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Multi-event shopping cart state
  const [selectedEvents, setSelectedEvents] = useState<EventSelection[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [eventBreakdown, setEventBreakdown] = useState<Array<{
    eventId: string;
    teamId: string;
    amount: number;
    eventName: string;
  }>>([]);

  // Fetch tournament data
  const { data: tournamentData, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getById(id!),
    enabled: !!id,
  });

  // Fetch events for this tournament
  const { data: eventsData } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventAPI.getByTournament(id!),
    enabled: !!id,
  });

  // Fetch user's teams to check for existing registrations
  const { data: myTeamsData } = useQuery({
    queryKey: ['myTeams'],
    queryFn: () => teamAPI.getMyTeams(),
    enabled: !!user,
  });

  // Create teams for doubles/mixed events only
  const createAllTeamsMutation = useMutation({
    mutationFn: async (selections: EventSelection[]) => {
      // Separate singles from team events
      const singlesEvents = selections.filter(sel => sel.event.format === 'singles');
      const teamEvents = selections.filter(sel => sel.event.format !== 'singles');

      // Create teams only for doubles/mixed events
      const teamPromises = teamEvents.map(async (selection) => {
        const teamName = `${user?.name} & ${selection.partnerName || 'Partner'}`;

        const teamResponse = await teamAPI.create(selection.eventId, {
          name: teamName,
          players: [user?._id]
        });

        // Create invitation if partner provided (but don't send email yet - will be sent after payment)
        if (selection.partnerEmail && teamResponse.data) {
          try {
            await invitationAPI.send(teamResponse.data._id, {
              inviteeEmail: selection.partnerEmail,
              inviteeName: selection.partnerName,
              message: `${user?.name} invited you for ${selection.event.name}`,
              sendEmail: false // Don't send email yet - will be sent after payment confirmation
            });
          } catch (inviteError) {
            console.error('Failed to create invitation:', inviteError);
          }
        }

        return {
          eventId: selection.eventId,
          teamId: teamResponse.data._id,
          isSingles: false
        };
      });

      const createdTeams = await Promise.all(teamPromises);

      // For singles events, just return event info (no team creation)
      const singlesRegistrations = singlesEvents.map(sel => ({
        eventId: sel.eventId,
        teamId: null,
        isSingles: true
      }));

      return [...createdTeams, ...singlesRegistrations];
    },
    onSuccess: async (teamRegistrations) => {
      queryClient.invalidateQueries({ queryKey: ['events', id] });

      const totalFee = selectedEvents.reduce((sum, sel) => sum + (sel.event.entryFee || 0), 0);

      if (totalFee > 0) {
        // Create multi-event payment intent
        try {
          const paymentResponse = await paymentAPI.createMultiEventIntent({
            eventRegistrations: teamRegistrations
          });

          if (paymentResponse.data.requiresPayment) {
            setClientSecret(paymentResponse.data.clientSecret);
            setEventBreakdown(paymentResponse.data.eventBreakdown);
            setIsPaymentDialogOpen(true);
          } else {
            toast.success('Successfully registered for all events!');
            setSelectedEvents([]);
            navigate('/dashboard');
          }
        } catch (paymentError: any) {
          console.error('Payment setup error:', paymentError);
          toast.error(paymentError.response?.data?.message || 'Failed to set up payment');
        }
      } else {
        toast.success('Successfully registered for all events!');
        setSelectedEvents([]);
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create teams');
    },
  });

  const tournament = tournamentData?.data;
  const events = eventsData?.data || [];
  const myTeams = myTeamsData?.data || [];

  // Get event IDs user is already registered for (both team and singles)
  // IMPORTANT: Only count PAID teams - unpaid teams don't count as registered
  const teamEventIds = myTeams
    .filter((team: any) => team.paymentStatus === 'paid') // Only paid teams
    .map((team: any) => team.event?._id || team.event)
    .filter(Boolean)
    .map(String); // Convert to strings for consistent comparison

  // Also check if user is registered as singles player in any events
  // IMPORTANT: Only count PAID registrations
  const singlesEventIds = events
    .filter((event: any) => {
      if (!event.registeredPlayers || event.registeredPlayers.length === 0) {
        return false;
      }
      return event.registeredPlayers.some((reg: any) => {
        if (!reg || !reg.player || !user?._id) {
          return false;
        }
        // Convert both to strings for comparison
        const regPlayerId = String(reg.player?._id || reg.player);
        const userId = String(user._id);
        // Only count if this registration is paid
        return regPlayerId === userId && reg.paymentStatus === 'paid';
      });
    })
    .map((event: any) => String(event._id));

  const registeredEventIds = [...new Set([...teamEventIds, ...singlesEventIds])];

  // Calculate total for shopping cart
  const cartTotal = selectedEvents.reduce((sum, sel) => sum + (sel.event.entryFee || 0), 0);

  const handleEventToggle = (event: any) => {
    if (!user) {
      toast.error("Please login to register");
      navigate("/login");
      return;
    }

    // Check if user is already registered for this event
    if (registeredEventIds.includes(String(event._id))) {
      toast.error("You are already registered for this event");
      return;
    }

    const isSelected = selectedEvents.some(sel => sel.eventId === event._id);

    if (isSelected) {
      // Remove from selection
      setSelectedEvents(prev => prev.filter(sel => sel.eventId !== event._id));
    } else {
      // Add to selection
      setSelectedEvents(prev => [...prev, {
        eventId: event._id,
        event: event,
        partnerName: '',
        partnerEmail: ''
      }]);
    }
  };

  const handlePartnerUpdate = (eventId: string, field: 'partnerName' | 'partnerEmail', value: string) => {
    setSelectedEvents(prev => prev.map(sel =>
      sel.eventId === eventId ? { ...sel, [field]: value } : sel
    ));
  };

  const handleProceedToCheckout = () => {
    if (selectedEvents.length === 0) {
      toast.error("Please select at least one event");
      return;
    }

    // Validate doubles/mixed events have partner info (optional but recommended)
    const doublesEventsWithoutPartner = selectedEvents.filter(
      sel => (sel.event.format === 'doubles' || sel.event.format === 'mixed-doubles') && !sel.partnerName
    );

    if (doublesEventsWithoutPartner.length > 0) {
      toast.info("You can add partner information later from the Teams page");
    }

    // Create teams for all selected events
    createAllTeamsMutation.mutate(selectedEvents);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false);
    setClientSecret(null);
    setEventBreakdown([]);
    setSelectedEvents([]);
    navigate('/dashboard');
  };

  const handlePaymentCancel = () => {
    setIsPaymentDialogOpen(false);

    // Check if any of the selected events are singles
    const hasSingles = selectedEvents.some(sel => sel.event.format === 'singles');
    const hasTeams = selectedEvents.some(sel => sel.event.format !== 'singles');

    // Show appropriate message and redirect based on event types
    if (hasSingles && !hasTeams) {
      // Only singles events
      toast.info("Payment cancelled. You can try registering again from the tournament page.");
      navigate(`/tournaments/${id}`);
    } else if (hasTeams && !hasSingles) {
      // Only team events (doubles/mixed)
      toast.info("Payment cancelled. You can complete payment later from your Teams page.");
      navigate('/teams');
    } else {
      // Mix of singles and team events
      toast.info("Payment cancelled. You can retry from the tournament page or complete payment from Teams.");
      navigate(`/tournaments/${id}`);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading registration...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The tournament you're trying to register for doesn't exist.
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

  const isRegistered = tournament.participants?.some((p: any) => p._id === user?.id);
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;
  const canRegister = !isRegistered && !isFull && tournament.status !== 'completed';

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-12">
          <div className="container mx-auto px-4">
            <Link
              to={`/tournaments/${id}`}
              className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tournament Details
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="animate-fade-in">
                <Badge className="bg-secondary text-secondary-foreground mb-4">
                  Event Registration
                </Badge>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
                  {tournament.name}
                </h1>
                <div className="flex flex-wrap gap-4 text-primary-foreground/80">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {tournament.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {format(new Date(tournament.startDate), 'MMM dd, yyyy')} - {format(new Date(tournament.endDate), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tournament Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Tournament Information
                  </CardTitle>
                  <CardDescription>Details about this tournament</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tournament.description && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Description</Label>
                      <p className="text-sm mt-1">{tournament.description}</p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Location</Label>
                      <p className="font-medium flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {tournament.location}
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground text-xs">Dates</Label>
                      <p className="font-medium flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(tournament.startDate), 'MMM dd')} - {format(new Date(tournament.endDate), 'MMM dd, yyyy')}
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground text-xs">Participants</Label>
                      <p className="font-medium flex items-center gap-2 mt-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {tournament.currentParticipants || 0} / {tournament.maxParticipants}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Events List */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Events</CardTitle>
                  <CardDescription>
                    Select an event to view details and register
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        No events available for this tournament yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.map((event: any) => {
                        const isFull = event.currentTeams >= event.maxTeams;
                        const isAlreadyRegistered = registeredEventIds.includes(String(event._id));
                        const isSelected = selectedEvents.some(sel => sel.eventId === event._id);
                        const selection = selectedEvents.find(sel => sel.eventId === event._id);
                        const needsPartner = event.format === 'doubles' || event.format === 'mixed-doubles';

                        // Check if there's an unpaid registration for this event
                        const hasUnpaidRegistration = myTeams.some((team: any) =>
                          (String(team.event?._id || team.event) === String(event._id)) &&
                          team.paymentStatus === 'unpaid'
                        );

                        const isDisabled = isFull || isAlreadyRegistered;

                        return (
                          <div
                            key={event._id}
                            onClick={() => !isDisabled && handleEventToggle(event)}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                              isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            } ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                            }`}
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <Checkbox
                                checked={isSelected || isAlreadyRegistered}
                                disabled={isDisabled}
                                className="mt-1 pointer-events-none"
                              />
                              <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1">{event.name}</h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" className="capitalize">
                                    {event.format.replace('-', ' ')}
                                  </Badge>
                                  <Badge variant="outline">
                                    {event.playFormat?.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                  </Badge>
                                </div>
                              </div>
                              {isFull && (
                                <Badge variant="destructive">Full</Badge>
                              )}
                              {isAlreadyRegistered && !isFull && (
                                <Badge variant="default" className="bg-green-600">Registered</Badge>
                              )}
                              {hasUnpaidRegistration && !isAlreadyRegistered && !isFull && (
                                <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700">
                                  Payment Pending
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-muted-foreground" />
                                <span>Skill: {event.skillLevel}+</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{event.currentTeams || 0} / {event.maxTeams}</span>
                              </div>
                              {event.entryFee > 0 ? (
                                <div className="flex items-center gap-2 font-semibold text-primary">
                                  <DollarSign className="w-4 h-4" />
                                  <span>${event.entryFee}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-green-600">
                                  <DollarSign className="w-4 h-4" />
                                  <span>Free</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="capitalize">{event.status}</span>
                              </div>
                            </div>

                            {/* Partner form for doubles/mixed events */}
                            {isSelected && needsPartner && (
                              <div
                                className="mt-4 pt-4 border-t space-y-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Label className="text-sm font-medium">Partner Information (Optional)</Label>
                                <div className="grid md:grid-cols-2 gap-3">
                                  <Input
                                    placeholder="Partner Name"
                                    value={selection?.partnerName || ''}
                                    onChange={(e) => handlePartnerUpdate(event._id, 'partnerName', e.target.value)}
                                  />
                                  <Input
                                    type="email"
                                    placeholder="Partner Email"
                                    value={selection?.partnerEmail || ''}
                                    onChange={(e) => handlePartnerUpdate(event._id, 'partnerEmail', e.target.value)}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  You can add your partner later from the Teams page
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Shopping Cart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Events ({selectedEvents.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedEvents.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                        <Trophy className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Select events from the list to register
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {selectedEvents.map((sel, idx) => (
                          <div key={sel.eventId} className="flex justify-between items-start text-sm">
                            <span className="flex-1">{sel.event.name}</span>
                            <span className="font-medium">
                              {sel.event.entryFee > 0 ? `$${sel.event.entryFee}` : 'Free'}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-semibold">Total</span>
                          <span className="text-2xl font-bold text-primary">
                            ${cartTotal.toFixed(2)}
                          </span>
                        </div>

                        <Button
                          onClick={handleProceedToCheckout}
                          disabled={createAllTeamsMutation.isPending}
                          className="w-full"
                        >
                          {createAllTeamsMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating Teams...
                            </>
                          ) : (
                            cartTotal > 0 ? 'Proceed to Payment' : 'Complete Registration'
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Organizer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Organizer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{tournament.organizer?.name || "Tournament Organizer"}</p>
                  {tournament.organizer?.email && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {tournament.organizer.email}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
          if (!open) {
            handlePaymentCancel();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-primary" />
                Complete Payment
              </DialogTitle>
              <DialogDescription>
                Complete your payment to confirm your registration for {selectedEvents.length} event{selectedEvents.length > 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>

            {clientSecret && (
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
                  eventBreakdown={eventBreakdown}
                  tournamentName={tournament?.name || ''}
                  amount={cartTotal}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </Elements>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Register;

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

const Register = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [createdTeam, setCreatedTeam] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

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

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (tournamentId: string) => tournamentAPI.register(tournamentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      toast.success("Successfully registered for the tournament!");
      setIsRegisterDialogOpen(false);
      setSelectedEvent(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to register");
    },
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: { eventId: string; eventFormat: string; partnerName?: string; partnerEmail?: string }) => {
      // Generate team name based on format
      let teamName = '';
      if (data.eventFormat === 'singles') {
        teamName = user?.name || 'Team';
      } else {
        // For doubles/mixed, combine both names if partner provided
        teamName = data.partnerName
          ? `${user?.name} & ${data.partnerName}`
          : `${user?.name}'s Team`;
      }

      const teamData: any = {
        name: teamName,
        players: [user?._id],
      };

      const teamResponse = await teamAPI.create(data.eventId, teamData);

      // If partner email is provided, send invitation
      if (data.partnerEmail && teamResponse.data) {
        try {
          await invitationAPI.send(teamResponse.data._id, {
            inviteeEmail: data.partnerEmail,
            inviteeName: data.partnerName,
            message: `${user?.name} has invited you to join their team for ${selectedEvent?.name}`
          });
        } catch (inviteError) {
          console.error('Failed to send invitation:', inviteError);
          // Don't fail the whole operation if invitation fails
        }
      }

      return teamResponse;
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', id] });

      // Store the created team
      setCreatedTeam(data.data);
      setIsPartnerDialogOpen(false);

      // Check if payment is required
      const entryFee = tournament?.entryFee || 0;

      if (entryFee > 0) {
        // Create payment intent
        try {
          const paymentResponse = await paymentAPI.createIntent({
            teamId: data.data._id,
            eventId: selectedEvent._id,
          });

          if (paymentResponse.data.requiresPayment) {
            // Show payment dialog
            setClientSecret(paymentResponse.data.clientSecret);
            setIsPaymentDialogOpen(true);
          } else {
            // Free tournament or payment not required
            toast.success("Successfully registered for the event!");
            setPartnerName("");
            setPartnerEmail("");
            setSelectedEvent(null);
          }
        } catch (paymentError: any) {
          console.error('Payment setup error:', paymentError);
          toast.error(paymentError.response?.data?.message || "Failed to set up payment");
        }
      } else {
        // No payment required
        if (variables.eventFormat === 'singles') {
          toast.success("Successfully registered for the event!");
        } else if (variables.partnerEmail) {
          toast.success("Team created and invitation sent to your partner!");
        } else {
          toast.success("Team created! You can invite your partner from the Teams page.");
        }
        setPartnerName("");
        setPartnerEmail("");
        setSelectedEvent(null);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to register for event");
    },
  });

  const tournament = tournamentData?.data;
  const events = eventsData?.data || [];

  const handleRegister = () => {
    if (!user) {
      toast.error("Please login to register");
      navigate("/login");
      return;
    }

    if (id) {
      registerMutation.mutate(id);
    }
  };

  const handleEventSelect = (event: any) => {
    if (!user) {
      toast.error("Please login to register");
      navigate("/login");
      return;
    }

    // Navigate to dedicated event registration page
    navigate(`/tournaments/${id}/register/${event._id}`);
  };

  const handleCreateTeamWithPartner = () => {
    if (selectedEvent && selectedEvent._id) {
      createTeamMutation.mutate({
        eventId: selectedEvent._id,
        eventFormat: selectedEvent.format,
        partnerName: partnerName.trim() || undefined,
        partnerEmail: partnerEmail.trim() || undefined,
      });
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false);
    setClientSecret(null);
    setCreatedTeam(null);
    setPartnerName("");
    setPartnerEmail("");
    setSelectedEvent(null);
    navigate('/dashboard');
  };

  const handlePaymentCancel = () => {
    setIsPaymentDialogOpen(false);
    toast.info("Payment cancelled. You can complete payment later from your Teams page.");
    navigate('/teams');
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
                      <Label className="text-muted-foreground text-xs">Entry Fee</Label>
                      <p className="font-medium text-primary flex items-center gap-2 mt-1">
                        <DollarSign className="w-4 h-4" />
                        {tournament.entryFee ? `$${tournament.entryFee}` : "Free"}
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

                        return (
                          <div
                            key={event._id}
                            className="p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors cursor-pointer"
                            onClick={() => handleEventSelect(event)}
                          >
                            <div className="flex items-start justify-between mb-3">
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
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-muted-foreground" />
                                <span>Skill: {event.skillLevel}+</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{event.currentTeams || 0} / {event.maxTeams}</span>
                              </div>
                              {event.entryFee && (
                                <div className="flex items-center gap-2 font-semibold text-primary">
                                  <DollarSign className="w-4 h-4" />
                                  <span>${event.entryFee}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="capitalize">{event.status}</span>
                              </div>
                            </div>

                            <Button
                              className="w-full mt-4"
                              variant="outline"
                            >
                              Register for Event
                            </Button>
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
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Event Registration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-semibold">Select Events to Register</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click on any event card below to create your team and register
                    </p>
                  </div>

                  <div className="pt-4 border-t space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available Events</span>
                      <span className="font-medium">{events.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entry Fee Range</span>
                      <span className="font-medium">
                        {events.length > 0
                          ? `$${Math.min(...events.map((e: any) => e.entryFee || 0))} - $${Math.max(...events.map((e: any) => e.entryFee || 0))}`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
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

        {/* Partner Information Dialog */}
        <Dialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-primary" />
                Add Partner for {selectedEvent?.name}
              </DialogTitle>
              <DialogDescription>
                Enter your partner's information to create your team. You can skip this and add them later from the Teams page.
              </DialogDescription>
            </DialogHeader>

            {selectedEvent && (
              <div className="space-y-6">
                {/* Event Info */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Event Type</span>
                    <Badge variant="secondary" className="capitalize">
                      {selectedEvent.format.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Players Required</span>
                    <span className="font-medium">2</span>
                  </div>
                  {selectedEvent.entryFee && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Entry Fee</span>
                      <span className="font-medium text-primary">${selectedEvent.entryFee}</span>
                    </div>
                  )}
                </div>

                {/* Partner Details Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="partnerName">Partner Name (Optional)</Label>
                    <Input
                      id="partnerName"
                      placeholder="e.g., John Smith"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className="mt-1"
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
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll use this to notify your partner in future updates
                    </p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-600 mb-1">Partner Registration</p>
                      <p className="text-muted-foreground">
                        You can create your team now and add your partner later from the Teams page. Team invitations will be available in a future update.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPartnerDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTeamWithPartner}
                disabled={createTeamMutation.isPending}
              >
                {createTeamMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Team...
                  </>
                ) : (
                  partnerName.trim() ? "Create Team with Partner" : "Create Team (Add Partner Later)"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
          if (!open) {
            handlePaymentCancel();
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-primary" />
                Complete Payment
              </DialogTitle>
              <DialogDescription>
                Complete your payment to confirm your registration for {selectedEvent?.name}
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
                  teamId={createdTeam?._id || ''}
                  eventId={selectedEvent?._id || ''}
                  tournamentName={tournament?.name || ''}
                  eventName={selectedEvent?.name || ''}
                  amount={tournament?.entryFee || 0}
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

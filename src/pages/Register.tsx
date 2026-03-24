import Layout from "@/components/layout/Layout";
import PaymentForm from "@/components/payment/PaymentForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { eventAPI, invitationAPI, paymentAPI, teamAPI, tournamentAPI } from "@/services/api";
import { formatEventSkillLevel } from "@/types/tournament";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    Warning,
    ArrowLeft,
    Calendar,
    Check,
    CaretUp,
    Clock,
    FileText,
    Hash,
    CircleNotch,
    Envelope,
    MapPin,
    Phone,
    ShieldCheck,
    ShoppingBag,
    Trophy,
    User,
    UserPlus,
    Users
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface EventSelection {
  eventId: string;
  event: any;
  partnerName?: string;
  partnerEmail?: string;
}

type SortOption = "startTime" | "price";

const Register = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedEvents, setSelectedEvents] = useState<EventSelection[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [eventBreakdown, setEventBreakdown] = useState<Array<{
    eventId: string;
    teamId: string;
    amount: number;
    eventName: string;
  }>>([]);

  // Filters (reference layout)
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("startTime");

  const { data: tournamentData, isLoading } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => tournamentAPI.getById(id!),
    enabled: !!id,
  });

  const { data: eventsData } = useQuery({
    queryKey: ["events", id],
    queryFn: () => eventAPI.getByTournament(id!),
    enabled: !!id,
  });

  const { data: myTeamsData } = useQuery({
    queryKey: ["myTeams"],
    queryFn: () => teamAPI.getMyTeams(),
    enabled: !!user,
  });

  // Load pending registration from localStorage if user just logged in
  useEffect(() => {
    if (user && id) {
      const pendingStr = localStorage.getItem('pendingRegistration');
      if (pendingStr) {
        try {
          const pendingData = JSON.parse(pendingStr);
          if (pendingData.tournamentId === id && pendingData.selections) {
            setSelectedEvents(pendingData.selections);
            // Optional: immediately trigger checkout or let user review
            toast.success("Your cart has been restored. Please review and proceed to checkout.");
          }
          localStorage.removeItem('pendingRegistration');
        } catch (e) {
          console.error("Failed to parse pending registration", e);
        }
      }
    }
  }, [user, id]);

  const createAllTeamsMutation = useMutation({
    mutationFn: async (selections: EventSelection[]) => {
      const singlesEvents = selections.filter((sel) => sel.event.format === "singles");
      const teamEvents = selections.filter((sel) => sel.event.format !== "singles");

      const teamPromises = teamEvents.map(async (selection) => {
        const teamName = `${user?.name} & ${selection.partnerName || "Partner"}`;
        const teamResponse = await teamAPI.create(selection.eventId, {
          name: teamName,
          players: [user?._id],
        });
        if (selection.partnerEmail && teamResponse.data) {
          try {
            await invitationAPI.send(teamResponse.data._id, {
              inviteeEmail: selection.partnerEmail,
              inviteeName: selection.partnerName,
              message: `${user?.name} invited you for ${selection.event.name}`,
              sendEmail: false,
            });
          } catch (inviteError) {
            console.error("Failed to create invitation:", inviteError);
          }
        }
        return {
          eventId: selection.eventId,
          teamId: teamResponse.data._id,
          isSingles: false,
        };
      });

      const createdTeams = await Promise.all(teamPromises);
      const singlesRegistrations = singlesEvents.map((sel) => ({
        eventId: sel.eventId,
        teamId: null,
        isSingles: true,
      }));
      return [...createdTeams, ...singlesRegistrations];
    },
    onSuccess: async (teamRegistrations) => {
      queryClient.invalidateQueries({ queryKey: ["events", id] });
      const totalFee = selectedEvents.reduce((sum, sel) => sum + (sel.event.entryFee || 0), 0);
      if (totalFee > 0) {
        try {
          const paymentResponse = await paymentAPI.createMultiEventIntent({
            eventRegistrations: teamRegistrations,
          });
          if (paymentResponse.data.requiresPayment) {
            setClientSecret(paymentResponse.data.clientSecret);
            setEventBreakdown(paymentResponse.data.eventBreakdown);
            setIsPaymentDialogOpen(true);
          } else {
            toast.success("Successfully registered for all events!");
            setSelectedEvents([]);
            navigate("/registration-success", { state: { tournamentName: tournamentData?.data?.name, eventIds: teamRegistrations.map(r => r.eventId) }});
          }
        } catch (paymentError: any) {
          console.error("Payment setup error:", paymentError);
          toast.error(paymentError.response?.data?.message || "Failed to set up payment");
        }
      } else {
        toast.success("Successfully registered for all events!");
        setSelectedEvents([]);
        navigate("/registration-success", { state: { tournamentName: tournamentData?.data?.name, eventIds: teamRegistrations.map(r => r.eventId) }});
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create teams");
    },
  });

  const tournament = tournamentData?.data;
  const events = eventsData?.data || [];
  const myTeams = myTeamsData?.data || [];

  const teamEventIds = myTeams
    .filter((team: any) => team.paymentStatus === "paid")
    .map((team: any) => team.event?._id || team.event)
    .filter(Boolean)
    .map(String);

  const singlesEventIds = events
    .filter((event: any) =>
      event.registeredPlayers?.some(
        (reg: any) =>
          reg?.player &&
          user?._id &&
          String(reg.player?._id || reg.player) === String(user._id) &&
          reg.paymentStatus === "paid"
      )
    )
    .map((event: any) => String(event._id));

  const registeredEventIds = [...new Set([...teamEventIds, ...singlesEventIds])];
  const cartTotal = selectedEvents.reduce((sum, sel) => sum + (sel.event.entryFee || 0), 0);

  // Filter and sort events for display
  const filteredAndSortedEvents = useMemo(() => {
    let list = [...events];
    if (formatFilter !== "all") {
      list = list.filter((e: any) => {
        if (formatFilter === "singles") return e.format === "singles";
        if (formatFilter === "doubles") return e.format === "doubles";
        if (formatFilter === "mixed") return e.format === "mixed-doubles";
        return true;
      });
    }
    if (skillFilter !== "all") {
      list = list.filter((e: any) => {
        const level = String(e.skillLevel || "").replace("+", "");
        const num = parseFloat(level) || 0;
        if (skillFilter === "3.0") return num <= 3.5;
        if (skillFilter === "4.5") return num >= 4.0;
        return true;
      });
    }
    if (sortBy === "price") {
      list.sort((a: any, b: any) => (a.entryFee || 0) - (b.entryFee || 0));
    } else {
      list.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
    }
    return list;
  }, [events, formatFilter, skillFilter, sortBy]);

  const openEventsCount = filteredAndSortedEvents.filter(
    (e: any) => (e.currentTeams || 0) < (e.maxTeams || 0) && !registeredEventIds.includes(String(e._id))
  ).length;

  const handleEventToggle = (event: any) => {
    if (registeredEventIds.includes(String(event._id))) {
      toast.error("You are already registered for this event");
      return;
    }
    const isSelected = selectedEvents.some((sel) => sel.eventId === event._id);
    if (isSelected) {
      setSelectedEvents((prev) => prev.filter((sel) => sel.eventId !== event._id));
    } else {
      setSelectedEvents((prev) => [
        ...prev,
        { eventId: event._id, event, partnerName: "", partnerEmail: "" },
      ]);
    }
  };

  const handlePartnerUpdate = (
    eventId: string,
    field: "partnerName" | "partnerEmail",
    value: string
  ) => {
    setSelectedEvents((prev) =>
      prev.map((sel) => (sel.eventId === eventId ? { ...sel, [field]: value } : sel))
    );
  };

  const handleProceedToCheckout = () => {
    if (selectedEvents.length === 0) {
      toast.error("Please select at least one event");
      return;
    }

    if (!user) {
      // Save pending registration and redirect to auth
      localStorage.setItem('pendingRegistration', JSON.stringify({
        tournamentId: id,
        selections: selectedEvents
      }));
      navigate(`/auth?redirect=/tournaments/${id}/register`);
      return;
    }

    const doublesWithoutPartner = selectedEvents.filter(
      (sel) =>
        (sel.event.format === "doubles" || sel.event.format === "mixed-doubles") && !sel.partnerName
    );
    if (doublesWithoutPartner.length > 0) {
      toast.info("You can add partner information later from the Teams page");
    }
    createAllTeamsMutation.mutate(selectedEvents);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false);
    setClientSecret(null);
    setEventBreakdown([]);
    setSelectedEvents([]);
    navigate("/registration-success", { state: { tournamentName: tournamentData?.data?.name }});
  };

  const handlePaymentCancel = () => {
    setIsPaymentDialogOpen(false);
    const hasSingles = selectedEvents.some((sel) => sel.event.format === "singles");
    const hasTeams = selectedEvents.some((sel) => sel.event.format !== "singles");
    if (hasSingles && !hasTeams) {
      toast.info("Payment cancelled. You can try registering again from the tournament page.");
      navigate(`/tournaments/${id}`);
    } else if (hasTeams && !hasSingles) {
      toast.info("Payment cancelled. You can complete payment later from your Teams page.");
      navigate("/teams");
    } else {
      toast.info("Payment cancelled. You can retry from the tournament page or complete payment from Teams.");
      navigate(`/tournaments/${id}`);
    }
  };

  const organizer = tournament?.organizer;
  const organizerName = organizer?.name || "Tournament Organizer";
  const organizerInitials = organizerName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const totalParticipants = tournament?.currentParticipants ?? 0;
  const maxParticipants = tournament?.maxParticipants ?? 0;
  const participantsPercent = maxParticipants ? Math.min(100, (totalParticipants / maxParticipants) * 100) : 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <CircleNotch className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
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
              <Warning className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Tournament Not Found</h2>
            <p className="text-muted-foreground mb-6">The tournament you're trying to register for doesn't exist.</p>
            <Button onClick={() => navigate("/tournaments")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournaments
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Compact header — reference style */}
        <div className="border-b border-border/60 bg-card/50">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <Link
                  to={`/tournaments/${id}`}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Tournament
                </Link>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-12 h-12 rounded-xl bg-hero-gradient flex items-center justify-center shadow-md shrink-0">
                    <Trophy className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
                      {tournament.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                      <span className="font-display font-semibold text-primary uppercase tracking-wider">
                        Event Registration
                      </span>
                      <span className="text-border">•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {tournament.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-display font-semibold tracking-wider text-muted-foreground uppercase">
                    Organized by
                  </p>
                  <p className="font-display font-bold text-foreground">{organizerName}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 border border-border/60">
                  <span className="text-sm font-display font-bold text-foreground">{organizerInitials}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main: three-card row then two columns */}
        <div className="container mx-auto px-4 sm:px-6 py-8">
          {/* Top row: Description | Participants | Organizer (exact reference layout) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card 1: Description — white */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm overflow-hidden">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-display font-semibold tracking-wider text-muted-foreground uppercase">
                  Info
                </span>
              </div>
              <h2 className="font-display font-bold text-lg text-foreground uppercase tracking-tight mb-2">
                Description
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tournament.description ||
                  "Join us for the most prestigious pickleball event of the year! Open to all skill levels."}
              </p>
            </div>

            {/* Card 2: Participants — white */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm overflow-hidden">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-display font-semibold tracking-wider text-muted-foreground uppercase">
                  Capacity
                </span>
              </div>
              <h2 className="font-display font-bold text-lg text-foreground uppercase tracking-tight mb-2">
                Participants
              </h2>
              <p className="font-display font-bold text-2xl text-foreground mb-3">
                <span className="text-foreground">{totalParticipants}</span>
                <span className="text-muted-foreground font-medium"> / {maxParticipants}</span>
              </p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    participantsPercent >= 90 ? "bg-destructive" : participantsPercent >= 70 ? "bg-secondary" : "bg-hero-gradient"
                  )}
                  style={{ width: `${participantsPercent}%` }}
                />
              </div>
            </div>

            {/* Card 3: Organizer — dark background (#141926) */}
            <div className="rounded-2xl p-6 shadow-sm overflow-hidden bg-[#141926] border border-[#1e293b]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-sm font-display font-bold text-foreground">{organizerInitials}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-white truncate">{organizerName}</p>
                  <p className="text-[10px] font-display font-semibold tracking-wider text-slate-400 uppercase">
                    Director
                  </p>
                </div>
              </div>
              {organizer?.email && (
                <p className="text-sm text-white flex items-center gap-2 mb-2 truncate">
                  <Envelope className="w-4 h-4 text-slate-400 shrink-0" />
                  {organizer.email}
                </p>
              )}
              {organizer?.phone && (
                <p className="text-sm text-white flex items-center gap-2 mb-4 truncate">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  {organizer.phone}
                </p>
              )}
              {!organizer?.phone && organizer?.email && <div className="mb-4" />}
              <Button
                className="w-full rounded-xl bg-[#283141] hover:bg-[#334155] text-white font-display font-bold text-sm uppercase tracking-wider border-0"
                size="sm"
                asChild
              >
                <a href={`mailto:${organizer?.email || ""}`}>Message Organizer</a>
              </Button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* Left column — available events only */}
            <main className="flex-1 min-w-0 space-y-6">
              {/* Available events */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-display font-bold text-xl text-foreground">
                    Available Events
                  </h2>
                  <Badge variant="secondary" className="font-display font-bold text-primary bg-primary/10 border-primary/20">
                    {openEventsCount} Open
                  </Badge>
                </div>

                {filteredAndSortedEvents.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No events match the current filters.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {filteredAndSortedEvents.map((event: any) => {
                      const isFull = (event.currentTeams || 0) >= (event.maxTeams || 0);
                      const isAlreadyRegistered = registeredEventIds.includes(String(event._id));
                      const isSelected = selectedEvents.some((sel) => sel.eventId === event._id);
                      const selection = selectedEvents.find((sel) => sel.eventId === event._id);
                      const needsPartner =
                        event.format === "doubles" || event.format === "mixed-doubles";
                      const hasUnpaidRegistration = myTeams.some(
                        (team: any) =>
                          String(team.event?._id || team.event) === String(event._id) &&
                          team.paymentStatus === "unpaid"
                      );
                      const isDisabled = isFull || isAlreadyRegistered;
                      const spotsLeft = Math.max(0, (event.maxTeams || 0) - (event.currentTeams || 0));

                      const formatLabel =
                        event.format === "mixed-doubles"
                          ? "Mixed Doubles"
                          : event.format?.charAt(0).toUpperCase() + (event.format || "").slice(1);
                      const playLabel = (event.playFormat || "")
                        .split("-")
                        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ");

                      return (
                        <li key={event._id}>
                          <div
                            onClick={() => !isDisabled && handleEventToggle(event)}
                            className={cn(
                              "glass-card rounded-2xl p-5 transition-all duration-300 border-2",
                              isDisabled && "opacity-60 cursor-not-allowed",
                              !isDisabled && "cursor-pointer hover:border-primary/30 hover:shadow-float",
                              isSelected
                                ? "border-primary bg-primary/5 shadow-md"
                                : "border-transparent"
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                {event.format === "singles" ? (
                                  <User className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <Users className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <h3 className="font-display font-bold text-foreground">{event.name}</h3>
                                  {isSelected && (
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {formatLabel}
                                  </Badge>
                                  <Badge
                                    variant={isSelected ? "default" : "secondary"}
                                    className={cn(isSelected && "bg-primary")}
                                  >
                                    {playLabel}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Trophy className="w-4 h-4" />
                                    Skill: {formatEventSkillLevel(event.skillLevel)}
                                  </span>
                                  {isFull ? (
                                    <Badge variant="destructive" className="text-xs">
                                      Event Full
                                    </Badge>
                                  ) : hasUnpaidRegistration ? (
                                    <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-800">
                                      Payment Pending
                                    </Badge>
                                  ) : (
<span className="flex items-center gap-1">
                                    <UserPlus className="w-4 h-4" />
                                    {spotsLeft} {(event.format || "").toLowerCase() === "singles" ? (spotsLeft === 1 ? "player spot" : "player spots") : (spotsLeft === 1 ? "team spot" : "team spots")} left
                                  </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {tournament.startDate
                                      ? format(new Date(tournament.startDate), "hh:mm a")
                                      : "—"}
                                  </span>
                                </div>
                                {isSelected && needsPartner && (
                                  <div
                                    className="mt-4 pt-4 border-t border-border/60 space-y-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Label className="text-sm font-medium">Partner (optional)</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <Input
                                        placeholder="Partner name"
                                        value={selection?.partnerName || ""}
                                        onChange={(e) =>
                                          handlePartnerUpdate(event._id, "partnerName", e.target.value)
                                        }
                                      />
                                      <Input
                                        type="email"
                                        placeholder="Partner email"
                                        value={selection?.partnerEmail || ""}
                                        onChange={(e) =>
                                          handlePartnerUpdate(event._id, "partnerEmail", e.target.value)
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p
                                  className={cn(
                                    "font-display font-bold text-lg",
                                    isSelected ? "text-primary" : "text-foreground"
                                  )}
                                >
                                  {event.entryFee > 0 ? `$${event.entryFee}` : "Free"}
                                </p>
                                {isAlreadyRegistered && (
                                  <span className="text-xs text-primary font-semibold">Registered</span>
                                )}
                                {isSelected && !isAlreadyRegistered && (
                                  <span className="text-xs font-display font-semibold text-primary">
                                    Added to cart
                                  </span>
                                )}
                                {isFull && !isAlreadyRegistered && (
                                  <div className="flex flex-col items-end gap-1 mt-1">
                                    {tournament?.settings?.allowWaitlist ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-primary bg-transparent text-primary hover:bg-primary/10 hover:text-primary hover:border-primary"
                                        asChild
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Link to={`/tournaments/${id}/register/${event._id}`}>
                                          <UserPlus className="w-4 h-4 mr-1" />
                                          Join Waitlist
                                        </Link>
                                      </Button>
                                    ) : (
                                      <span className="text-xs text-destructive font-semibold">
                                        Event full
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </main>

            {/* Right sidebar — filters, summary */}
            <aside className="lg:w-[340px] shrink-0 space-y-6">
              {/* Filter events */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Hash className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-bold text-foreground uppercase tracking-tight">
                    Filter Events
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase">
                      Format
                    </Label>
                    <Select value={formatFilter} onValueChange={setFormatFilter}>
                      <SelectTrigger className="mt-1.5 h-9">
                        <SelectValue placeholder="All formats" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Formats</SelectItem>
                        <SelectItem value="singles">Singles</SelectItem>
                        <SelectItem value="doubles">Doubles</SelectItem>
                        <SelectItem value="mixed">Mixed Doubles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase block mb-2">
                      Skill Level
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {["all", "3.0", "4.5"].map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => setSkillFilter(skill)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-display font-semibold border transition-colors",
                            skillFilter === skill
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                          )}
                        >
                          {skill === "all" ? "All" : `${skill}+`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase">
                        Sort by
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy("startTime");
                          setFormatFilter("all");
                          setSkillFilter("all");
                        }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sort"
                          checked={sortBy === "startTime"}
                          onChange={() => setSortBy("startTime")}
                          className="text-primary border-border"
                        />
                        <span className="text-sm font-medium">Start Time</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sort"
                          checked={sortBy === "price"}
                          onChange={() => setSortBy("price")}
                          className="text-primary border-border"
                        />
                        <span className="text-sm font-medium">Price: Low to High</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration summary — green CTA card */}
              <div className="rounded-2xl overflow-hidden border-2 border-primary/30 bg-primary/10 shadow-lg">
                <div className="p-5 bg-hero-gradient">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-primary-foreground flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5" />
                      Registration Summary
                    </h3>
                    <CaretUp className="w-5 h-5 text-primary-foreground opacity-80" />
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {selectedEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Select events from the list to add them here.
                    </p>
                  ) : (
                    <>
                      <ul className="space-y-3">
                        {selectedEvents.map((sel) => (
                          <li
                            key={sel.eventId}
                            className="flex items-start justify-between gap-2 text-sm"
                          >
                            <div>
                              <p className="font-medium text-foreground">{sel.event.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {tournament.startDate
                                  ? format(new Date(tournament.startDate), "MMM d, hh:mm a")
                                  : "—"}
                              </p>
                            </div>
                            <span className="font-display font-bold text-primary shrink-0">
                              {sel.event.entryFee > 0 ? `$${sel.event.entryFee}` : "Free"}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-border/60 pt-3 space-y-1">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Fees</span>
                          <span>—</span>
                        </div>
                        <div className="flex justify-between font-display font-bold text-foreground pt-2">
                          <span>Total</span>
                          <span className="text-primary text-lg">${cartTotal.toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        onClick={handleProceedToCheckout}
                        disabled={createAllTeamsMutation.isPending}
                        className="w-full h-12 font-display font-bold rounded-xl bg-foreground text-background hover:bg-foreground/90 shadow-md"
                      >
                        {createAllTeamsMutation.isPending ? (
                          <>
                            <CircleNotch className="w-5 h-5 mr-2 animate-spin" />
                            Creating…
                          </>
                        ) : (
                          <>
                            Checkout Now
                            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Payment dialog — unchanged */}
        <Dialog
          open={isPaymentDialogOpen}
          onOpenChange={(open) => {
            if (!open) handlePaymentCancel();
          }}
        >
          <DialogContent className="max-w-4xl md:max-w-5xl max-h-[90vh] p-0 overflow-y-auto bg-transparent border-none shadow-2xl grid grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)]">
            {/* Left panel: Tournament details (dark) */}
            <div className="bg-[#07101f] text-white px-8 py-8 flex flex-col gap-8">
              {/* Logo + brand */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center shadow-md">
                  <Trophy className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-bold text-lg tracking-tight">PB DRAW</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
                    Tournament Details
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold mb-1.5">
                    Event
                  </p>
                  <p className="font-display font-bold text-xl leading-snug">
                    {tournament.name}
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 mt-0.5 text-slate-400" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
                        Date & Time
                      </p>
                      <p className="mt-0.5">
                        {tournament.startDate
                          ? `${format(new Date(tournament.startDate), "PP")} • ${format(
                              new Date(tournament.startDate),
                              "p",
                            )}`
                          : "TBA"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
                        Location
                      </p>
                      <p className="mt-0.5">{tournament.location}</p>
                    </div>
                  </div>

                  {user && (
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 mt-0.5 text-slate-400" />
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
                          Player
                        </p>
                        <p className="mt-0.5">{user.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security footer */}
              <div className="mt-auto pt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Bank-level 256-bit encryption</span>
              </div>
            </div>

            {/* Right panel: Payment details (Stripe) */}
            <div className="bg-card px-6 sm:px-8 py-7 sm:py-8 flex flex-col min-h-0">
              <DialogHeader className="mb-4 sm:mb-6 text-left">
                <DialogTitle className="text-2xl font-display font-bold tracking-tight">
                  Payment Details
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1.5">
                  Complete your payment to confirm your registration for{" "}
                  {selectedEvents.length} event{selectedEvents.length > 1 ? "s" : ""}.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 min-h-0">
                {clientSecret && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: "stripe",
                        variables: {
                          colorPrimary: "hsl(145 70% 35%)",
                          colorBackground: "#ffffff",
                          colorText: "#1e293b",
                          colorDanger: "#ef4444",
                          fontFamily: "Inter, system-ui, sans-serif",
                          borderRadius: "8px",
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      eventBreakdown={eventBreakdown}
                      tournamentName={tournament?.name || ""}
                      amount={cartTotal}
                      onSuccess={handlePaymentSuccess}
                      checkoutModal
                    />
                  </Elements>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Register;

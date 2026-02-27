import Layout from "@/components/layout/Layout";
import RefundsPanel from "@/components/tournament-dashboard/RefundsPanel";
import ScoresPanel from "@/components/tournament-dashboard/ScoresPanel";
import TestDataPanel from "@/components/tournament-dashboard/TestDataPanel";
import BracketViewer from "@/components/tournament/BracketViewer";
import AIPlannerChat from "@/components/tournament/EnhancedAIPlannerChat";
import ExportButtons from "@/components/tournament/ExportButtons";
import RegisteredPlayers from "@/components/tournament/RegisteredPlayers";
import TournamentPlanner from "@/components/tournament/TournamentPlanner";
import TournamentSchedule from "@/components/tournament/TournamentSchedule";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { cn } from "@/lib/utils";
import { eventAPI, favoritesAPI, tournamentAPI } from "@/services/api";
import type { GameType, TournamentFormat } from "@/types/tournament";
import { formatEventSkillLevel } from "@/types/tournament";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    ChevronRight,
    Clock,
    Heart,
    Image as ImageIcon,
    Layers,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Share2,
    Trophy,
    Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

// Dashboard components
import DashboardOverview, {
    type ActivityItem,
} from "@/components/tournament-dashboard/DashboardOverview";
import DashboardTopBar from "@/components/tournament-dashboard/DashboardTopBar";
import OrganizerEventsPanel from "@/components/tournament-dashboard/OrganizerEventsPanel";
import TournamentDashboardSidebar, {
    MobileDashboardNav,
    type DashboardSection,
} from "@/components/tournament-dashboard/TournamentDashboardSidebar";

/* ─── Status config ─── */
const statusConfig = {
  open: {
    label: "Registration Open",
    className: "bg-primary/10 text-primary border-primary/20",
    dotClass: "bg-primary",
  },
  closed: {
    label: "Registration Closed",
    className: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dotClass: "bg-destructive animate-pulse",
  },
  completed: {
    label: "Completed",
    className: "bg-accent text-accent-foreground border-accent-foreground/20",
    dotClass: "bg-accent-foreground",
  },
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
};

const TournamentDetail = () => {
  /* ─── Hooks ─── */
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { socket, joinTournament, leaveTournament } = useSocket();
  const queryClient = useQueryClient();

  // Active section from URL (?tab=dashboard)
  const activeSection = (searchParams.get("tab") as DashboardSection) || "dashboard";
  const setActiveSection = useCallback(
    (section: DashboardSection) => {
      setSearchParams({ tab: section }, { replace: true });
    },
    [setSearchParams]
  );

  /* ─── Local state ─── */
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteTournamentDialogOpen, setIsDeleteTournamentDialogOpen] = useState(false);
  const [isStartTournamentDialogOpen, setIsStartTournamentDialogOpen] = useState(false);
  const [isCompleteTournamentDialogOpen, setIsCompleteTournamentDialogOpen] = useState(false);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [newEvent, setNewEvent] = useState({
    name: "",
    gameType: "Singles" as GameType,
    format: "Round Robin" as TournamentFormat,
    skillLevel: "3.5-4.0",
    maxPlayers: 32,
    entryFee: 50,
    addPlayoffStage: false,
  });

  const isFavorite = id ? favoritesAPI.isFavorite(id) : false;

  /* ─── Queries ─── */
  const { data, isLoading, error } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => tournamentAPI.getById(id!),
    enabled: !!id,
  });

  /* ─── Mutations ─── */
  const createEventMutation = useMutation({
    mutationFn: (d: any) => eventAPI.create(id!, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      setIsCreateEventOpen(false);
      setNewEvent({ name: "", gameType: "Singles", format: "Round Robin", skillLevel: "3.5-4.0", maxPlayers: 32, entryFee: 50, addPlayoffStage: false });
      toast.success("Event created successfully!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create event"),
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => eventAPI.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
      toast.success("Event deleted successfully!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete event"),
  });

  const deleteTournamentMutation = useMutation({
    mutationFn: (tid: string) => tournamentAPI.delete(tid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      setIsDeleteTournamentDialogOpen(false);
      toast.success("Tournament deleted successfully!");
      navigate("/tournaments");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete tournament"),
  });

  const startTournamentMutation = useMutation({
    mutationFn: (tid: string) => tournamentAPI.startTournament(tid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      setIsStartTournamentDialogOpen(false);
      toast.success("Tournament started! It's now live.");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to start tournament"),
  });

  const completeTournamentMutation = useMutation({
    mutationFn: (tid: string) => tournamentAPI.completeTournament(tid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      setIsCompleteTournamentDialogOpen(false);
      toast.success("Tournament completed! Great event.");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to complete tournament"),
  });

  /* ─── Socket ─── */
  useEffect(() => {
    if (id) {
      joinTournament(id);
      return () => { leaveTournament(id); };
    }
  }, [id, joinTournament, leaveTournament]);

  useEffect(() => {
    if (!socket) return;

    const pushActivity = (desc: string, entity: string, action: string) => {
      setRecentActivities((prev) => [
        { id: crypto.randomUUID(), timestamp: new Date(), description: desc, entity, action },
        ...prev,
      ].slice(0, 50));
    };

    const handleTournamentUpdate = (tournamentData: any) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      toast.info("Tournament information updated");
      pushActivity("Tournament details updated", "Tournament", "Update");
    };

    const handleMatchUpdate = (matchData: any) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      pushActivity("Match updated", "Match", "Update");
    };

    const handleScoreUpdate = (scoreData: any) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      toast.success(`Match score updated: ${scoreData.team1Score}-${scoreData.team2Score}`);
      pushActivity(`Score: ${scoreData.team1Score}-${scoreData.team2Score}`, "Score", "Update");
    };

    socket.on("tournament-updated", handleTournamentUpdate);
    socket.on("match-updated", handleMatchUpdate);
    socket.on("score-updated", handleScoreUpdate);
    return () => {
      socket.off("tournament-updated", handleTournamentUpdate);
      socket.off("match-updated", handleMatchUpdate);
      socket.off("score-updated", handleScoreUpdate);
    };
  }, [socket, id, queryClient]);

  /* ─── Handlers ─── */
  const handleDeleteClick = (eventId: string, eventName: string) => {
    toast.warning(`Warning: Deleting "${eventName}" will permanently remove all associated data.`, { duration: 4000 });
    setEventToDelete(eventId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => { if (eventToDelete) deleteEventMutation.mutate(eventToDelete); };

  const handleDeleteTournamentClick = () => {
    toast.warning(`Warning: Deleting "${tournament?.name}" will permanently remove the tournament and all associated data.`, { duration: 4000 });
    setIsDeleteTournamentDialogOpen(true);
  };

  const handleConfirmDeleteTournament = () => { if (id) deleteTournamentMutation.mutate(id); };
  const handleStartTournamentClick = () => { setIsStartTournamentDialogOpen(true); };
  const handleConfirmStartTournament = () => { if (id) startTournamentMutation.mutate(id); };
  const handleCompleteTournamentClick = () => { setIsCompleteTournamentDialogOpen(true); };
  const handleConfirmCompleteTournament = () => { if (id) completeTournamentMutation.mutate(id); };

  const handleCreateEvent = () => {
    if (!newEvent.name) { toast.error("Please enter an event name"); return; }
    const playFormat = newEvent.format === "Pools + Playoffs" ? "pool-play" : newEvent.format.toLowerCase().replace(/ /g, "-");
    createEventMutation.mutate({
      name: newEvent.name,
      format: newEvent.gameType.toLowerCase().replace(" ", "-"),
      playFormat,
      addPlayoffStage: playFormat !== 'round-robin',
      skillLevel: newEvent.skillLevel,
      maxTeams: newEvent.maxPlayers,
      entryFee: newEvent.entryFee,
      status: "upcoming",
    });
  };

  const handleToggleFavorite = () => {
    if (!id) return;
    if (isFavorite) { favoritesAPI.removeFavorite(id); toast.success("Removed from favorites"); }
    else { favoritesAPI.addFavorite(id); toast.success("Added to favorites"); }
    queryClient.invalidateQueries({ queryKey: ["favorite-tournaments"] });
  };

  /* ─── Data ─── */
  const tournament = data?.data;

  /* ─── Loading / Error ─── */
  if (isLoading) {
    return (
      <Layout variant="minimal">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading tournament details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !tournament) {
    return (
      <Layout variant="minimal">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The tournament you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/tournaments")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournaments
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const statusInfo = statusConfig[tournament.status as keyof typeof statusConfig] || statusConfig.draft;
  const organizerId = typeof tournament.organizer === "string" ? tournament.organizer : tournament.organizer?._id;
  const isOrganizer = user?._id === organizerId || user?.role === "admin";

  /* ─── Alert Dialogs (shared by both views) ─── */
  const alertDialogs = (
    <>
      {/* Delete Event */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event and all associated data including teams, pools, and matches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setEventToDelete(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteEventMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteEventMutation.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>) : "Yes, Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Tournament */}
      <AlertDialog open={isDeleteTournamentDialogOpen} onOpenChange={setIsDeleteTournamentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tournament and all associated data including events, teams, pools, matches, and registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteTournamentDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteTournament} disabled={deleteTournamentMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteTournamentMutation.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>) : "Yes, Delete Tournament"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Start Tournament */}
      <AlertDialog open={isStartTournamentDialogOpen} onOpenChange={setIsStartTournamentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the tournament go live and appear on the "Live Tournaments" page. Players will see this tournament as "In Progress" and matches can begin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsStartTournamentDialogOpen(false)}>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStartTournament} disabled={startTournamentMutation.isPending} className="bg-court-green text-white hover:bg-court-green-dark">
              {startTournamentMutation.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting...</>) : "Yes, Start Tournament"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Tournament */}
      <AlertDialog open={isCompleteTournamentDialogOpen} onOpenChange={setIsCompleteTournamentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the tournament as finished. The status will change to "Completed" and it will no longer appear as a live tournament. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsCompleteTournamentDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCompleteTournament} disabled={completeTournamentMutation.isPending} className="bg-foreground text-background hover:bg-foreground/90">
              {completeTournamentMutation.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Completing...</>) : "Yes, Complete Tournament"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  /* ═══════════════════════════════════════════
     ORGANIZER VIEW — Dashboard Layout
  ═══════════════════════════════════════════ */
  if (isOrganizer) {
    const renderSection = () => {
      switch (activeSection) {
        case "dashboard":
          return <DashboardOverview tournament={tournament} recentActivities={recentActivities} />;
        case "events":
          return (
            <OrganizerEventsPanel
              tournamentId={id!}
              tournament={tournament}
              events={tournament.events || []}
              isCreateEventOpen={isCreateEventOpen}
              setIsCreateEventOpen={setIsCreateEventOpen}
              newEvent={newEvent}
              setNewEvent={setNewEvent}
              onCreateEvent={handleCreateEvent}
              createEventPending={createEventMutation.isPending}
              onDeleteEvent={handleDeleteClick}
            />
          );
        case "pools":
          return (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="font-display font-bold text-2xl flex items-center gap-2">
                  <Layers className="w-6 h-6 text-primary" />
                  Pools
                </h2>
                <p className="text-muted-foreground mt-1">
                  Manage pools, standings, and matches for each event. Select an event to create pools, assign teams, and run pool play or playoffs.
                </p>
              </div>
              {(tournament.events?.length ?? 0) > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(tournament.events || []).map((event: any) => (
                    <div
                      key={event._id}
                      className="glass-card rounded-2xl border border-border/50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-primary/30 hover:shadow-float transition-all"
                    >
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold text-lg truncate">{event.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="capitalize text-xs">
                            {event.format?.replace("-", " ") ?? "—"}
                          </Badge>
                          <span>
                            {(event.currentTeams || 0)} / {event.maxTeams || "—"} {(event.format || "").toLowerCase() === "singles" ? "players" : "teams"}
                          </span>
                        </div>
                      </div>
                      <Button asChild className="shrink-0">
                        <Link to={`/tournaments/${id}/events/${event._id}/pools`}>
                          Manage pools
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-2xl border border-border/50 p-12 text-center">
                  <Layers className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground font-medium">No events yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add events in the Events tab, then come back here to manage pools for each event.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveSection("events")}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Go to Events
                  </Button>
                </div>
              )}
            </div>
          );
        case "registrations":
          return <RegisteredPlayers tournamentId={id!} />;
        case "planner":
          return <TournamentPlanner tournament={tournament} events={tournament.events || []} />;
        case "ai-planner":
          return (
            <AIPlannerChat
              tournamentId={id!}
              onEventsCreated={() => {
                queryClient.invalidateQueries({ queryKey: ["tournament", id] });
                queryClient.invalidateQueries({ queryKey: ["events", id] });
                toast.success("Events created! Check the Events tab.");
              }}
            />
          );
        case "schedule":
          return (
            <TournamentSchedule
              tournamentId={id!}
              tournamentStartDate={tournament.startDate}
            />
          );
        case "brackets":
          return <BracketViewer tournamentId={id!} />;
        case "scores":
          return (
            <ScoresPanel
              tournamentId={id!}
              events={tournament.events || []}
            />
          );
        case "refunds":
          return <RefundsPanel tournamentId={id!} tournamentName={tournament.name} />;
        case "test":
          return <TestDataPanel tournamentId={id!} />;
        default:
          return <DashboardOverview tournament={tournament} recentActivities={recentActivities} />;
      }
    };

    return (
      <Layout variant="minimal">
        <Helmet>
          <title>Dashboard - {tournament.name} | Pickle Rally</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            {/* Top Bar */}
            <DashboardTopBar
              tournament={tournament}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
              onStartTournament={handleStartTournamentClick}
              onCompleteTournament={handleCompleteTournamentClick}
              onDeleteTournament={handleDeleteTournamentClick}
            />

            {/* Mobile nav */}
            <MobileDashboardNav activeSection={activeSection} onSectionChange={setActiveSection} />

            {/* Main layout: sidebar + content */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              <TournamentDashboardSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                tournamentId={id!}
              />

              <main className="flex-1 min-w-0 font-sans">{renderSection()}</main>
            </div>
          </div>

          {alertDialogs}
        </div>
      </Layout>
    );
  }

  /* ═══════════════════════════════════════════
     PLAYER VIEW — Public Layout
  ═══════════════════════════════════════════ */
  return (
    <Layout variant="minimal">
      <Helmet>
        <title>{tournament.name} | Pickle Rally</title>
        <meta name="description" content={tournament.description || `Register for ${tournament.name} on Pickle Rally.`} />
        <meta property="og:title" content={`${tournament.name} | Pickle Rally`} />
        <meta property="og:description" content={tournament.description || `Register for ${tournament.name} on Pickle Rally.`} />
        {tournament.image && <meta property="og:image" content={tournament.image} />}
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen bg-background">
        {/* Compact Hero Header (Solid Premium Design) */}
        <div className="bg-card border-b border-border/60 py-10 relative overflow-hidden shadow-sm">
          <div className="container mx-auto px-4 relative z-10">
            <Link to="/tournaments" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Tournaments
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 overflow-hidden">
              <div className="animate-fade-in">
                <Badge variant="outline" className={cn("font-medium border mb-3 backdrop-blur-sm", statusInfo.className)}>
                  <span className={cn("w-2 h-2 rounded-full mr-2", statusInfo.dotClass)} />
                  {statusInfo.label}
                </Badge>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3 break-words">
                  {tournament.name}
                </h1>
                <div className="flex flex-wrap gap-3 text-muted-foreground font-sans">
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full text-sm border border-border/50">
                    <MapPin className="w-4 h-4 text-primary" />
                    {tournament.location}
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full text-sm border border-border/50">
                    <Calendar className="w-4 h-4 text-primary" />
                    {format(new Date(tournament.startDate), "MMM dd, yyyy")} - {format(new Date(tournament.endDate), "MMM dd, yyyy")}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <Button variant="outline" size="icon" className="shadow-sm hover:shadow-md transition-shadow w-9 h-9 sm:w-10 sm:h-10" onClick={handleToggleFavorite}>
                  <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5 transition-colors", isFavorite && "fill-red-500 text-red-500")} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="shadow-sm hover:shadow-md transition-shadow w-9 h-9 sm:w-10 sm:h-10"
                  onClick={() => {
                    const url = `${window.location.origin}/spectator/${id}`;
                    navigator.clipboard
                      .writeText(url)
                      .then(() => toast.success("Spectator link copied!"))
                      .catch(() => toast.error("Could not copy link"));
                  }}
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <ExportButtons tournament={tournament} matches={tournament.matches || []} teams={tournament.teams || []} events={tournament.events || []} variant="outline" />
                {tournament.status === "open" && (
                  <Button variant="default" size="default" className="shadow-sm hover:shadow-md transition-shadow font-bold text-sm sm:text-base" asChild>
                    <Link to={`/tournaments/${id}/register`}>Register Now</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Photo Gallery */}
          {tournament.image && (
            <div className="bg-card rounded-2xl overflow-hidden mb-8 animate-fade-in border border-border/60 shadow-sm relative">
              <div className="h-1.5 bg-primary absolute top-0 left-0 right-0" />
              <div className="p-8 pt-10">
                <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Tournament Gallery
                </h3>
                <Carousel className="w-full">
                  <CarouselContent>
                    <CarouselItem>
                      <div className="relative aspect-video rounded-lg overflow-hidden">
                        <img src={tournament.image} alt={tournament.name} className="w-full h-full object-cover" />
                      </div>
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8 min-w-0">
              <Tabs defaultValue="overview" className="animate-fade-in">
                <TabsList className="w-full justify-start bg-card border border-border/60 p-1.5 rounded-xl gap-1 overflow-x-auto scrollbar-hide shadow-sm">
                  <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 data-[state=active]:hover:bg-primary transition-all shrink-0 text-xs sm:text-sm font-semibold">Overview</TabsTrigger>
                  <TabsTrigger value="events" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 data-[state=active]:hover:bg-primary transition-all shrink-0 text-xs sm:text-sm font-semibold">Events</TabsTrigger>
                  <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 data-[state=active]:hover:bg-primary transition-all shrink-0 text-xs sm:text-sm font-semibold">Schedule</TabsTrigger>
                  <TabsTrigger value="brackets" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 data-[state=active]:hover:bg-primary transition-all shrink-0 text-xs sm:text-sm font-semibold">Brackets</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6">
                  <div className="prose max-w-none">
                    <h3 className="text-2xl font-display font-bold mb-4">About This Tournament</h3>
                    <p className="text-muted-foreground leading-relaxed">{tournament.description}</p>
                  </div>

                  <div className="mt-8 grid sm:grid-cols-2 gap-4">
                    <div className="group bg-card rounded-2xl border border-border/60 hover:border-border p-8 shadow-sm transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors duration-300 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Registered Players</div>
                          <div className="font-display font-bold text-xl">{tournament.currentPlayers || 0} / {tournament.maxPlayers}</div>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            (() => {
                              const pct = Math.round(((tournament.currentPlayers || 0) / tournament.maxPlayers) * 100);
                              if (pct >= 90) return "bg-destructive";
                              if (pct >= 70) return "bg-warning";
                              return "bg-primary";
                            })()
                          )}
                          style={{ width: `${((tournament.currentPlayers || 0) / tournament.maxPlayers) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="group bg-card rounded-2xl border border-border/60 hover:border-border p-8 shadow-sm transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors duration-300 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Registration Deadline</div>
                          <div className="font-display font-bold text-xl">{format(new Date(tournament.registrationDeadline), "MMM dd, yyyy")}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Venue Details */}
                  {tournament.venue && (
                    <div className="mt-8 bg-card rounded-2xl border border-border/60 p-8 shadow-sm">
                      <h3 className="font-display font-bold text-lg mb-4">Venue Information</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-muted-foreground">Venue Name</span>
                          <p className="font-semibold">{tournament.venue.name}</p>
                        </div>
                        {tournament.venue.courts && (
                          <div>
                            <span className="text-sm text-muted-foreground">Available Courts</span>
                            <p className="font-semibold">{tournament.venue.courts} Courts</p>
                          </div>
                        )}
                        {tournament.venue.facilities && tournament.venue.facilities.length > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground">Facilities</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {tournament.venue.facilities.map((facility: string, idx: number) => (
                                <Badge key={idx} variant="outline">{facility}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rules */}
                  {tournament.rules && (
                    <div className="mt-8 bg-card rounded-2xl border border-border/60 p-8 shadow-sm">
                      <h3 className="font-display font-bold text-lg mb-4">Tournament Rules</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{tournament.rules}</p>
                    </div>
                  )}

                  {/* Contact Information */}
                  {(tournament.contactEmail || tournament.contactPhone) && (
                    <div className="mt-8 bg-card rounded-2xl border border-border/60 p-8 shadow-sm">
                      <h3 className="font-display font-bold text-lg mb-4">Contact Information</h3>
                      <div className="space-y-2">
                        {tournament.contactEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <a href={`mailto:${tournament.contactEmail}`} className="font-semibold text-primary hover:underline">{tournament.contactEmail}</a>
                          </div>
                        )}
                        {tournament.contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <a href={`tel:${tournament.contactPhone}`} className="font-semibold">{tournament.contactPhone}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Events Tab */}
                <TabsContent value="events" className="mt-6">
                  <div className="mb-6">
                    <h3 className="text-2xl font-display font-bold">Available Events</h3>
                  </div>
                  {tournament.events && tournament.events.length > 0 ? (
                    <div className="space-y-4">
                      {tournament.events.map((event: any, index: number) => (
                        <div key={event._id} className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm hover:border-border transition-colors animate-fade-in" style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                              <h4 className="font-display font-bold text-lg">{event.name}</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="capitalize">{(event.format || "").replace("-", " ")}</Badge>
                                <Badge variant="accent">{formatEventSkillLevel(event.skillLevel)}</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">
                                  {(event.format || "").toLowerCase() === "singles" ? "Players" : "Teams"}
                                </div>
                                <div className="font-semibold">{event.currentTeams || 0}/{event.maxTeams}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Entry Fee</div>
                                <div className="font-display font-bold text-primary">${event.entryFee}</div>
                              </div>
                              {tournament.status === "open" && (
                                <Button variant="outline">Register</Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No events have been added yet.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Schedule Tab */}
                <TabsContent value="schedule" className="mt-6">
                  <TournamentSchedule
                    tournamentId={id!}
                    tournamentStartDate={tournament.startDate}
                  />
                </TabsContent>

                {/* Brackets Tab */}
                <TabsContent value="brackets" className="mt-6">
                  <BracketViewer tournamentId={id!} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {/* Registration Card */}
              <div className="bg-card rounded-2xl border border-border/60 p-8 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
                <h3 className="font-display font-bold text-lg mb-4 mt-2">Quick Registration</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-display font-bold text-lg text-primary">
                      {tournament.events && tournament.events.length > 0
                        ? `From $${Math.min(...tournament.events.map((e: any) => e.entryFee))}`
                        : "TBD"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Events</span>
                    <Badge variant="secondary">{tournament.events?.length || 0} Available</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-semibold">{format(new Date(tournament.registrationDeadline), "MMM dd")}</span>
                  </div>
                </div>
                {tournament.status === "open" && (
                  <Button variant="default" className="w-full shadow-sm hover:shadow-md transition-all duration-300 group font-bold" size="lg" asChild>
                    <Link to={`/tournaments/${id}/register`}>
                      Register Now
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                )}
              </div>

              {/* Organizer Info */}
              <div className="bg-card rounded-2xl border border-border/60 p-8 shadow-sm">
                <h3 className="font-display font-bold text-lg mb-4">Organizer</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Name</div>
                    <div className="font-semibold">{tournament.organizer?.name || "Unknown"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <a href={`mailto:${tournament.organizer?.email || ""}`} className="font-semibold text-primary hover:underline">{tournament.organizer?.email || "Not provided"}</a>
                  </div>
                  {tournament.organizer?.phone && (
                    <div>
                      <div className="text-muted-foreground">Phone</div>
                      <div className="font-semibold">{tournament.organizer.phone}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Venue Info */}
              <div className="bg-card rounded-2xl border border-border/60 p-8 shadow-sm">
                <h3 className="font-display font-bold text-lg mb-4">Venue</h3>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">{tournament.venue?.name || tournament.location}</div>
                    <div className="text-sm text-muted-foreground">{tournament.address}</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4 hover-lift" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(tournament.address)}`, "_blank")}>
                  View on Map
                </Button>
              </div>
            </div>
          </div>
        </div>

        {alertDialogs}
      </div>
    </Layout>
  );
};

export default TournamentDetail;

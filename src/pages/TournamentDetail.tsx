import Layout from "@/components/layout/Layout";
import OrganizerTournamentDashboard from "@/components/tournament-detail/OrganizerTournamentDashboard";
import PlayerTournamentView from "@/components/tournament-detail/PlayerTournamentView";
import TournamentAlertDialogs from "@/components/tournament-detail/TournamentAlertDialogs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { eventAPI, favoritesAPI, tournamentAPI } from "@/services/api";
import type { GameType, TournamentFormat } from "@/types/tournament";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Warning, ArrowLeft, CircleNotch } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { ActivityItem } from "@/components/tournament-dashboard/DashboardOverview";
import type { DashboardSection } from "@/components/tournament-dashboard/TournamentDashboardSidebar";

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
            <CircleNotch className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
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
              <Warning className="w-8 h-8 text-destructive" />
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

  const alertDialogsProps = {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    eventToDelete,
    setEventToDelete,
    onConfirmDeleteEvent: handleConfirmDelete,
    deleteEventPending: deleteEventMutation.isPending,
    isDeleteTournamentDialogOpen,
    setIsDeleteTournamentDialogOpen,
    onConfirmDeleteTournament: handleConfirmDeleteTournament,
    deleteTournamentPending: deleteTournamentMutation.isPending,
    isStartTournamentDialogOpen,
    setIsStartTournamentDialogOpen,
    onConfirmStartTournament: handleConfirmStartTournament,
    startTournamentPending: startTournamentMutation.isPending,
    isCompleteTournamentDialogOpen,
    setIsCompleteTournamentDialogOpen,
    onConfirmCompleteTournament: handleConfirmCompleteTournament,
    completeTournamentPending: completeTournamentMutation.isPending,
  };

  if (isOrganizer) {
    return (
      <>
        <OrganizerTournamentDashboard
          tournament={tournament}
          tournamentId={id!}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          recentActivities={recentActivities}
          isCreateEventOpen={isCreateEventOpen}
          setIsCreateEventOpen={setIsCreateEventOpen}
          newEvent={newEvent}
          setNewEvent={setNewEvent}
          onCreateEvent={handleCreateEvent}
          createEventPending={createEventMutation.isPending}
          onDeleteEvent={handleDeleteClick}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
          onStartTournament={handleStartTournamentClick}
          onCompleteTournament={handleCompleteTournamentClick}
          onDeleteTournament={handleDeleteTournamentClick}
          onEventsCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["tournament", id] });
            queryClient.invalidateQueries({ queryKey: ["events", id] });
            toast.success("Events created! Check the Events tab.");
          }}
        />
        <TournamentAlertDialogs {...alertDialogsProps} />
      </>
    );
  }

  return (
    <>
      <PlayerTournamentView
        tournament={tournament}
        tournamentId={id!}
        statusInfo={statusInfo}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
        onCopySpectatorLink={() => {
          const url = `${window.location.origin}/spectator/${id}`;
          navigator.clipboard.writeText(url).then(() => toast.success("Spectator link copied!")).catch(() => toast.error("Could not copy link"));
        }}
      />
      <TournamentAlertDialogs {...alertDialogsProps} />
    </>
  );
}

export default TournamentDetail;


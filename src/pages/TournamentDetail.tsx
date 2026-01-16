import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  ArrowLeft,
  Share2,
  Heart,
  Settings,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Image as ImageIcon,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { tournamentAPI, favoritesAPI, eventAPI } from "@/services/api";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { GameType, TournamentFormat, SkillLevel } from "@/types/tournament";
import BracketViewer from "@/components/tournament/BracketViewer";
import TournamentSchedule from "@/components/tournament/TournamentSchedule";
import RegisteredPlayers from "@/components/tournament/RegisteredPlayers";
import AIPlannerChat from "@/components/tournament/EnhancedAIPlannerChat";
import TournamentPlanner from "@/components/tournament/TournamentPlanner";
import ExportButtons from "@/components/tournament/ExportButtons";
import { cn } from "@/lib/utils";

const skillLevels: SkillLevel[] = ["2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "Open"];
const gameTypes: GameType[] = ["Singles", "Doubles", "Mixed Doubles"];
const tournamentFormats: TournamentFormat[] = ["Round-Robin", "Single Elimination", "Double Elimination", "Pool+Knockout"];

const statusConfig = {
  open: {
    label: "Registration Open",
    className: "bg-primary/10 text-primary border-primary/20",
    dotClass: "bg-primary"
  },
  closed: {
    label: "Registration Closed",
    className: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground"
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dotClass: "bg-destructive animate-pulse"
  },
  completed: {
    label: "Completed",
    className: "bg-accent text-accent-foreground border-accent-foreground/20",
    dotClass: "bg-accent-foreground"
  },
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground"
  },
};

const TournamentDetail = () => {
  // ALL HOOKS MUST BE DECLARED AT THE TOP BEFORE ANY CONDITIONAL LOGIC
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinTournament, leaveTournament } = useSocket();
  const queryClient = useQueryClient();
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteTournamentDialogOpen, setIsDeleteTournamentDialogOpen] = useState(false);
  const [isStartTournamentDialogOpen, setIsStartTournamentDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    gameType: "Singles" as GameType,
    format: "Round-Robin" as TournamentFormat,
    skillLevel: "4.0" as SkillLevel,
    maxPlayers: 32,
    entryFee: 50,
  });

  const isFavorite = id ? favoritesAPI.isFavorite(id) : false;

  // Fetch tournament data from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getById(id!),
    enabled: !!id,
  });

  // Create event mutation (moved before conditional returns)
  const createEventMutation = useMutation({
    mutationFn: (data: any) => eventAPI.create(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      setIsCreateEventOpen(false);
      setNewEvent({
        name: "",
        gameType: "Singles",
        format: "Round-Robin",
        skillLevel: "4.0",
        maxPlayers: 32,
        entryFee: 50,
      });
      toast.success("Event created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create event");
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => eventAPI.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
      toast.success("Event deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete event");
    },
  });

  // Delete tournament mutation
  const deleteTournamentMutation = useMutation({
    mutationFn: (tournamentId: string) => tournamentAPI.delete(tournamentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setIsDeleteTournamentDialogOpen(false);
      toast.success("Tournament deleted successfully!");
      navigate('/tournaments');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete tournament");
    },
  });

  // Start tournament mutation
  const startTournamentMutation = useMutation({
    mutationFn: (tournamentId: string) => tournamentAPI.startTournament(tournamentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setIsStartTournamentDialogOpen(false);
      toast.success("Tournament started! It's now live.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to start tournament");
    },
  });

  // Join tournament room on mount, leave on unmount
  useEffect(() => {
    if (id) {
      joinTournament(id);
      return () => {
        leaveTournament(id);
      };
    }
  }, [id, joinTournament, leaveTournament]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleTournamentUpdate = (tournamentData: any) => {
      console.log('🏆 Tournament updated:', tournamentData);
      // Invalidate and refetch tournament data
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      toast.info('Tournament information updated');
    };

    const handleMatchUpdate = (matchData: any) => {
      console.log('🏓 Match updated:', matchData);
      // Invalidate tournament data to refresh schedule/brackets
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
    };

    const handleScoreUpdate = (scoreData: any) => {
      console.log('📊 Score updated:', scoreData);
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      toast.success(`Match score updated: ${scoreData.team1Score}-${scoreData.team2Score}`);
    };

    socket.on('tournament-updated', handleTournamentUpdate);
    socket.on('match-updated', handleMatchUpdate);
    socket.on('score-updated', handleScoreUpdate);

    return () => {
      socket.off('tournament-updated', handleTournamentUpdate);
      socket.off('match-updated', handleMatchUpdate);
      socket.off('score-updated', handleScoreUpdate);
    };
  }, [socket, id, queryClient]);

  const handleDeleteClick = (eventId: string, eventName: string) => {
    // Show warning toast first
    toast.warning(`Warning: Deleting "${eventName}" will permanently remove all associated data.`, {
      duration: 4000,
    });
    
    // Set the event to delete and open confirmation dialog
    setEventToDelete(eventId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete);
    }
  };

  const handleDeleteTournamentClick = () => {
    // Show warning toast first
    toast.warning(`Warning: Deleting "${tournament?.name}" will permanently remove the tournament and all associated data including events, teams, pools, and matches.`, {
      duration: 4000,
    });
    
    // Open confirmation dialog
    setIsDeleteTournamentDialogOpen(true);
  };

  const handleConfirmDeleteTournament = () => {
    if (id) {
      deleteTournamentMutation.mutate(id);
    }
  };

  const handleStartTournamentClick = () => {
    setIsStartTournamentDialogOpen(true);
  };

  const handleConfirmStartTournament = () => {
    if (id) {
      startTournamentMutation.mutate(id);
    }
  };

  const handleCreateEvent = () => {
    if (!newEvent.name) {
      toast.error("Please enter an event name");
      return;
    }

    createEventMutation.mutate({
      name: newEvent.name,
      format: newEvent.gameType.toLowerCase().replace(' ', '-'),
      playFormat: newEvent.format.toLowerCase().replace(/ /g, '-'),
      skillLevel: newEvent.skillLevel,
      maxTeams: newEvent.maxPlayers,
      entryFee: newEvent.entryFee,
      status: 'upcoming',
    });
  };

  // Data processing
  const tournament = data?.data;

  // Conditional returns AFTER all hooks
  if (isLoading) {
    return (
      <Layout>
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
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The tournament you're looking for doesn't exist or has been removed.
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

  // Get status configuration
  const statusInfo = statusConfig[tournament.status as keyof typeof statusConfig] || statusConfig.draft;

  // Check if user is the organizer
  const isOrganizer = user?._id === tournament.organizer?._id || user?.role === 'admin';

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-12 relative overflow-hidden">
          {/* Floating Orbs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 right-[10%] w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute bottom-10 left-[5%] w-48 h-48 bg-court-green-dark/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "3s" }} />
          </div>
          
          {/* Court pattern overlay */}
          <div className="absolute inset-0 court-pattern opacity-5 pointer-events-none" />
          
          <div className="container mx-auto px-4 relative z-10">
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Tournaments
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="animate-fade-in">
                <Badge variant="outline" className={cn("font-medium border mb-4 backdrop-blur-sm", statusInfo.className)}>
                  <span className={cn("w-2 h-2 rounded-full mr-2", statusInfo.dotClass)} />
                  {statusInfo.label}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
                  {tournament.name}
                </h1>
                <div className="flex flex-wrap gap-4 text-primary-foreground/80">
                  <div className="flex items-center gap-2 glass-dark px-3 py-1.5 rounded-full text-sm">
                    <MapPin className="w-4 h-4" />
                    {tournament.location}
                  </div>
                  <div className="flex items-center gap-2 glass-dark px-3 py-1.5 rounded-full text-sm">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(tournament.startDate), 'MMM dd, yyyy')} - {format(new Date(tournament.endDate), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <Button
                  variant="glass"
                  size="icon"
                  className="hover:shadow-glow transition-shadow"
                  onClick={() => {
                    if (id) {
                      if (isFavorite) {
                        favoritesAPI.removeFavorite(id);
                        toast.success("Removed from favorites");
                      } else {
                        favoritesAPI.addFavorite(id);
                        toast.success("Added to favorites");
                      }
                      queryClient.invalidateQueries({ queryKey: ['favorite-tournaments'] });
                    }
                  }}
                >
                  <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button variant="glass" size="icon" className="hover:shadow-glow transition-shadow">
                  <Share2 className="w-5 h-5" />
                </Button>
                <ExportButtons 
                  tournament={tournament}
                  matches={tournament.matches || []}
                  teams={tournament.teams || []}
                  events={tournament.events || []}
                  variant="outline"
                />
                {isOrganizer && (
                  <div className="flex flex-col gap-2">
                    {(tournament.status === 'open' || tournament.status === 'closed') && (
                      <Button
                        variant="default"
                        size="lg"
                        className="bg-court-green text-white hover:bg-court-green-dark shadow-lg"
                        onClick={handleStartTournamentClick}
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        Start Tournament
                      </Button>
                    )}
                    <Button variant="default" size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg" asChild>
                      <Link to={`/tournaments/${id}/edit`}>
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Tournament
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={handleDeleteTournamentClick}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Tournament
                    </Button>
                  </div>
                )}
                {tournament.status === 'open' && !isOrganizer && (
                  <Button variant="accent" size="lg" className="shadow-glow-yellow hover:shadow-glow-lg transition-shadow" asChild>
                    <Link to={`/tournaments/${id}/register`}>
                      Register Now
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Photo Gallery */}
          {tournament.image && (
            <div className="glass-card-hover rounded-2xl overflow-hidden mb-8 animate-fade-in">
              <div className="h-1.5 bg-hero-gradient" />
              <div className="p-8">
                <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Tournament Gallery
                </h3>
                <Carousel className="w-full">
                  <CarouselContent>
                    <CarouselItem>
                      <div className="relative aspect-video rounded-lg overflow-hidden">
                        <img
                          src={tournament.image}
                          alt={tournament.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <Tabs defaultValue="overview" className="animate-fade-in">
                <TabsList className="w-full justify-start glass border border-border/50 p-1.5 rounded-xl gap-1">
                  <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">Overview</TabsTrigger>
                  <TabsTrigger value="events" className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">Events</TabsTrigger>
                  {isOrganizer && (
                    <>
                      <TabsTrigger value="players" className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">Players Registered</TabsTrigger>
                      <TabsTrigger value="planner" className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        Planner
                      </TabsTrigger>
                      <TabsTrigger value="ai-planner" className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        AI Planner
                      </TabsTrigger>
                    </>
                  )}
                  <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">Schedule</TabsTrigger>
                  <TabsTrigger value="brackets" className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">Brackets</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="prose max-w-none">
                    <h3 className="text-2xl font-display font-bold mb-4">About This Tournament</h3>
                    <p className="text-muted-foreground leading-relaxed">{tournament.description}</p>
                  </div>

                  <div className="mt-8 grid sm:grid-cols-2 gap-4">
                    <div className="group glass-card-hover rounded-2xl p-8">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-hero-gradient group-hover:shadow-glow transition-all duration-300 flex items-center justify-center">
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
                              const percentFull = Math.round(((tournament.currentPlayers || 0) / tournament.maxPlayers) * 100);
                              if (percentFull >= 90) return "bg-destructive";
                              if (percentFull >= 70) return "bg-warning";
                              return "bg-hero-gradient";
                            })()
                          )}
                          style={{ width: `${((tournament.currentPlayers || 0) / tournament.maxPlayers) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="group glass-card-hover rounded-2xl p-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-hero-gradient group-hover:shadow-glow transition-all duration-300 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Registration Deadline</div>
                          <div className="font-display font-bold text-xl">{format(new Date(tournament.registrationDeadline), 'MMM dd, yyyy')}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Venue Details */}
                  {tournament.venue && (
                    <div className="mt-8 glass-card-hover rounded-2xl p-8">
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
                    <div className="mt-8 glass-card-hover rounded-2xl p-8">
                      <h3 className="font-display font-bold text-lg mb-4">Tournament Rules</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{tournament.rules}</p>
                    </div>
                  )}

                  {/* Contact Information */}
                  {(tournament.contactEmail || tournament.contactPhone) && (
                    <div className="mt-8 glass-card-hover rounded-2xl p-8">
                      <h3 className="font-display font-bold text-lg mb-4">Contact Information</h3>
                      <div className="space-y-2">
                        {tournament.contactEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <a href={`mailto:${tournament.contactEmail}`} className="font-semibold text-primary hover:underline">
                              {tournament.contactEmail}
                            </a>
                          </div>
                        )}
                        {tournament.contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <a href={`tel:${tournament.contactPhone}`} className="font-semibold">
                              {tournament.contactPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-display font-bold">Available Events</h3>
                    {isOrganizer && (
                      <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Event
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Create New Event</DialogTitle>
                            <DialogDescription>
                              Add a new event to this tournament
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="event-name">Event Name *</Label>
                              <Input
                                id="event-name"
                                placeholder="e.g., Men's Singles"
                                value={newEvent.name}
                                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Game Type</Label>
                                <Select
                                  value={newEvent.gameType}
                                  onValueChange={(v: GameType) => setNewEvent({ ...newEvent, gameType: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {gameTypes.map((gt) => (
                                      <SelectItem key={gt} value={gt}>
                                        {gt}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Format</Label>
                                <Select
                                  value={newEvent.format}
                                  onValueChange={(v: TournamentFormat) => setNewEvent({ ...newEvent, format: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {tournamentFormats.map((tf) => (
                                      <SelectItem key={tf} value={tf}>
                                        {tf}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label>Skill Level</Label>
                                <Select
                                  value={newEvent.skillLevel}
                                  onValueChange={(v: SkillLevel) => setNewEvent({ ...newEvent, skillLevel: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {skillLevels.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {s}+
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Max Players</Label>
                                <Input
                                  type="number"
                                  value={newEvent.maxPlayers}
                                  onChange={(e) => setNewEvent({ ...newEvent, maxPlayers: parseInt(e.target.value) || 32 })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Entry Fee ($)</Label>
                                <Input
                                  type="number"
                                  value={newEvent.entryFee}
                                  onChange={(e) => setNewEvent({ ...newEvent, entryFee: parseInt(e.target.value) || 0 })}
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsCreateEventOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleCreateEvent}
                              disabled={createEventMutation.isPending}
                            >
                              {createEventMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Create Event
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  {tournament.events && tournament.events.length > 0 ? (
                    <div className="space-y-4">
                      {tournament.events.map((event: any, index: number) => (
                        <div
                          key={event._id}
                          className="glass-card-hover rounded-2xl p-6 animate-fade-in"
                          style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                              <h4 className="font-display font-bold text-lg">{event.name}</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="capitalize">{event.format.replace('-', ' ')}</Badge>
                                <Badge variant="accent">{event.skillLevel}+</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Teams</div>
                                <div className="font-semibold">{event.currentTeams || 0}/{event.maxTeams}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Entry Fee</div>
                                <div className="font-display font-bold text-primary">${event.entryFee}</div>
                              </div>
                              <div className="flex gap-2">
                                {isOrganizer && (
                                  <>
                                    <Button asChild>
                                      <Link to={`/tournaments/${id}/events/${event._id}/pools`}>
                                        <Settings className="w-4 h-4 mr-1" />
                                        Manage
                                      </Link>
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      onClick={() => handleDeleteClick(event._id, event.name)}
                                      title="Delete event"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                {!isOrganizer && tournament.status === 'open' && (
                                  <Button variant="outline">Register</Button>
                                )}
                              </div>
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

                {isOrganizer && (
                  <>
                    <TabsContent value="players" className="mt-6">
                      <RegisteredPlayers tournamentId={id!} />
                    </TabsContent>

                    <TabsContent value="planner" className="mt-6">
                      <TournamentPlanner
                        tournament={tournament}
                        events={tournament.events || []}
                      />
                    </TabsContent>

                    <TabsContent value="ai-planner" className="mt-6">
                      <AIPlannerChat
                        tournamentId={id!}
                        onEventsCreated={() => {
                          queryClient.invalidateQueries({ queryKey: ['tournament', id] });
                          queryClient.invalidateQueries({ queryKey: ['events', id] });
                          toast.success("Events created! Check the Events tab.");
                        }}
                      />
                    </TabsContent>
                  </>
                )}

                <TabsContent value="schedule" className="mt-6">
                  <TournamentSchedule tournamentId={id!} />
                </TabsContent>

                <TabsContent value="brackets" className="mt-6">
                  <BracketViewer tournamentId={id!} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {/* Registration Card */}
              <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-hero-gradient" />
                <h3 className="font-display font-bold text-lg mb-4">Quick Registration</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-display font-bold text-lg text-primary">
                      {tournament.events && tournament.events.length > 0
                        ? `From $${Math.min(...tournament.events.map((e: any) => e.entryFee))}`
                        : 'TBD'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Events</span>
                    <Badge variant="secondary">{tournament.events?.length || 0} Available</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-semibold">{format(new Date(tournament.registrationDeadline), 'MMM dd')}</span>
                  </div>
                </div>
                {tournament.status === 'open' && !isOrganizer && (
                  <Button variant="hero" className="w-full shadow-glow hover:shadow-glow-lg transition-all duration-300 group" size="lg" asChild>
                    <Link to={`/tournaments/${id}/register`}>
                      Register Now
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                )}
              </div>

              {/* Organizer Info */}
              <div className="glass-card-hover rounded-2xl p-8">
                <h3 className="font-display font-bold text-lg mb-4">Organizer</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Name</div>
                    <div className="font-semibold">{tournament.organizer?.name || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <a href={`mailto:${tournament.organizer?.email || ''}`} className="font-semibold text-primary hover:underline">
                      {tournament.organizer?.email || 'Not provided'}
                    </a>
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
              <div className="glass-card-hover rounded-2xl p-8">
                <h3 className="font-display font-bold text-lg mb-4">Venue</h3>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">{tournament.venue?.name || tournament.location}</div>
                    <div className="text-sm text-muted-foreground">{tournament.address}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4 hover-lift"
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(tournament.address)}`, '_blank')}
                >
                  View on Map
                </Button>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Delete Event Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the event and all associated data including teams, pools, and matches.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIsDeleteDialogOpen(false);
                setEventToDelete(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteEventMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteEventMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete Event"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Tournament Confirmation Dialog */}
        <AlertDialog open={isDeleteTournamentDialogOpen} onOpenChange={setIsDeleteTournamentDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the tournament and all associated data including events, teams, pools, matches, and registrations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIsDeleteTournamentDialogOpen(false);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteTournament}
                disabled={deleteTournamentMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteTournamentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete Tournament"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Start Tournament Confirmation Dialog */}
        <AlertDialog open={isStartTournamentDialogOpen} onOpenChange={setIsStartTournamentDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start Tournament?</AlertDialogTitle>
              <AlertDialogDescription>
                This will make the tournament go live and appear on the "Live Tournaments" page. Players will see this tournament as "In Progress" and matches can begin.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIsStartTournamentDialogOpen(false);
              }}>
                No
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmStartTournament}
                disabled={startTournamentMutation.isPending}
                className="bg-court-green text-white hover:bg-court-green-dark"
              >
                {startTournamentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Yes, Start Tournament"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Layout>
    );
  };

  export default TournamentDetail;

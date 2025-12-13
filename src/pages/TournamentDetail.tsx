import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
} from "lucide-react";
import { tournamentAPI, favoritesAPI, eventAPI } from "@/services/api";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { GameType, TournamentFormat, SkillLevel } from "@/types/tournament";
import BracketViewer from "@/components/tournament/BracketViewer";
import TournamentSchedule from "@/components/tournament/TournamentSchedule";

const skillLevels: SkillLevel[] = ["2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "Open"];
const gameTypes: GameType[] = ["Singles", "Doubles", "Mixed Doubles"];
const tournamentFormats: TournamentFormat[] = ["Round-Robin", "Single Elimination", "Double Elimination", "Pool+Knockout"];

const TournamentDetail = () => {
  // ALL HOOKS MUST BE DECLARED AT THE TOP BEFORE ANY CONDITIONAL LOGIC
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteTournamentDialogOpen, setIsDeleteTournamentDialogOpen] = useState(false);
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

  // Format data for display
  const statusLabels: Record<string, string> = {
    open: 'Registration Open',
    closed: 'Registration Closed',
    'in-progress': 'In Progress',
    completed: 'Completed',
    draft: 'Draft',
  };

  const statusLabel = statusLabels[tournament.status] || tournament.status;

  // Check if user is the organizer
  const isOrganizer = user?._id === tournament.organizer?._id || user?.role === 'admin';

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-12">
          <div className="container mx-auto px-4">
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tournaments
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="animate-fade-in">
                <Badge className="bg-secondary text-secondary-foreground mb-4">
                  {statusLabel}
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

              <div className="flex gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <Button
                  variant="glass"
                  size="icon"
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
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                </Button>
                <Button variant="glass" size="icon">
                  <Share2 className="w-5 h-5" />
                </Button>
                {isOrganizer && (
                  <div className="flex flex-col gap-2">
                    <Button variant="default" size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
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
                  <Button variant="accent" size="lg" asChild>
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
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <Tabs defaultValue="overview" className="animate-fade-in">
                <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
                  <TabsTrigger value="events" className="rounded-lg">Events</TabsTrigger>
                  <TabsTrigger value="schedule" className="rounded-lg">Schedule</TabsTrigger>
                  <TabsTrigger value="brackets" className="rounded-lg">Brackets</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="prose max-w-none">
                    <h3 className="text-2xl font-display font-bold mb-4">About This Tournament</h3>
                    <p className="text-muted-foreground leading-relaxed">{tournament.description}</p>
                  </div>

                  <div className="mt-8 grid sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-card rounded-xl border border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Registered Players</div>
                          <div className="font-display font-bold text-xl">{tournament.currentPlayers || 0} / {tournament.maxPlayers}</div>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${((tournament.currentPlayers || 0) / tournament.maxPlayers) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-6 bg-card rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Registration Deadline</div>
                          <div className="font-display font-bold text-xl">{format(new Date(tournament.registrationDeadline), 'MMM dd, yyyy')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                      {tournament.events.map((event: any) => (
                        <div
                          key={event._id}
                          className="p-6 bg-card rounded-xl border border-border hover:shadow-card transition-shadow"
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
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h3 className="font-display font-bold text-lg mb-4">Quick Registration</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-semibold">
                      {tournament.events && tournament.events.length > 0
                        ? `From $${Math.min(...tournament.events.map((e: any) => e.entryFee))}`
                        : 'TBD'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Events</span>
                    <span className="font-semibold">{tournament.events?.length || 0} Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-semibold">{format(new Date(tournament.registrationDeadline), 'MMM dd')}</span>
                  </div>
                </div>
                {tournament.status === 'open' && !isOrganizer && (
                  <Button variant="hero" className="w-full" size="lg">
                    Register Now
                  </Button>
                )}
              </div>

              {/* Organizer Info */}
              <div className="bg-card rounded-xl border border-border p-6">
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
              <div className="bg-card rounded-xl border border-border p-6">
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
                  className="w-full mt-4"
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
      </Layout>
    );
  };
  
  export default TournamentDetail;

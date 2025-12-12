import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  Heart,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { tournamentAPI, userAPI, favoritesAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
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

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("my-tournaments");

  // Fetch user's tournaments (as organizer)
  const { data: myTournamentsData, isLoading: loadingMyTournaments } = useQuery({
    queryKey: ['my-tournaments'],
    queryFn: async () => {
      // Try to get organizer tournaments, fallback to all if endpoint doesn't exist
      try {
        return await userAPI.getMyTournaments();
      } catch {
        // Fallback: get all tournaments and filter by organizer
        const all = await tournamentAPI.getAll({ limit: 100 });
        return {
          data: all.data?.filter((t: any) => t.organizerId === user?._id) || [],
        };
      }
    },
    enabled: !!user && (user.role === 'organizer' || user.role === 'admin'),
  });

  // Fetch user's registrations
  const { data: registrationsData, isLoading: loadingRegistrations } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: async () => {
      try {
        return await userAPI.getMyRegistrations();
      } catch {
        // Fallback: get all tournaments (will need backend support for actual registrations)
        return { data: [] };
      }
    },
    enabled: !!user,
  });

  // Fetch tournament history
  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['my-history'],
    queryFn: async () => {
      try {
        return await userAPI.getMyHistory();
      } catch {
        const all = await tournamentAPI.getAll({ status: 'completed', limit: 100 });
        return { data: all.data || [] };
      }
    },
    enabled: !!user,
  });

  // Get favorites
  const favorites = favoritesAPI.getFavorites();
  const { data: favoritesData, isLoading: loadingFavorites } = useQuery({
    queryKey: ['favorite-tournaments', favorites],
    queryFn: async () => {
      if (favorites.length === 0) return { data: [] };
      const tournaments = await Promise.all(
        favorites.map(id => tournamentAPI.getById(id).catch(() => null))
      );
      return { data: tournaments.filter(Boolean).map((t: any) => t.data) };
    },
    enabled: favorites.length > 0,
  });

  // Delete tournament mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => tournamentAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success("Tournament deleted successfully");
      setDeleteDialogOpen(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete tournament");
    },
  });

  const myTournaments = myTournamentsData?.data || [];
  const registrations = registrationsData?.data || [];
  const history = historyData?.data || [];
  const favoriteTournaments = favoritesData?.data || [];

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'open': 'default',
      'closed': 'secondary',
      'in-progress': 'default',
      'completed': 'outline',
      'draft': 'outline',
    };
    return variants[status] || 'outline';
  };

  const TournamentCard = ({ tournament, showActions = false }: { tournament: any; showActions?: boolean }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">
              <Link to={`/tournaments/${tournament._id || tournament.id}`} className="hover:text-primary">
                {tournament.name}
              </Link>
            </CardTitle>
            <CardDescription className="flex flex-wrap gap-2 items-center">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {tournament.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
              </span>
            </CardDescription>
          </div>
          <Badge variant={getStatusBadge(tournament.status) as any}>
            {tournament.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {tournament.currentPlayers || 0} / {tournament.maxPlayers} players
            </span>
            <span>{tournament.events?.length || 0} events</span>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link to={`/tournaments/${tournament._id || tournament.id}`}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(tournament._id || tournament.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">Please log in</h2>
              <p className="text-muted-foreground mb-4">You need to be logged in to view your dashboard.</p>
              <Button asChild>
                <Link to="/login">Log In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-2">
              My Dashboard
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Welcome back, {user.name}!
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="my-tournaments">
                <Trophy className="w-4 h-4 mr-2" />
                My Tournaments
              </TabsTrigger>
              <TabsTrigger value="registrations">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                My Registrations
              </TabsTrigger>
              <TabsTrigger value="favorites">
                <Heart className="w-4 h-4 mr-2" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            {/* My Tournaments Tab */}
            <TabsContent value="my-tournaments">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-display font-bold">
                    Tournaments I'm Organizing
                  </h2>
                  {(user.role === 'organizer' || user.role === 'admin') && (
                    <Button asChild>
                      <Link to="/create-tournament">
                        <Trophy className="w-4 h-4 mr-2" />
                        Create Tournament
                      </Link>
                    </Button>
                  )}
                </div>

                {loadingMyTournaments ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : myTournaments.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No tournaments yet</h3>
                      <p className="text-muted-foreground mb-4">
                        {user.role === 'organizer' || user.role === 'admin'
                          ? "Create your first tournament to get started!"
                          : "You haven't organized any tournaments."}
                      </p>
                      {(user.role === 'organizer' || user.role === 'admin') && (
                        <Button asChild>
                          <Link to="/create-tournament">Create Tournament</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myTournaments.map((tournament: any) => (
                      <TournamentCard key={tournament._id || tournament.id} tournament={tournament} showActions={true} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* My Registrations Tab */}
            <TabsContent value="registrations">
              <div className="space-y-4">
                <h2 className="text-2xl font-display font-bold">My Registrations</h2>
                {loadingRegistrations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : registrations.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No registrations yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't registered for any tournaments yet.
                      </p>
                      <Button asChild>
                        <Link to="/tournaments">Browse Tournaments</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {registrations.map((tournament: any) => (
                      <TournamentCard key={tournament._id || tournament.id} tournament={tournament} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites">
              <div className="space-y-4">
                <h2 className="text-2xl font-display font-bold">Favorite Tournaments</h2>
                {loadingFavorites ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : favoriteTournaments.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Save tournaments you're interested in by clicking the heart icon.
                      </p>
                      <Button asChild>
                        <Link to="/tournaments">Browse Tournaments</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteTournaments.map((tournament: any) => (
                      <TournamentCard key={tournament._id || tournament.id} tournament={tournament} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <div className="space-y-4">
                <h2 className="text-2xl font-display font-bold">Tournament History</h2>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : history.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No history yet</h3>
                      <p className="text-muted-foreground">
                        Your completed tournament history will appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map((tournament: any) => (
                      <TournamentCard key={tournament._id || tournament.id} tournament={tournament} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialogOpen} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tournament? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialogOpen && deleteMutation.mutate(deleteDialogOpen)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Dashboard;


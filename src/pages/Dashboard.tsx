import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Loader2,
  AlertCircle,
  TrendingUp,
  Clock,
  Target,
  Medal,
  Play,
  UserPlus,
  Award,
  ArrowRight,
  Bell,
  Settings,
  Plus,
  Ticket,
  QrCode,
} from "lucide-react";
import { tournamentAPI, authAPI, teamAPI, invitationAPI } from "@/services/api";
import TicketCard from "@/components/check-in/TicketCard";
import WaitlistStatus from "@/components/registration/WaitlistStatus";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ConnectAccountStatus } from "@/components/stripe/ConnectAccountStatus";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => authAPI.getStats(),
    enabled: !!user,
  });

  // Fetch all tournaments for filtering
  const { data: allTournamentsData, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['all-tournaments-dashboard'],
    queryFn: () => tournamentAPI.getAll(),
  });

  // Fetch user's teams
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => teamAPI.getMyTeams(),
    enabled: !!user,
  });

  // Fetch pending invitations
  const { data: invitationsData, isLoading: invitationsLoading } = useQuery({
    queryKey: ['my-invitations'],
    queryFn: () => invitationAPI.getReceived(),
    enabled: !!user,
  });

  // Fetch user's tickets
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['my-tickets-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/check-in/my-tickets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      return data.data;
    },
    enabled: !!user,
  });

  // Fetch waitlist entries
  const { data: waitlistData, isLoading: waitlistLoading } = useQuery({
    queryKey: ['my-waitlist'],
    queryFn: async () => {
      const response = await fetch('/api/waitlist/my-entries', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch waitlist');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!user,
  });

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

  const stats = statsData?.data?.statistics || user.statistics || {
    matchesPlayed: 0,
    matchesWon: 0,
    tournamentsPlayed: 0,
    goldMedals: 0,
    silverMedals: 0,
    bronzeMedals: 0,
  };

  const winRate = stats.matchesPlayed > 0
    ? ((stats.matchesWon / stats.matchesPlayed) * 100).toFixed(1)
    : 0;

  const allTournaments = allTournamentsData?.data || [];
  const myTeams = teamsData?.data || [];
  const pendingInvitations = (invitationsData?.data || []).filter((inv: any) => inv.status === 'pending');

  // Filter tournaments based on role
  const myTournaments = allTournaments.filter((t: any) =>
    t.organizer?._id === user._id || t.organizer === user._id
  );

  const upcomingTournaments = statsData?.data?.tournaments?.filter((t: any) =>
    t.status === 'open' || t.status === 'upcoming' || t.status === 'in-progress'
  ) || [];

  const activeTournaments = myTournaments.filter((t: any) =>
    t.status === 'open' || t.status === 'in-progress'
  );

  // Recommended tournaments (based on skill level and location)
  const recommendedTournaments = allTournaments.filter((t: any) => {
    if (t.status !== 'open') return false;

    // Check if user is already registered
    const alreadyRegistered = upcomingTournaments.some((ut: any) => ut._id === t._id);
    if (alreadyRegistered) return false;

    // Check skill level match
    if (t.skillLevelRequirement?.min && user.skillLevel) {
      if (user.skillLevel < t.skillLevelRequirement.min || user.skillLevel > (t.skillLevelRequirement.max || 5.0)) {
        return false;
      }
    }

    // Check location match (simple city match)
    if (user.location?.city && t.location) {
      return t.location.toLowerCase().includes(user.location.city.toLowerCase());
    }

    return true;
  }).slice(0, 3);

  const isOrganizer = user.role === 'organizer' || user.role === 'admin';

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-2">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-primary-foreground/80">
                  {isOrganizer ? 'Manage your tournaments and track your events' : 'Track your progress and find new tournaments'}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="glass" size="icon">
                  <Bell className="w-5 h-5" />
                </Button>
                <Button variant="glass" size="icon" asChild>
                  <Link to="/profile">
                    <Settings className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {isOrganizer ? (
            /* ORGANIZER DASHBOARD */
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{myTournaments.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {activeTournaments.length} active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeTournaments.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Currently running
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {myTournaments.reduce((sum: number, t: any) => sum + (t.currentPlayers || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across all tournaments
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Events Created</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {myTournaments.reduce((sum: number, t: any) => sum + (t.events?.length || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total events
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Stripe Connect - Payment Setup */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Payment Setup</h2>
                <ConnectAccountStatus />
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your tournaments efficiently</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button asChild className="h-auto py-6 flex-col gap-2">
                    <Link to="/create-tournament">
                      <Plus className="w-6 h-6" />
                      <span>Create Tournament</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-auto py-6 flex-col gap-2">
                    <Link to="/tournaments">
                      <Trophy className="w-6 h-6" />
                      <span>View All Tournaments</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-auto py-6 flex-col gap-2">
                    <Link to="/teams">
                      <Users className="w-6 h-6" />
                      <span>Manage Teams</span>
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Active Tournaments */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Active Tournaments</CardTitle>
                      <CardDescription>Tournaments currently open or in progress</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/tournaments">
                        View All
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {tournamentsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : activeTournaments.length > 0 ? (
                    <div className="space-y-4">
                      {activeTournaments.map((tournament: any) => (
                        <div
                          key={tournament._id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/tournaments/${tournament._id}`)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{tournament.name}</h3>
                              <Badge variant={tournament.status === 'in-progress' ? 'default' : 'secondary'}>
                                {tournament.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {tournament.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(tournament.startDate), 'MMM dd, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {tournament.currentPlayers || 0} players
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No active tournaments</p>
                      <Button asChild className="mt-4">
                        <Link to="/create-tournament">Create Your First Tournament</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* PLAYER DASHBOARD */
            <div className="space-y-8">
              {/* Player Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{winRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.matchesWon} wins / {stats.matchesPlayed} matches
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.tournamentsPlayed}</div>
                    <p className="text-xs text-muted-foreground">
                      Total participated
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Skill Level</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{user.skillLevel || 'N/A'}</div>
                    <p className="text-xs text-muted-foreground">
                      Current rating
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Medals</CardTitle>
                    <Medal className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-yellow-600">{stats.goldMedals}</span>
                      <span className="text-lg font-bold text-gray-400">{stats.silverMedals}</span>
                      <span className="text-lg font-bold text-orange-600">{stats.bronzeMedals}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gold / Silver / Bronze
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Invitations */}
              {pendingInvitations.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-orange-600" />
                      <CardTitle className="text-orange-900">Pending Team Invitations</CardTitle>
                    </div>
                    <CardDescription>You have {pendingInvitations.length} pending invitation(s)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingInvitations.slice(0, 3).map((invitation: any) => (
                        <div key={invitation._id} className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg">
                          <div>
                            <p className="font-medium">{invitation.team?.name || 'Team Invitation'}</p>
                            <p className="text-sm text-muted-foreground">From: {invitation.inviter?.name || 'Unknown'}</p>
                          </div>
                          <Button size="sm" asChild>
                            <Link to="/teams">View</Link>
                          </Button>
                        </div>
                      ))}
                      {pendingInvitations.length > 3 && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link to="/teams">View All Invitations</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Tournaments */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>My Upcoming Tournaments</CardTitle>
                      <CardDescription>Tournaments you're registered for</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/profile">
                        View All
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : upcomingTournaments.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingTournaments.slice(0, 3).map((tournament: any) => (
                        <div
                          key={tournament._id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/tournaments/${tournament._id}`)}
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{tournament.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {tournament.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(tournament.startDate), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary">{tournament.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No upcoming tournaments</p>
                      <Button asChild className="mt-4">
                        <Link to="/discover">Discover Tournaments</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommended Tournaments */}
              {recommendedTournaments.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Recommended For You</CardTitle>
                        <CardDescription>Based on your skill level and location</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/discover">
                          Browse All
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendedTournaments.map((tournament: any) => (
                        <div
                          key={tournament._id}
                          className="p-4 border rounded-lg hover:shadow-md cursor-pointer transition-all"
                          onClick={() => navigate(`/tournaments/${tournament._id}`)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-sm">{tournament.name}</h3>
                            <Badge variant="default" className="text-xs">Open</Badge>
                          </div>
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {tournament.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(tournament.startDate), 'MMM dd')}
                            </div>
                          </div>
                          <Button size="sm" className="w-full mt-3">
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* My Teams */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>My Teams</CardTitle>
                      <CardDescription>Teams you're a part of</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/teams">
                        Manage Teams
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {teamsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : myTeams.length > 0 ? (
                    <div className="space-y-3">
                      {myTeams.slice(0, 5).map((team: any) => (
                        <div key={team._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{team.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {team.players?.length || 0} player(s)
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to="/teams">View</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No teams yet</p>
                      <p className="text-sm mt-1">Register for a tournament to create your first team</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* My Tickets */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-green-600" />
                      <div>
                        <CardTitle>My Tickets</CardTitle>
                        <CardDescription>Your tournament tickets with QR codes</CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/tickets">
                        View All
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ticketsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : ticketsData && ticketsData.length > 0 ? (
                    <div className="space-y-4">
                      {ticketsData.slice(0, 3).map((ticket: any) => (
                        <TicketCard key={ticket.paymentId} payment={ticket} compact />
                      ))}
                      {ticketsData.length > 3 && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link to="/tickets">
                            View All {ticketsData.length} Tickets
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No tickets yet</p>
                      <p className="text-sm mt-1">Your tickets will appear here after registration</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Waitlist Entries */}
              {waitlistData && waitlistData.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50/30">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <div>
                        <CardTitle className="text-yellow-900">Waitlist Entries</CardTitle>
                        <CardDescription>Events you're waiting to join</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {waitlistData.slice(0, 3).map((entry: any) => (
                        <WaitlistStatus key={entry._id} entry={entry} />
                      ))}
                      {waitlistData.length > 3 && (
                        <Button variant="outline" className="w-full mt-2">
                          View All {waitlistData.length} Waitlist Entries
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

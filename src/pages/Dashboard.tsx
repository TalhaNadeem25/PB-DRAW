import TicketCard from "@/components/check-in/TicketCard";
import Layout from "@/components/layout/Layout";
import CancelRegistrationDialog from "@/components/registration/CancelRegistrationDialog";
import WaitlistStatus from "@/components/registration/WaitlistStatus";
import { ConnectAccountStatus } from "@/components/stripe/ConnectAccountStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonGrid } from "@/components/ui/skeleton-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI, invitationAPI, teamAPI, tournamentAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertCircle, ArrowRight, Award, Bell, Brain, Calendar, Clock, Loader2, MapPin, Medal, Play, Plus, Settings, Sparkles, Target, Ticket, TrendingUp, Trophy, UserPlus, Users, XCircle, Zap } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedCancellation, setSelectedCancellation] = useState<{
    eventId: string;
    eventName: string;
    tournamentName: string;
    isDoubles?: boolean;
    partnerName?: string;
  } | null>(null);

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

  // Extract individual event registrations from teams
  const myEventRegistrations = myTeams
    .filter((team: any) => team.event && team.event.tournament)
    .map((team: any) => ({
      eventId: team.event._id,
      eventName: team.event.name,
      eventFormat: team.event.format,
      tournamentId: team.event.tournament._id || team.event.tournament,
      tournamentName: team.event.tournament.name || 'Tournament',
      tournamentStartDate: team.event.tournament.startDate,
      tournamentLocation: team.event.tournament.location || 'TBD',
      tournamentStatus: team.event.tournament.status || 'upcoming',
      teamId: team._id,
      teamName: team.name,
      isDoubles: team.players?.length > 1,
      partnerName: team.players?.find((p: any) => p._id !== user._id)?.name,
      registeredAt: team.createdAt,
    }))
    .filter((reg: any) => {
      // Show all registrations where tournament hasn't finished yet
      const status = reg.tournamentStatus;
      return status === 'open' ||
             status === 'upcoming' ||
             status === 'in-progress' ||
             status === 'draft'; // Include draft in case tournaments haven't been published yet
    })
    .sort((a: any, b: any) => {
      const dateA = a.tournamentStartDate ? new Date(a.tournamentStartDate).getTime() : 0;
      const dateB = b.tournamentStartDate ? new Date(b.tournamentStartDate).getTime() : 0;
      return dateA - dateB;
    });

  const liveMatchesCount = myEventRegistrations.filter(
    (reg: any) => reg.tournamentStatus === "in-progress"
  ).length;

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
        {/* Compact top bar — no green hero */}
        <div className="border-b border-border/60 bg-card/50">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-1 break-words">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-muted-foreground text-sm">
                  {isOrganizer
                    ? "Manage your tournaments and track your events"
                    : liveMatchesCount > 0
                    ? `You have ${liveMatchesCount} live match${liveMatchesCount > 1 ? "es" : ""} today. Let's get that win.`
                    : "Track your progress and find new tournaments"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="icon" className="w-9 h-9 sm:w-10 sm:h-10">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button variant="outline" size="icon" className="w-9 h-9 sm:w-10 sm:h-10" asChild>
                  <Link to="/profile">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {isOrganizer ? (
            /* ORGANIZER DASHBOARD */
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
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

              {/* AI Planner Hero Card */}
              <Card className="border-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
                <CardContent className="pt-8 relative z-10">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-hero-gradient rounded-2xl flex items-center justify-center shadow-glow">
                        <Sparkles className="w-10 h-10 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full mb-3">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-xs font-bold text-primary">NEW FEATURE</span>
                      </div>
                      <h3 className="font-display font-bold text-2xl mb-2">
                        Plan Perfect Tournaments with AI
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Let AI help you calculate court requirements, suggest events, optimize schedules, and more. Get expert recommendations instantly.
                      </p>
                      <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-primary" />
                          <span className="text-sm">Smart Event Suggestions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="text-sm">Court Calculations</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-sm">Schedule Optimization</span>
                        </div>
                      </div>
                      <Button asChild size="lg" className="bg-hero-gradient hover:shadow-glow">
                        <Link to="/tournament-planner">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Try AI Planner Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[120px] sm:max-w-none">{tournament.location}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 shrink-0" />
                                {format(new Date(tournament.startDate), 'MMM dd, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 shrink-0" />
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
            <Tabs defaultValue="overview" className="w-full space-y-8">
              <TabsList className="bg-muted p-1 rounded-xl h-auto">
                <TabsTrigger value="overview" className="rounded-lg px-6 py-2.5 font-display uppercase font-bold tracking-widest text-xs data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="events" className="rounded-lg px-6 py-2.5 font-display uppercase font-bold tracking-widest text-xs data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                  Events & Waitlist
                </TabsTrigger>
                <TabsTrigger value="teams" className="rounded-lg px-6 py-2.5 font-display uppercase font-bold tracking-widest text-xs data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                  Teams & Network
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8 animate-in fade-in-50 duration-500">
              
              {/* Next Match Persistent Banner */}
              {myEventRegistrations.length > 0 && (
                <Card className="border-0 bg-hero-gradient text-primary-foreground rounded-2xl overflow-hidden relative shadow-md">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                  <CardContent className="p-6 relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full mb-3 border border-white/20">
                        <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
                        <span className="text-xs font-bold font-display uppercase tracking-widest text-white">Up Next</span>
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-4">
                        <div className="text-center">
                          <p className="text-sm font-display font-semibold uppercase tracking-wider text-white/80">
                            {myEventRegistrations[0].tournamentStartDate ? format(new Date(myEventRegistrations[0].tournamentStartDate), 'MMM') : 'TBD'}
                          </p>
                          <p className="text-4xl font-display font-black leading-none">
                            {myEventRegistrations[0].tournamentStartDate ? format(new Date(myEventRegistrations[0].tournamentStartDate), 'dd') : '--'}
                          </p>
                        </div>
                        <div className="h-10 w-px bg-white/20" />
                        <div className="text-left">
                          <h3 className="font-display font-bold text-xl leading-tight line-clamp-1">
                            {myEventRegistrations[0].eventName}
                          </h3>
                          <p className="text-sm font-medium text-white/90 truncate flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5" />
                            {myEventRegistrations[0].tournamentName}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex justify-center md:justify-end gap-3 w-full md:w-auto mt-4 md:mt-0">
                      <Button className="bg-white text-primary hover:bg-neutral-100 font-display font-bold uppercase tracking-widest w-full md:w-auto rounded-xl h-12" asChild>
                        <Link to={`/tournaments/${myEventRegistrations[0].tournamentId}`}>
                          View Bracket <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Player Stats — hero row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {/* Win rate hero card */}
                <Card className="md:col-span-2 glass-card rounded-2xl overflow-hidden bg-hero-gradient text-primary-foreground">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-display font-semibold tracking-wider uppercase text-primary-foreground/80">
                          Win Rate
                        </p>
                        <p className="font-display font-bold text-4xl mt-1">
                          {winRate}%
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{stats.matchesWon}W / {stats.matchesPlayed}M</span>
                      </div>
                    </div>
                    <p className="text-xs text-primary-foreground/80 mt-auto">
                      Keep playing to improve your ranking and unlock new events.
                    </p>
                  </CardContent>
                </Card>

                {/* Tournaments card */}
                <Card className="glass-card rounded-2xl">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[11px] font-display font-semibold tracking-wider text-muted-foreground uppercase">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Tournaments
                    </p>
                    <p className="font-display font-bold text-2xl text-foreground">
                      {stats.tournamentsPlayed}
                    </p>
                  </CardContent>
                </Card>

                {/* Skill level card */}
                <Card className="glass-card rounded-2xl">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Award className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[11px] font-display font-semibold tracking-wider text-muted-foreground uppercase">
                        Rating
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Skill Level
                    </p>
                    <p className="font-display font-bold text-2xl text-foreground">
                      {user.skillLevel || "N/A"}
                    </p>
                  </CardContent>
                </Card>

                {/* Medals card */}
                <Card className="glass-card rounded-2xl">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Medal className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[11px] font-display font-semibold tracking-wider text-muted-foreground uppercase">
                        Medals
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-yellow-600">{stats.goldMedals}</span>
                      <span className="text-base font-bold text-gray-400">{stats.silverMedals}</span>
                      <span className="text-base font-bold text-orange-600">{stats.bronzeMedals}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gold / Silver / Bronze
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Invitations moved to Teams tab */}


              {/* My Event Registrations */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-display text-xl">My Event Registrations</CardTitle>
                      <CardDescription>Events you're registered for across all tournaments</CardDescription>
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
                  {teamsLoading ? (
                    <SkeletonGrid count={3} />
                  ) : myEventRegistrations.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {myEventRegistrations.map((registration: any) => (
                        <div
                          key={registration.eventId}
                          className="glass-card-hover rounded-2xl p-4 cursor-pointer flex flex-col justify-between h-full"
                          onClick={() => navigate(`/tournaments/${registration.tournamentId}`)}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            {/* Date badge */}
                            <div className="flex flex-col items-center justify-center rounded-xl bg-muted px-2 py-2 min-w-[70px]">
                              <p className="text-[11px] font-display font-semibold uppercase text-muted-foreground">
                                {registration.tournamentStartDate
                                  ? format(new Date(registration.tournamentStartDate), 'MMM').toUpperCase()
                                  : 'TBD'}
                              </p>
                              <p className="font-display font-bold text-xl text-foreground leading-none">
                                {registration.tournamentStartDate
                                  ? format(new Date(registration.tournamentStartDate), 'dd')
                                  : '--'}
                              </p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-display font-bold text-base truncate">
                                  {registration.eventName}
                                </h3>
                                <Badge variant="outline" className="text-[11px] uppercase">
                                  {registration.eventFormat}
                                </Badge>
                                {registration.isDoubles && (
                                  <Badge variant="secondary" className="text-[11px] uppercase">
                                    Doubles
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <Trophy className="w-3 h-3" />
                                <span className="font-medium truncate">
                                  {registration.tournamentName}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {registration.tournamentLocation}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(registration.tournamentStartDate), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 text-xs">
                            <Badge
                              variant="secondary"
                              className="capitalize"
                            >
                              {registration.tournamentStatus.replace('-', ' ')}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCancellation({
                                    eventId: registration.eventId,
                                    eventName: registration.eventName,
                                    tournamentName: registration.tournamentName,
                                    isDoubles: registration.isDoubles,
                                    partnerName: registration.partnerName,
                                  });
                                  setCancelDialogOpen(true);
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No event registrations</p>
                      <Button asChild className="mt-4">
                        <Link to="/tournaments">Find Tournaments</Link>
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
                        <CardTitle className="font-display text-xl">Recommended For You</CardTitle>
                        <CardDescription>Based on your skill level and location</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/tournaments">
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

              {/* My Teams moved to Teams tab */}

              {/* Deep Performance Insights */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Deep Performance Insights</CardTitle>
                    <CardDescription>Keep an eye on your key stats over recent matches</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Serve Accuracy</span>
                        <span className="font-semibold">
                          {Math.min(100, Number(winRate) + 10)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-hero-gradient rounded-full"
                          style={{ width: `${Math.min(100, Number(winRate) + 10)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Third Shot Consistency</span>
                        <span className="font-semibold">
                          {Math.max(40, Math.min(95, Number(winRate)))}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full"
                          style={{ width: `${Math.max(40, Math.min(95, Number(winRate)))}%` }}
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      Your backhand drive has improved over recent events — keep trusting it on big
                      points.
                    </p>
                  </CardContent>
                </Card>

              </div>
              </TabsContent>

              <TabsContent value="events" className="space-y-8 animate-in fade-in-50 duration-500">

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
              </TabsContent>

              <TabsContent value="teams" className="space-y-8 animate-in fade-in-50 duration-500">
                {/* Pending Invitations - banner style */}
                {pendingInvitations.length > 0 && (
                  <Card className="border-orange-200 bg-orange-50/80 rounded-2xl overflow-hidden">
                    <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-orange-900">
                            Pending team invitation
                          </p>
                          <p className="text-sm text-orange-800">
                            You have {pendingInvitations.length} team invitation
                            {pendingInvitations.length > 1 ? "s" : ""} waiting for your response.
                          </p>
                        </div>
                      </div>
                      <Button className="md:w-auto w-full bg-orange-500 hover:bg-orange-600 text-white" asChild>
                        <Link to="/teams">Review</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* My Teams */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-display text-xl">My Teams</CardTitle>
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
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Cancel Registration Dialog */}
      {selectedCancellation && (
        <CancelRegistrationDialog
          eventId={selectedCancellation.eventId}
          eventName={selectedCancellation.eventName}
          tournamentName={selectedCancellation.tournamentName}
          isDoubles={selectedCancellation.isDoubles}
          partnerName={selectedCancellation.partnerName}
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          onSuccess={() => {
            // Refresh data after successful cancellation
            window.location.reload();
          }}
        />
      )}
    </Layout>
  );
};

export default Dashboard;

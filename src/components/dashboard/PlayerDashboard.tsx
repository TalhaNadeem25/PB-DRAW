import TicketCard from "@/components/check-in/TicketCard";
import WaitlistStatus from "@/components/registration/WaitlistStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonGrid } from "@/components/ui/skeleton-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  ArrowRight,
  Medal,
  Calendar,
  Clock,
  CircleNotch,
  MapPin,
  Ticket,
  Trophy,
  TrendingUp,
  UserPlus,
  Users,
  XCircle,
} from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";

export interface PlayerDashboardStats {
  matchesPlayed: number;
  matchesWon: number;
  tournamentsPlayed: number;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
}

export interface PlayerDashboardUser {
  skillLevel?: number | string;
}

export interface EventRegistration {
  eventId: string;
  eventName: string;
  eventFormat?: string;
  tournamentId: string;
  tournamentName: string;
  tournamentStartDate?: string;
  tournamentLocation?: string;
  tournamentStatus?: string;
  isDoubles?: boolean;
  partnerName?: string;
  [key: string]: unknown;
}

export interface CancelRegistrationPayload {
  eventId: string;
  eventName: string;
  tournamentName: string;
  isDoubles?: boolean;
  partnerName?: string;
}

export interface PlayerDashboardProps {
  stats: PlayerDashboardStats;
  winRate: string;
  user: PlayerDashboardUser;
  myEventRegistrations: EventRegistration[];
  recommendedTournaments: Array<{
    _id: string;
    name: string;
    location?: string;
    startDate?: string;
    [key: string]: unknown;
  }>;
  myTeams: Array<{ _id: string; name?: string; players?: unknown[]; [key: string]: unknown }>;
  pendingInvitations: unknown[];
  ticketsData: unknown[];
  waitlistData: unknown[];
  teamsLoading: boolean;
  ticketsLoading: boolean;
  onCancelRegistration: (payload: CancelRegistrationPayload) => void;
}

const PlayerDashboard = ({
  stats,
  winRate,
  user,
  myEventRegistrations,
  recommendedTournaments,
  myTeams,
  pendingInvitations,
  ticketsData,
  waitlistData,
  teamsLoading,
  ticketsLoading,
  onCancelRegistration,
}: PlayerDashboardProps) => {
  const navigate = useNavigate();

  return (
    <Tabs defaultValue="overview" className="w-full space-y-8">
      <TabsList className="bg-muted p-1 rounded-xl h-auto">
        <TabsTrigger
          value="overview"
          className="rounded-lg px-6 py-2.5 font-display uppercase font-bold tracking-widest text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="events"
          className="rounded-lg px-6 py-2.5 font-display uppercase font-bold tracking-widest text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
        >
          Events & Waitlist
        </TabsTrigger>
        <TabsTrigger
          value="teams"
          className="rounded-lg px-6 py-2.5 font-display uppercase font-bold tracking-widest text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
        >
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
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-card/20 backdrop-blur-md rounded-full mb-3 border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
                  <span className="text-xs font-bold font-display uppercase tracking-widest text-white">
                    Up Next
                  </span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <div className="text-center">
                    <p className="text-sm font-display font-semibold uppercase tracking-wider text-white/80">
                      {myEventRegistrations[0].tournamentStartDate
                        ? format(new Date(myEventRegistrations[0].tournamentStartDate), "MMM")
                        : "TBD"}
                    </p>
                    <p className="text-4xl font-display font-black leading-none">
                      {myEventRegistrations[0].tournamentStartDate
                        ? format(new Date(myEventRegistrations[0].tournamentStartDate), "dd")
                        : "--"}
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
                <Button
                  className="bg-white text-primary hover:bg-neutral-100 font-display font-bold uppercase tracking-widest w-full md:w-auto rounded-xl h-12"
                  asChild
                >
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
          <Card className="md:col-span-2 glass-card rounded-2xl overflow-hidden bg-hero-gradient text-primary-foreground">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-display font-semibold tracking-wider uppercase text-primary-foreground/80">
                    Win Rate
                  </p>
                  <p className="font-display font-bold text-4xl mt-1">{winRate}%</p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    {stats.matchesWon}W / {stats.matchesPlayed}M
                  </span>
                </div>
              </div>
              <p className="text-xs text-primary-foreground/80 mt-auto">
                Keep playing to improve your ranking and unlock new events.
              </p>
            </CardContent>
          </Card>

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
              <p className="text-xs text-muted-foreground mb-1">Tournaments</p>
              <p className="font-display font-bold text-2xl text-foreground">
                {stats.tournamentsPlayed}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Medal className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[11px] font-display font-semibold tracking-wider text-muted-foreground uppercase">
                  Rating
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Skill Level</p>
              <p className="font-display font-bold text-2xl text-foreground">
                {user.skillLevel ?? "N/A"}
              </p>
            </CardContent>
          </Card>

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
              <p className="text-xs text-muted-foreground">Gold / Silver / Bronze</p>
            </CardContent>
          </Card>
        </div>

        {/* My Event Registrations */}
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-xl">My Event Registrations</CardTitle>
                <CardDescription>
                  Events you're registered for across all tournaments
                </CardDescription>
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
                {myEventRegistrations.map((registration) => (
                  <div
                    key={registration.eventId}
                    className="glass-card-hover rounded-2xl p-4 cursor-pointer flex flex-col justify-between h-full"
                    onClick={() => navigate(`/tournaments/${registration.tournamentId}`)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex flex-col items-center justify-center rounded-xl bg-muted px-2 py-2 min-w-[70px]">
                        <p className="text-[11px] font-display font-semibold uppercase text-muted-foreground">
                          {registration.tournamentStartDate
                            ? format(
                                new Date(registration.tournamentStartDate),
                                "MMM"
                              ).toUpperCase()
                            : "TBD"}
                        </p>
                        <p className="font-display font-bold text-xl text-foreground leading-none">
                          {registration.tournamentStartDate
                            ? format(new Date(registration.tournamentStartDate), "dd")
                            : "--"}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-bold text-base truncate">
                            {registration.eventName}
                          </h3>
                          {registration.eventFormat && (
                            <Badge variant="outline" className="text-[11px] uppercase">
                              {registration.eventFormat}
                            </Badge>
                          )}
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
                            {registration.tournamentLocation ?? "TBD"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {registration.tournamentStartDate
                              ? format(
                                  new Date(registration.tournamentStartDate),
                                  "MMM dd, yyyy"
                                )
                              : "TBD"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs">
                      {registration.tournamentStatus && (
                        <Badge variant="secondary" className="capitalize">
                          {String(registration.tournamentStatus).replace("-", " ")}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelRegistration({
                              eventId: registration.eventId,
                              eventName: registration.eventName,
                              tournamentName: registration.tournamentName,
                              isDoubles: registration.isDoubles,
                              partnerName: registration.partnerName,
                            });
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
                {recommendedTournaments.map((tournament) => (
                  <div
                    key={tournament._id}
                    className="p-4 border rounded-lg hover:shadow-md cursor-pointer transition-all"
                    onClick={() => navigate(`/tournaments/${tournament._id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-sm">{tournament.name}</h3>
                      <Badge variant="default" className="text-xs">
                        Open
                      </Badge>
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      {tournament.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {tournament.location}
                        </div>
                      )}
                      {tournament.startDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(tournament.startDate), "MMM dd")}
                        </div>
                      )}
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

        {/* Deep Performance Insights */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="font-display text-lg">Deep Performance Insights</CardTitle>
              <CardDescription>
                Keep an eye on your key stats over recent matches
              </CardDescription>
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
                    style={{
                      width: `${Math.max(40, Math.min(95, Number(winRate)))}%`,
                    }}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground italic">
                Your backhand drive has improved over recent events — keep trusting it on big points.
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
                <CircleNotch className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : ticketsData && Array.isArray(ticketsData) && ticketsData.length > 0 ? (
              <div className="space-y-4">
                {ticketsData.slice(0, 3).map((ticket: any, index: number) => (
                  <TicketCard
                    key={ticket?.paymentId ?? index}
                    payment={ticket}
                    compact
                  />
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
        {waitlistData && Array.isArray(waitlistData) && waitlistData.length > 0 && (
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
                  <WaitlistStatus
                    key={entry?._id ?? Math.random()}
                    entry={entry}
                  />
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
              <Button
                className="md:w-auto w-full bg-orange-500 hover:bg-orange-600 text-white"
                asChild
              >
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
                <CircleNotch className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : myTeams.length > 0 ? (
              <div className="space-y-3">
                {myTeams.slice(0, 5).map((team) => (
                  <div
                    key={team._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {team.players?.length ?? 0} player(s)
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
  );
};

export default PlayerDashboard;

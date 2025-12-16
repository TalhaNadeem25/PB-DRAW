import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Trophy,
  Filter,
  Loader2,
  Award,
  Clock
} from "lucide-react";
import { tournamentAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Discover = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [skillLevelFilter, setSkillLevelFilter] = useState<string>("all");

  const { data: tournamentsData, isLoading } = useQuery({
    queryKey: ['discover-tournaments'],
    queryFn: () => tournamentAPI.getAll(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const tournaments = tournamentsData?.data || [];

  // Filter tournaments
  const filteredTournaments = tournaments.filter((tournament: any) => {
    // Search filter
    const matchesSearch = searchQuery === "" ||
      tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.location?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "all" ||
      tournament.status === statusFilter;

    // Skill level filter (check if tournament events have matching skill levels)
    const matchesSkillLevel = skillLevelFilter === "all" ||
      (tournament.events && tournament.events.some((event: any) =>
        event.skillLevel?.toString() === skillLevelFilter
      ));

    return matchesSearch && matchesStatus && matchesSkillLevel;
  });

  // Sort: upcoming/open first, then by date
  const sortedTournaments = [...filteredTournaments].sort((a: any, b: any) => {
    // Priority: open > upcoming > in-progress > completed
    const statusPriority: any = { 'open': 1, 'upcoming': 2, 'in-progress': 3, 'completed': 4 };
    const aPriority = statusPriority[a.status] || 99;
    const bPriority = statusPriority[b.status] || 99;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Sort by start date
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const getStatusBadge = (status: string) => {
    const styles: any = {
      'open': 'bg-green-100 text-green-700',
      'upcoming': 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-orange-100 text-orange-700',
      'completed': 'bg-gray-100 text-gray-700',
    };

    return (
      <div className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </div>
    );
  };

  const handleTournamentClick = (tournamentId: string) => {
    navigate(`/tournaments/${tournamentId}`);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
              Discover Tournaments
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl">
              Browse and join pickleball tournaments near you. Find the perfect competition for your skill level.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b bg-white sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search tournaments by name, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              {/* Skill Level Filter */}
              <Select value={skillLevelFilter} onValueChange={setSkillLevelFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Award className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Skill Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="2.5">2.5</SelectItem>
                  <SelectItem value="3.0">3.0</SelectItem>
                  <SelectItem value="3.5">3.5</SelectItem>
                  <SelectItem value="4.0">4.0</SelectItem>
                  <SelectItem value="4.5">4.5</SelectItem>
                  <SelectItem value="5.0">5.0</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tournament Grid */}
        <div className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : sortedTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTournaments.map((tournament: any) => (
                <Card
                  key={tournament._id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleTournamentClick(tournament._id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">{tournament.name}</CardTitle>
                      </div>
                      {getStatusBadge(tournament.status)}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {tournament.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Location */}
                    {tournament.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{tournament.location}</span>
                      </div>
                    )}

                    {/* Registration Deadline */}
                    {tournament.registrationDeadline && tournament.status === 'open' && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          Register by {new Date(tournament.registrationDeadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {/* Max Teams */}
                    {tournament.maxTeams && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>Max {tournament.maxTeams} teams</span>
                      </div>
                    )}

                    {/* Entry Fee */}
                    {tournament.entryFee && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                        <Trophy className="w-4 h-4" />
                        <span>${tournament.entryFee} entry fee</span>
                      </div>
                    )}

                    {/* Skill Levels */}
                    {tournament.events && tournament.events.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Award className="w-4 h-4" />
                        <span>
                          Levels: {[...new Set(tournament.events.map((e: any) => e.skillLevel).filter(Boolean))].join(', ')}
                        </span>
                      </div>
                    )}

                    {/* CTA Button */}
                    {tournament.status === 'open' && (
                      <Button
                        className="w-full mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAuthenticated) {
                            toast.error("Please log in to register for tournaments");
                            navigate("/login");
                          } else {
                            navigate(`/tournaments/${tournament._id}`);
                          }
                        }}
                      >
                        View Details & Register
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No tournaments found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || skillLevelFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Check back soon for new tournaments"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Discover;

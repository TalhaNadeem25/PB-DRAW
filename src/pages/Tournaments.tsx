import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import TournamentCard from "@/components/tournaments/TournamentCard";
import TournamentSidebar, { RatingWidget, NextMatchWidget, PartnerRequestsWidget, NearbyCourtsWidget } from "@/components/tournaments/TournamentSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  Loader2,
  Trophy,
  X,
  ChevronDown,
  Signal,
  Calendar,
  ArrowRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tournamentAPI } from "@/services/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const Tournaments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("soonest");
  const [locationFilter, setLocationFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["tournaments", searchQuery, statusFilter],
    queryFn: () =>
      tournamentAPI.getAll({
        status: statusFilter,
        search: searchQuery,
        limit: 50,
      }),
  });

  const tournaments = data?.data || [];

  const formattedTournaments = tournaments.map((tournament: any) => ({
    id: tournament._id,
    name: tournament.name,
    location: tournament.location,
    startDate: format(new Date(tournament.startDate), "MMM dd"),
    endDate: format(new Date(tournament.endDate), "MMM dd"),
    playerCount: tournament.currentPlayers || 0,
    maxPlayers: tournament.maxPlayers,
    eventCount: tournament.events?.length || 0,
    status: tournament.status,
    featured: false,
    entryFee: tournament.entryFee || 0,
    skillLevel: tournament.skillLevel || "All Levels",
    imageUrl: tournament.imageUrl || "",
    organizerId: typeof tournament.organizer === 'string' ? tournament.organizer : tournament.organizer?._id,
  }));

  const activeFiltersCount = [locationFilter, skillFilter].filter(Boolean).length;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Search Section */}
        <div className="border-b border-border/60 bg-card/50">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            {/* Search Bar Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
              <div className="flex-1 min-w-0 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by tournament name or venue"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base bg-background border-border rounded-xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button className="h-12 px-4 sm:px-6 font-display text-sm gap-2 rounded-xl shadow-sm shrink-0">
                <MapPin className="w-4 h-4" />
                Nearby
              </Button>
            </div>

            {/* Filter Chips Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Location */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full text-sm gap-1.5 font-medium border-border/80"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Location
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setLocationFilter("")}>
                    All Locations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocationFilter("nearby")}>
                    Nearby
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocationFilter("ca")}>
                    California
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocationFilter("fl")}>
                    Florida
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocationFilter("tx")}>
                    Texas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Skill Level */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full text-sm gap-1.5 font-medium border-border/80"
                  >
                    <Signal className="w-3.5 h-3.5" />
                    Skill Level
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setSkillFilter("")}>
                    All Levels
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSkillFilter("2.0-3.0")}>
                    2.0 - 3.0
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSkillFilter("3.0-4.0")}>
                    3.0 - 4.0
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSkillFilter("4.0-5.0")}>
                    4.0 - 5.0
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Date Range */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full text-sm gap-1.5 font-medium border-border/80"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Date Range
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>This Week</DropdownMenuItem>
                  <DropdownMenuItem>This Month</DropdownMenuItem>
                  <DropdownMenuItem>Next 3 Months</DropdownMenuItem>
                  <DropdownMenuItem>All Dates</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort */}
              <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2 mt-2 sm:mt-0">
                <span className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase">
                  Sort by:
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[130px] h-9 border-0 bg-transparent text-sm font-semibold p-0 shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soonest">Soonest</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="price-low">Price: Low</SelectItem>
                    <SelectItem value="price-high">Price: High</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filter pills */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {locationFilter && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {locationFilter}
                    <button onClick={() => setLocationFilter("")}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {skillFilter && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {skillFilter}
                    <button onClick={() => setSkillFilter("")}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <p className="text-muted-foreground">Loading tournaments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">
                Error loading tournaments
              </h3>
              <p className="text-muted-foreground mb-4">Please try again later.</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-start">
              {/* Left: Tournament Grid */}
              <div className="flex-1 min-w-0 w-full">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold text-foreground">
                    Featured Tournaments
                  </h2>
                  <button className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                    View all <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {formattedTournaments.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-5">
                    {formattedTournaments.map((tournament: any, index: number) => (
                      <div
                        key={tournament.id}
                        className="animate-fade-in"
                        style={{
                          animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
                        }}
                      >
                        <TournamentCard {...tournament} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-6">
                      <Trophy className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-2">
                      No tournaments found
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      Try adjusting your search or filters to find more tournaments.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                        setLocationFilter("");
                        setSkillFilter("");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>

              {/* Right: Sidebar — sticky on desktop, horizontal scroll on mobile */}
              <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-4 min-w-max">
                  <div className="w-[280px] shrink-0"><RatingWidget /></div>
                  <div className="w-[280px] shrink-0"><NextMatchWidget /></div>
                  <div className="w-[280px] shrink-0"><PartnerRequestsWidget /></div>
                  <div className="w-[280px] shrink-0"><NearbyCourtsWidget /></div>
                </div>
              </div>
              <div className="hidden lg:block w-[320px] shrink-0 sticky top-24">
                <TournamentSidebar />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Tournaments;

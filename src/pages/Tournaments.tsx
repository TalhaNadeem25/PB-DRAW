import { useState } from "react";
import Layout from "@/components/layout/Layout";
import TournamentCard from "@/components/tournaments/TournamentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data for tournaments
const mockTournaments = [
  {
    id: "1",
    name: "Summer Slam Championship 2024",
    location: "Austin, TX",
    startDate: "Jun 15",
    endDate: "Jun 17",
    playerCount: 128,
    maxPlayers: 256,
    eventCount: 6,
    status: "open" as const,
    featured: true,
  },
  {
    id: "2",
    name: "Desert Classic Open",
    location: "Phoenix, AZ",
    startDate: "Jun 22",
    endDate: "Jun 24",
    playerCount: 64,
    maxPlayers: 128,
    eventCount: 4,
    status: "open" as const,
  },
  {
    id: "3",
    name: "Pacific Coast Showdown",
    location: "San Diego, CA",
    startDate: "Jul 1",
    endDate: "Jul 3",
    playerCount: 200,
    maxPlayers: 200,
    eventCount: 8,
    status: "closed" as const,
  },
  {
    id: "4",
    name: "Midwest Masters",
    location: "Chicago, IL",
    startDate: "Jul 8",
    endDate: "Jul 10",
    playerCount: 156,
    maxPlayers: 256,
    eventCount: 6,
    status: "in-progress" as const,
    featured: true,
  },
  {
    id: "5",
    name: "Rocky Mountain Challenge",
    location: "Denver, CO",
    startDate: "Jul 15",
    endDate: "Jul 17",
    playerCount: 48,
    maxPlayers: 128,
    eventCount: 4,
    status: "open" as const,
  },
  {
    id: "6",
    name: "Southeast Showdown",
    location: "Atlanta, GA",
    startDate: "May 20",
    endDate: "May 22",
    playerCount: 128,
    maxPlayers: 128,
    eventCount: 5,
    status: "completed" as const,
  },
];

const Tournaments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredTournaments = mockTournaments.filter((tournament) => {
    const matchesSearch =
      tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || tournament.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4 animate-fade-in">
              Find Tournaments
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Discover and register for pickleball tournaments near you.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="container mx-auto px-4 -mt-8 relative z-10">
          <div className="bg-card rounded-2xl shadow-card p-6 border border-border animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search tournaments or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Registration Open</SelectItem>
                    <SelectItem value="closed">Registration Closed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  Near Me
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredTournaments.length}</span> tournaments
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament, index) => (
              <div
                key={tournament.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <TournamentCard {...tournament} />
              </div>
            ))}
          </div>

          {filteredTournaments.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">No tournaments found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Tournaments;

import { useParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

// Mock tournament data
const tournament = {
  id: "1",
  name: "Summer Slam Championship 2024",
  location: "Austin Pickleball Complex, Austin, TX",
  address: "1234 Court Street, Austin, TX 78701",
  startDate: "June 15, 2024",
  endDate: "June 17, 2024",
  registrationDeadline: "June 10, 2024",
  playerCount: 128,
  maxPlayers: 256,
  status: "open",
  description:
    "Join us for the biggest pickleball event of the summer! The Summer Slam Championship brings together players from across the nation for three days of intense competition, amazing prizes, and unforgettable moments. Whether you're a seasoned pro or an aspiring competitor, there's an event for everyone.",
  events: [
    { id: "1", name: "Men's Singles", format: "Singles", skillLevel: "4.0+", spots: "32/64", price: 50 },
    { id: "2", name: "Women's Singles", format: "Singles", skillLevel: "4.0+", spots: "28/64", price: 50 },
    { id: "3", name: "Men's Doubles", format: "Doubles", skillLevel: "4.0+", spots: "24/32 Teams", price: 75 },
    { id: "4", name: "Women's Doubles", format: "Doubles", skillLevel: "4.0+", spots: "20/32 Teams", price: 75 },
    { id: "5", name: "Mixed Doubles", format: "Doubles", skillLevel: "3.5+", spots: "28/48 Teams", price: 75 },
    { id: "6", name: "Senior Mixed 50+", format: "Doubles", skillLevel: "3.0+", spots: "16/32 Teams", price: 60 },
  ],
  organizer: {
    name: "Austin Pickleball Association",
    email: "tournaments@austinpickleball.com",
    phone: "(512) 555-0123",
  },
};

const TournamentDetail = () => {
  const { id } = useParams();

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
                  Registration Open
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
                    {tournament.startDate} - {tournament.endDate}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <Button variant="glass" size="icon">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="glass" size="icon">
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button variant="accent" size="lg">
                  Register Now
                </Button>
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
                          <div className="font-display font-bold text-xl">{tournament.playerCount} / {tournament.maxPlayers}</div>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(tournament.playerCount / tournament.maxPlayers) * 100}%` }}
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
                          <div className="font-display font-bold text-xl">{tournament.registrationDeadline}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                  <h3 className="text-2xl font-display font-bold mb-6">Available Events</h3>
                  <div className="space-y-4">
                    {tournament.events.map((event) => (
                      <div
                        key={event.id}
                        className="p-6 bg-card rounded-xl border border-border hover:shadow-card transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <h4 className="font-display font-bold text-lg">{event.name}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline">{event.format}</Badge>
                              <Badge variant="accent">{event.skillLevel}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Spots</div>
                              <div className="font-semibold">{event.spots}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Entry Fee</div>
                              <div className="font-display font-bold text-primary">${event.price}</div>
                            </div>
                            <div className="flex gap-2">
                              <Button asChild>
                                <Link to={`/tournaments/${id}/events/${event.id}/pools`}>
                                  <Settings className="w-4 h-4 mr-1" />
                                  Manage
                                </Link>
                              </Button>
                              <Button variant="outline">Register</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="mt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Schedule will be available closer to the event date.</p>
                  </div>
                </TabsContent>

                <TabsContent value="brackets" className="mt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Brackets will be generated once registration closes.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {/* Registration Card */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-card sticky top-24">
                <h3 className="font-display font-bold text-lg mb-4">Quick Registration</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-semibold">From $50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Events</span>
                    <span className="font-semibold">{tournament.events.length} Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-semibold">{tournament.registrationDeadline}</span>
                  </div>
                </div>
                <Button variant="hero" className="w-full" size="lg">
                  Register Now
                </Button>
              </div>

              {/* Organizer Info */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display font-bold text-lg mb-4">Organizer</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Organization</div>
                    <div className="font-semibold">{tournament.organizer.name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <a href={`mailto:${tournament.organizer.email}`} className="font-semibold text-primary hover:underline">
                      {tournament.organizer.email}
                    </a>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Phone</div>
                    <div className="font-semibold">{tournament.organizer.phone}</div>
                  </div>
                </div>
              </div>

              {/* Venue Info */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display font-bold text-lg mb-4">Venue</h3>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">Austin Pickleball Complex</div>
                    <div className="text-sm text-muted-foreground">{tournament.address}</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View on Map
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TournamentDetail;

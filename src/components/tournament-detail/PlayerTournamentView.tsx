import ExportButtons from "@/components/tournament/ExportButtons";
import TournamentSchedule from "@/components/tournament/TournamentSchedule";
import BracketViewer from "@/components/tournament/BracketViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEventSkillLevel } from "@/types/tournament";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Heart,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Share2,
  Trophy,
  Users,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export interface StatusInfo {
  label: string;
  className: string;
  dotClass: string;
}

export interface PlayerTournamentViewProps {
  tournament: any;
  tournamentId: string;
  statusInfo: StatusInfo;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onCopySpectatorLink?: () => void;
}

export default function PlayerTournamentView({
  tournament,
  tournamentId: id,
  statusInfo,
  isFavorite,
  onToggleFavorite,
  onCopySpectatorLink,
}: PlayerTournamentViewProps) {
  return (
    <Layout variant="minimal">
      <Helmet>
        <title>{tournament.name} | Picklix</title>
        <meta name="description" content={tournament.description || `Register for ${tournament.name} on Picklix.`} />
        <meta property="og:title" content={`${tournament.name} | Picklix`} />
        <meta property="og:description" content={tournament.description || `Register for ${tournament.name} on Picklix.`} />
        {tournament.image && <meta property="og:image" content={tournament.image} />}
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border/60 py-10 relative overflow-hidden shadow-sm">
          <div className="container mx-auto px-4 relative z-10">
            <Link to="/tournaments" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Tournaments
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 overflow-hidden">
              <div className="animate-fade-in">
                <Badge variant="outline" className={cn("font-medium border mb-3 backdrop-blur-sm", statusInfo.className)}>
                  <span className={cn("w-2 h-2 rounded-full mr-2", statusInfo.dotClass)} />
                  {statusInfo.label}
                </Badge>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3 break-words">
                  {tournament.name}
                </h1>
                <div className="flex flex-wrap gap-3 text-muted-foreground font-sans">
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full text-sm border border-border/50">
                    <MapPin className="w-4 h-4 text-primary" />
                    {tournament.location}
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full text-sm border border-border/50">
                    <Calendar className="w-4 h-4 text-primary" />
                    {format(new Date(tournament.startDate), "MMM dd, yyyy")} - {format(new Date(tournament.endDate), "MMM dd, yyyy")}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <Button variant="outline" size="icon" className="shadow-sm hover:shadow-md transition-shadow w-9 h-9 sm:w-10 sm:h-10" onClick={onToggleFavorite}>
                  <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5 transition-colors", isFavorite && "fill-red-500 text-red-500")} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="shadow-sm hover:shadow-md transition-shadow w-9 h-9 sm:w-10 sm:h-10"
                  onClick={onCopySpectatorLink}
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <ExportButtons tournament={tournament} matches={tournament.matches || []} teams={tournament.teams || []} events={tournament.events || []} variant="outline" />
                {tournament.status === "open" && (
                  <Button variant="default" size="default" className="shadow-sm hover:shadow-md transition-shadow font-bold text-sm sm:text-base" asChild>
                    <Link to={`/tournaments/${id}/register`}>Register Now</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {tournament.image && (
            <div className="bg-card rounded-2xl overflow-hidden mb-8 animate-fade-in border border-border/60 shadow-sm relative">
              <div className="h-1.5 bg-primary absolute top-0 left-0 right-0" />
              <div className="p-8 pt-10">
                <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Tournament Gallery
                </h3>
                <Carousel className="w-full">
                  <CarouselContent>
                    <CarouselItem>
                      <div className="relative aspect-video rounded-lg overflow-hidden">
                        <img src={tournament.image} alt={tournament.name} className="w-full h-full object-cover" />
                      </div>
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6 lg:space-y-8 min-w-0">
              <Tabs defaultValue="overview" className="animate-fade-in">
                <TabsList className="w-full justify-start bg-card border border-border/60 p-1.5 rounded-xl gap-1 overflow-x-auto scrollbar-hide shadow-sm">
                  <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 data-[state=active]:hover:bg-primary transition-all shrink-0 text-xs sm:text-sm font-semibold">Overview</TabsTrigger>
                  <TabsTrigger value="events" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 data-[state=active]:hover:bg-primary transition-all shrink-0 text-xs sm:text-sm font-semibold">Events</TabsTrigger>
                  <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 data-[state=active]:hover:bg-primary transition-all shrink-0 text-xs sm:text-sm font-semibold">Schedule</TabsTrigger>
                  <TabsTrigger value="brackets" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 data-[state=active]:hover:bg-primary transition-all shrink-0 text-xs sm:text-sm font-semibold">Brackets</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="prose max-w-none">
                    <h3 className="text-2xl font-display font-bold mb-4">About This Tournament</h3>
                    <p className="text-muted-foreground leading-relaxed">{tournament.description}</p>
                  </div>

                  <div className="mt-8 grid sm:grid-cols-2 gap-4">
                    <div className="group bg-card rounded-2xl border border-border/60 hover:border-border p-8 shadow-sm transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors duration-300 flex items-center justify-center">
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
                              const pct = Math.round(((tournament.currentPlayers || 0) / tournament.maxPlayers) * 100);
                              if (pct >= 90) return "bg-destructive";
                              if (pct >= 70) return "bg-warning";
                              return "bg-primary";
                            })()
                          )}
                          style={{ width: `${((tournament.currentPlayers || 0) / tournament.maxPlayers) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="group bg-card rounded-2xl border border-border/60 hover:border-border p-8 shadow-sm transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors duration-300 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Registration Deadline</div>
                          <div className="font-display font-bold text-xl">{format(new Date(tournament.registrationDeadline), "MMM dd, yyyy")}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {tournament.venue && (
                    <div className="mt-8 bg-card rounded-2xl border border-border/60 p-8 shadow-sm">
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
                        {tournament.venue.facilities?.length > 0 && (
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

                  {tournament.rules && (
                    <div className="mt-8 bg-card rounded-2xl border border-border/60 p-8 shadow-sm">
                      <h3 className="font-display font-bold text-lg mb-4">Tournament Rules</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{tournament.rules}</p>
                    </div>
                  )}

                  {(tournament.contactEmail || tournament.contactPhone) && (
                    <div className="mt-8 bg-card rounded-2xl border border-border/60 p-8 shadow-sm">
                      <h3 className="font-display font-bold text-lg mb-4">Contact Information</h3>
                      <div className="space-y-2">
                        {tournament.contactEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <a href={`mailto:${tournament.contactEmail}`} className="font-semibold text-primary hover:underline">{tournament.contactEmail}</a>
                          </div>
                        )}
                        {tournament.contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <a href={`tel:${tournament.contactPhone}`} className="font-semibold">{tournament.contactPhone}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                  <div className="mb-6">
                    <h3 className="text-2xl font-display font-bold">Available Events</h3>
                  </div>
                  {tournament.events?.length > 0 ? (
                    <div className="space-y-4">
                      {tournament.events.map((event: any, index: number) => (
                        <div key={event._id} className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm hover:border-border transition-colors animate-fade-in" style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                              <h4 className="font-display font-bold text-lg">{event.name}</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="capitalize">{(event.format || "").replace("-", " ")}</Badge>
                                <Badge variant="accent">{formatEventSkillLevel(event.skillLevel)}</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">
                                  {(event.format || "").toLowerCase() === "singles" ? "Players" : "Teams"} Registered
                                </div>
                                <div className="font-semibold">{event.currentTeams || 0}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Entry Fee</div>
                                <div className="font-display font-bold text-primary">${event.entryFee}</div>
                              </div>
                              {tournament.status === "open" && (
                                <Button variant="outline" asChild>
                                  <Link to={`/tournaments/${id}/register`}>Register</Link>
                                </Button>
                              )}
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
                  <TournamentSchedule tournamentId={id} tournamentStartDate={tournament.startDate} />
                </TabsContent>

                <TabsContent value="brackets" className="mt-6">
                  <BracketViewer tournamentId={id} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="bg-card rounded-2xl border border-border/60 p-8 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
                <h3 className="font-display font-bold text-lg mb-4 mt-2">Quick Registration</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-display font-bold text-lg text-primary">
                      {tournament.events?.length > 0
                        ? `From $${Math.min(...tournament.events.map((e: any) => e.entryFee))}`
                        : "TBD"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Events</span>
                    <Badge variant="secondary">{tournament.events?.length || 0} Available</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-semibold">{format(new Date(tournament.registrationDeadline), "MMM dd")}</span>
                  </div>
                </div>
                {tournament.status === "open" && (
                  <Button variant="default" className="w-full shadow-sm hover:shadow-md transition-all duration-300 group font-bold" size="lg" asChild>
                    <Link to={`/tournaments/${id}/register`}>
                      Register Now
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border/60 p-8 shadow-sm">
                <h3 className="font-display font-bold text-lg mb-4">Organizer</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Name</div>
                    <div className="font-semibold">{tournament.organizer?.name || "Unknown"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <a href={`mailto:${tournament.organizer?.email || ""}`} className="font-semibold text-primary hover:underline">{tournament.organizer?.email || "Not provided"}</a>
                  </div>
                  {tournament.organizer?.phone && (
                    <div>
                      <div className="text-muted-foreground">Phone</div>
                      <div className="font-semibold">{tournament.organizer.phone}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border/60 p-8 shadow-sm">
                <h3 className="font-display font-bold text-lg mb-4">Venue</h3>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">{tournament.venue?.name || tournament.location}</div>
                    <div className="text-sm text-muted-foreground">{tournament.address}</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4 hover-lift" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(tournament.address)}`, "_blank")}>
                  View on Map
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


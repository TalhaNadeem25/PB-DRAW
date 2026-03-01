import { Clock, MapPin, Trophy, CheckCircle, XCircle, ArrowRight, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/* ────────────────────────────────
   YOUR RATING WIDGET
──────────────────────────────── */
export const RatingWidget = () => (
  <Card className="overflow-hidden border-0 shadow-sm">
    <div className="bg-primary px-5 py-1.5 flex items-center justify-between">
      <span className="text-xs font-display font-semibold tracking-wider text-primary-foreground uppercase">
        Your Rating
      </span>
      <Trophy className="w-4 h-4 text-primary-foreground/70" />
    </div>
    <CardContent className="p-5">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-4xl font-display font-bold text-foreground">—</span>
        <span className="text-sm text-muted-foreground font-semibold">DUPR</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Connect DUPR to see your rating
      </p>
    </CardContent>
  </Card>
);

/* ────────────────────────────────
   NEXT MATCH WIDGET
──────────────────────────────── */
export const NextMatchWidget = () => (
  <Card className="border border-border/60 shadow-sm">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-bold tracking-wider text-foreground uppercase">
          Next Match
        </h3>
        <Badge variant="outline" className="text-xs font-display text-primary border-primary/30 bg-primary/5">
          <Timer className="w-3 h-3 mr-1" />
          Starting in 2h 45m
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <span className="text-base font-display font-bold text-foreground">Quarter Finals</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Court</span>
            <p className="font-semibold text-foreground">Court #04</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Opponent</span>
            <p className="font-semibold text-foreground">Smith / Jones</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ────────────────────────────────
   PARTNER REQUESTS WIDGET
──────────────────────────────── */
interface PartnerRequest {
  name: string;
  tournament: string;
  initials: string;
}

const mockRequests: PartnerRequest[] = [
  { name: "Sarah L.", tournament: "Summer Slam Classic", initials: "SL" },
  { name: "Mike T.", tournament: "City-Wide Pickle Fest", initials: "MT" },
];

export const PartnerRequestsWidget = () => (
  <Card className="border border-border/60 shadow-sm">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-bold tracking-wider text-foreground uppercase">
          Partner Requests
        </h3>
        <Badge className="bg-primary/10 text-primary text-xs border-0 font-semibold">
          {mockRequests.length} New
        </Badge>
      </div>

      <div className="space-y-3">
        {mockRequests.map((req, i) => (
          <div key={i} className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-muted text-xs font-semibold">
                {req.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{req.name}</p>
              <p className="text-xs text-muted-foreground truncate">{req.tournament}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="w-7 h-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors">
                <CheckCircle className="w-4 h-4" />
              </button>
              <button className="w-7 h-7 rounded-full bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

/* ────────────────────────────────
   NEARBY COURTS WIDGET
──────────────────────────────── */
export const NearbyCourtsWidget = () => (
  <Card className="overflow-hidden border border-border/60 shadow-sm">
    <div className="relative h-36 bg-muted">
      {/* Map placeholder */}
      <div className="w-full h-full bg-gradient-to-br from-accent/50 via-muted to-accent/30 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-6 h-6 text-primary mx-auto mb-1" />
          <span className="text-xs font-display font-bold text-primary uppercase tracking-wider">
            Explore
          </span>
          <p className="text-sm font-display font-bold text-foreground">
            Nearby Courts & Venues
          </p>
        </div>
      </div>
    </div>
  </Card>
);

/* ────────────────────────────────
   FULL SIDEBAR
──────────────────────────────── */
const TournamentSidebar = () => {
  return (
    <div className="space-y-4">
      <RatingWidget />
      <NextMatchWidget />
      <PartnerRequestsWidget />
      <NearbyCourtsWidget />
    </div>
  );
};

export default TournamentSidebar;

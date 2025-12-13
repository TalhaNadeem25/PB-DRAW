import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfDay, endOfDay, isWithinInterval, addDays, subDays } from "date-fns";

interface Match {
  _id: string;
  team1: {
    _id: string;
    name?: string;
    players: Array<{ _id: string; name: string }>;
  };
  team2?: {
    _id: string;
    name?: string;
    players: Array<{ _id: string; name: string }>;
  };
  scheduledTime?: string;
  courtNumber?: number;
  status: string;
  score?: {
    team1Score: number;
    team2Score: number;
  };
  pool?: {
    _id: string;
    name: string;
  };
  bracket?: string;
  round?: number;
}

interface MatchScheduleProps {
  matches: Match[];
  events?: Array<{ _id: string; name: string }>;
  selectedEventId?: string;
  onEventChange?: (eventId: string) => void;
}

const MatchSchedule = ({ matches, events, selectedEventId, onEventChange }: MatchScheduleProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [courtFilter, setCourtFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");

  // Get team display name
  const getTeamName = (team: Match['team1']) => {
    if (team.name) return team.name;
    return team.players.map(p => p.name).join(' / ') || 'TBD';
  };

  // Filter matches by selected date and court
  const scheduledMatches = matches.filter(m => m.scheduledTime);

  const filteredMatches = scheduledMatches.filter(match => {
    const matchDate = new Date(match.scheduledTime!);
    const isInDateRange = isWithinInterval(matchDate, {
      start: startOfDay(selectedDate),
      end: endOfDay(selectedDate),
    });

    const matchesCourt = courtFilter === "all" || match.courtNumber?.toString() === courtFilter;

    return isInDateRange && matchesCourt;
  });

  // Sort matches by time
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    return new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime();
  });

  // Group matches by court for timeline view
  const matchesByCourt = sortedMatches.reduce((acc, match) => {
    const court = match.courtNumber || 0;
    if (!acc[court]) acc[court] = [];
    acc[court].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  // Get unique courts
  const allCourts = Array.from(new Set(scheduledMatches.map(m => m.courtNumber).filter(Boolean))) as number[];
  const courts = allCourts.sort((a, b) => a - b);

  const MatchCard = ({ match }: { match: Match }) => {
    const isCompleted = match.status === 'completed';
    const time = format(new Date(match.scheduledTime!), 'h:mm a');

    return (
      <div className={`p-3 rounded-lg border-2 ${
        isCompleted ? 'bg-muted/50 border-muted' : 'bg-card border-border'
      }`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {time}
            </Badge>
            {match.courtNumber && (
              <Badge variant="secondary" className="text-xs">
                Court {match.courtNumber}
              </Badge>
            )}
            {isCompleted && (
              <Badge className="bg-green-500 text-xs">Completed</Badge>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{getTeamName(match.team1)}</span>
            {isCompleted && <span className="font-bold">{match.score?.team1Score ?? '-'}</span>}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{match.team2 ? getTeamName(match.team2) : 'TBD'}</span>
            {isCompleted && match.team2 && <span className="font-bold">{match.score?.team2Score ?? '-'}</span>}
          </div>
        </div>

        {match.pool && (
          <div className="mt-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">{match.pool.name}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Match Schedule
          </CardTitle>
          <CardDescription>
            View all scheduled matches by date and court
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event Selector */}
          {events && events.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Event</label>
              <Select value={selectedEventId} onValueChange={onEventChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event._id} value={event._id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Navigation */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1 text-center font-semibold">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
            </div>
          </div>

          {/* Court Filter */}
          {courts.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Court</label>
                <Select value={courtFilter} onValueChange={setCourtFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courts</SelectItem>
                    {courts.map((court) => (
                      <SelectItem key={court} value={court.toString()}>
                        Court {court}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">View</label>
                <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timeline">Timeline by Court</SelectItem>
                    <SelectItem value="list">List View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Display */}
      {sortedMatches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-bold text-lg mb-2">No Matches Scheduled</h3>
            <p className="text-muted-foreground">
              There are no matches scheduled for {format(selectedDate, 'MMMM d, yyyy')}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "timeline" ? (
        /* Timeline View by Court */
        <div className="space-y-4">
          {Object.entries(matchesByCourt)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([court, courtMatches]) => (
              <Card key={court}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Court {court}
                  </CardTitle>
                  <CardDescription>
                    {courtMatches.length} match{courtMatches.length !== 1 ? 'es' : ''} scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {courtMatches.map((match) => (
                      <MatchCard key={match._id} match={match} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle>All Matches</CardTitle>
            <CardDescription>
              {sortedMatches.length} match{sortedMatches.length !== 1 ? 'es' : ''} scheduled for this day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {sortedMatches.map((match) => (
                <MatchCard key={match._id} match={match} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchSchedule;

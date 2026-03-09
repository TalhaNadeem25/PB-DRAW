import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock,
  Calendar,
  Users,
  CircleNotch,
  CaretLeft,
  CaretRight,
  Info,
} from '@phosphor-icons/react';
import { format, addMinutes, startOfDay, setHours, setMinutes, isSameDay, parseISO, isToday } from 'date-fns';
import { matchAPI, poolAPI } from '@/services/api';
import { cn } from '@/lib/utils';

interface TournamentPlannerProps {
  tournament: any;
  events: any[];
}

interface Match {
  _id: string;
  team1: any;
  team2: any;
  scheduledTime: string | null;
  courtNumber: number | null;
  status: string;
  score: {
    team1Score: number;
    team2Score: number;
  };
  pool?: any;
  bracket?: string;
  round?: number;
  matchNumber?: number;
}

type TimeInterval = 15 | 30 | 60;

const TournamentPlanner = ({ tournament, events }: TournamentPlannerProps) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?._id || '');
  const [timeInterval, setTimeInterval] = useState<TimeInterval>(30);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(tournament.startDate));
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);

  const selectedEvent = events.find(e => e._id === selectedEventId);
  const courts = tournament.venue?.courts || 4;

  // Fetch pools and matches for the selected event
  const { data: poolsData, isLoading: poolsLoading } = useQuery({
    queryKey: ['pools', selectedEventId],
    queryFn: () => poolAPI.getByEvent(selectedEventId),
    enabled: !!selectedEventId,
  });

  // Fetch all matches for each pool
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['event-matches', selectedEventId, poolsData?.data],
    queryFn: async () => {
      const pools = poolsData?.data || [];
      const allMatches: Match[] = [];

      for (const pool of pools) {
        try {
          const response = await matchAPI.getByPool(pool._id);
          if (response?.data) {
            allMatches.push(...response.data.map((m: any) => ({ ...m, pool })));
          }
        } catch (error) {
          console.error('Error fetching matches for pool:', pool._id);
        }
      }

      return allMatches;
    },
    enabled: !!poolsData?.data?.length,
  });

  const matches = matchesData || [];
  const isLoading = poolsLoading || matchesLoading;

  // Generate time slots for the day
  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    const dayStart = setMinutes(setHours(startOfDay(selectedDate), 7), 0); // Start at 7 AM
    const dayEnd = setMinutes(setHours(startOfDay(selectedDate), 22), 0); // End at 10 PM

    let currentTime = dayStart;
    while (currentTime <= dayEnd) {
      slots.push(currentTime);
      currentTime = addMinutes(currentTime, timeInterval);
    }

    return slots;
  }, [selectedDate, timeInterval]);

  // Group matches by time slot and court
  const matchGrid = useMemo(() => {
    const grid: Map<string, Map<number, Match>> = new Map();

    matches.forEach((match: Match) => {
      if (!match.scheduledTime || !match.courtNumber) return;

      const matchDate = parseISO(match.scheduledTime);
      if (!isSameDay(matchDate, selectedDate)) return;

      // Find the closest time slot
      const matchHour = matchDate.getHours();
      const matchMinute = matchDate.getMinutes();
      const slotKey = `${matchHour.toString().padStart(2, '0')}:${Math.floor(matchMinute / timeInterval) * timeInterval}`.padEnd(5, '0');

      if (!grid.has(slotKey)) {
        grid.set(slotKey, new Map());
      }
      grid.get(slotKey)!.set(match.courtNumber, match);
    });

    return grid;
  }, [matches, selectedDate, timeInterval]);

  // Count scheduled vs unscheduled matches
  const { scheduledCount, unscheduledCount } = useMemo(() => {
    let scheduled = 0;
    let unscheduled = 0;

    matches.forEach((match: Match) => {
      if (match.scheduledTime && match.courtNumber) {
        scheduled++;
      } else {
        unscheduled++;
      }
    });

    return { scheduledCount: scheduled, unscheduledCount: unscheduled };
  }, [matches]);

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 border-green-500 text-green-700';
      case 'in-progress':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-700';
      case 'cancelled':
        return 'bg-red-500/20 border-red-500 text-red-700';
      default:
        return 'bg-blue-500/20 border-blue-500 text-blue-700';
    }
  };

  const getTeamName = (team: any) => {
    if (!team) return 'TBD';
    if (team.name) return team.name;
    if (team.players && team.players.length > 0) {
      return team.players.map((p: any) => p.name || 'Player').join(' & ');
    }
    return 'Team';
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setIsMatchDialogOpen(true);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  if (!events.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
          <p className="text-muted-foreground">
            Create events for this tournament to start planning your schedule.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Event Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Event:</label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event._id} value={event._id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Interval */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Interval:</label>
              <Select
                value={timeInterval.toString()}
                onValueChange={(v) => setTimeInterval(parseInt(v) as TimeInterval)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                <CaretLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={isToday(selectedDate) ? "default" : "outline"}
                size="sm"
                onClick={goToToday}
                className="px-3"
              >
                Today
              </Button>
              <div className="px-4 py-2 bg-muted rounded-lg font-medium min-w-[180px] text-center">
                {format(selectedDate, 'EEEE, MMM dd, yyyy')}
              </div>
              <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                <CaretRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-primary">{matches.length}</div>
            <div className="text-sm text-muted-foreground">Total Matches</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-green-600">{scheduledCount}</div>
            <div className="text-sm text-muted-foreground">Scheduled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{unscheduledCount}</div>
            <div className="text-sm text-muted-foreground">Unscheduled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{courts}</div>
            <div className="text-sm text-muted-foreground">Courts</div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Schedule Grid - {selectedEvent?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <CircleNotch className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header - Courts */}
                <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `80px repeat(${courts}, 1fr)` }}>
                  <div className="p-2 text-center font-semibold text-muted-foreground text-sm">
                    Time
                  </div>
                  {Array.from({ length: courts }, (_, i) => (
                    <div key={i} className="p-2 text-center font-semibold bg-primary/10 rounded-lg">
                      Court {i + 1}
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                <div className="space-y-1">
                  {timeSlots.map((slot, index) => {
                    const slotKey = format(slot, 'HH:mm');
                    const slotMatches = matchGrid.get(slotKey);

                    return (
                      <div
                        key={index}
                        className="grid gap-1"
                        style={{ gridTemplateColumns: `80px repeat(${courts}, 1fr)` }}
                      >
                        {/* Time Label */}
                        <div className="p-2 text-sm text-muted-foreground font-mono flex items-center justify-center bg-muted/30 rounded-lg">
                          {format(slot, 'h:mm a')}
                        </div>

                        {/* Court Cells */}
                        {Array.from({ length: courts }, (_, courtIndex) => {
                          const courtNumber = courtIndex + 1;
                          const match = slotMatches?.get(courtNumber);

                          return (
                            <div
                              key={courtIndex}
                              className={cn(
                                "min-h-[60px] rounded-lg border-2 border-dashed border-muted transition-all",
                                match ? "border-solid cursor-pointer hover:shadow-md" : "hover:border-primary/30 hover:bg-primary/5",
                                match && getMatchStatusColor(match.status)
                              )}
                              onClick={() => match && handleMatchClick(match)}
                            >
                              {match && (
                                <div className="p-2 h-full">
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {match.pool?.name || match.bracket || `R${match.round}`}
                                    </Badge>
                                    <span className="text-xs opacity-70">#{match.matchNumber || '-'}</span>
                                  </div>
                                  <div className="text-xs font-medium truncate">
                                    {getTeamName(match.team1)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">vs</div>
                                  <div className="text-xs font-medium truncate">
                                    {getTeamName(match.team2)}
                                  </div>
                                  {match.status === 'completed' && (
                                    <div className="text-xs font-bold mt-1">
                                      {match.score.team1Score} - {match.score.team2Score}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unscheduled Matches */}
      {unscheduledCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Info className="w-5 h-5" />
              Unscheduled Matches ({unscheduledCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {matches
                .filter((m: Match) => !m.scheduledTime || !m.courtNumber)
                .map((match: Match) => (
                  <div
                    key={match._id}
                    className="p-3 border rounded-lg bg-yellow-50 border-yellow-200 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleMatchClick(match)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{match.pool?.name || match.bracket}</Badge>
                      <span className="text-xs text-muted-foreground">#{match.matchNumber}</span>
                    </div>
                    <div className="text-sm font-medium">{getTeamName(match.team1)}</div>
                    <div className="text-xs text-muted-foreground">vs</div>
                    <div className="text-sm font-medium">{getTeamName(match.team2)}</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Details Dialog */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-sm">
                  {selectedMatch.pool?.name || selectedMatch.bracket || `Round ${selectedMatch.round}`}
                </Badge>
                <Badge className={getMatchStatusColor(selectedMatch.status)}>
                  {selectedMatch.status}
                </Badge>
              </div>

              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{getTeamName(selectedMatch.team1)}</div>
                  {selectedMatch.status === 'completed' && (
                    <div className="text-xl font-bold">{selectedMatch.score.team1Score}</div>
                  )}
                </div>
                <div className="text-center text-muted-foreground text-sm">VS</div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{getTeamName(selectedMatch.team2)}</div>
                  {selectedMatch.status === 'completed' && (
                    <div className="text-xl font-bold">{selectedMatch.score.team2Score}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Scheduled Time:</span>
                  <div className="font-medium">
                    {selectedMatch.scheduledTime
                      ? format(parseISO(selectedMatch.scheduledTime), 'MMM dd, h:mm a')
                      : 'Not scheduled'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Court:</span>
                  <div className="font-medium">
                    {selectedMatch.courtNumber ? `Court ${selectedMatch.courtNumber}` : 'Not assigned'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Match Number:</span>
                  <div className="font-medium">#{selectedMatch.matchNumber || '-'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Round:</span>
                  <div className="font-medium">{selectedMatch.round || '-'}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentPlanner;

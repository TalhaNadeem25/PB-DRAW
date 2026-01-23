import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Settings,
  Wand2,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  GripVertical,
  Printer,
} from "lucide-react";
import { tournamentAPI, courtAPI, poolAPI } from "@/services/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Event {
  _id: string;
  name: string;
  format: string;
}

interface Pool {
  _id: string;
  name: string;
  matches: Match[];
}

interface Court {
  number: number;
  name: string;
  type: 'indoor' | 'outdoor';
  available: boolean;
}

interface Scheduling {
  startTime: string;
  endTime: string;
  slotDuration: number;
  breakTimes: Array<{ start: string; end: string; label: string }>;
}

interface Match {
  _id: string;
  team1?: { _id: string; name: string };
  team2?: { _id: string; name: string };
  courtNumber?: number;
  court?: string;
  scheduledTime?: string;
  status: string;
  round?: number;
  event?: { _id: string; name: string; format: string };
  pool?: string | { _id: string; name: string };
}

interface ScheduleGridData {
  courts: Court[];
  scheduling: Scheduling;
  timeSlots: string[];
  scheduledMatches: Match[];
  unscheduledMatches: Match[];
}

const CourtManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [courts, setCourts] = useState<Court[]>([]);
  const [scheduling, setScheduling] = useState<Scheduling>({
    startTime: '08:00',
    endTime: '18:00',
    slotDuration: 30,
    breakTimes: [],
  });
  const [draggedMatch, setDraggedMatch] = useState<Match | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedPoolId, setSelectedPoolId] = useState<string>('all');

  // Fetch tournament
  const { data: tournamentData, isLoading: tournamentLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getById(id!),
    enabled: !!id,
  });

  // Fetch schedule grid
  const { data: gridData, isLoading: gridLoading, refetch: refetchGrid } = useQuery({
    queryKey: ['schedule-grid', id],
    queryFn: () => courtAPI.getScheduleGrid(id!),
    enabled: !!id,
  });

  // Fetch pools for selected event
  const { data: poolsData } = useQuery({
    queryKey: ['pools', selectedEventId],
    queryFn: () => poolAPI.getByEvent(selectedEventId),
    enabled: !!selectedEventId && selectedEventId !== 'all',
  });

  const pools: Pool[] = poolsData?.data || [];

  // Initialize courts from grid data
  useEffect(() => {
    if (gridData?.data) {
      setCourts(gridData.data.courts || []);
      setScheduling(gridData.data.scheduling || {
        startTime: '08:00',
        endTime: '18:00',
        slotDuration: 30,
        breakTimes: [],
      });
    }
  }, [gridData]);

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: { courts: Court[]; scheduling: Scheduling }) =>
      courtAPI.updateConfiguration(id!, data),
    onSuccess: () => {
      toast.success("Court configuration updated");
      queryClient.invalidateQueries({ queryKey: ['schedule-grid', id] });
      setIsConfigOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update configuration");
    },
  });

  // Assign match to court mutation
  const assignMatchMutation = useMutation({
    mutationFn: (data: { matchId: string; courtNumber: number; scheduledTime: string; courtName: string }) =>
      courtAPI.assignMatch(data.matchId, {
        courtNumber: data.courtNumber,
        scheduledTime: data.scheduledTime,
        courtName: data.courtName,
      }),
    onSuccess: () => {
      toast.success("Match scheduled");
      // Invalidate all related queries so schedule shows up everywhere
      queryClient.invalidateQueries({ queryKey: ['schedule-grid', id] });
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', id] });
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to schedule match");
    },
  });

  // Auto-schedule mutation
  const autoScheduleMutation = useMutation({
    mutationFn: () => courtAPI.autoSchedule(id!),
    onSuccess: (data) => {
      toast.success(data.message || "Matches auto-scheduled");
      // Invalidate all related queries so schedule shows up everywhere
      queryClient.invalidateQueries({ queryKey: ['schedule-grid', id] });
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', id] });
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to auto-schedule");
    },
  });

  // Clear schedule mutation
  const clearScheduleMutation = useMutation({
    mutationFn: () => courtAPI.clearSchedule(id!),
    onSuccess: () => {
      toast.success("Schedule cleared");
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['schedule-grid', id] });
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', id] });
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to clear schedule");
    },
  });

  // Check conflicts mutation
  const checkConflictsMutation = useMutation({
    mutationFn: () => courtAPI.checkConflicts(id!),
    onSuccess: (data) => {
      if (data.data.hasConflicts) {
        toast.error(`Found ${data.data.conflicts.length} scheduling conflicts`);
      } else {
        toast.success("No scheduling conflicts found");
      }
    },
  });

  const tournament = tournamentData?.data;
  const events: Event[] = tournament?.events || [];
  const grid: ScheduleGridData = gridData?.data || {
    courts: [],
    scheduling: { startTime: '08:00', endTime: '18:00', slotDuration: 30, breakTimes: [] },
    timeSlots: [],
    scheduledMatches: [],
    unscheduledMatches: [],
  };

  // Filter unscheduled matches based on selected event and pool
  const filteredUnscheduledMatches = grid.unscheduledMatches.filter((match: any) => {
    // Filter by event
    if (selectedEventId !== 'all' && match.event?._id !== selectedEventId) {
      return false;
    }
    // Filter by pool
    if (selectedPoolId !== 'all' && match.pool !== selectedPoolId && match.pool?._id !== selectedPoolId) {
      return false;
    }
    return true;
  });

  // Reset pool selection when event changes
  useEffect(() => {
    setSelectedPoolId('all');
  }, [selectedEventId]);

  // Drag and drop handlers
  const handleDragStart = (match: Match) => {
    setDraggedMatch(match);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (courtNumber: number, courtName: string, timeSlot: string) => {
    if (!draggedMatch || !tournament) return;

    // Create full datetime from tournament date + time slot
    const startDate = new Date(tournament.startDate);
    const [hours, minutes] = timeSlot.split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);

    assignMatchMutation.mutate({
      matchId: draggedMatch._id,
      courtNumber,
      scheduledTime: startDate.toISOString(),
      courtName,
    });

    setDraggedMatch(null);
  };

  // Get match at specific court and time
  const getMatchAtSlot = (courtNumber: number, timeSlot: string): Match | undefined => {
    return grid.scheduledMatches.find(match => {
      if (match.courtNumber !== courtNumber) return false;
      if (!match.scheduledTime) return false;
      const matchTime = format(new Date(match.scheduledTime), 'HH:mm');
      return matchTime === timeSlot;
    });
  };

  // Add court handler
  const handleAddCourt = () => {
    const newNumber = courts.length > 0 ? Math.max(...courts.map(c => c.number)) + 1 : 1;
    setCourts([...courts, {
      number: newNumber,
      name: `Court ${newNumber}`,
      type: 'indoor',
      available: true,
    }]);
  };

  // Remove court handler
  const handleRemoveCourt = (courtNumber: number) => {
    setCourts(courts.filter(c => c.number !== courtNumber));
  };

  // Get event color
  const getEventColor = (eventFormat?: string) => {
    switch (eventFormat) {
      case 'singles': return 'bg-green-500/20 border-green-500 text-green-700';
      case 'doubles': return 'bg-blue-500/20 border-blue-500 text-blue-700';
      case 'mixed-doubles': return 'bg-purple-500/20 border-purple-500 text-purple-700';
      default: return 'bg-primary/20 border-primary text-primary';
    }
  };

  if (tournamentLoading || gridLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Tournament Not Found</h2>
            <Button onClick={() => navigate('/tournaments')}>Back to Tournaments</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-8">
          <div className="container mx-auto px-4">
            <Link
              to={`/tournaments/${id}`}
              className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tournament
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-primary-foreground">
                  Court Manager
                </h1>
                <p className="text-primary-foreground/70 mt-1">{tournament.name}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setIsConfigOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Courts
                </Button>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => autoScheduleMutation.mutate()}
                  disabled={autoScheduleMutation.isPending}
                >
                  {autoScheduleMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  Auto-Schedule
                </Button>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => checkConflictsMutation.mutate()}
                  disabled={checkConflictsMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check Conflicts
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearScheduleMutation.mutate()}
                  disabled={clearScheduleMutation.isPending}
                  className="text-destructive border-destructive/50 hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Unscheduled Matches Sidebar */}
            <Card className="glass-card-hover lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Unscheduled
                </CardTitle>
                <CardDescription>
                  {filteredUnscheduledMatches.length} of {grid.unscheduledMatches.length} matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Event and Pool Filters */}
                <div className="space-y-3 mb-4 pb-4 border-b">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Event</Label>
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Events" />
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

                  {selectedEventId !== 'all' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Pool</Label>
                      <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All Pools" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Pools</SelectItem>
                          {pools.map((pool) => (
                            <SelectItem key={pool._id} value={pool._id}>
                              {pool.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    {filteredUnscheduledMatches.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        {grid.unscheduledMatches.length === 0
                          ? "All matches are scheduled! 🎉"
                          : "No matches for selected filters"}
                      </p>
                    ) : (
                      filteredUnscheduledMatches.map((match) => (
                        <div
                          key={match._id}
                          draggable
                          onDragStart={() => handleDragStart(match)}
                          className={cn(
                            "p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all",
                            "hover:shadow-md hover:-translate-y-0.5",
                            getEventColor(match.event?.format)
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <Badge variant="outline" className="text-xs">
                              {match.event?.name || 'Match'}
                            </Badge>
                            {match.round && (
                              <Badge variant="secondary" className="text-xs">
                                R{match.round}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">
                            {match.team1?.name || 'TBD'}
                          </p>
                          <p className="text-xs text-muted-foreground">vs</p>
                          <p className="text-sm font-medium truncate">
                            {match.team2?.name || 'TBD'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Schedule Grid */}
            <Card className="glass-card-hover lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Schedule Grid
                </CardTitle>
                <CardDescription>
                  Drag matches to court/time slots • {format(new Date(tournament.startDate), 'MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {grid.courts.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Courts Configured</h3>
                    <p className="text-muted-foreground mb-4">
                      Add courts to start scheduling matches
                    </p>
                    <Button onClick={() => setIsConfigOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Configure Courts
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                      <thead>
                        <tr>
                          <th className="p-2 border bg-muted font-medium text-left w-24">
                            Time
                          </th>
                          {grid.courts.filter(c => c.available).map((court) => (
                            <th
                              key={court.number}
                              className="p-2 border bg-muted font-medium text-center min-w-[150px]"
                            >
                              {court.name}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {court.type}
                              </Badge>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {grid.timeSlots.map((timeSlot) => (
                          <tr key={timeSlot}>
                            <td className="p-2 border font-mono text-sm bg-muted/50">
                              {timeSlot}
                            </td>
                            {grid.courts.filter(c => c.available).map((court) => {
                              const match = getMatchAtSlot(court.number, timeSlot);
                              return (
                                <td
                                  key={`${court.number}-${timeSlot}`}
                                  className={cn(
                                    "p-1 border h-20 transition-colors",
                                    !match && "hover:bg-primary/5 cursor-pointer",
                                    draggedMatch && !match && "bg-primary/10"
                                  )}
                                  onDragOver={handleDragOver}
                                  onDrop={() => handleDrop(court.number, court.name, timeSlot)}
                                >
                                  {match && (
                                    <div
                                      className={cn(
                                        "p-2 rounded h-full border-2 text-xs",
                                        getEventColor(match.event?.format)
                                      )}
                                    >
                                      <p className="font-medium truncate">
                                        {match.team1?.name || 'TBD'}
                                      </p>
                                      <p className="text-muted-foreground">vs</p>
                                      <p className="font-medium truncate">
                                        {match.team2?.name || 'TBD'}
                                      </p>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500" />
                    <span>Singles</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded bg-blue-500/20 border-2 border-blue-500" />
                    <span>Doubles</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded bg-purple-500/20 border-2 border-purple-500" />
                    <span>Mixed Doubles</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Court Configuration Dialog */}
        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Court Configuration</DialogTitle>
              <DialogDescription>
                Configure courts and scheduling settings for this tournament
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Courts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Courts</Label>
                  <Button size="sm" variant="outline" onClick={handleAddCourt}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Court
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {courts.map((court, index) => (
                    <div
                      key={court.number}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <Input
                        value={court.name}
                        onChange={(e) => {
                          const updated = [...courts];
                          updated[index].name = e.target.value;
                          setCourts(updated);
                        }}
                        className="flex-1"
                        placeholder="Court name"
                      />
                      <Select
                        value={court.type}
                        onValueChange={(value: 'indoor' | 'outdoor') => {
                          const updated = [...courts];
                          updated[index].type = value;
                          setCourts(updated);
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indoor">Indoor</SelectItem>
                          <SelectItem value="outdoor">Outdoor</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={court.available}
                          onCheckedChange={(checked) => {
                            const updated = [...courts];
                            updated[index].available = checked;
                            setCourts(updated);
                          }}
                        />
                        <span className="text-xs text-muted-foreground w-16">
                          {court.available ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveCourt(court.number)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {courts.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No courts configured. Add your first court!
                    </p>
                  )}
                </div>
              </div>

              {/* Scheduling */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Scheduling</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={scheduling.startTime}
                      onChange={(e) => setScheduling({ ...scheduling, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={scheduling.endTime}
                      onChange={(e) => setScheduling({ ...scheduling, endTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slotDuration">Slot Duration (min)</Label>
                    <Select
                      value={scheduling.slotDuration.toString()}
                      onValueChange={(value) => setScheduling({ ...scheduling, slotDuration: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="20">20 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateConfigMutation.mutate({ courts, scheduling })}
                disabled={updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default CourtManager;

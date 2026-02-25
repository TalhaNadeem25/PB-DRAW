import Layout from "@/components/layout/Layout";
import { ConnectAccountStatus } from "@/components/stripe/ConnectAccountStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import api, { eventAPI, tournamentAPI } from "@/services/api";
import type { GameType, TournamentEvent, TournamentFormat } from "@/types/tournament";
import { SKILL_LEVEL_RANGES, formatEventSkillLevel } from "@/types/tournament";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    ArrowLeft,
    ArrowRight,
    Brain,
    CalendarIcon,
    Check,
    DollarSign,
    Loader2,
    MapPin,
    Plus,
    Sparkles,
    Trash2,
    Trophy,
    Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
const gameTypes: GameType[] = ["Singles", "Doubles", "Mixed Doubles"];
const tournamentFormats: TournamentFormat[] = ["Round Robin", "Single Elimination", "Double Elimination", "Pools + Playoffs"];

const CreateTournament = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  // All hooks must be declared at the top before any conditional logic
  const [step, setStep] = useState(1);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [maxPlayers] = useState(9999); // Default high value - actual limits are per event
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [allowWaitlist, setAllowWaitlist] = useState(false);

  // Events state
  const [events, setEvents] = useState<Omit<TournamentEvent, "id" | "registeredPlayers">[]>([]);
  const [newEvent, setNewEvent] = useState({
    name: "",
    gameType: "Singles" as GameType,
    format: "Round Robin" as TournamentFormat,
    skillLevel: "3.5-4.0",
    maxPlayers: 32,
    entryFee: 50,
    addPlayoffStage: false,
  });

  // Mutation for creating tournament
  const createTournamentMutation = useMutation({
    mutationFn: async (tournamentData: any) => {
      const tournament = await tournamentAPI.create(tournamentData);
      return tournament.data;
    },
    onSuccess: async (tournament) => {
      // Create events for the tournament
      for (const event of events) {
        try {
          const playFormat = event.format === "Pools + Playoffs" ? "pool-play" : event.format.toLowerCase().replace(/ /g, "-");
          await eventAPI.create(tournament._id, {
            name: event.name,
            format: event.gameType.toLowerCase().replace(/ /g, "-"),
            playFormat,
            addPlayoffStage: playFormat !== 'round-robin',
            skillLevel: event.skillLevel,
            maxTeams: event.maxPlayers,
            entryFee: event.entryFee,
            status: "upcoming",
          });
        } catch (error) {
          console.error('Error creating event:', error);
        }
      }

      // Upload image if provided
      if (imageFile) {
        try {
          await tournamentAPI.uploadImage(tournament._id, imageFile);
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Tournament created but image upload failed');
        }
      }

      // Invalidate tournaments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });

      toast.success("Tournament created successfully!");
      navigate(`/tournaments/${tournament._id}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create tournament';
      toast.error(message);
    },
  });

  const { data: stripeStatus } = useQuery({
    queryKey: ['stripe-connect-status'],
    queryFn: async () => {
      const response = await api.get('/stripe/connect/status');
      return response.data;
    },
    enabled: isAuthenticated && (user?.role === 'organizer' || user?.role === 'admin'),
  });

  // Handle authentication and authorization checks
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'organizer' && user?.role !== 'admin') {
      toast.error('Only organizers can create tournaments');
      navigate('/tournaments');
      return;
    }

    setIsCheckingAuth(false);
  }, [isAuthenticated, user, navigate]);

  // Show nothing while checking authentication
  if (isCheckingAuth || !isAuthenticated || (user?.role !== 'organizer' && user?.role !== 'admin')) {
    return null;
  }

  const addEvent = () => {
    if (!newEvent.name) {
      toast.error("Please enter an event name");
      return;
    }
    setEvents([...events, { ...newEvent }]);
    setNewEvent({
      name: "",
      gameType: "Singles",
      format: "Round Robin",
      skillLevel: "3.5-4.0",
      maxPlayers: 32,
      entryFee: 50,
      addPlayoffStage: false,
    });
    toast.success("Event added");
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error("Only JPEG, PNG, and WEBP images are allowed");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!name || !location || !address || !description || !startDate || !endDate || !registrationDeadline || events.length === 0) {
      toast.error("Please fill in all required fields and add at least one event");
      return;
    }

    // Create tournament via API
    createTournamentMutation.mutate({
      name,
      description,
      location,
      address,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      maxPlayers,
      status: 'open',
      settings: { allowWaitlist },
    });
  };

  const canProceed = () => {
    if (step === 1) {
      // Must be connected to Stripe and have all fields filled
      return !!stripeStatus?.connected && name && location && address && description && startDate && endDate && registrationDeadline;
    }
    if (step === 2) {
      return events.length > 0;
    }
    return true;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Compact top bar — no green hero */}
        <div className="border-b border-border/60 bg-card/50">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Create Tournament
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Set up your pickleball tournament in minutes
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="glass-card rounded-2xl p-4 sm:p-6 animate-fade-in overflow-x-auto">
            <div className="flex items-center justify-between max-w-2xl mx-auto min-w-[280px]">
              {[
                { num: 1, label: "Basic Info" },
                { num: 2, label: "Events" },
                { num: 3, label: "Review" },
              ].map((s, i) => (
                <div key={s.num} className="flex items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-display font-bold transition-all",
                      step >= s.num
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                  </div>
                  <span
                    className={cn(
                      "ml-3 font-medium hidden sm:block",
                      step >= s.num ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                  {i < 2 && (
                    <div
                      className={cn(
                        "w-12 sm:w-24 h-1 mx-4 rounded-full",
                        step > s.num ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-8 animate-fade-in">
                {/* Stripe Connect Gate */}
                <ConnectAccountStatus />

                {/* AI Planner Promotion Banner */}
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-2xl" />
                  <CardContent className="pt-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-hero-gradient rounded-xl flex items-center justify-center shadow-md">
                          <Brain className="w-6 h-6 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/20 rounded-full mb-2">
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span className="text-xs font-bold text-primary">AI-POWERED</span>
                        </div>
                        <h3 className="font-display font-bold text-lg mb-1">
                          Not sure where to start? Let AI help you plan!
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Get instant recommendations for events, court requirements, schedules, and pricing
                        </p>
                      </div>
                      <Button asChild variant="outline" className="border-primary/30 hover:bg-primary/10 flex-shrink-0">
                        <Link to="/tournament-planner">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Try AI Planner
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      Tournament Details
                    </CardTitle>
                    <CardDescription>
                      Enter the basic information about your tournament
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Tournament Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Summer Slam Championship 2024"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="location">Venue Name *</Label>
                        <Input
                          id="location"
                          placeholder="e.g., Austin Pickleball Complex"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          placeholder="e.g., 123 Court Street, Austin, TX"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell players what makes your tournament special..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label htmlFor="allowWaitlist" className="text-base font-medium cursor-pointer">Allow waitlist</Label>
                          <p className="text-sm text-muted-foreground">
                            When an event is full, players can join a waitlist. You can approve them to send a payment link.
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="allowWaitlist"
                        checked={allowWaitlist}
                        onCheckedChange={setAllowWaitlist}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image">Tournament Image</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageChange}
                      />
                      <p className="text-sm text-muted-foreground">
                        Upload a tournament image (JPG, PNG, or WEBP, max 5MB)
                      </p>
                      {imagePreview && (
                        <div className="mt-2">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full max-w-md rounded-lg border border-border object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-primary" />
                      Dates
                    </CardTitle>
                    <CardDescription>
                      Set the tournament dates and registration deadline
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label>Start Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>End Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Registration Deadline *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !registrationDeadline && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {registrationDeadline
                                ? format(registrationDeadline, "PPP")
                                : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={registrationDeadline}
                              onSelect={setRegistrationDeadline}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 2: Events */}
            {step === 2 && (
              <div className="space-y-8 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-primary" />
                      Add Events
                    </CardTitle>
                    <CardDescription>
                      Create competition events for your tournament
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4">
                      <div className="space-y-2">
                        <Label>Event Name</Label>
                        <Input
                          placeholder="e.g., Men's Singles"
                          value={newEvent.name}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Game Type</Label>
                        <Select
                          value={newEvent.gameType}
                          onValueChange={(v: GameType) =>
                            setNewEvent({ ...newEvent, gameType: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {gameTypes.map((gt) => (
                              <SelectItem key={gt} value={gt}>
                                {gt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Game Format</Label>
                        <Select
                          value={newEvent.format}
                          onValueChange={(v: TournamentFormat) =>
                            setNewEvent({ ...newEvent, format: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tournamentFormats.map((tf) => (
                              <SelectItem key={tf} value={tf}>
                                {tf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Skill Level Range</Label>
                        <Select
                          value={newEvent.skillLevel}
                          onValueChange={(v) =>
                            setNewEvent({ ...newEvent, skillLevel: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="e.g. 3.5-4.0" />
                          </SelectTrigger>
                          <SelectContent>
                            {SKILL_LEVEL_RANGES.map((range) => (
                              <SelectItem key={range} value={range}>
                                {range}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Choose the skill range for this event (e.g. 3.5-4.0)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {newEvent.gameType === "Singles" ? "Max Players" : "Max Teams"}
                        </Label>
                        <Input
                          type="number"
                          min={2}
                          value={newEvent.maxPlayers}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              maxPlayers: parseInt(e.target.value) || (newEvent.gameType === "Singles" ? 32 : 16),
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          {newEvent.gameType === "Singles"
                            ? "Maximum number of players in this event"
                            : "Maximum number of teams (pairs) in this event"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Entry Fee ($)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={newEvent.entryFee}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                entryFee: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                          <Button onClick={addEvent}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Event List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Events ({events.length})</CardTitle>
                    <CardDescription>
                      {events.length === 0
                        ? "No events added yet. Add at least one event to continue."
                        : "Review and manage your tournament events"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {events.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Add your first event above</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {events.map((event, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{event.name}</h4>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline">{event.gameType}</Badge>
                                  <Badge variant="secondary">{event.format}</Badge>
                                  <Badge variant="accent">{formatEventSkillLevel(event.skillLevel)}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right hidden sm:block">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Users className="w-4 h-4" />
                                  {event.maxPlayers} {event.gameType === "Singles" ? "players" : "teams"}
                                </div>
                                <div className="flex items-center gap-1 text-sm font-medium text-primary">
                                  <DollarSign className="w-4 h-4" />
                                  {event.entryFee}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeEvent(index)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-8 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Tournament</CardTitle>
                    <CardDescription>
                      Make sure everything looks correct before creating
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h3 className="font-display font-bold text-lg">
                          Tournament Details
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-muted-foreground">Name</span>
                            <p className="font-medium">{name}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Location</span>
                            <p className="font-medium flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              {location}
                            </p>
                          </div>
                          {address && (
                            <div>
                              <span className="text-sm text-muted-foreground">Address</span>
                              <p className="font-medium">{address}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-display font-bold text-lg">Dates</h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-muted-foreground">
                              Tournament Dates
                            </span>
                            <p className="font-medium">
                              {startDate && format(startDate, "PPP")} -{" "}
                              {endDate && format(endDate, "PPP")}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">
                              Registration Deadline
                            </span>
                            <p className="font-medium">
                              {registrationDeadline && format(registrationDeadline, "PPP")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <h3 className="font-display font-bold text-lg mb-4">
                        Events ({events.length})
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {events.map((event, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div>
                              <span className="font-medium">{event.name}</span>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {event.gameType}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {event.format}
                                </Badge>
                                <Badge variant="accent" className="text-xs">
                                  {formatEventSkillLevel(event.skillLevel)}
                                </Badge>
                              </div>
                            </div>
                            <span className="font-display font-bold text-primary">
                              ${event.entryFee}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  variant="hero"
                  onClick={handleSubmit}
                  disabled={createTournamentMutation.isPending}
                >
                  {createTournamentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Tournament
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateTournament;

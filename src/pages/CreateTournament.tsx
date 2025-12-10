import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Plus,
  Trash2,
  Trophy,
  MapPin,
  Users,
  DollarSign,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { TournamentEvent, EventFormat, SkillLevel } from "@/types/tournament";

const skillLevels: SkillLevel[] = ["2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "Open"];
const eventFormats: EventFormat[] = ["Singles", "Doubles", "Mixed Doubles"];

const CreateTournament = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>();
  const [maxPlayers, setMaxPlayers] = useState("256");
  
  // Events state
  const [events, setEvents] = useState<Omit<TournamentEvent, "id" | "registeredTeams">[]>([]);
  const [newEvent, setNewEvent] = useState({
    name: "",
    format: "Singles" as EventFormat,
    skillLevel: "4.0" as SkillLevel,
    maxTeams: 32,
    entryFee: 50,
  });

  const addEvent = () => {
    if (!newEvent.name) {
      toast.error("Please enter an event name");
      return;
    }
    setEvents([...events, { ...newEvent }]);
    setNewEvent({
      name: "",
      format: "Singles",
      skillLevel: "4.0",
      maxTeams: 32,
      entryFee: 50,
    });
    toast.success("Event added");
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name || !location || !startDate || !endDate || events.length === 0) {
      toast.error("Please fill in all required fields and add at least one event");
      return;
    }

    // In a real app, this would save to the database
    toast.success("Tournament created successfully!");
    navigate("/tournaments");
  };

  const canProceed = () => {
    if (step === 1) {
      return name && location && startDate && endDate && registrationDeadline;
    }
    if (step === 2) {
      return events.length > 0;
    }
    return true;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-12">
          <div className="container mx-auto px-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground animate-fade-in">
              Create Tournament
            </h1>
            <p className="text-lg text-primary-foreground/80 mt-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Set up your pickleball tournament in minutes
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="container mx-auto px-4 -mt-6 relative z-10">
          <div className="bg-card rounded-2xl shadow-card p-6 border border-border">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
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
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-8 animate-fade-in">
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
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell players what makes your tournament special..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Players</Label>
                      <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                        <SelectTrigger className="w-full md:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="64">64 Players</SelectItem>
                          <SelectItem value="128">128 Players</SelectItem>
                          <SelectItem value="256">256 Players</SelectItem>
                          <SelectItem value="512">512 Players</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                        <Label>Format</Label>
                        <Select
                          value={newEvent.format}
                          onValueChange={(v: EventFormat) =>
                            setNewEvent({ ...newEvent, format: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {eventFormats.map((f) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Skill Level</Label>
                        <Select
                          value={newEvent.skillLevel}
                          onValueChange={(v: SkillLevel) =>
                            setNewEvent({ ...newEvent, skillLevel: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {skillLevels.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}+
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Max Teams</Label>
                        <Input
                          type="number"
                          value={newEvent.maxTeams}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              maxTeams: parseInt(e.target.value) || 32,
                            })
                          }
                        />
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
                                  <Badge variant="outline">{event.format}</Badge>
                                  <Badge variant="accent">{event.skillLevel}+</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right hidden sm:block">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Users className="w-4 h-4" />
                                  {event.maxTeams} teams
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
                          <div>
                            <span className="text-sm text-muted-foreground">Max Players</span>
                            <p className="font-medium">{maxPlayers}</p>
                          </div>
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
                                  {event.format}
                                </Badge>
                                <Badge variant="accent" className="text-xs">
                                  {event.skillLevel}+
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
                <Button variant="hero" onClick={handleSubmit}>
                  Create Tournament
                  <Check className="w-4 h-4 ml-2" />
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

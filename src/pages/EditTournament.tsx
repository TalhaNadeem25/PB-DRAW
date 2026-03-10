import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
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
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CalendarBlank,
  ArrowLeft,
  CircleNotch,
  FloppyDisk,
  Users,
  Trophy,
  MapPin,
  Gavel,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { tournamentAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const AMENITY_OPTIONS = ["Parking", "Restrooms", "Locker Rooms", "Food & Beverages", "Seating/Bleachers", "First Aid", "WiFi"];

const EditTournament = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getById(id!),
    enabled: !!id,
  });

  const tournament = data?.data;

  // Step 1: Basic Info
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(128);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>();
  const [status, setStatus] = useState("open");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [allowWaitlist, setAllowWaitlist] = useState(false);

  // Venue & Courts
  const [courtCount, setCourtCount] = useState<number | string>("");
  const [courtSurface, setCourtSurface] = useState("");
  const [playStartTime, setPlayStartTime] = useState("08:00");
  const [playEndTime, setPlayEndTime] = useState("18:00");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [spectatorCapacity, setSpectatorCapacity] = useState<number | string>("");

  // Rules & Prizes
  const [checkInWindow, setCheckInWindow] = useState("30");
  const [refereeType, setRefereeType] = useState("");
  const [entryFee, setEntryFee] = useState<number | string>(0);
  const [prizeTotal, setPrizeTotal] = useState<number | string>("");
  const [prizeFirst, setPrizeFirst] = useState("");
  const [prizeSecond, setPrizeSecond] = useState("");
  const [prizeThird, setPrizeThird] = useState("");
  const [rules, setRules] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (tournament) {
      setName(tournament.name || "");
      setLocation(tournament.location || "");
      setAddress(tournament.address || "");
      setDescription(tournament.description || "");
      setMaxPlayers(tournament.maxPlayers || 128);
      setStartDate(tournament.startDate ? new Date(tournament.startDate) : undefined);
      setEndDate(tournament.endDate ? new Date(tournament.endDate) : undefined);
      setRegistrationDeadline(tournament.registrationDeadline ? new Date(tournament.registrationDeadline) : undefined);
      setStatus(tournament.status || "open");
      setCurrentImage(tournament.image || null);
      setAllowWaitlist(tournament.settings?.allowWaitlist === true);

      // Venue
      setCourtCount(tournament.venue?.courts ?? "");
      setCourtSurface(tournament.venue?.courtSurface || "");
      setAmenities(tournament.venue?.facilities || []);
      setSpectatorCapacity(tournament.venue?.spectatorCapacity ?? "");

      // Scheduling
      setPlayStartTime(tournament.scheduling?.startTime || "08:00");
      setPlayEndTime(tournament.scheduling?.endTime || "18:00");
      setCheckInWindow(String(tournament.scheduling?.checkInWindow ?? 30));

      // Rules & prizes
      setRefereeType(tournament.refereeType || "");
      setEntryFee(tournament.entryFee ?? 0);
      setPrizeTotal(tournament.prizePool?.total ?? "");
      setPrizeFirst(tournament.prizePool?.distribution?.first || "");
      setPrizeSecond(tournament.prizePool?.distribution?.second || "");
      setPrizeThird(tournament.prizePool?.distribution?.third || "");
      setRules(tournament.rules || "");
      setContactEmail(tournament.contactEmail || "");
      setContactPhone(tournament.contactPhone || "");
    }
  }, [tournament]);

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("Image size must be less than 5MB"); return; }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error("Only JPEG, PNG, and WEBP images are allowed"); return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: any) => tournamentAPI.update(id!, data),
    onSuccess: async () => {
      if (imageFile) {
        try {
          await tournamentAPI.uploadImage(id!, imageFile);
        } catch {
          toast.error('Tournament updated but image upload failed');
        }
      }
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success("Tournament updated successfully!");
      navigate(`/tournaments/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update tournament");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateMutation.mutate({
      name,
      description,
      location,
      address,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline?.toISOString(),
      maxPlayers,
      status,
      rules: rules || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      entryFee: Number(entryFee) || 0,
      refereeType: refereeType || undefined,
      settings: {
        ...(tournament?.settings || {}),
        allowWaitlist,
      },
      venue: {
        courts: courtCount !== "" ? Number(courtCount) : undefined,
        courtSurface: courtSurface || undefined,
        facilities: amenities.length > 0 ? amenities : undefined,
        spectatorCapacity: spectatorCapacity !== "" ? Number(spectatorCapacity) : undefined,
      },
      scheduling: {
        startTime: playStartTime,
        endTime: playEndTime,
        checkInWindow: Number(checkInWindow),
      },
      prizePool: {
        total: prizeTotal !== "" ? Number(prizeTotal) : 0,
        distribution: {
          first: prizeFirst || undefined,
          second: prizeSecond || undefined,
          third: prizeThird || undefined,
        },
      },
    });
  };

  const isOrganizer = tournament && user && (
    tournament.organizerId === user._id ||
    tournament.organizer?._id === user._id ||
    user.role === 'admin'
  );

  if (tournament && user && !isOrganizer) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-2">Unauthorized</h2>
              <p className="text-muted-foreground mb-4">You don't have permission to edit this tournament.</p>
              <Button asChild><a href={`/tournaments/${id}`}>Back to Tournament</a></Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <CircleNotch className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !tournament) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-2">Tournament Not Found</h2>
              <p className="text-muted-foreground mb-4">The tournament you're looking for doesn't exist.</p>
              <Button asChild><a href="/tournaments">Back to Tournaments</a></Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border/60 bg-card/50">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            <Button
              variant="ghost"
              onClick={() => navigate(`/tournaments/${id}`)}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournament
            </Button>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">Edit Tournament</h1>
            <p className="text-muted-foreground text-sm">Update tournament information</p>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Basic Info */}
              <Card className="glass-card rounded-2xl border-border/50">
                <CardHeader>
                  <CardTitle>Tournament Details</CardTitle>
                  <CardDescription>Update the basic information about your tournament</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tournament Name *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="location">Venue Name *</Label>
                      <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="maxPlayers">Max Players *</Label>
                      <Input
                        id="maxPlayers"
                        type="number"
                        min="4"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 128)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="draft">Draft</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input id="contactPhone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                    </div>
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
                    <Switch id="allowWaitlist" checked={allowWaitlist} onCheckedChange={setAllowWaitlist} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Tournament Image</Label>
                    <Input id="image" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} />
                    <p className="text-sm text-muted-foreground">Upload a new tournament image (JPG, PNG, or WEBP, max 5MB)</p>
                    {(imagePreview || currentImage) && (
                      <div className="mt-2">
                        <img
                          src={imagePreview || currentImage!}
                          alt="Tournament"
                          className="w-full max-w-md rounded-lg border border-border object-cover"
                        />
                        {imagePreview && (
                          <p className="text-sm text-muted-foreground mt-2">New image selected (will be uploaded on save)</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Dates */}
              <Card className="glass-card rounded-2xl border-border/50">
                <CardHeader>
                  <CardTitle>Dates</CardTitle>
                  <CardDescription>Update tournament dates and registration deadline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { label: "Start Date *", date: startDate, setDate: setStartDate },
                      { label: "End Date *", date: endDate, setDate: setEndDate },
                      { label: "Registration Deadline", date: registrationDeadline, setDate: setRegistrationDeadline },
                    ].map(({ label, date, setDate }) => (
                      <div key={label} className="space-y-2">
                        <Label>{label}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                            >
                              <CalendarBlank className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Venue & Courts */}
              <Card className="glass-card rounded-2xl border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle>Venue & Courts</CardTitle>
                  </div>
                  <CardDescription>Tell players about your venue setup</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="courtCount">Number of Courts</Label>
                      <Input
                        id="courtCount"
                        type="number"
                        min="1"
                        placeholder="e.g. 8"
                        value={courtCount}
                        onChange={(e) => setCourtCount(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courtSurface">Court Surface</Label>
                      <Select value={courtSurface} onValueChange={setCourtSurface}>
                        <SelectTrigger id="courtSurface">
                          <SelectValue placeholder="Select surface type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indoor-sport-court">Indoor Sport Court</SelectItem>
                          <SelectItem value="indoor-wood">Indoor Wood</SelectItem>
                          <SelectItem value="outdoor-concrete">Outdoor Concrete</SelectItem>
                          <SelectItem value="outdoor-asphalt">Outdoor Asphalt</SelectItem>
                          <SelectItem value="outdoor-sport-court">Outdoor Sport Court</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="playStartTime">Play Starts</Label>
                      <Input id="playStartTime" type="time" value={playStartTime} onChange={(e) => setPlayStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="playEndTime">Play Ends</Label>
                      <Input id="playEndTime" type="time" value={playEndTime} onChange={(e) => setPlayEndTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spectatorCapacity">Spectator Capacity</Label>
                      <Input
                        id="spectatorCapacity"
                        type="number"
                        min="0"
                        placeholder="e.g. 200"
                        value={spectatorCapacity}
                        onChange={(e) => setSpectatorCapacity(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Amenities</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {AMENITY_OPTIONS.map((amenity) => (
                        <div key={amenity} className="flex items-center gap-2">
                          <Checkbox
                            id={`amenity-${amenity}`}
                            checked={amenities.includes(amenity)}
                            onCheckedChange={() => toggleAmenity(amenity)}
                          />
                          <label htmlFor={`amenity-${amenity}`} className="text-sm font-medium cursor-pointer">{amenity}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rules & Prizes */}
              <Card className="glass-card rounded-2xl border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <CardTitle>Rules & Prizes</CardTitle>
                  </div>
                  <CardDescription>Configure rules, fees, and prize distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="checkInWindow">Check-in Window (minutes)</Label>
                      <Input
                        id="checkInWindow"
                        type="number"
                        min="0"
                        placeholder="30"
                        value={checkInWindow}
                        onChange={(e) => setCheckInWindow(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Minutes before first match players must check in</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="refereeType">Referee Type</Label>
                      <Select value={refereeType} onValueChange={setRefereeType}>
                        <SelectTrigger id="refereeType">
                          <SelectValue placeholder="Select referee type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self-officiated">Self-officiated</SelectItem>
                          <SelectItem value="line-judges">Line Judges</SelectItem>
                          <SelectItem value="certified-referees">Certified Referees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entryFee">
                        <span className="flex items-center gap-1"><CurrencyDollar className="h-4 w-4" />Tournament Entry Fee ($)</span>
                      </Label>
                      <Input
                        id="entryFee"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={entryFee}
                        onChange={(e) => setEntryFee(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Gavel className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-base font-medium">Prize Pool</Label>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prizeTotal">Total Prize Pool ($)</Label>
                        <Input
                          id="prizeTotal"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={prizeTotal}
                          onChange={(e) => setPrizeTotal(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prizeFirst">🥇 1st Place</Label>
                        <Input id="prizeFirst" placeholder="e.g. $500" value={prizeFirst} onChange={(e) => setPrizeFirst(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prizeSecond">🥈 2nd Place</Label>
                        <Input id="prizeSecond" placeholder="e.g. $250" value={prizeSecond} onChange={(e) => setPrizeSecond(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prizeThird">🥉 3rd Place</Label>
                        <Input id="prizeThird" placeholder="e.g. $100" value={prizeThird} onChange={(e) => setPrizeThird(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rules">Tournament Rules</Label>
                    <Textarea
                      id="rules"
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                      rows={5}
                      placeholder="Describe the rules, scoring format, and any special regulations..."
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground text-right">{rules.length}/2000</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(`/tournaments/${id}`)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <><CircleNotch className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><FloppyDisk className="w-4 h-4 mr-2" />Save Changes</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditTournament;

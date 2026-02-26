import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { authAPI } from "@/services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CalendarDays,
  ChevronUp,
  Loader2,
  Lock,
  MapPin,
  Moon,
  Pencil,
  Save,
  Sun,
  Target,
  Trophy,
  User,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AVAILABILITY_OPTIONS = [
  { id: "morning", label: "Morning", icon: Sun },
  { id: "afternoon", label: "Afternoon", icon: Sun },
  { id: "evening", label: "Evening", icon: Moon },
  { id: "weekends", label: "Weekends", icon: CalendarDays },
];

const PREFERRED_SIDE_OPTIONS = ["Left", "Right", "Both"] as const;



const Profile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    skillLevel: "3.0",
    bio: "",
    city: "",
    state: "",
    playingDays: [] as string[],
    partnerPreference: "either" as "looking" | "have-partner" | "either",
    preferredSide: "Left" as "Left" | "Right" | "Both",
    primaryPaddle: "",
    availability: [] as string[],
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        skillLevel: user.skillLevel?.toString() ?? "3.0",
        bio: user.bio ?? "",
        city: user.location?.city ?? "",
        state: user.location?.state ?? "",
        playingDays: user.preferences?.playingDays ?? [],
        partnerPreference: user.preferences?.partnerPreference ?? "either",
        preferredSide: (user.preferences?.preferredSide as "Left" | "Right" | "Both") ?? "Left",
        primaryPaddle: user.preferences?.primaryPaddle ?? "",
        availability: user.preferences?.availability ?? [],
      });
    }
  }, [user]);

  const initialData = {
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    skillLevel: user?.skillLevel?.toString() ?? "3.0",
    bio: user?.bio ?? "",
    city: user?.location?.city ?? "",
    state: user?.location?.state ?? "",
    playingDays: user?.preferences?.playingDays ?? [],
    partnerPreference: user?.preferences?.partnerPreference ?? "either",
    preferredSide: (user?.preferences?.preferredSide as "Left" | "Right" | "Both") ?? "Left",
    primaryPaddle: user?.preferences?.primaryPaddle ?? "",
    availability: user?.preferences?.availability ?? [],
  };
  const hasUnsavedChanges =
    formData.name !== initialData.name ||
    formData.phone !== initialData.phone ||
    formData.skillLevel !== initialData.skillLevel ||
    formData.bio !== initialData.bio ||
    formData.city !== initialData.city ||
    formData.state !== initialData.state ||
    JSON.stringify(formData.playingDays) !== JSON.stringify(initialData.playingDays) ||
    formData.partnerPreference !== initialData.partnerPreference ||
    formData.preferredSide !== initialData.preferredSide ||
    formData.primaryPaddle !== initialData.primaryPaddle ||
    JSON.stringify(formData.availability) !== JSON.stringify(initialData.availability);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => authAPI.getStats(),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => authAPI.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data);
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: formData.name,
      phone: formData.phone || undefined,
      skillLevel: parseFloat(formData.skillLevel),
      bio: formData.bio || undefined,
      location: {
        city: formData.city || undefined,
        state: formData.state || undefined,
      },
      preferences: {
        playingDays: formData.playingDays,
        partnerPreference: formData.partnerPreference,
        preferredSide: formData.preferredSide,
        primaryPaddle: formData.primaryPaddle || undefined,
        availability: formData.availability,
      },
    });
  };

  const toggleAvailability = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.includes(id)
        ? prev.availability.filter((a) => a !== id)
        : [...prev.availability, id],
    }));
  };

  const discardChanges = () => {
    if (user) {
      setFormData({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        skillLevel: user.skillLevel?.toString() ?? "3.0",
        bio: user.bio ?? "",
        city: user.location?.city ?? "",
        state: user.location?.state ?? "",
        playingDays: user.preferences?.playingDays ?? [],
        partnerPreference: user.preferences?.partnerPreference ?? "either",
        preferredSide: (user.preferences?.preferredSide as "Left" | "Right" | "Both") ?? "Left",
        primaryPaddle: user.preferences?.primaryPaddle ?? "",
        availability: user.preferences?.availability ?? [],
      });
      toast.success("Changes discarded");
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="w-full max-w-md glass-card rounded-2xl">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-display font-bold mb-2">Please log in</h2>
              <p className="text-muted-foreground">You need to be logged in to view your profile.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const stats = statsData?.data?.statistics || user.statistics || {
    matchesPlayed: 0,
    matchesWon: 0,
    tournamentsPlayed: 0,
    goldMedals: 0,
    silverMedals: 0,
    bronzeMedals: 0,
  };
  const tournaments = statsData?.data?.tournaments || [];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero: cover + avatar + name */}
        <div className="relative">
          {/* Cover */}
          <div className="h-40 sm:h-52 bg-muted border-b border-border relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-90"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-3 right-3 rounded-lg gap-1.5 bg-card/90 border border-border shadow-sm"
            >
              <Pencil className="w-4 h-4" />
              Edit Cover
            </Button>
          </div>

          {/* Avatar + name (overlapping cover) */}
          <div className="container mx-auto px-4 -mt-14 sm:-mt-16 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-card shadow-float flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-14 h-14 sm:w-16 sm:h-16 text-muted-foreground" />
                  )}
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-primary border-2 border-background" />
              </div>
              <div className="pb-1">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                  {user.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
                  <span className="font-display font-semibold text-primary uppercase tracking-wider">
                    {user.role === "player" ? "Verified Player" : user.role === "organizer" ? "Organizer" : "Admin"}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Member</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column content */}
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column */}
            <div className="space-y-6">
              {/* Personal Information */}
              <Card className="glass-card rounded-2xl border-border/50 overflow-hidden">
                <div className="h-1 bg-primary/20" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display font-bold text-foreground">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase">
                      Full Name
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-muted/50 border-border rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase">
                      Email Address
                    </Label>
                    <Input
                      value={formData.email}
                      disabled
                      className="bg-muted/50 border-border rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      Location
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                        className="bg-muted/50 border-border rounded-lg"
                      />
                      <Input
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="State"
                        maxLength={2}
                        className="bg-muted/50 border-border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase">
                      Short Bio
                    </Label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell others about yourself and your pickleball goals..."
                      rows={4}
                      maxLength={500}
                      className="bg-muted/50 border-border rounded-lg resize-none"
                    />
                    <p className="text-xs text-muted-foreground">{formData.bio.length}/500</p>
                  </div>
                </CardContent>
              </Card>

              {/* Playing Preferences */}
              <Card className="glass-card rounded-2xl border-border/50 overflow-hidden">
                <div className="h-1 bg-primary/20" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display font-bold text-foreground">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    Playing Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase">
                      Preferred Side
                    </Label>
                    <div className="flex gap-2 p-1 rounded-lg bg-muted/50 border border-border w-fit">
                      {PREFERRED_SIDE_OPTIONS.map((side) => (
                        <button
                          key={side}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, preferredSide: side })
                          }
                          className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                            formData.preferredSide === side
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          {side}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase">
                      Primary Paddle
                    </Label>
                    <Input
                      value={formData.primaryPaddle}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryPaddle: e.target.value })
                      }
                      placeholder="e.g. Selkirk Vanguard Control"
                      className="bg-muted/50 border-border rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase">
                      Typical Availability
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABILITY_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = formData.availability.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleAvailability(opt.id)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Pickleball Stats */}
              <Card className="glass-card rounded-2xl border-border/50 overflow-hidden">
                <div className="h-1 bg-primary/20" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display font-bold text-foreground">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    Pickleball Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase">
                        Self-Rating
                      </span>
                      <span className="font-display font-bold text-2xl text-foreground">
                        {formData.skillLevel}
                        <ChevronUp className="w-5 h-5 text-primary inline-block ml-0.5" />
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Skill level</p>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase">
                        Experience
                      </span>
                      <span className="font-display font-bold text-xl text-foreground">
                        {stats.tournamentsPlayed > 0 ? "Active" : "New"} Player
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.tournamentsPlayed} tournaments played
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase block mb-3">
                      Skill Assessment
                    </Label>
                      <div className="bg-muted/50 rounded-xl p-6 border border-border text-center">
                        <Target className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <h4 className="font-display font-medium text-foreground mb-1">Dynamic Skill Tracking</h4>
                        <p className="text-sm text-muted-foreground">
                          Coming soon! Track your performance across dinking, drives, and court mobility based on match results.
                        </p>
                      </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Security */}
              <Card className="glass-card rounded-2xl border-border/50 overflow-hidden">
                <div className="h-1 bg-primary/20" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display font-bold text-foreground">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    Account Security
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Update your password or manage two-factor authentication settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="link"
                    className="text-primary font-display font-semibold p-0 h-auto underline"
                    onClick={() => toast.info("Security settings coming soon")}
                  >
                    Security Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tournament History (full width below) */}
          <Card className="glass-card rounded-2xl border-border/50 mt-8 overflow-hidden">
            <div className="h-1 bg-primary/20" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display font-bold text-foreground">
                <Calendar className="w-5 h-5 text-primary" />
                Tournament History
              </CardTitle>
              <CardDescription>Your past tournaments and performances</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : tournaments.length > 0 ? (
                <div className="space-y-3">
                  {tournaments.slice(0, 10).map((tournament: any) => (
                    <div
                      key={tournament._id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/tournaments/${tournament._id}`)}
                    >
                      <div>
                        <h3 className="font-display font-bold text-foreground">{tournament.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(tournament.startDate).toLocaleDateString()}
                          </span>
                          {tournament.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {tournament.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-display font-semibold capitalize",
                          tournament.status === "completed"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary/20 text-foreground"
                        )}
                      >
                        {tournament.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-display font-bold text-foreground">No tournament history yet</p>
                  <p className="text-sm mt-1">Join a tournament to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom action bar */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-float">
            <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                You have unsaved changes in Personal Information
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={discardChanges}>
                  Discard
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={updateMutation.isPending}
                  className="bg-primary text-primary-foreground hover:shadow-glow"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        {hasUnsavedChanges && <div className="h-20" />}
      </div>
    </Layout>
  );
};

export default Profile;

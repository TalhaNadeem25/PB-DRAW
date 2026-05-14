import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eyebrow, Pill, PbAvatar } from "@/components/ui/pb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { authAPI } from "@/services/api";
import { ConnectAccountStatus } from "@/components/stripe/ConnectAccountStatus";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CalendarDots,
  CaretUp,
  CircleNotch,
  Lock,
  MapPin,
  Moon,
  PencilSimple,
  FloppyDisk,
  Sun,
  Target,
  Trophy,
  User,
  Lightning,
  ShareNetwork,
  CheckCircle,
  CreditCard,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AVAILABILITY_OPTIONS = [
  { id: "morning", label: "Morning", icon: Sun },
  { id: "afternoon", label: "Afternoon", icon: Sun },
  { id: "evening", label: "Evening", icon: Moon },
  { id: "weekends", label: "Weekends", icon: CalendarDots },
];

const PREFERRED_SIDE_OPTIONS = ["Left", "Right", "Both"] as const;



const Profile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"profile" | "payments">("profile");
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

  const winRate = stats.matchesPlayed > 0
    ? Math.round((stats.matchesWon / stats.matchesPlayed) * 100)
    : 0;

  return (
    <Layout>
      <div className="min-h-screen bg-background">

        {/* ── Mobile Profile Layout ── */}
        <div className="md:hidden flex flex-col min-h-screen bg-pb-paper pb-20">

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pb-3 bg-pb-surface border-b border-pb-hairline sticky top-0 z-30" style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)' }}>
            <h1 className="font-display font-bold text-[18px] text-pb-ink tracking-[-0.02em]">Profile</h1>
            <button
              onClick={() => navigator.share?.({ title: user.name, url: window.location.href }).catch(() => {})}
              className="w-9 h-9 flex items-center justify-center rounded-[6px] border border-pb-hairline text-pb-muted"
            >
              <ShareNetwork size={16} />
            </button>
          </div>

          {/* Tab strip (organizers only) */}
          {user.role === "organizer" && (
            <div className="flex border-b border-pb-hairline bg-pb-surface">
              {(["profile", "payments"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-2.5 text-[11px] font-mono uppercase tracking-[0.08em] border-b-2 -mb-px transition-colors",
                    activeTab === tab ? "border-pb-ink text-pb-ink" : "border-transparent text-pb-muted"
                  )}
                >
                  {tab === "profile" ? "Profile" : "Payments"}
                </button>
              ))}
            </div>
          )}

          {/* Profile tab */}
          {activeTab === "profile" && (
          <>

          {/* Profile header */}
          <div className="px-4 pt-5 pb-4 bg-pb-surface border-b border-pb-hairline">
            <div className="flex items-center gap-4 mb-3">
              <PbAvatar name={user.name} size={68} tone="ink" />
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-[22px] text-pb-ink tracking-[-0.025em] leading-tight">{user.name}</h2>
                <p className="font-mono text-[11px] text-pb-muted mt-0.5">
                  {user.location?.city && user.location?.state
                    ? `${user.location.city}, ${user.location.state}`
                    : user.email?.split("@")[0] ? `@${user.email.split("@")[0]}` : ""}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Pill tone="court" className="flex items-center gap-1 text-[10px]">
                    <CheckCircle size={10} weight="bold" />
                    {user.role === "player" ? "Verified" : user.role === "organizer" ? "Organizer" : "Admin"}
                  </Pill>
                  <Pill tone="neutral" mono className="text-[10px]">Member</Pill>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 divide-x divide-pb-hairline bg-pb-surface border-b border-pb-hairline">
            {[
              { label: "SKILL LVL", value: formData.skillLevel },
              { label: "MATCHES", value: String(stats.matchesPlayed) },
              { label: "WIN RATE", value: `${winRate}%` },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center justify-center py-4 gap-0.5">
                <Eyebrow>{label}</Eyebrow>
                <span className="font-mono text-[22px] font-bold text-pb-court leading-none">{value}</span>
              </div>
            ))}
          </div>

          {/* Trophy cabinet */}
          {tournaments.length > 0 && (
            <div className="px-4 pt-5">
              <Eyebrow className="mb-3">TROPHY CABINET</Eyebrow>
              <div className="bg-pb-surface border border-pb-hairline rounded-[8px] overflow-hidden divide-y divide-pb-hairline">
                {tournaments.slice(0, 6).map((tournament: any, idx: number) => (
                  <div
                    key={tournament._id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-pb-surface2 transition-colors"
                    onClick={() => navigate(`/tournaments/${tournament._id}`)}
                  >
                    {/* Place badge */}
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-mono font-bold border",
                      idx === 0
                        ? "bg-pb-amber-tint border-[#E8C9A1] text-[#7C3F0A]"
                        : "bg-pb-surface2 border-pb-hairline text-pb-muted"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-[13px] text-pb-ink truncate">{tournament.name}</p>
                      <p className="font-mono text-[10px] text-pb-faint">
                        {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-pb-muted capitalize shrink-0">{tournament.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit profile CTA */}
          <div className="px-4 pt-4">
            <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <PencilSimple size={14} className="text-pb-muted" />
                <Eyebrow>EDIT PROFILE</Eyebrow>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-pb-muted uppercase tracking-[0.1em]">Name</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-8 px-2.5 text-[12px] font-mono bg-pb-paper border border-pb-hairline rounded-[4px] text-pb-ink focus:outline-none focus:border-pb-rule"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-pb-muted uppercase tracking-[0.1em]">Skill</label>
                  <input
                    value={formData.skillLevel}
                    onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
                    className="h-8 px-2.5 text-[12px] font-mono bg-pb-paper border border-pb-hairline rounded-[4px] text-pb-ink focus:outline-none focus:border-pb-rule"
                  />
                </div>
              </div>
              {hasUnsavedChanges && (
                <button
                  onClick={handleSubmit}
                  disabled={updateMutation.isPending}
                  className="w-full h-9 rounded-[6px] bg-pb-ink text-white text-[12px] font-mono font-semibold flex items-center justify-center gap-2"
                >
                  {updateMutation.isPending
                    ? <><CircleNotch size={13} className="animate-spin" /> Saving…</>
                    : <><FloppyDisk size={13} /> Save Changes</>}
                </button>
              )}
            </div>
          </div>

          </> /* end profile tab */
          )}

          {/* Payments tab (organizer only) */}
          {activeTab === "payments" && user.role === "organizer" && (
            <div className="px-4 pt-5 pb-6">
              <ConnectAccountStatus />
            </div>
          )}

        </div>

        {/* ── Desktop Profile Layout (md+) ── */}
        <div className="hidden md:block">

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
                      <Lightning className="w-5 h-5 text-primary" />
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
                        <CaretUp className="w-5 h-5 text-primary inline-block ml-0.5" />
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

              {/* Stripe Configuration (organizers only) */}
              {user.role === "organizer" && (
                <Card className="glass-card rounded-2xl border-border/50 overflow-hidden">
                  <div className="h-1 bg-primary/20" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display font-bold text-foreground">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      Payment Setup
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Connect your Stripe account to collect entry fees from players.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ConnectAccountStatus />
                  </CardContent>
                </Card>
              )}
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
                  <CircleNotch className="w-8 h-8 animate-spin text-primary" />
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
                      <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FloppyDisk className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        {hasUnsavedChanges && <div className="h-20" />}
        </div>{/* end hidden md:block */}
      </div>
    </Layout>
  );
};

export default Profile;

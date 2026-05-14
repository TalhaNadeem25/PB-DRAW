import Layout from "@/components/layout/Layout";
import { ConnectAccountStatus } from "@/components/stripe/ConnectAccountStatus";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Eyebrow, Pill, PbBtn } from "@/components/ui/pb";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import api, { eventAPI, tournamentAPI } from "@/services/api";
import type { GameType, TournamentEvent, TournamentFormat } from "@/types/tournament";
import { SKILL_LEVEL_RANGES, formatEventSkillLevel } from "@/types/tournament";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft, ArrowRight, Brain, CalendarBlank, Check,
  CircleNotch, CurrencyDollar, MapPin, Plus, Sparkle, Trash, Trophy, Users,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const gameTypes: GameType[] = ["Singles", "Doubles", "Mixed Doubles"];
const tournamentFormats: TournamentFormat[] = ["Round Robin", "Single Elimination", "Double Elimination", "Pools + Playoffs"];

const AMENITIES = ["Parking", "Restrooms", "Locker Rooms", "Food & Beverages", "Seating/Bleachers", "First Aid", "WiFi"];

/* ── Shared form primitives ── */
const FL = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[11px] font-mono uppercase tracking-[0.08em] text-pb-muted mb-1.5">{children}</label>
);
const FI = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "w-full h-9 rounded-[6px] border border-pb-hairline bg-pb-surface2 px-3 text-[13px] font-sans text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule",
      props.className
    )}
  />
);
const FS = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={cn(
      "w-full h-9 rounded-[6px] border border-pb-hairline bg-pb-surface2 px-3 text-[13px] font-mono text-pb-ink focus:outline-none focus:border-pb-rule",
      props.className
    )}
  />
);
const FTA = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      "w-full rounded-[6px] border border-pb-hairline bg-pb-surface2 px-3 py-2 text-[13px] font-sans text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule resize-none",
      props.className
    )}
  />
);

/* ── Section card ── */
const SCard = ({ icon: Icon, title, sub, children }: { icon: React.ElementType; title: string; sub?: string; children: React.ReactNode }) => (
  <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-pb-hairline bg-pb-surface2">
      <Icon size={14} className="text-pb-muted shrink-0" />
      <div>
        <p className="font-display font-semibold text-[15px] tracking-[-0.015em] text-pb-ink">{title}</p>
        {sub && <p className="text-[11px] font-mono text-pb-muted">{sub}</p>}
      </div>
    </div>
    <div className="p-5 space-y-5">{children}</div>
  </div>
);

/* ── Date picker trigger ── */
const DateBtn = ({ date, onClick }: { date?: Date; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full h-9 rounded-[6px] border border-pb-hairline bg-pb-surface2 px-3 text-[13px] font-mono text-pb-ink flex items-center gap-2 hover:border-pb-rule focus:outline-none focus:border-pb-rule transition-colors"
  >
    <CalendarBlank size={13} className="text-pb-muted shrink-0" />
    {date ? format(date, "MMM d, yyyy") : <span className="text-pb-faint">Pick a date</span>}
  </button>
);

const CreateTournament = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [maxPlayers] = useState(9999);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [allowWaitlist, setAllowWaitlist] = useState(false);
  const [isFree, setIsFree] = useState(false);

  const [courtCount, setCourtCount] = useState<number | string>(4);
  const [courtSurface, setCourtSurface] = useState("");
  const [playStartTime, setPlayStartTime] = useState("08:00");
  const [playEndTime, setPlayEndTime] = useState("18:00");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [spectatorCapacity, setSpectatorCapacity] = useState<number | string>("");

  const [checkInWindow, setCheckInWindow] = useState("30");
  const [refereeType, setRefereeType] = useState("");
  const [tournamentFee, setTournamentFee] = useState<number | string>(0);
  const [prizeTotal, setPrizeTotal] = useState<number | string>("");
  const [prizeFirst, setPrizeFirst] = useState("");
  const [prizeSecond, setPrizeSecond] = useState("");
  const [prizeThird, setPrizeThird] = useState("");

  const [events, setEvents] = useState<Omit<TournamentEvent, "id" | "registeredPlayers">[]>([]);
  const [newEvent, setNewEvent] = useState({
    name: "", gameType: "Singles" as GameType, format: "Round Robin" as TournamentFormat,
    skillLevel: "3.5-4.0", maxPlayers: 32, entryFee: 50, addPlayoffStage: false,
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (tournamentData: any) => {
      const tournament = await tournamentAPI.create(tournamentData);
      return tournament.data;
    },
    onSuccess: async (tournament) => {
      for (const event of events) {
        try {
          const playFormat = event.format === "Pools + Playoffs" ? "pool-play" : event.format.toLowerCase().replace(/ /g, "-");
          await eventAPI.create(tournament._id, {
            name: event.name, format: event.gameType.toLowerCase().replace(/ /g, "-"),
            playFormat, addPlayoffStage: playFormat !== "round-robin",
            skillLevel: event.skillLevel, maxTeams: event.maxPlayers,
            entryFee: isFree ? 0 : event.entryFee, status: "upcoming",
          });
        } catch (error) {
          console.error("Error creating event:", error);
        }
      }
      if (imageFile) {
        try { await tournamentAPI.uploadImage(tournament._id, imageFile); }
        catch { toast.error("Tournament created but image upload failed"); }
      }
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Tournament created successfully!");
      navigate(`/tournaments/${tournament._id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create tournament");
    },
  });

  const { data: stripeStatus } = useQuery({
    queryKey: ["stripe-connect-status"],
    queryFn: async () => { const r = await api.get("/stripe/connect/status"); return r.data; },
    enabled: isAuthenticated && (user?.role === "organizer" || user?.role === "admin"),
  });

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (user?.role !== "organizer" && user?.role !== "admin") {
      toast.error("Only organizers can create tournaments");
      navigate("/tournaments"); return;
    }
    setIsCheckingAuth(false);
  }, [isAuthenticated, user, navigate]);

  if (isCheckingAuth || !isAuthenticated || (user?.role !== "organizer" && user?.role !== "admin")) return null;

  const addEvent = () => {
    if (!newEvent.name) { toast.error("Please enter an event name"); return; }
    setEvents([...events, { ...newEvent }]);
    setNewEvent({ name: "", gameType: "Singles", format: "Round Robin", skillLevel: "3.5-4.0", maxPlayers: 32, entryFee: 50, addPlayoffStage: false });
    toast.success("Event added");
  };

  const removeEvent = (index: number) => setEvents(events.filter((_, i) => i !== index));

  const toggleAmenity = (a: string) =>
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image size must be less than 5MB"); return; }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG, and WEBP images are allowed"); return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!name || !location || !address || !description || !startDate || !endDate || !registrationDeadline || events.length === 0) {
      toast.error("Please fill in all required fields and add at least one event");
      return;
    }
    createTournamentMutation.mutate({
      name, description, location, address,
      startDate: startDate.toISOString(), endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      maxPlayers, status: "open", settings: { allowWaitlist },
      venue: {
        courts: courtCount !== "" ? Number(courtCount) : undefined,
        courtSurface: courtSurface || undefined,
        facilities: amenities.length > 0 ? amenities : undefined,
        spectatorCapacity: spectatorCapacity !== "" ? Number(spectatorCapacity) : undefined,
      },
      scheduling: { startTime: playStartTime, endTime: playEndTime, checkInWindow: Number(checkInWindow) },
      entryFee: isFree ? 0 : (Number(tournamentFee) || 0), isFree,
      refereeType: refereeType || undefined,
      prizePool: prizeTotal !== "" && Number(prizeTotal) >= 0 ? {
        total: Number(prizeTotal),
        distribution: { first: prizeFirst || undefined, second: prizeSecond || undefined, third: prizeThird || undefined },
      } : undefined,
    });
  };

  const goToStep = (n: number) => { setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const canProceed = () => {
    if (step === 1) {
      const filled = !!(name && location && address && description && startDate && endDate && registrationDeadline);
      return isFree ? filled : (!!stripeStatus?.connected && filled);
    }
    if (step === 2) return events.length > 0;
    return true;
  };

  const STEPS = [
    { num: 1, label: "Basic Info" },
    { num: 2, label: "Events" },
    { num: 3, label: "Venue" },
    { num: 4, label: "Rules" },
    { num: 5, label: "Review" },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-pb-paper">

        {/* ── Top bar ── */}
        <div className="bg-pb-surface border-b border-pb-hairline">
          <div className="container mx-auto px-4 sm:px-6 py-5">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-[12px] font-mono text-pb-muted hover:text-pb-ink mb-4 transition-colors"
            >
              <ArrowLeft size={13} /> Back
            </button>
            <h1 className="font-display font-extrabold text-[32px] tracking-[-0.035em] leading-none text-pb-ink mb-1">
              Create Tournament
            </h1>
            <p className="text-[12px] font-mono text-pb-muted">Set up your pickleball tournament in minutes</p>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-6">

          {/* ── Step indicator ── */}
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-4 mb-6">
            <div className="flex items-start max-w-2xl mx-auto">
              {STEPS.map((s, i) => (
                <div key={s.num} className="flex items-start flex-1">
                  <div className="flex flex-col items-center gap-1 w-8 shrink-0">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-bold transition-colors",
                      step > s.num ? "bg-pb-court text-white" :
                      step === s.num ? "bg-pb-ink text-white" :
                      "bg-pb-surface2 border border-pb-hairline text-pb-muted"
                    )}>
                      {step > s.num ? <Check size={11} weight="bold" /> : s.num}
                    </div>
                    <span className={cn(
                      "text-[9px] font-mono uppercase tracking-[0.06em] hidden sm:block text-center leading-tight",
                      step >= s.num ? "text-pb-ink" : "text-pb-faint"
                    )}>
                      {s.label}
                    </span>
                  </div>
                  {i < 4 && (
                    <div className={cn(
                      "flex-1 h-px mt-3.5 mx-1 transition-colors",
                      step > s.num ? "bg-pb-court" : "bg-pb-hairline"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Form content ── */}
          <div className="max-w-3xl mx-auto space-y-5">

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5">
                {/* Free toggle */}
                <div className={cn(
                  "border rounded-[6px] p-4 flex items-start justify-between gap-4 transition-colors",
                  isFree ? "bg-pb-court-tint2/40 border-pb-court" : "bg-pb-surface border-pb-hairline"
                )}>
                  <div>
                    <p className="font-sans font-semibold text-[14px] text-pb-ink mb-0.5">Free Tournament</p>
                    <p className="text-[12px] font-mono text-pb-muted">Enable to waive all entry fees. Stripe is not required.</p>
                    {isFree && (
                      <p className="text-[11px] font-mono text-pb-court mt-1.5 font-semibold uppercase tracking-[0.06em]">
                        Stripe not required · All fees set to $0
                      </p>
                    )}
                  </div>
                  <Switch checked={isFree} onCheckedChange={(v) => { setIsFree(v); if (v) setTournamentFee(0); }} className="shrink-0 mt-0.5" />
                </div>

                {/* Stripe gate */}
                {!isFree && <ConnectAccountStatus />}

                {/* AI planner promo */}
                <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-5 flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-10 h-10 rounded-[6px] bg-pb-court-tint2 border border-pb-hairline flex items-center justify-center shrink-0">
                    <Brain size={18} className="text-pb-court" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Pill tone="court" mono>AI-Powered</Pill>
                    </div>
                    <p className="font-display font-semibold text-[15px] tracking-[-0.015em] text-pb-ink mb-1">
                      Not sure where to start? Let AI help you plan!
                    </p>
                    <p className="text-[12px] font-mono text-pb-muted">
                      Get instant recommendations for events, court requirements, schedules, and pricing.
                    </p>
                  </div>
                  <Link
                    to="/tournament-planner"
                    className="shrink-0 h-9 px-4 rounded-[6px] border border-pb-hairline bg-pb-surface2 flex items-center gap-1.5 text-[12px] font-mono text-pb-ink hover:border-pb-rule transition-colors"
                  >
                    <Sparkle size={13} /> Try AI Planner
                  </Link>
                </div>

                {/* Tournament details */}
                <SCard icon={Trophy} title="Tournament Details" sub="Basic information about your tournament">
                  <div>
                    <FL>Tournament Name *</FL>
                    <FI placeholder="e.g., Summer Slam Championship 2025" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <FL>Venue Name *</FL>
                      <FI placeholder="e.g., Austin Pickleball Complex" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                    <div>
                      <FL>Address *</FL>
                      <FI placeholder="e.g., 123 Court Street, Austin, TX" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <FL>Description *</FL>
                    <FTA
                      placeholder="Tell players what makes your tournament special..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex items-start justify-between gap-4 p-4 rounded-[6px] border border-pb-hairline bg-pb-surface2">
                    <div className="flex items-start gap-2.5">
                      <Users size={14} className="text-pb-muted shrink-0 mt-0.5" />
                      <div>
                        <p className="font-sans font-medium text-[13px] text-pb-ink">Allow waitlist</p>
                        <p className="text-[11px] font-mono text-pb-muted mt-0.5">
                          When an event is full, players can join a waitlist. You approve them to send a payment link.
                        </p>
                      </div>
                    </div>
                    <Switch checked={allowWaitlist} onCheckedChange={setAllowWaitlist} className="shrink-0" />
                  </div>
                  <div>
                    <FL>Tournament Image</FL>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="w-full text-[12px] font-mono text-pb-muted file:mr-3 file:h-7 file:px-3 file:rounded-[4px] file:border file:border-pb-hairline file:bg-pb-surface2 file:text-[11px] file:font-mono file:text-pb-ink file:cursor-pointer"
                    />
                    <p className="text-[11px] font-mono text-pb-faint mt-1.5">JPEG, PNG, or WEBP · max 5 MB</p>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="mt-3 w-full max-w-sm rounded-[6px] border border-pb-hairline object-cover" />
                    )}
                  </div>
                </SCard>

                {/* Dates */}
                <SCard icon={CalendarBlank} title="Dates" sub="Tournament dates and registration deadline">
                  <div className="grid md:grid-cols-3 gap-4">
                    {([
                      { label: "Start Date *", date: startDate, set: setStartDate },
                      { label: "End Date *", date: endDate, set: setEndDate },
                      { label: "Registration Deadline *", date: registrationDeadline, set: setRegistrationDeadline },
                    ] as { label: string; date: Date | undefined; set: (d: Date | undefined) => void }[]).map(({ label, date, set }) => (
                      <div key={label}>
                        <FL>{label}</FL>
                        <Popover>
                          <PopoverTrigger asChild>
                            <DateBtn date={date} />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={date} onSelect={set} initialFocus className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                    ))}
                  </div>
                </SCard>
              </div>
            )}

            {/* Step 2: Events */}
            {step === 2 && (
              <div className="space-y-5">
                <SCard icon={Plus} title="Add Event" sub="Create competition events for your tournament">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <FL>Event Name</FL>
                      <FI placeholder="e.g., Men's Singles 3.5" value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} />
                    </div>
                    <div>
                      <FL>Game Type</FL>
                      <FS value={newEvent.gameType} onChange={(e) => setNewEvent({ ...newEvent, gameType: e.target.value as GameType })}>
                        {gameTypes.map((g) => <option key={g} value={g}>{g}</option>)}
                      </FS>
                    </div>
                    <div>
                      <FL>Format</FL>
                      <FS value={newEvent.format} onChange={(e) => setNewEvent({ ...newEvent, format: e.target.value as TournamentFormat })}>
                        {tournamentFormats.map((f) => <option key={f} value={f}>{f}</option>)}
                      </FS>
                    </div>
                    <div>
                      <FL>Skill Level</FL>
                      <FS value={newEvent.skillLevel} onChange={(e) => setNewEvent({ ...newEvent, skillLevel: e.target.value })}>
                        {SKILL_LEVEL_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </FS>
                    </div>
                    <div>
                      <FL>{newEvent.gameType === "Singles" ? "Max Players" : "Max Teams"}</FL>
                      <FI
                        type="number"
                        min={2}
                        value={newEvent.maxPlayers}
                        onChange={(e) => setNewEvent({ ...newEvent, maxPlayers: parseInt(e.target.value) || 16 })}
                      />
                    </div>
                    {!isFree && (
                      <div>
                        <FL>Entry Fee ($)</FL>
                        <FI
                          type="number"
                          min={0}
                          value={newEvent.entryFee}
                          onChange={(e) => setNewEvent({ ...newEvent, entryFee: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    )}
                  </div>
                  <PbBtn variant="primary" size="md" onClick={addEvent} className="w-full sm:w-auto">
                    <Plus size={14} /> Add Event
                  </PbBtn>
                </SCard>

                {/* Event list */}
                <SCard icon={Trophy} title={`Your Events (${events.length})`} sub={events.length === 0 ? "Add at least one event to continue" : "Review and manage your tournament events"}>
                  {events.length === 0 ? (
                    <div className="py-10 text-center">
                      <Trophy size={28} className="mx-auto mb-3 text-pb-faint" />
                      <p className="text-[12px] font-mono text-pb-muted">Add your first event above</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {events.map((event, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 border border-pb-hairline rounded-[6px] bg-pb-surface2 hover:border-pb-rule transition-colors">
                          <Trophy size={14} className="text-pb-muted shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-semibold text-[14px] tracking-[-0.01em] text-pb-ink truncate mb-1">
                              {event.name}
                            </p>
                            <div className="flex gap-1.5 flex-wrap">
                              <Pill tone="neutral" mono>{event.gameType}</Pill>
                              <Pill tone="neutral" mono>{event.format}</Pill>
                              <Pill tone="neutral" mono>{formatEventSkillLevel(event.skillLevel)}</Pill>
                            </div>
                          </div>
                          <div className="text-right shrink-0 hidden sm:block">
                            <p className="font-mono font-semibold text-[13px] text-pb-ink">{isFree ? "Free" : `$${event.entryFee}`}</p>
                            <p className="font-mono text-[11px] text-pb-muted">{event.maxPlayers} {event.gameType === "Singles" ? "players" : "teams"}</p>
                          </div>
                          <button
                            onClick={() => removeEvent(index)}
                            className="w-8 h-8 rounded-[6px] border border-pb-hairline flex items-center justify-center text-pb-muted hover:border-destructive/50 hover:text-destructive transition-colors shrink-0"
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </SCard>
              </div>
            )}

            {/* Step 3: Venue & Courts */}
            {step === 3 && (
              <SCard icon={MapPin} title="Venue & Courts" sub="Tell players about your venue setup — all fields are optional">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <FL>Number of Courts</FL>
                    <FI
                      type="number"
                      min={1}
                      placeholder="e.g. 8"
                      value={courtCount}
                      onChange={(e) => setCourtCount(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <FL>Court Surface</FL>
                    <FS value={courtSurface} onChange={(e) => setCourtSurface(e.target.value)}>
                      <option value="">Select surface type</option>
                      <option value="indoor-sport-court">Indoor Sport Court</option>
                      <option value="indoor-wood">Indoor Wood</option>
                      <option value="outdoor-concrete">Outdoor Concrete</option>
                      <option value="outdoor-asphalt">Outdoor Asphalt</option>
                      <option value="outdoor-sport-court">Outdoor Sport Court</option>
                    </FS>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <FL>Play Starts</FL>
                    <FI type="time" value={playStartTime} onChange={(e) => setPlayStartTime(e.target.value)} />
                  </div>
                  <div>
                    <FL>Play Ends</FL>
                    <FI type="time" value={playEndTime} onChange={(e) => setPlayEndTime(e.target.value)} />
                  </div>
                  <div>
                    <FL>Spectator Capacity</FL>
                    <FI
                      type="number"
                      min={0}
                      placeholder="e.g. 200"
                      value={spectatorCapacity}
                      onChange={(e) => setSpectatorCapacity(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <FL>Amenities</FL>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                    {AMENITIES.map((amenity) => (
                      <label
                        key={amenity}
                        className={cn(
                          "flex items-center gap-2.5 cursor-pointer p-3 rounded-[6px] border transition-colors",
                          amenities.includes(amenity)
                            ? "border-pb-court bg-pb-court-tint2"
                            : "border-pb-hairline bg-pb-surface2 hover:border-pb-rule"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors",
                          amenities.includes(amenity) ? "bg-pb-court border-pb-court" : "border-pb-rule bg-pb-surface"
                        )}>
                          {amenities.includes(amenity) && <Check size={10} weight="bold" className="text-white" />}
                        </div>
                        <input type="checkbox" checked={amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="sr-only" />
                        <span className="text-[12px] font-mono text-pb-ink">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </SCard>
            )}

            {/* Step 4: Rules & Prizes */}
            {step === 4 && (
              <div className="space-y-5">
                <SCard icon={Trophy} title="Check-In & Officials" sub="Set check-in policy and officiating details — all optional">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <FL>Check-In Window</FL>
                      <FS value={checkInWindow} onChange={(e) => setCheckInWindow(e.target.value)}>
                        <option value="15">15 min before first match</option>
                        <option value="30">30 min before first match</option>
                        <option value="45">45 min before first match</option>
                        <option value="60">1 hour before first match</option>
                        <option value="120">2 hours before first match</option>
                      </FS>
                    </div>
                    <div>
                      <FL>Referee Type</FL>
                      <FS value={refereeType} onChange={(e) => setRefereeType(e.target.value)}>
                        <option value="">Select referee type</option>
                        <option value="self-officiated">Self-Officiated</option>
                        <option value="line-judges">Line Judges</option>
                        <option value="certified-referees">Certified Referees</option>
                      </FS>
                    </div>
                  </div>
                </SCard>

                <SCard icon={CurrencyDollar} title="Registration Fee" sub="One-time tournament fee charged per player, in addition to per-event fees">
                  {isFree ? (
                    <div className="flex items-center gap-2.5 p-3 rounded-[6px] bg-pb-court-tint2 border border-pb-court">
                      <CurrencyDollar size={13} className="text-pb-court shrink-0" />
                      <p className="text-[12px] font-mono font-semibold text-pb-court uppercase tracking-[0.06em]">
                        Free Tournament — all fees are $0
                      </p>
                    </div>
                  ) : (
                    <div>
                      <FL>Tournament Entry Fee ($)</FL>
                      <div className="relative">
                        <CurrencyDollar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-pb-muted" />
                        <FI
                          type="number"
                          min={0}
                          placeholder="0"
                          value={tournamentFee}
                          onChange={(e) => setTournamentFee(e.target.value === "" ? "" : Number(e.target.value))}
                          className="pl-8"
                        />
                      </div>
                      <p className="text-[11px] font-mono text-pb-faint mt-1.5">Enter 0 for no tournament-level fee.</p>
                    </div>
                  )}
                </SCard>

                <SCard icon={Trophy} title="Prize Information" sub="Add prize details to attract competitive players — optional">
                  <div>
                    <FL>Total Prize Pool ($)</FL>
                    <div className="relative">
                      <CurrencyDollar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-pb-muted" />
                      <FI
                        type="number"
                        min={0}
                        placeholder="0"
                        value={prizeTotal}
                        onChange={(e) => setPrizeTotal(e.target.value === "" ? "" : Number(e.target.value))}
                        className="pl-8"
                      />
                    </div>
                    <p className="text-[11px] font-mono text-pb-faint mt-1.5">Enter 0 for medals-only or no cash prizes.</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { label: "1st Place", value: prizeFirst, set: setPrizeFirst, emoji: "🥇" },
                      { label: "2nd Place", value: prizeSecond, set: setPrizeSecond, emoji: "🥈" },
                      { label: "3rd Place", value: prizeThird, set: setPrizeThird, emoji: "🥉" },
                    ].map(({ label, value, set, emoji }) => (
                      <div key={label}>
                        <FL>{emoji} {label}</FL>
                        <FI placeholder="e.g. $500 or Gold Medal" value={value} onChange={(e) => set(e.target.value)} />
                      </div>
                    ))}
                  </div>
                </SCard>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
                <div className="px-5 py-4 border-b border-pb-hairline bg-pb-surface2">
                  <p className="font-display font-semibold text-[16px] tracking-[-0.02em] text-pb-ink">Review Your Tournament</p>
                  <p className="text-[11px] font-mono text-pb-muted mt-0.5">Make sure everything looks correct before creating</p>
                </div>
                <div className="p-5 space-y-6">
                  {/* Basic */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Eyebrow className="mb-3">Tournament Details</Eyebrow>
                      <div className="space-y-3">
                        {[
                          { k: "Name", v: name },
                          { k: "Location", v: location },
                          { k: "Address", v: address },
                        ].map(({ k, v }) => v ? (
                          <div key={k}>
                            <p className="text-[11px] font-mono text-pb-muted">{k}</p>
                            <p className="font-sans font-medium text-[13px] text-pb-ink">{v}</p>
                          </div>
                        ) : null)}
                      </div>
                    </div>
                    <div>
                      <Eyebrow className="mb-3">Dates</Eyebrow>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[11px] font-mono text-pb-muted">Tournament Dates</p>
                          <p className="font-mono text-[13px] text-pb-ink">
                            {startDate && format(startDate, "MMM d")} – {endDate && format(endDate, "MMM d, yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-mono text-pb-muted">Registration Deadline</p>
                          <p className="font-mono text-[13px] text-pb-ink">{registrationDeadline && format(registrationDeadline, "MMM d, yyyy")}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="pt-4 border-t border-pb-hairline">
                    <Eyebrow className="mb-3">Events ({events.length})</Eyebrow>
                    <div className="grid md:grid-cols-2 gap-2">
                      {events.map((event, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border border-pb-hairline rounded-[6px] bg-pb-surface2">
                          <div>
                            <p className="font-display font-semibold text-[13px] text-pb-ink">{event.name}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              <Pill tone="neutral" mono>{event.gameType}</Pill>
                              <Pill tone="neutral" mono>{event.format}</Pill>
                              <Pill tone="neutral" mono>{formatEventSkillLevel(event.skillLevel)}</Pill>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-[13px] text-pb-court shrink-0">
                            {isFree ? "Free" : `$${event.entryFee}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Venue summary */}
                  {(courtCount !== "" || courtSurface || amenities.length > 0 || spectatorCapacity !== "") && (
                    <div className="pt-4 border-t border-pb-hairline">
                      <Eyebrow className="mb-3">Venue & Courts</Eyebrow>
                      <div className="grid md:grid-cols-2 gap-3">
                        {courtCount !== "" && (
                          <div>
                            <p className="text-[11px] font-mono text-pb-muted">Courts</p>
                            <p className="font-mono text-[13px] text-pb-ink">{courtCount} courts{courtSurface ? ` · ${courtSurface.replace(/-/g, " ")}` : ""}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[11px] font-mono text-pb-muted">Play Hours</p>
                          <p className="font-mono text-[13px] text-pb-ink">{playStartTime} – {playEndTime}</p>
                        </div>
                        {amenities.length > 0 && (
                          <div className="md:col-span-2">
                            <p className="text-[11px] font-mono text-pb-muted">Amenities</p>
                            <p className="font-mono text-[13px] text-pb-ink">{amenities.join(", ")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prizes summary */}
                  {(prizeFirst || prizeSecond || prizeThird || (prizeTotal !== "" && Number(prizeTotal) > 0)) && (
                    <div className="pt-4 border-t border-pb-hairline">
                      <Eyebrow className="mb-3">Prize Pool</Eyebrow>
                      <div className="space-y-1">
                        {prizeTotal !== "" && Number(prizeTotal) > 0 && (
                          <p className="font-mono text-[13px] text-pb-ink">Total: ${Number(prizeTotal).toLocaleString()}</p>
                        )}
                        {prizeFirst && <p className="font-mono text-[12px] text-pb-muted">🥇 {prizeFirst}</p>}
                        {prizeSecond && <p className="font-mono text-[12px] text-pb-muted">🥈 {prizeSecond}</p>}
                        {prizeThird && <p className="font-mono text-[12px] text-pb-muted">🥉 {prizeThird}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="flex justify-between pt-2 pb-8">
              <PbBtn variant="outline" size="md" onClick={() => goToStep(step - 1)} disabled={step === 1}>
                <ArrowLeft size={14} /> Back
              </PbBtn>

              {step < 5 ? (
                <PbBtn variant="primary" size="md" onClick={() => goToStep(step + 1)} disabled={!canProceed()}>
                  Next <ArrowRight size={14} />
                </PbBtn>
              ) : (
                <PbBtn variant="primary" size="md" onClick={handleSubmit} disabled={createTournamentMutation.isPending}>
                  {createTournamentMutation.isPending ? (
                    <><CircleNotch size={14} className="animate-spin" /> Creating…</>
                  ) : (
                    <>Create Tournament <Check size={14} /></>
                  )}
                </PbBtn>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateTournament;

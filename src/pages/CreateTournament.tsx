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
  ArrowLeft, Brain, CalendarBlank, Check, CircleNotch,
  CurrencyDollar, MapPin, Plus, Sparkle, Trash, Trophy, Users, X,
} from "@phosphor-icons/react";
import { forwardRef, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const gameTypes: GameType[] = ["Singles", "Doubles", "Mixed Doubles"];
const tournamentFormats: TournamentFormat[] = ["Round Robin", "Single Elimination", "Double Elimination", "Pools + Playoffs"];
const AMENITIES = ["Parking", "Restrooms", "Locker Rooms", "Food & Beverages", "Seating/Bleachers", "First Aid", "WiFi"];

/* ── Primitives ─────────────────────────────────────────────────────────── */
const FL = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10.5px] font-mono uppercase tracking-[0.1em] text-pb-muted mb-1.5">{children}</label>
);
const FI = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "w-full h-9 rounded-[6px] border border-pb-hairline bg-white px-3 text-[13px] font-sans text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-ink transition-colors",
      props.className
    )}
  />
);
const FS = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={cn(
      "w-full h-9 rounded-[6px] border border-pb-hairline bg-white px-3 text-[13px] font-mono text-pb-ink focus:outline-none focus:border-pb-ink transition-colors",
      props.className
    )}
  />
);
const FTA = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      "w-full rounded-[6px] border border-pb-hairline bg-white px-3 py-2 text-[13px] font-sans text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-ink transition-colors resize-none",
      props.className
    )}
  />
);
const DateBtn = forwardRef<HTMLButtonElement, { date?: Date; onClick?: () => void }>(
  ({ date, onClick }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="w-full h-9 rounded-[6px] border border-pb-hairline bg-white px-3 text-[13px] font-mono text-pb-ink flex items-center gap-2 hover:border-pb-ink focus:outline-none transition-colors"
    >
      <CalendarBlank size={13} className="text-pb-muted shrink-0" />
      {date ? format(date, "MMM d, yyyy") : <span className="text-pb-faint">Pick a date</span>}
    </button>
  )
);
DateBtn.displayName = "DateBtn";

/* ── Section header ────────────────────────────────────────────────────── */
const SH = ({ step, total, title, sub }: { step: number; total: number; title: string; sub?: string }) => (
  <div className="mb-8">
    <p className="font-mono text-[10.5px] text-pb-muted uppercase tracking-[0.12em] mb-1">Step {step} of {total}</p>
    <h2 className="font-display font-black text-[36px] tracking-[-0.03em] leading-none text-pb-ink mb-2">{title}</h2>
    {sub && <p className="text-[14px] text-pb-muted">{sub}</p>}
  </div>
);

/* ── Field section label ────────────────────────────────────────────────── */
const SL = ({ children }: { children: React.ReactNode }) => (
  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-pb-muted mb-3">{children}</p>
);

const STEPS = [
  { num: 1, label: "Basics" },
  { num: 2, label: "Events" },
  { num: 3, label: "Venue" },
  { num: 4, label: "Schedule" },
  { num: 5, label: "Pricing" },
  { num: 6, label: "Review" },
];

/* ═══════════════════════════════════════════════════════════════════════ */

const CreateTournament = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Basic info
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [allowWaitlist, setAllowWaitlist] = useState(false);
  const [isFree, setIsFree] = useState(false);

  // Venue
  const [courtCount, setCourtCount] = useState<number | string>(4);
  const [courtSurface, setCourtSurface] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [spectatorCapacity, setSpectatorCapacity] = useState<number | string>("");

  // Schedule
  const [playStartTime, setPlayStartTime] = useState("08:00");
  const [playEndTime, setPlayEndTime] = useState("18:00");
  const [checkInWindow, setCheckInWindow] = useState("30");
  const [refereeType, setRefereeType] = useState("");

  // Pricing
  const [tournamentFee, setTournamentFee] = useState<number | string>(0);
  const [prizeTotal, setPrizeTotal] = useState<number | string>("");
  const [prizeFirst, setPrizeFirst] = useState("");
  const [prizeSecond, setPrizeSecond] = useState("");
  const [prizeThird, setPrizeThird] = useState("");

  // Events
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
        } catch (err) {
          console.error("Error creating event:", err);
        }
      }
      if (imageFile) {
        try { await tournamentAPI.uploadImage(tournament._id, imageFile); }
        catch { toast.error("Tournament created but image upload failed"); }
      }
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Tournament created!");
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
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG, or WEBP allowed"); return;
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
      maxPlayers: 9999, status: "open", settings: { allowWaitlist },
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

  const goTo = (n: number) => { setStep(n); window.scrollTo({ top: 0 }); };

  const canProceed = () => {
    if (step === 1) {
      const filled = !!(name && location && address && description && startDate && endDate && registrationDeadline);
      return isFree ? filled : (!!stripeStatus?.connected && filled);
    }
    if (step === 2) return events.length > 0;
    return true;
  };

  // Draw Assistant hint
  const assistantHint = () => {
    if (step === 1 && !name) return "Start by giving your tournament a name and picking your dates.";
    if (step === 2 && events.length === 0) return "Add at least one event. You can mix formats — doubles, singles, mixed — all in one tournament.";
    if (step === 2 && events.length > 0) return `${events.length} event${events.length > 1 ? "s" : ""} added. For ${events.reduce((s, e) => s + e.maxPlayers, 0)} total players across ${events.length} event${events.length > 1 ? "s" : ""}.`;
    if (step === 3) return `With ${courtCount} courts, we suggest grouping players in pools of 4–6 for round-robin play.`;
    if (step === 4) return "Set play hours that give each match enough time. 30 min per match is standard for pool play.";
    if (step === 5 && !isFree) return "Entry fees help cover court costs. Most recreational tournaments charge $25–$60 per player.";
    if (step === 6) return "Everything look right? Hit Create to go live.";
    return "Fill in the details and we'll guide you through.";
  };

  return (
    <div className="h-full flex flex-col bg-pb-paper overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 bg-pb-paper border-b border-pb-hairline px-6 pb-4 flex items-center justify-between" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
        <div>
          <p className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.12em] mb-0.5">
            New Draft · {name || "Untitled tournament"}
          </p>
          <h1 className="font-display font-black text-[26px] tracking-[-0.03em] leading-none text-pb-ink">
            Build a tournament
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="h-8 px-4 rounded-[6px] border border-pb-hairline font-mono text-[11px] text-pb-ink hover:bg-pb-surface transition-colors"
          >
            Save &amp; exit
          </button>
          <button
            disabled
            className="h-8 px-4 rounded-[6px] border border-pb-hairline font-mono text-[11px] text-pb-muted cursor-not-allowed"
          >
            Preview public page
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left sidebar ────────────────────────────────────────────── */}
        <aside className="w-[220px] shrink-0 border-r border-pb-hairline flex flex-col overflow-y-auto bg-pb-paper hidden md:flex">
          <div className="px-5 pt-6 pb-4">
            <p className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.12em] mb-4">
              Steps · {step} of {STEPS.length}
            </p>
            <nav className="space-y-0.5">
              {STEPS.map((s) => (
                <button
                  key={s.num}
                  onClick={() => s.num < step ? goTo(s.num) : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-left transition-colors",
                    step === s.num
                      ? "bg-pb-ink text-white"
                      : step > s.num
                      ? "text-pb-muted hover:bg-pb-surface cursor-pointer"
                      : "text-pb-faint cursor-default"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-mono font-bold transition-colors",
                    step === s.num ? "bg-white text-pb-ink" :
                    step > s.num ? "bg-pb-court text-white" :
                    "border border-pb-hairline text-pb-faint"
                  )}>
                    {step > s.num ? <Check size={10} weight="bold" /> : s.num}
                  </div>
                  <span className={cn(
                    "font-display font-semibold text-[13px] tracking-[-0.01em]",
                    step === s.num ? "text-white" : step > s.num ? "text-pb-muted" : "text-pb-faint"
                  )}>
                    {s.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Draw assistant */}
          <div className="mt-auto px-4 pb-6">
            <div className="bg-pb-court-tint2 border border-pb-hairline rounded-[8px] p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Brain size={12} className="text-pb-court" />
                <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-pb-court font-bold">Draw Assistant</p>
              </div>
              <p className="text-[12px] text-pb-ink leading-relaxed mb-3">{assistantHint()}</p>
              <Link
                to="/tournament-planner"
                className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-pb-court uppercase tracking-[0.08em] hover:underline"
              >
                <Sparkle size={10} /> Try AI Planner
              </Link>
            </div>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 sm:px-10 py-10">

            {/* Step 1: Basics */}
            {step === 1 && (
              <div>
                <SH step={1} total={6} title="Basics" sub="The fundamentals — name, location, and dates." />

                {/* Free toggle */}
                <div className="mb-8">
                  <SL>Tournament Type</SL>
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-[8px] border transition-colors",
                    isFree ? "bg-pb-court-tint2 border-pb-court" : "bg-white border-pb-hairline"
                  )}>
                    <div>
                      <p className="font-display font-semibold text-[14px] text-pb-ink">Free Tournament</p>
                      <p className="font-mono text-[11px] text-pb-muted mt-0.5">Waive all entry fees. Stripe not required.</p>
                    </div>
                    <Switch checked={isFree} onCheckedChange={(v) => { setIsFree(v); if (v) setTournamentFee(0); }} />
                  </div>
                </div>

                {!isFree && (
                  <div className="mb-8">
                    <ConnectAccountStatus />
                  </div>
                )}

                {/* Details */}
                <div className="mb-8 space-y-5">
                  <SL>Tournament Details</SL>
                  <div>
                    <FL>Tournament Name *</FL>
                    <FI placeholder="e.g., Summer Slam Championship 2025" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <FL>Venue Name *</FL>
                      <FI placeholder="e.g., Austin Pickleball Complex" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                    <div>
                      <FL>Address *</FL>
                      <FI placeholder="123 Court Street, Austin TX" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <FL>Description *</FL>
                    <FTA placeholder="Tell players what makes this tournament special…" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                  </div>
                </div>

                {/* Dates */}
                <div className="mb-8 space-y-4">
                  <SL>Dates</SL>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {([
                      { label: "Start Date *", date: startDate, set: setStartDate },
                      { label: "End Date *", date: endDate, set: setEndDate },
                      { label: "Registration Deadline *", date: registrationDeadline, set: setRegistrationDeadline },
                    ] as { label: string; date: Date | undefined; set: (d: Date | undefined) => void }[]).map(({ label, date, set }) => (
                      <div key={label}>
                        <FL>{label}</FL>
                        <Popover>
                          <PopoverTrigger asChild><DateBtn date={date} /></PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={date} onSelect={set} initialFocus className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div className="mb-8 space-y-3">
                  <SL>Settings</SL>
                  <div className="flex items-start justify-between gap-4 p-4 rounded-[8px] border border-pb-hairline bg-white">
                    <div className="flex items-start gap-2.5">
                      <Users size={14} className="text-pb-muted mt-0.5 shrink-0" />
                      <div>
                        <p className="font-display font-semibold text-[13px] text-pb-ink">Allow waitlist</p>
                        <p className="font-mono text-[11px] text-pb-muted mt-0.5">Players can join a waitlist when an event is full.</p>
                      </div>
                    </div>
                    <Switch checked={allowWaitlist} onCheckedChange={setAllowWaitlist} />
                  </div>
                </div>

                {/* Image */}
                <div className="mb-8">
                  <SL>Cover Image</SL>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="w-full text-[12px] font-mono text-pb-muted file:mr-3 file:h-7 file:px-3 file:rounded-[4px] file:border file:border-pb-hairline file:bg-white file:text-[11px] file:font-mono file:text-pb-ink file:cursor-pointer"
                  />
                  <p className="font-mono text-[10.5px] text-pb-faint mt-1.5">JPEG, PNG, or WEBP · max 5 MB</p>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="mt-3 w-full max-w-xs rounded-[6px] border border-pb-hairline object-cover" />
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Events */}
            {step === 2 && (
              <div>
                <SH step={2} total={6} title="Events" sub="Add the competition events for your tournament. You can mix formats and skill levels." />

                {/* Add event form */}
                <div className="mb-8">
                  <SL>Add Event</SL>
                  <div className="bg-white border border-pb-hairline rounded-[8px] p-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <FL>Event Name</FL>
                        <FI placeholder="e.g., Men's Doubles 3.5" value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} />
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
                        <FI type="number" min={2} value={newEvent.maxPlayers} onChange={(e) => setNewEvent({ ...newEvent, maxPlayers: parseInt(e.target.value) || 16 })} />
                      </div>
                      {!isFree && (
                        <div>
                          <FL>Entry Fee ($)</FL>
                          <FI type="number" min={0} value={newEvent.entryFee} onChange={(e) => setNewEvent({ ...newEvent, entryFee: parseInt(e.target.value) || 0 })} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={addEvent}
                      className="flex items-center gap-2 h-9 px-4 rounded-[6px] bg-pb-ink text-white font-mono text-[12px] hover:bg-pb-ink/90 transition-colors"
                    >
                      <Plus size={13} weight="bold" /> Add Event
                    </button>
                  </div>
                </div>

                {/* Event list */}
                <div>
                  <SL>Your Events ({events.length})</SL>
                  {events.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-pb-hairline rounded-[8px]">
                      <Trophy size={24} className="mx-auto mb-2 text-pb-faint" />
                      <p className="font-mono text-[12px] text-pb-faint">No events yet — add one above</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {events.map((event, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-white border border-pb-hairline rounded-[8px]">
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-bold text-[14px] text-pb-ink">{event.name}</p>
                            <div className="flex gap-1.5 flex-wrap mt-1.5">
                              <Pill tone="neutral" mono>{event.gameType}</Pill>
                              <Pill tone="neutral" mono>{event.format}</Pill>
                              <Pill tone="neutral" mono>{formatEventSkillLevel(event.skillLevel)}</Pill>
                            </div>
                          </div>
                          <div className="text-right shrink-0 hidden sm:block">
                            <p className="font-mono font-bold text-[13px] text-pb-ink">{isFree ? "Free" : `$${event.entryFee}`}</p>
                            <p className="font-mono text-[11px] text-pb-muted">{event.maxPlayers} {event.gameType === "Singles" ? "players" : "teams"}</p>
                          </div>
                          <button onClick={() => removeEvent(index)} className="w-8 h-8 rounded-[6px] border border-pb-hairline flex items-center justify-center text-pb-muted hover:text-pb-ink transition-colors shrink-0">
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Venue */}
            {step === 3 && (
              <div>
                <SH step={3} total={6} title="Venue" sub="Court details and facilities. All fields are optional." />

                <div className="space-y-5">
                  <SL>Courts</SL>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <FL>Number of Courts</FL>
                      <FI type="number" min={1} placeholder="e.g. 8" value={courtCount} onChange={(e) => setCourtCount(e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                    <div>
                      <FL>Court Surface</FL>
                      <FS value={courtSurface} onChange={(e) => setCourtSurface(e.target.value)}>
                        <option value="">Select surface</option>
                        <option value="indoor-sport-court">Indoor Sport Court</option>
                        <option value="indoor-wood">Indoor Wood</option>
                        <option value="outdoor-concrete">Outdoor Concrete</option>
                        <option value="outdoor-asphalt">Outdoor Asphalt</option>
                        <option value="outdoor-sport-court">Outdoor Sport Court</option>
                      </FS>
                    </div>
                    <div>
                      <FL>Spectator Capacity</FL>
                      <FI type="number" min={0} placeholder="e.g. 200" value={spectatorCapacity} onChange={(e) => setSpectatorCapacity(e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="pt-2">
                    <SL>Amenities</SL>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AMENITIES.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleAmenity(a)}
                          className={cn(
                            "flex items-center gap-2.5 p-3 rounded-[6px] border text-left transition-colors",
                            amenities.includes(a)
                              ? "border-pb-ink bg-pb-ink text-white"
                              : "border-pb-hairline bg-white text-pb-muted hover:border-pb-ink"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0",
                            amenities.includes(a) ? "bg-white border-white" : "border-pb-hairline"
                          )}>
                            {amenities.includes(a) && <Check size={9} weight="bold" className="text-pb-ink" />}
                          </div>
                          <span className="font-mono text-[11px]">{a}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Schedule */}
            {step === 4 && (
              <div>
                <SH step={4} total={6} title="Schedule" sub="Set play hours, check-in policy, and officiating." />
                <div className="space-y-5">
                  <SL>Play Hours</SL>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <FL>Play Starts</FL>
                      <FI type="time" value={playStartTime} onChange={(e) => setPlayStartTime(e.target.value)} />
                    </div>
                    <div>
                      <FL>Play Ends</FL>
                      <FI type="time" value={playEndTime} onChange={(e) => setPlayEndTime(e.target.value)} />
                    </div>
                  </div>

                  <div className="pt-2">
                    <SL>Officials &amp; Check-In</SL>
                    <div className="grid sm:grid-cols-2 gap-4">
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
                          <option value="">Select type</option>
                          <option value="self-officiated">Self-Officiated</option>
                          <option value="line-judges">Line Judges</option>
                          <option value="certified-referees">Certified Referees</option>
                        </FS>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Pricing */}
            {step === 5 && (
              <div>
                <SH step={5} total={6} title="Pricing" sub="Entry fees and prize pool." />

                {isFree ? (
                  <div className="flex items-center gap-2.5 p-4 rounded-[8px] bg-pb-court-tint2 border border-pb-court mb-8">
                    <CurrencyDollar size={14} className="text-pb-court shrink-0" />
                    <p className="font-mono text-[12px] font-semibold text-pb-court uppercase tracking-[0.06em]">
                      Free tournament — all fees set to $0
                    </p>
                  </div>
                ) : (
                  <div className="mb-8 space-y-5">
                    <SL>Entry Fee</SL>
                    <div>
                      <FL>Tournament Entry Fee ($)</FL>
                      <div className="relative">
                        <CurrencyDollar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-pb-muted" />
                        <FI type="number" min={0} placeholder="0" value={tournamentFee} onChange={(e) => setTournamentFee(e.target.value === "" ? "" : Number(e.target.value))} className="pl-8" />
                      </div>
                      <p className="font-mono text-[10.5px] text-pb-faint mt-1.5">One-time fee per player. Enter 0 for no tournament-level fee.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  <SL>Prize Pool (optional)</SL>
                  <div>
                    <FL>Total Prize Pool ($)</FL>
                    <div className="relative">
                      <CurrencyDollar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-pb-muted" />
                      <FI type="number" min={0} placeholder="0" value={prizeTotal} onChange={(e) => setPrizeTotal(e.target.value === "" ? "" : Number(e.target.value))} className="pl-8" />
                    </div>
                    <p className="font-mono text-[10.5px] text-pb-faint mt-1.5">Enter 0 for medals-only.</p>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { label: "🥇 1st Place", value: prizeFirst, set: setPrizeFirst },
                      { label: "🥈 2nd Place", value: prizeSecond, set: setPrizeSecond },
                      { label: "🥉 3rd Place", value: prizeThird, set: setPrizeThird },
                    ].map(({ label, value, set }) => (
                      <div key={label}>
                        <FL>{label}</FL>
                        <FI placeholder="e.g. $500" value={value} onChange={(e) => set(e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Review */}
            {step === 6 && (
              <div>
                <SH step={6} total={6} title="Review" sub="Make sure everything looks right before going live." />
                <div className="space-y-6">

                  <div className="bg-white border border-pb-hairline rounded-[8px] divide-y divide-pb-hairline overflow-hidden">
                    {/* Tournament */}
                    <div className="p-5">
                      <SL>Tournament</SL>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {[
                          { k: "Name", v: name },
                          { k: "Location", v: location },
                          { k: "Address", v: address },
                          { k: "Dates", v: startDate && endDate ? `${format(startDate, "MMM d")} – ${format(endDate, "MMM d, yyyy")}` : "" },
                          { k: "Registration Deadline", v: registrationDeadline ? format(registrationDeadline, "MMM d, yyyy") : "" },
                        ].filter(x => x.v).map(({ k, v }) => (
                          <div key={k}>
                            <p className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.08em]">{k}</p>
                            <p className="font-sans text-[13px] text-pb-ink mt-0.5">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Events */}
                    <div className="p-5">
                      <SL>Events ({events.length})</SL>
                      <div className="space-y-2">
                        {events.map((e, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-[6px] border border-pb-hairline">
                            <div>
                              <p className="font-display font-bold text-[13px] text-pb-ink">{e.name}</p>
                              <div className="flex gap-1 mt-1">
                                <Pill tone="neutral" mono>{e.gameType}</Pill>
                                <Pill tone="neutral" mono>{e.format}</Pill>
                                <Pill tone="neutral" mono>{formatEventSkillLevel(e.skillLevel)}</Pill>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-[13px] text-pb-court">{isFree ? "Free" : `$${e.entryFee}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Venue */}
                    {(courtCount !== "" || courtSurface || amenities.length > 0) && (
                      <div className="p-5">
                        <SL>Venue</SL>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {courtCount !== "" && (
                            <div>
                              <p className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.08em]">Courts</p>
                              <p className="font-sans text-[13px] text-pb-ink mt-0.5">{courtCount}{courtSurface ? ` · ${courtSurface.replace(/-/g, " ")}` : ""}</p>
                            </div>
                          )}
                          <div>
                            <p className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.08em]">Play Hours</p>
                            <p className="font-sans text-[13px] text-pb-ink mt-0.5">{playStartTime} – {playEndTime}</p>
                          </div>
                          {amenities.length > 0 && (
                            <div className="sm:col-span-2">
                              <p className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.08em]">Amenities</p>
                              <p className="font-sans text-[13px] text-pb-ink mt-0.5">{amenities.join(", ")}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Prizes */}
                    {(prizeFirst || prizeSecond || prizeThird || (prizeTotal !== "" && Number(prizeTotal) > 0)) && (
                      <div className="p-5">
                        <SL>Prizes</SL>
                        <div className="space-y-1">
                          {prizeTotal !== "" && Number(prizeTotal) > 0 && <p className="font-mono text-[13px] text-pb-ink">Total: ${Number(prizeTotal).toLocaleString()}</p>}
                          {prizeFirst && <p className="font-mono text-[12px] text-pb-muted">🥇 {prizeFirst}</p>}
                          {prizeSecond && <p className="font-mono text-[12px] text-pb-muted">🥈 {prizeSecond}</p>}
                          {prizeThird && <p className="font-mono text-[12px] text-pb-muted">🥉 {prizeThird}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Navigation ────────────────────────────────────────────── */}
            <div className="flex justify-between pt-8 pb-10">
              <button
                onClick={() => goTo(step - 1)}
                disabled={step === 1}
                className="flex items-center gap-2 h-9 px-4 rounded-[6px] border border-pb-hairline font-mono text-[12px] text-pb-ink disabled:opacity-40 hover:bg-pb-surface transition-colors"
              >
                <ArrowLeft size={13} /> Back
              </button>

              {step < 6 ? (
                <button
                  onClick={() => goTo(step + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 h-9 px-5 rounded-[6px] bg-pb-ink text-white font-mono text-[12px] disabled:opacity-40 hover:bg-pb-ink/90 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={createTournamentMutation.isPending}
                  className="flex items-center gap-2 h-9 px-5 rounded-[6px] bg-pb-ink text-white font-mono text-[12px] disabled:opacity-40 hover:bg-pb-ink/90 transition-colors"
                >
                  {createTournamentMutation.isPending ? (
                    <><CircleNotch size={13} className="animate-spin" /> Creating…</>
                  ) : (
                    <><Check size={13} weight="bold" /> Create Tournament</>
                  )}
                </button>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateTournament;
